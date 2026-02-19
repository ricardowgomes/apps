# Finance App — Plan

## Status: Idea / Not Started

## Vision

A private family finance application to track expenses, income, budgets, and financial goals. Built as a sub-application within `exponencial`, accessible only to authenticated family members.

## Core Feature Ideas

### 1. Expense Tracking
- Log expenses with category, amount, date, notes
- Recurring expense support (subscriptions, rent, etc.)
- Import from bank CSV/OFX files

### 2. Income Tracking
- Log income sources
- Salary, freelance, investments

### 3. Budgeting
- Monthly budget by category
- Visual progress bars / alerts when approaching limits
- Budget vs. actuals comparison

### 4. Dashboard
- Monthly summary (income vs. expenses)
- Category breakdown (pie chart / bar chart)
- Savings rate

### 5. Reports
- Monthly/yearly reports
- Export to PDF or CSV

### 6. Goals
- Set and track financial goals (e.g., emergency fund, vacation)
- Progress tracking

## Domain Model (Draft)

```
Transaction
  - id
  - type: 'income' | 'expense'
  - amount: Money (currency + value)
  - category: Category
  - date: Date
  - description: string
  - tags: string[]
  - isRecurring: boolean

Category
  - id
  - name
  - type: 'income' | 'expense'
  - color (for charts)
  - icon

Budget
  - id
  - categoryId
  - month: YearMonth
  - limit: Money

Account
  - id
  - name
  - type: 'checking' | 'savings' | 'investment'
  - balance: Money
```

## Technical Considerations

- **Auth**: Needs authentication before building features — evaluate Cloudflare Access, Clerk, or simple token-based auth
- **Database**: Cloudflare D1 (SQLite at the edge) or Turso; avoid purely client-side storage for financial data
- **Currency**: Handle multi-currency if needed; default to BRL
- **Privacy**: Data must be private; no public exposure
- **Route prefix**: `/finance/`

## Dependencies to Evaluate

- Cloudflare D1 for persistence
- An auth solution compatible with Cloudflare Workers
- A charting library (recharts, chart.js, or similar)

## Open Questions

- [ ] Single-user or multi-user (family members with separate logins)?
- [ ] Currency: BRL only, or multi-currency?
- [ ] Mobile-first or desktop-first?
- [ ] Import from bank statements (which banks/formats)?
- [ ] Integrate with any bank APIs?
