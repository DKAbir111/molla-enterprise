<div align="center">

<img src="https://i.ibb.co.com/8g5THwVH/dashboard.png" alt="Inventra Dashboard" width="100%" style="border-radius: 12px;" />

<br/>
<br/>

# 🏢 Inventra II — Enterprise Inventory & Business Management

**The all-in-one open-source platform for managing your business operations with precision.**
Built with **Next.js**, **NestJS**, and **TypeScript** — designed for enterprises, freelancers, and growing businesses.

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-red?style=for-the-badge&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-orange?style=for-the-badge)](https://opensource.org)

<br/>

[🚀 Live Demo](#) · [📖 Documentation](#) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues) · [🤝 Contribute](#contributing)

</div>

---

## ✨ Why Inventra?

> Most inventory tools are either too simple for real business needs or too expensive for small enterprises. **Inventra bridges that gap** — offering enterprise-grade features while remaining fully open source, self-hostable, and customizable.

Whether you're running a retail shop, a wholesale business, or a multi-branch enterprise — Inventra gives you **complete visibility and control** over every rupee in and every product out.

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="https://i.ibb.co.com/8g5THwVH/dashboard.png" alt="Dashboard" width="100%" style="border-radius: 8px;" />
      <br /><strong>📊 Main Dashboard</strong>
    </td>
    <td align="center" width="50%">
      <img src="https://i.ibb.co.com/Kcx6mcXV/settings.png" alt="Settings & Notifications" width="100%" style="border-radius: 8px;" />
      <br /><strong>⚙️ Notification Settings</strong>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="https://i.ibb.co.com/rfMZ9q1K/Accounts.png" alt="Accounts Management" width="100%" style="border-radius: 8px;" />
      <br /><strong>💰 Accounts Management</strong>
    </td>
    <td align="center" width="50%">
      <img src="https://i.ibb.co.com/mFrBPHpx/darkmood.png" alt="Dark Mode" width="100%" style="border-radius: 8px;" />
      <br /><strong>🌙 Beautiful Dark Mode</strong>
    </td>
  </tr>
</table>

---

## 🚀 Feature Overview

### 📦 Inventory & Product Management
- Full product catalog with categories, SKUs, variants, and pricing
- Real-time stock level tracking across locations
- **Low Stock Alerts** — get notified when any product falls below your custom threshold
- Batch product updates and bulk import/export support
- Product cost vs. selling price margin calculation

### 🛒 Sales Management (Sells)
- Create, manage, and track sales orders end-to-end
- Invoice generation with **PDF export** — professional, branded, print-ready
- Sales history, filtering, and drill-down reports
- Payment tracking: partial, full, and overdue
- Discount and tax configuration per product or order

### 🛍️ Purchase Management (Buys)
- Manage purchase orders from vendors
- Track received vs. pending stock
- Vendor payment tracking and aging reports
- Purchase history with full audit trail

### 👥 Customer Management
- Comprehensive customer profiles with contact info and transaction history
- **Receivables tracking** — know exactly who owes you money and how much
- Customer credit limits and outstanding balance visibility
- Customer-level profit and engagement reports
- PDF reports per customer — share or print instantly

### 🏭 Vendor Management
- Full vendor directory with terms, contacts, and history
- **Payables tracking** — never miss a payment to a supplier
- Vendor-wise purchase history and performance reports
- Payment scheduling and reminder system

### ⚡ Quick Entries
- Rapid transaction entry for fast-paced business environments
- Keyboard-friendly interface for speed
- Bulk entry support for common daily operations
- Reduce data entry time by up to 70%

### 🧮 Critical Calculations & Dry-Run Expansion
- **Dry-run simulation engine** — forecast what happens when stock is expanded or reduced
- Automatic profit/loss calculations per transaction
- Gross margin, net margin, and ROI calculations
- Cash flow projections based on receivables and payables

### 📊 Reporting System
- **Business-wide reports**: Sales, Purchases, Profit & Loss, Cash Flow
- **Customer reports**: Outstanding balances, transaction history, aging analysis
- **Vendor reports**: Payable aging, purchase summaries
- **Inventory reports**: Stock valuation, movement history, low stock summary
- All reports exportable to **PDF** with your business branding
- Date range filters, category filters, and comparative period analysis

### 💳 Accounts & Ledger
- Double-entry style transaction tracking
- Receivables (who owes you) vs. Payables (who you owe) — clearly separated
- Complete account history with running balances
- Bank and cash account management

### 🔔 Notifications & Alerts
- **Low Stock Alerts** — configurable per-product thresholds
- **Order Aging Alerts** — flag orders pending beyond N hours
- **Receivable Reminders** — auto-remind when payments are overdue
- **Payable Reminders** — never miss a vendor payment
- Email notification support (SMS — coming soon)
- In-app notification center with badge counts

### 🌐 Multi-Language Support
- Full internationalization (i18n) built-in
- Supports **English** and **Bengali (বাংলা)** out of the box
- Easy to extend with additional languages
- RTL-ready architecture

### 🎨 UI & Theming
- Stunning **Dark Mode** and Light Mode
- Clean, modern enterprise UI
- Fully responsive — works on desktop, tablet, and mobile
- Accessible design with keyboard navigation

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React, TypeScript |
| **Backend** | NestJS, TypeScript |
| **Database** | PostgreSQL / MySQL (configurable) |
| **ORM** | TypeORM / Prisma |
| **Auth** | JWT + Role-Based Access Control |
| **PDF Engine** | Custom PDF generation engine |
| **i18n** | next-i18next / react-intl |
| **UI Components** | Custom component library |
| **State Management** | Zustand / React Query |

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have the following installed:

```bash
Node.js >= 18.x
npm >= 9.x  (or yarn / pnpm)
PostgreSQL >= 14
Git
```

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/inventra.git
cd inventra
```

**2. Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

**3. Configure environment**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials and secrets

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your API URL
```

**4. Set up the database**
```bash
cd backend
npm run migration:run
npm run seed  # Optional: seed with demo data
```

**5. Run the development servers**
```bash
# In one terminal — start backend (NestJS)
cd backend
npm run start:dev

# In another terminal — start frontend (Next.js)
cd frontend
npm run dev
```

**6. Open your browser**
```
Frontend:  http://localhost:3000
Backend:   http://localhost:3001
API Docs:  http://localhost:3001/api/docs
```

---

## 🐳 Docker (Recommended for Production)

```bash
# Clone and configure
git clone https://github.com/your-username/inventra.git
cd inventra
cp .env.example .env  # Fill in your values

# Start everything with Docker Compose
docker-compose up -d

# Open at http://localhost:3000
```

---

## 📂 Project Structure

```
inventra/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Authentication & authorization
│   │   │   ├── products/     # Product & inventory management
│   │   │   ├── customers/    # Customer management
│   │   │   ├── vendors/      # Vendor management
│   │   │   ├── sells/        # Sales management
│   │   │   ├── buys/         # Purchase management
│   │   │   ├── accounts/     # Financial accounts & ledger
│   │   │   ├── reports/      # Reporting engine
│   │   │   ├── notifications/# Alert & notification system
│   │   │   └── settings/     # System configuration
│   │   └── common/           # Shared utilities, guards, decorators
│   └── ...
│
├── frontend/                 # Next.js App
│   ├── app/                  # App router pages
│   ├── components/           # Reusable UI components
│   ├── lib/                  # API clients, hooks, utils
│   ├── locales/              # i18n translation files (en, bn, ...)
│   └── ...
│
├── docker-compose.yml
└── README.md
```

---

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Inventra is built for the community, by the community.

### How to Contribute

**1. Fork the repository**
Click the **Fork** button at the top right of this page.

**2. Create your feature branch**
```bash
git checkout -b feature/amazing-feature
```

**3. Make your changes**
Write clean, typed TypeScript. Follow existing code patterns.

**4. Commit with a clear message**
```bash
git commit -m "feat: add amazing feature"
```

**5. Push and open a Pull Request**
```bash
git push origin feature/amazing-feature
```
Then open a PR against the `main` branch. Fill in the PR template.

### Contribution Areas

| Area | What's Needed |
|---|---|
| 🌐 Translations | Add new languages to `/locales` |
| 🐛 Bug Fixes | Pick up issues labeled `good first issue` |
| 📱 Mobile UI | Improve responsive layouts |
| 📊 Reports | New report types and charts |
| 🧪 Tests | Unit and integration test coverage |
| 📖 Docs | Improve documentation and examples |
| 🔌 Integrations | Payment gateways, accounting tools |

### Code Standards

- **TypeScript strict mode** — no `any` types
- **ESLint + Prettier** — run `npm run lint` before committing
- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Write tests for new features when possible

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

---

## 🗺️ Roadmap

- [x] Product & Inventory Management
- [x] Sales & Purchase Management
- [x] Customer & Vendor Management
- [x] Accounts & Receivables/Payables
- [x] PDF Invoice & Report Generation
- [x] Multi-language (EN + BN)
- [x] Dark Mode
- [x] Notification System
- [ ] SMS Notifications *(in progress)*
- [ ] Mobile App (React Native)
- [ ] Multi-branch / Multi-warehouse support
- [ ] Barcode / QR Code scanner integration
- [ ] Payment gateway integration (bKash, Nagad, Stripe)
- [ ] WhatsApp notification support
- [ ] Public customer portal
- [ ] Advanced analytics with charts

---

## 🐛 Reporting Issues

Found a bug? Have a suggestion?

1. Check [existing issues](../../issues) first
2. Open a [new issue](../../issues/new) with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior
   - Screenshots if helpful

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

You are free to use, modify, and distribute this software for personal or commercial purposes with attribution.

---

## 🙏 Acknowledgements

- [NestJS](https://nestjs.com) — progressive Node.js framework
- [Next.js](https://nextjs.org) — the React framework for production
- [TypeScript](https://www.typescriptlang.org) — typed JavaScript at scale
- All the amazing open source contributors who make this possible ❤️

---

<div align="center">

**Made with ❤️ for businesses everywhere**

⭐ **Star this repo** if you find it useful — it helps others discover Inventra!

[🐦 Twitter](#) · [💬 Discord](#) · [📧 Email](#)

</div>
