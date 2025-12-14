# Backend Service

This is the backend service for the CHU consultation enterprise application. It provides the API endpoints for authentication, consultation management, and PDF generation.

## Technology Stack

- **Runtime**: Node.js with [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- PostgreSQL database

### Installation

```bash
pnpm install
```

### Running the Server

Development mode with hot reload:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
pnpm start
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

- `DATABASE_URL`: Connection string for PostgreSQL
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 3000)
