# Inventory Management — Gap Analysis

**Scope:** what stands between the current implementation and an inventory system that any business could adopt.
**Date:** 2026-07-16
**Codebase:** `backend/` (NestJS + Prisma + PostgreSQL), `frontend/` (Next.js 15)

---

## 1. Verdict

The app today is a **competent order-and-cost tracker for one specific sand business**. It is not yet an inventory management system, and it cannot be handed to a general user without changes.

Two things drive that conclusion:

1. **Stock is a single mutable integer with no history.** `Product.stock` is an `Int` that services increment and decrement in place ([`schema.prisma:67`](backend/prisma/schema.prisma)). Nothing records *why* it changed. Every correctness gap below is downstream of this one decision.
2. **The core workflow is inverted relative to every other business.** Recording a purchase does **not** add stock. The operator types the stock number in by hand, and the Buy exists only to document what was paid for it. That is a deliberate fit to this business, but it is the opposite of what a general user expects.

The good news: the multi-tenant scoping, the money columns (`Decimal(12,2)`), the settings/alerts model, and the newly token-driven UI are solid foundations. The gaps are concentrated in the stock domain itself.

**Current data volume is tiny** (1 product, 1 sell, 1 buy, 3 organizations). None of the latent bugs below have corrupted anything *yet* — verified directly against the database. That is a function of low usage, not of correctness. They will surface in the first real month of trading.

---

## 2. What exists today

| Capability | State |
|---|---|
| Multi-tenant scoping by `organizationId` | Solid, applied consistently (one exception, §3.3) |
| Product catalog (name, type, grade, unit, price) | Present |
| Purchases (Buy + BuyItem) with vendor, transport, discount | Present — **but no stock movement** |
| Sales (Sell + SellItem) with customer, transport, discount | Present, decrements stock |
| Drying gains (free quantity added to stock) | Present — domain-specific |
| Low-stock alerts + email digest + snoozes | Present |
| Money as `Decimal(12,2)` | Correct column choice |
| Cost inputs (`buyPrice`, `otherCostPerUnit`, `targetPrice`) | Present, but no costing method (§5) |

---

## 3. Category A — Correctness and data integrity

These are defects in what already exists. They matter regardless of which business uses the product.

### 3.1 Overselling is not prevented — stock goes negative
**Severity: critical**

`sells.service.ts:90` decrements with `{ decrement: it.quantity }` and never checks availability. There is no service guard, **no DB `CHECK` constraint** (the column is plain `stock INTEGER NOT NULL DEFAULT 0`), and no client-side validation — `SellModal` doesn't even *display* stock in the product picker. Selling 500 units of a product with 3 in stock succeeds and leaves `stock = -497`.

Telling detail: price *is* floor-validated client-side against `targetPrice`. The missing stock ceiling is an oversight, not a deliberate backorder feature.

### 3.2 Cancelling a sell never returns stock
**Severity: critical — silent, cumulative data corruption**

`PATCH /sells/:id` with `status: 'cancelled'` only writes the status field (`sells.service.ts:125-140`). Stock decremented at creation is never restored. Every cancellation permanently destroys inventory. The UI offers "cancelled" in a plain dropdown with no confirmation (`sells/page.tsx:131-152`).

This is the most damaging item on the list, because nothing surfaces it. Stock silently drifts below reality forever.

### 3.3 Buys can write across tenants
**Severity: critical — security**

`buys.service.ts` builds `itemsData` from `dto.items` *before* fetching products, then resolves names with a `|| 'Item'` fallback (line 32). A `productId` belonging to **another organization** is never rejected: the `BuyItem` is created against the foreign product and line 54 flips `awaitingPurchase: false` on it — inside a `try {} catch {}` that swallows the evidence. Same pattern in `updateItems` (line 107).

`sells.create` gets this right by throwing `NotFoundException`. Buys simply omits the check. With 3 organizations already live, this is real exposure.

### 3.4 Lost updates — no concurrency control
**Severity: high**

`products.update` writes stock as an **absolute value** (`data = { ...dto }`, `products.service.ts:47`), with no optimistic locking or version column. A manual stock edit clobbers any concurrent sale's decrement. Two simultaneous sales can also both pass a (future) availability check and both decrement.

### 3.5 Price floor bypassed on item edit
**Severity: high**

`sells.create` enforces `price >= targetPrice` (lines 49-50). `sells.updateItems` does not (line 154). `PUT /sells/:id/items` sells at any price, bypassing the control the UI advertises.

### 3.6 Transaction hygiene
**Severity: medium**

- `sells.service.ts:93` queries via `this.prisma` (not `tx`) **inside** a `$transaction`, once **per item** — a separate connection per line item, risking pool exhaustion under load.
- `sells.service.ts:118` **sends email inside the open transaction**. SMTP latency holds the DB lock; a later rollback cannot unsend the mail.

### 3.7 Smaller items
- **Float math on money.** Totals compute as `price * quantity` in JS floats, then land in `Decimal(12,2)` columns. Rounding drift is inevitable.
- **`shortCode` collisions.** `makeShortCode` takes 6 hex chars of a UUID with no unique constraint; `search` matches on it.
- **`targetPrice` frozen at creation.** `update` never sets it and the frontend never sends it, so the sell-price floor is permanently the product's original price.
- **`buyPrice` dropped on edit.** Sent on create, omitted from the edit payload (`ProductModal.tsx:132-141`) while still feeding on-screen cost math.
- **Dead code.** `buys.updateItems` fetches `existing` (line 103) and never uses it.

---

## 4. Category B — Missing core primitives

This is the difference between "tracks a number" and "manages inventory".

### 4.1 No stock ledger — the root cause
**Severity: critical | Effort: large**

There is no append-only record of stock movement. `Product.stock` is the only truth, and it has no history. Consequences:

- You cannot answer "why is stock 1999?" or "who changed it, and when?"
- Cancellation/returns cannot be reversed correctly (§3.2) because there is no movement to reverse.
- No audit trail for disputes, shrinkage, or compliance.
- Stock cannot be recomputed or reconciled if it drifts.
- No costing method is possible (§5) — that requires movement history.

**Every serious inventory system is a ledger**, with on-hand as a derived or cached projection. This is the single highest-leverage change in this document.

### 4.2 No reservation / allocation model
**Severity: high**

Stock decrements at **sell creation**, while `status` is still `pending`. So a pending order is indistinguishable from a delivered one, stock-wise. There is no `reserved` vs `available` split, meaning:

- No way to hold stock for an unconfirmed order without removing it.
- Cancelling must restore (which it doesn't — §3.2).
- "Available to promise" cannot be computed.

Standard model: `on_hand`, `reserved`, `available = on_hand - reserved`.

### 4.3 No stock adjustments with reasons
**Severity: high**

The only way to correct stock is to overwrite the number via the product edit form. There is no adjustment entity, no reason code (damage, theft, shrinkage, count correction, expiry), no approval, no audit. Wastage and breakage — universal in real operations — have nowhere to go.

### 4.4 No returns
**Severity: high**

Neither sales returns (customer → you) nor purchase returns (you → vendor) exist. Both are routine, and both move stock and money.

### 4.5 No stock take / cycle counting
**Severity: medium**

No way to record a physical count and reconcile it against the system, which is how real businesses discover drift.

### 4.6 No locations / warehouses
**Severity: medium** (high for multi-site users)

Stock is one number per product per organization. No `Warehouse`/`Location` entity, no per-location stock, no transfers between sites. Any business with two yards or a shop plus a store cannot model reality.

### 4.7 No batch / lot / serial / expiry tracking
**Severity: medium** (blocking for food, pharma, chemicals, electronics)

No `batch`, `lot`, `serial`, or `expiry` fields exist (verified against the schema — the `expiresAt` in the codebase belongs to `PasswordResetToken`, and `location` to `LoginActivity`). This closes off entire industries.

---

## 5. Category C — Costing and valuation

**Severity: high | Effort: medium-large**

There is no costing method. No FIFO, no weighted average, no standard cost. Instead there are three loose scalars on the product — `buyPrice`, `otherCostPerUnit`, `targetPrice` — plus a bespoke formula in the UI:

```
Auto = (buy + other) × (stock − drying gains)   // ProductModal.tsx:360
```

This means:
- **COGS is not tracked per sale.** Margin per order cannot be computed correctly.
- **Inventory valuation** is a point-in-time guess from current `buyPrice`, not from what was actually paid for the units on hand.
- Buying the same product at two different prices loses the distinction entirely.

A real system derives cost from the ledger (§4.1). Without movements, no costing method is even expressible.

---

## 6. Category D — Catalog and identity

| Gap | Impact |
|---|---|
| **No SKU** | No stable business identifier. Products are matched by UUID or name. |
| **No barcode** | No scanning — a baseline expectation for warehouse/retail use. |
| **Quantities are `Int`** (`stock`, all `quantity` columns) | **You cannot sell 2.5 units.** The one live product is measured in `feet` — a volume. Sand, liquids, weight, and length are all fractional by nature. This blocks most non-discrete businesses and is a schema-level change (`Int` → `Decimal`). |
| **`unit` is a free-text `String`** | No unit registry, no conversion (buy in tonnes, sell in kg), no validation. Typos create silent divergence. |
| **No product categories** | `type` and `grade` are free-text strings. |
| **No soft delete** | `products.remove` hard-deletes; only a FK violation prevents destroying history. Other models have `deletedAt`; `Product` does not. |

---

## 7. Category E — Domain coupling (blocks "usable by all users")

This section is the direct answer to *"can it be used by any user?"* — currently, no.

### 7.1 Buys do not add stock
**Severity: critical for general use**

`buys.service.ts:52` states it outright: *"mark products as purchased (awaitingPurchase -> false). No stock movement."* The frontend agrees — `BuyModal.tsx:138` pre-fills the buy quantity **from the product's existing stock**:

```ts
const initialQty = Number(product.stock || 0) > 0 ? Number(product.stock) : 1
```

The intended workflow is: *create the product and type its stock in manually → record a Buy to document what was paid for that already-entered stock.* Verified against live data: a Buy of 2000 units, product stock 1999, one unit sold. `2000 − 1 = 1999` — the buy contributed nothing.

For every other business, **receiving goods is how stock increases**. A general user will record a purchase and expect stock to rise. It won't.

> ⚠️ **Migration hazard:** if buys are changed to increment stock, that `initialQty` prefill double-counts at exactly 2×, and existing data must be reinterpreted. This needs a data migration and a workflow decision, not just a code change.

### 7.2 `awaitingPurchase` is a private concept
A product is "awaiting purchase" until a Buy references it. This models this business's paperwork, not a general inventory state. Other systems express this as a purchase order lifecycle (draft → ordered → received).

### 7.3 Drying gains are sand-specific
`DryingGain` is a first-class table, a service, an API, and a UI section. It encodes "material gains volume as it dries" — free quantity that dilutes unit cost. For a general system this is one instance of a broader concept: **a positive stock adjustment with a reason code** (§4.3). It should become a reason, not a table.

### 7.4 Vocabulary
`Sell`/`Buy` are unusual names for `SalesOrder`/`PurchaseOrder`. `grade` is a sand attribute promoted to a first-class column. Cosmetic, but it signals the coupling.

---

## 8. Category F — Replenishment

**Severity: medium**

`OrganizationSettings.lowStockThreshold` is **one integer for every product in the organization** (`schema.prisma:231`, default 5). A business selling both cement bags and rare fittings needs different thresholds per product.

Missing: per-product reorder point, reorder quantity, safety stock, supplier lead time, and any demand/velocity signal. There is no purchase suggestion.

---

## 9. Category G — Access control and audit

- **Roles are not enforced for inventory.** `User.role` exists (`owner`/`member`) and `LoginActivity` is tracked, but no guard restricts who may change stock, edit prices, or delete products. Any authenticated member of an org has full write access.
- **No audit trail** on inventory mutations (see §4.1). `LoginActivity` covers logins only.

---

## 10. Category H — Scale

- **Unbounded queries.** `alerts.service` loads **all** sells and **all** buys for an org into memory to compute receivables/payables, then filters in JS. This is fine at 1 order and quadratic pain at 50,000.
- **No pagination** on list endpoints (`findAll` returns everything).
- **N+1 writes** in stock loops (`sells.service.ts:89-102`).
- **Snooze filtering** uses `id: { notIn: [...] }` with an unbounded array.

---

## 11. Proposed target model

The ledger is the keystone. Sketch:

```prisma
model StockMovement {
  id             String   @id @default(uuid())
  organizationId String
  productId      String
  locationId     String?

  quantity       Decimal  @db.Decimal(14, 4)  // signed: +receipt, -issue
  reason         String   // purchase_receipt | sale_issue | sale_return |
                          // purchase_return | adjustment_damage | adjustment_count |
                          // drying_gain | transfer_in | transfer_out
  refType        String?  // 'sell' | 'buy' | 'adjustment' | 'transfer'
  refId          String?

  unitCost       Decimal? @db.Decimal(14, 4)  // for FIFO / weighted average
  balanceAfter   Decimal  @db.Decimal(14, 4)  // running total, for audit

  note           String?
  createdById    String
  createdAt      DateTime @default(now())

  @@index([organizationId, productId, createdAt])
  @@index([refType, refId])
}
```

With this in place:
- `Product.stock` becomes a **cached projection** of `SUM(quantity)`, reconcilable at any time.
- Cancellation writes a compensating `+` movement instead of mutating a scalar.
- Drying gains become `reason = 'drying_gain'` — the sand-specific table disappears (§7.3).
- FIFO/weighted-average costing becomes computable (§5).
- The audit trail is free.

Alongside it:
- `Decimal` quantities everywhere (§6).
- `CHECK (stock >= 0)` plus a `version` column for optimistic locking.
- `reserved` tracked so `available = on_hand - reserved` (§4.2).

---

## 12. Prioritized roadmap

Ordered by risk-reduction per unit of effort.

### Phase 0 — Stop the bleeding (days)
No schema change. Do this before any real usage.
1. Reject sales exceeding available stock; add `CHECK (stock >= 0)` as a backstop. (§3.1)
2. Restore stock when a sell is cancelled. (§3.2)
3. Validate `productId` ownership in `buys.create` / `updateItems`. (§3.3)
4. Apply the `targetPrice` floor in `updateItems`. (§3.5)
5. Move the settings read and the email send out of the transaction. (§3.6)
6. Delete the dead `backend/prisma.config.ts`.

### Phase 1 — The ledger (weeks)
7. Add `StockMovement`; write to it from every path that touches stock.
8. Backfill movements from existing buys/sells so history is not lost.
9. Make `Product.stock` a projection + add a reconcile job.
10. Add optimistic locking (`version`).

### Phase 2 — Make it general (weeks)
11. **Decide the buy→stock workflow** and migrate (§7.1) — the key product decision in this document.
12. `Decimal` quantities; unit registry with conversions. (§6)
13. Stock adjustments with reason codes; fold drying gains into them. (§4.3, §7.3)
14. Sales and purchase returns. (§4.4)
15. SKU + barcode. (§6)

### Phase 3 — Depth (months)
16. Reservations / available-to-promise. (§4.2)
17. Costing method (weighted average first, FIFO after). (§5)
18. Locations + transfers. (§4.6)
19. Per-product reorder points, lead times, purchase suggestions. (§8)
20. Batch/lot/serial/expiry. (§4.7)
21. Stock take / cycle counting. (§4.5)
22. Role-based permissions on inventory mutations. (§9)
23. Pagination + query bounds. (§10)

---

## 13. Evidence index

| Claim | Location |
|---|---|
| Stock is a mutable `Int`, no constraint | `backend/prisma/schema.prisma:67`; migration `stock INTEGER NOT NULL DEFAULT 0` |
| No availability check on sale | `backend/src/sells/sells.service.ts:90` |
| Cancellation does not restore stock | `backend/src/sells/sells.service.ts:125-140` |
| Cross-tenant buy writes | `backend/src/buys/buys.service.ts:20, 32, 53-54, 107-108` |
| Absolute stock write, no lock | `backend/src/products/products.service.ts:47, 53` |
| Price floor enforced on create only | `sells.service.ts:49-50` vs `:154` |
| Non-`tx` query + email inside transaction | `backend/src/sells/sells.service.ts:93, 118` |
| Buys explicitly move no stock | `backend/src/buys/buys.service.ts:52` |
| Buy qty prefilled from existing stock | `frontend/src/components/buys/BuyModal.tsx:138` |
| Live data confirms buy adds nothing | Buy 2000 → stock 1999 → 1 sold |
| Global (not per-product) low-stock threshold | `backend/prisma/schema.prisma:231` |
| Drying-gain cost formula | `frontend/src/components/products/ProductModal.tsx:360` |
| Unbounded receivable/payable scans | `backend/src/alerts/alerts.service.ts` |
| No SKU/barcode/batch/serial/expiry/warehouse/reorder | Verified absent from `schema.prisma` |
