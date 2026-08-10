-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "note" TEXT,
    "customerId" TEXT,
    "vendorId" TEXT,
    "sellId" TEXT,
    "buyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_direction_idx" ON "Payment"("organizationId", "direction");

-- CreateIndex
CREATE INDEX "Payment_sellId_idx" ON "Payment"("sellId");

-- CreateIndex
CREATE INDEX "Payment_buyId_idx" ON "Payment"("buyId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_vendorId_idx" ON "Payment"("vendorId");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_source_idx" ON "Transaction"("organizationId", "source");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sellId_fkey" FOREIGN KEY ("sellId") REFERENCES "Sell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_buyId_fkey" FOREIGN KEY ("buyId") REFERENCES "Buy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- DATA BACKFILL
-- ============================================================================
-- Sell.paidAmount / Buy.paidAmount were typed in by hand. They are now a cache
-- recomputed from Payment rows, so every existing non-zero figure has to become
-- a Payment or the money disappears from the ledger.
--
-- The original date of each payment is unknowable — only a running total was
-- ever stored — so each is recorded against its order's own date and flagged in
-- the note as a migrated opening figure.

INSERT INTO "Payment" ("id", "organizationId", "direction", "amount", "date", "method", "note", "customerId", "sellId", "createdAt")
SELECT
  gen_random_uuid()::text,
  s."organizationId",
  'in',
  s."paidAmount",
  s."createdAt",
  'cash',
  'Migrated from the order''s paid amount; original payment date unknown.',
  s."customerId",
  s."id",
  NOW()
FROM "Sell" s
WHERE s."paidAmount" > 0;

INSERT INTO "Payment" ("id", "organizationId", "direction", "amount", "date", "method", "note", "vendorId", "buyId", "createdAt")
SELECT
  gen_random_uuid()::text,
  b."organizationId",
  'out',
  b."paidAmount",
  b."createdAt",
  'cash',
  'Migrated from the purchase''s paid amount; original payment date unknown.',
  -- Buy stores the vendor as free text, so match the master record by name and
  -- phone. A miss just leaves vendorId null; the buyId link still holds.
  (SELECT v."id" FROM "Vendor" v
    WHERE v."organizationId" = b."organizationId"
      AND v."name" = b."vendorName"
      AND COALESCE(v."phone", '') = COALESCE(b."vendorPhone", '')
    LIMIT 1),
  b."id",
  NOW()
FROM "Buy" b
WHERE b."paidAmount" > 0;

-- The sell/buy services used to auto-create a Transaction for each payment.
-- Accounts summed those AND the order totals, double-counting every paid order.
-- Mark them so the accrual summary can exclude them; they are represented by
-- the Payment rows above now. User-entered rows keep the default 'manual'.
UPDATE "Transaction"
SET "source" = 'order'
WHERE "description" LIKE 'Sell payment - %'
   OR "description" LIKE 'Buy payment - %';
