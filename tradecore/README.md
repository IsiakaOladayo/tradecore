# TradeCore Africa — Invoice Finance Platform

> Cloud Engineering Project 2 backdrop application.
> Built on the architecture designed in Project 1 (ArchVault).

---

## What is TradeCore

TradeCore Africa is a B2B invoice finance platform. Businesses upload invoices, request advances of up to 80% of the invoice value, and repay when their customers settle. The platform processes ₦180M in transactions per day across Nigeria, Ghana, and Kenya.

This repository is the application the Cloud team deploys onto the ArchVault architecture built in Project 1.

---

## Repository structure

```
tradecore/
├── backend/            Node.js Express API
│   ├── src/
│   │   ├── app.js          Express app, middleware, routes
│   │   ├── index.js        Entry point
│   │   ├── routes/         auth, invoices, requests, dashboard
│   │   ├── middleware/      JWT authentication
│   │   └── lib/            db pool, logger
│   ├── Dockerfile
│   └── .env.example
├── frontend/           React + Vite + Tailwind
│   ├── src/
│   │   ├── main.jsx        App entry, routing
│   │   ├── pages/          Login, Register, Dashboard, Invoices, Requests
│   │   ├── components/     Layout with sidebar nav
│   │   ├── lib/            Zustand auth store, API helper
│   │   └── aws-exports.js  AWS Amplify config (Cloud team fills this in)
│   └── vite.config.js
├── database/
│   └── schema.sql      PostgreSQL schema + seed data
├── docker-compose.yml  Local development stack
└── .github/
    └── workflows/
        └── ci.yml      CI/CD pipeline — auto deploy staging, manual approve prod
```

---

## Running locally

**Prerequisites:** Docker and Docker Compose installed.

```bash
# Clone your copy of the repo
git clone https://github.com/YOUR_USERNAME/tradecore.git
cd tradecore

# Start the full stack
docker-compose up

# App:      http://localhost:3001
# API:      http://localhost:4000
# API docs: http://localhost:4000/health
```

The database schema and seed data load automatically on first run.

**Demo account:** demo@acmesupplies.ng / Demo1234!

---

## API reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | None | Register a business |
| POST | `/api/auth/login`    | None | Login |
| GET  | `/api/auth/me`       | Bearer | Current business profile |
| GET  | `/api/invoices`      | Bearer | List invoices |
| POST | `/api/invoices`      | Bearer | Upload invoice |
| GET  | `/api/invoices/:id`  | Bearer | Get invoice |
| GET  | `/api/requests`      | Bearer | List finance requests |
| POST | `/api/requests`      | Bearer | Submit finance request |
| GET  | `/api/dashboard`     | Bearer | Summary stats |
| GET  | `/health`            | None | Health check |

---

## Environment variables

See `backend/.env.example` for the full list.

In production every value comes from AWS Secrets Manager — nothing is hardcoded.
The ECS task role has permission to read the secrets. The Cloud team configures this.

---

## What the Cloud team builds on top of this

Project 2 (TradeCore Deploy) takes this application and deploys it onto the
ArchVault infrastructure from Project 1. The Cloud team:

1. Containerises the API and pushes to ECR
2. Deploys the API on ECS Fargate with Aurora PostgreSQL as the database
3. Hosts the React frontend on AWS Amplify
4. Configures CloudFront for CDN and HTTPS
5. Wires AWS Cognito for authentication (replacing the JWT-only system)
6. Stores all secrets in Secrets Manager
7. Sets up CloudWatch for observability
8. Configures the CI/CD pipeline with their ECS cluster and Amplify app IDs
9. Runs the full deployment and validates the live application

The `aws-exports.js` file in the frontend has placeholders for every
value the Cloud team provides after setting up the AWS services.

---

## AWS services the frontend uses via Amplify

- **Auth:** AWS Cognito User Pool (replaces the custom JWT auth)
- **Storage:** S3 (invoice document uploads — future feature)
- **API:** REST calls to the ECS-hosted backend via ALB

---

## CI/CD pipeline

`.github/workflows/ci.yml` runs on every push:

- **develop branch** → tests → build → auto-deploy to staging ECS + Amplify staging
- **main branch** → tests → build → **manual approval required** → deploy to production

The pipeline uses OIDC. No stored AWS credentials anywhere.

---

*TradeCore Africa — Expadox Lab Cloud Engineering Project 2*
