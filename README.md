# Caliber - Frontend Dashboard Submission

Caliber is a production style dashboard interface built to demonstrate core frontend engineering skills required for this role.

This submission focuses on:
- Structured UI systems
- Data visualization (time and category)
- State management and data flow
- Role based UI behavior
- Filtering, search, and data exploration
- Responsive and polished UX

It is not a static demo. It is designed as a working product interface with realistic interaction flows and architecture.

---

## Live Demo

App: https://caliber-ai.vercel.app/  
Email: test@example.com  
Password: Test123!

---

## Why This Project

Most AI systems can generate outputs, but lack visibility into performance, quality, and risk over time.

Caliber solves this by providing:
- Centralized evaluation tracking
- Trend analysis across time
- Category level performance insights
- Searchable and filterable data exploration
- Exportable datasets for deeper analysis

This creates a realistic use case for building a data driven dashboard similar to financial or analytics platforms.

---

## Assignment Mapping

This project directly covers the evaluation criteria:

### 1. Dashboard Overview
- KPI Cards: total evaluations, average score, latency, success rate
- Time based visualization: 7, 14, 30 day trend chart
- Category breakdown: score distribution by category

### 2. Transactions or Data Table
- Paginated evaluations table
- Fields: date, score (amount equivalent), category, metadata
- Search across multiple fields
- Category and date filtering
- Structured and sortable display

### 3. Role Based UI
- Admin and Viewer toggle in UI
- Viewer mode disables sensitive actions
- Role persisted using localStorage

### 4. Insights
- Category performance breakdown
- Trend based observations via charts
- Aggregated metrics via dashboard cards

### 5. State Management
- API driven data flow
- Cached fetching strategy
- Controlled UI state for filters, role, pagination

### 6. UI and UX
- Clean dashboard layout
- Responsive across devices
- Loading states using skeletons
- Smooth transitions and interactions
- Handles empty and edge cases

---

## Key Features

### Dashboard
- KPI cards with aggregated metrics
- Interactive trend chart with time window selection
- Category breakdown visualization
- Recent activity panel

### Evaluations Explorer
- Full table with pagination
- Search by interaction ID, prompt, and response
- Category and date filtering
- Detail modal view
- Export to CSV and JSON

### Role System
- Toggle between Admin and Viewer
- UI adapts based on role
- Prevents modification actions in Viewer mode

### Configuration Panel
- Sampling controls
- PII handling toggle
- Evaluation limits

### Product Surface
- Landing page
- Documentation page
- Privacy and Terms pages

---

## Architecture

- Built with Next.js App Router
- Frontend and API routes in a single application
- Supabase for database, auth, and row level security

### Data Flow
1. Events are ingested via API
2. Stored securely per user
3. Aggregated via stats endpoints
4. Rendered in dashboard and table views

### State Handling
- API driven state
- Client side UI state for filters, role, pagination
- Cached responses for performance

---

## Security and Performance

- Authenticated API access using Supabase
- Row level security for user data isolation
- Cached queries for faster dashboard rendering
- Pagination for large datasets
- Skeleton loading for better perceived performance

---

## Tech Stack

- Next.js 15
- TypeScript
- Supabase (PostgreSQL, Auth, RLS)
- Tailwind CSS
- Recharts
- Framer Motion

---

## How to Evaluate This Project

1. Log in using demo credentials  
2. Open Dashboard  
   - Change time ranges (7, 14, 30 days)  
   - Observe KPI changes and trends  
3. Go to Evaluations  
   - Apply filters (category and date)  
   - Use search  
   - Open detail modal  
4. Export filtered data (CSV or JSON)  
5. Toggle Admin and Viewer role  
   - Observe UI behavior changes  
6. Visit Docs, Privacy, and Terms  

---

## Scope Notes

- Add Evaluation is simulated in UI for demonstration
- Role system is UI level only, not enforced on backend
- Focus is on frontend architecture and UX

---

## Local Setup

### Install dependencies
```bash
npm install
```

### Run development server:
```bash
npm run dev
```

### Configure .env.local with Supabase credentials.
Seed data:
```bash
npm run seed
```
---

## Project Structure

- **src/**
  - **app/** - Next.js pages and API routes
    - `page.tsx` - Landing page
    - `layout.tsx` - App layout wrapper
    - `globals.css` - Global styles
    - `dashboard/` - Dashboard page
    - `evaluations/` - Evaluations explorer
    - `config/` - Settings page
    - `login/` & `signup/` - Authentication pages
    - `api/` - Backend routes
      - `evals/` - Event ingestion endpoints
      - `cron/` - Keep-alive background job
  - **components/** - React components
    - `Dashboard/` - Dashboard UI components
    - `Evaluations/` - Table and modal components
    - `ui/` - Shared UI primitives
    - `AuthProvider.tsx`, `RoleProvider.tsx`, `Navbar.tsx`, `Footer.tsx`
  - **lib/** - Utilities and helpers
    - `supabase/` - Database & auth clients
    - `cache.ts`, `design-system.ts`, `performance.ts`, `utils.ts`
  - **types/** - TypeScript definitions
    - `global.d.ts`
- **scripts/**
  - `seed.js` - Demo data seeding
  - `setup-database.sql` - Database initialization
  - `optimize-database.sql` - Performance utilities
- **Config files** - `next.config.ts`, `tsconfig.json`, `package.json`, etc.

---

## Final Note

This project demonstrates:
- Structured frontend architecture
- Data driven UI design
- Modular and scalable components
- Clean and usable interface design

I would be happy to walk through the architecture and decisions in detail.