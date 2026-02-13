# myCRM

A simple, modern customer relationship management (CRM) application for managing your business contacts, accounts, and sales opportunities — all in one place.

## What does it do?

- **Accounts** — Keep track of the companies you work with, including their industry, phone number, and website.
- **Contacts** — Store details for the people at those companies — names, emails, and phone numbers, linked to their account.
- **Opportunities** — Track your sales deals with stages (Prospecting → Qualification → Proposal → Negotiation → Closed Won/Lost), expected revenue, and close dates. Each opportunity is linked to an account.
- **Custom Fields** — Add your own fields to any object type (text, number, date, dropdown, checkbox) through the Settings page — no coding required.
- **Page Layouts** — Control which fields appear on each record page and in what order.

## Prerequisites

Before running the app, make sure you have the following installed:

1. **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
2. **PostgreSQL** (v14 or higher) — [Download here](https://www.postgresql.org/download/)

## Getting started

### 1. Set up the database

Make sure PostgreSQL is running, then create a database and user:

```bash
sudo -u postgres psql -c "CREATE ROLE myuser WITH LOGIN CREATEDB PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE sf_crm OWNER myuser;"
```

### 2. Configure the connection

Edit `backend/.env` and update the database URL to match your setup:

```
DATABASE_URL=postgres://myuser:password@localhost:5432/sf_crm
PORT=3001
```

### 3. Install dependencies

From the project root:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 4. Set up the database tables and seed data

```bash
cd backend
npm run db:push
npm run db:seed
```

### 5. Run the app

From the project root:

```bash
npm run dev
```

This starts both the backend API server and the frontend. Open your browser to:

**http://localhost:5173**

## Project structure

```
myCRM/
├── frontend/   — React web application (what you see in the browser)
├── backend/    — API server and database logic
└── package.json
```
