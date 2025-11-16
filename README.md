# FlowSplit - Automated Smart Money Routing

**FlowSplit is a production-grade, event-driven fintech platform that automatically routes a user's income into designated smart-wallets based on user-defined rules.**

This monorepo contains the complete source code for all frontend applications and backend microservices that constitute the FlowSplit platform.

---

## Core Features (V1)

- **Automated Splitting:** Automatically splits incoming deposits based on percentage-based rules.
- **Smart Wallets:** Users can create multiple "smart-wallets" for different financial goals (e.g., Rent, Savings, Bills).
- **Auditable Ledger:** All financial transactions are recorded on a production-grade, immutable double-entry ledger.
- **Secure Payouts:** Users can securely link external bank accounts and initiate payouts from their smart-wallets.
- **Real-time Event-Driven Architecture:** Built on a microservices architecture orchestrated by a message broker (RabbitMQ).
- **Production-Grade Security:** Centralized JWT-based authentication, secure webhook handling, and robust validation.

---

## Tech Stack & Architecture

- **Monorepo:** PNPM Workspaces + Turborepo
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Zustand
- **Backend:** NestJS (Node.js), TypeScript
- **Database:** PostgreSQL (managed via Prisma ORM)
- **Event Bus:** RabbitMQ
- **Integrations:** Paystack API for deposits and payouts

### Service Breakdown

- **`auth-service`:** Handles user registration, login, and JWT issuance.
- **`user-service`:** Manages user profiles and settings.
- **`wallet-service`:** Manages creation and retrieval of user smart-wallets.
- **`rule-service`:** Manages user-defined split rules.
- **`transactions-service`:** Ingests external deposit webhooks (e.g., Paystack).
- **`rule-engine`:** A worker service that consumes deposit events and executes the splitting logic.
- **`payout-service`:** Orchestrates the entire payout flow, from bank account verification to transfer completion.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PNPM (v8 or higher)
- Docker and Docker Compose

### 1. Initial Setup

Clone the repository and install all dependencies from the root directory.

```bash
git clone <your-repo-url>
cd flowsplit
pnpm install
