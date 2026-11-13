# 🚀 K-Funnels AI | ClickFunnels Clone Powered by Genkit & Gemini

A full-stack, enterprise-grade **ClickFunnels clone** powered by **Firebase Genkit** with **Google Gemini (3.8 / 3.5 / 2.5 Flash)**, **NestJS**, **Mongoose (MongoDB)**, **Angular v22**, and **PrimeNG UI Kit**, unified inside a high-performance **Nx monorepo**.

---

## ⚡ Core Features

- 🎨 **Visual Drag-and-Drop Funnel Builder**:
  - Live WYSIWYG step designer with multi-device preview (**Desktop**, **Tablet**, **Mobile**).
  - Add, arrange, edit, and reorder elements: Headlines, Subheadlines, VSL Video Players, Bullet Value Lists, Opt-in Lead Forms, Checkout & Order Bump Modules, Urgency Countdowns, Testimonials, and Guarantee Badges.
  - Step hierarchy sidebar with real-time conversion rates and visitor metrics.
  - Interactive Property Inspector for Typography, Colors, Margins, Borders, and Custom CSS.
- 🤖 **Firebase Genkit + Gemini AI Engines**:
  - **1-Click AI Funnel Generator**: Generates full high-converting direct-response funnels (Opt-in → VSL Sales Page → Order Checkout with Order Bump → Confirmation Thank You) from product description and audience.
  - **AI Copywriter Studio**: Generates high-converting headlines, hooks, and bullet copy utilizing proven frameworks: **AIDA** (Attention-Interest-Desire-Action), **PAS** (Problem-Agitate-Solve), and **BAB** (Before-After-Bridge).
  - **AI CRO Auditor**: Performs real-time Conversion Rate Optimization audits with scoring (Clarity, Urgency, Social Proof, CTA Power, Mobile Readability) and actionable A/B test split suggestions.
  - Dual-mode architecture: Uses live **Gemini 3.8 / 3.5 / 2.5 Flash** when `GEMINI_API_KEY` is present, with zero-downtime direct-response intelligent fallback if offline.
- 📦 **Order Bump & Opt-in Capture**:
  - Dynamic checkout component supporting 1-click **Order Bumps** (e.g., $27 fast-action toolkit).
  - Friction-free opt-in capture directly synced to the CRM database.
- 📊 **CRM & Funnel Analytics**:
  - Live Dashboard with Gross Revenue, Total Visitors, Opt-in Leads, Conversion Rate, and Funnel Breakdown.
  - Lead Management CRM with CSV export.
  - Order Transactions ledger with order bump revenue tracking.
- 🌐 **Live Public Visitor Pages**:
  - Clean client-facing funnel URLs: `/f/:funnelSlug` and `/f/:funnelSlug/:stepSlug`.
  - Automatic page view tracking and live lead capture & checkout processing.

---

## 🏗️ Architecture & Monorepo Structure

```
kfunnels/
├── .agents/skills/genkit/SKILL.md       # Genkit AI development skill
├── .gemini/skills/genkit/SKILL.md       # Gemini workspace skill
├── apps/
│   ├── backend/                        # NestJS + Mongoose + Genkit API
│   │   └── src/
│   │       ├── ai/                     # Genkit flows (Gemini Flash, Schemas)
│   │       ├── funnels/                # Funnels & Steps CRUD, Seeders
│   │       ├── leads/                  # CRM Opt-in leads tracking
│   │       ├── orders/                 # Checkout & Order bump processing
│   │       ├── analytics/              # Dashboard metrics & page views
│   │       └── schemas/                # Mongoose models (Funnel, Lead, Order)
│   └── frontend/                       # Angular v22 + PrimeNG
│       └── src/app/
│           ├── core/services/          # Angular HTTP services
│           ├── layout/                 # Topbar, responsive shell
│           └── pages/
│               ├── dashboard/          # Performance & revenue analytics
│               ├── funnels-list/       # Funnels catalogue & category filter
│               ├── funnel-builder/     # WYSIWYG ClickFunnels-style builder
│               ├── ai-wizard/          # 1-Click AI Funnel Generator
│               ├── ai-copywriter/      # AIDA, PAS, BAB copywriting studio
│               ├── cro-auditor/        # Real-time page audit & A/B testing
│               ├── contacts/           # Leads CRM table & CSV exporter
│               ├── orders/             # Order transactions & bumps
│               └── public-viewer/      # Live visitor-facing funnel pages
└── libs/
    └── shared/                         # Domain models, DTOs & TypeScript types
```

---

## 🛠️ Tech Stack

- **Monorepo**: [Nx 24](https://nx.dev)
- **Frontend**: [Angular v22](https://angular.dev) (Standalone Components, Signals, Reactive Forms, New Control Flow)
- **UI Kit**: [PrimeNG 22](https://primeng.org) with `@primeuix/themes` (Aura theme) and PrimeIcons
- **Backend**: [NestJS 11](https://nestjs.com)
- **Database**: [Mongoose 8](https://mongoosejs.com) + MongoDB
- **AI Engine**: [Firebase Genkit](https://firebase.google.com/docs/genkit) + `@genkit-ai/google-genai` (Gemini 3.8 / 3.5 / 2.5 Flash)

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **MongoDB**: Active on `mongodb://127.0.0.1:27017/kfunnels`

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set your Google Gemini API Key:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/kfunnels
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(If `GEMINI_API_KEY` is not provided, K-Funnels automatically activates its built-in direct-response intelligence fallback engine without crashing or failing).*

### 3. Run with Nx
Start the NestJS backend:
```bash
npx nx serve backend
```

Start the Angular v22 frontend:
```bash
PORT=4200 npx nx serve frontend --port=4200
```

Open your browser at:
- **K-Funnels App**: `http://localhost:4200`
- **Backend API**: `http://localhost:3000/api`

---

## 🧠 Genkit Skills Installed in the Project

The project includes custom agent skills located at:
- `.agents/skills/genkit/SKILL.md`
- `.gemini/skills/genkit/SKILL.md`

These guide AI agents and developers in:
1. Configuring `@genkit-ai/google-genai` and model resolution (`gemini-2.5-flash`, `gemini-3.5-flash`, `gemini-3.8-flash`).
2. Defining type-safe structured outputs using Zod schemas.
3. NestJS service encapsulation and error handling.
4. Prompt architecture for direct-response sales copy and CRO analysis.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/funnels` | List all funnels |
| `POST` | `/api/funnels` | Create a new funnel |
| `GET` | `/api/funnels/:id` | Get funnel by ID or slug |
| `PUT` | `/api/funnels/:id` | Update funnel, steps, or elements |
| `DELETE` | `/api/funnels/:id` | Delete a funnel |
| `POST` | `/api/funnels/:id/steps` | Add a step to a funnel |
| `PUT` | `/api/funnels/:id/steps/:stepId` | Update a specific step & layout |
| `POST` | `/api/ai/generate-funnel` | 1-Click AI Funnel Generation flow |
| `POST` | `/api/ai/copywriter` | Generate AIDA/PAS/BAB direct-response copy |
| `POST` | `/api/ai/cro-audit` | Page conversion audit & A/B test variants |
| `GET` | `/api/leads` | List CRM leads |
| `POST` | `/api/leads` | Capture opt-in lead and increment conversion |
| `GET` | `/api/orders` | List customer orders |
| `POST` | `/api/orders` | Process order checkout & order bumps |
| `GET` | `/api/analytics/dashboard` | Aggregated revenue and conversion metrics |
| `POST` | `/api/analytics/track-view` | Track visitor page view for a funnel step |

---

## 🧪 Testing the Live Application

1. **AI Funnel Wizard**: Navigate to `http://localhost:4200/ai-wizard`, enter your product details, and watch the AI synthesize the entire funnel hierarchy and copy.
2. **Funnel Builder**: Navigate to `http://localhost:4200/builder/ai-saas-growth-funnel`, toggle Desktop/Tablet/Mobile viewports, reorder blocks, and click "Audit Page with AI".
3. **Public Visitor Flow**:
   - Visit `http://localhost:4200/f/ai-saas-growth-funnel`.
   - Submit the lead form to enter your CRM.
   - Proceed to checkout, toggle the $47 Order Bump, and submit the order.
   - Check `http://localhost:4200/contacts` and `http://localhost:4200/orders` to verify instant real-time recording.

---

## 📜 License
MIT
