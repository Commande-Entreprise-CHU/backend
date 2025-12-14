<<<<<<< HEAD
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
=======
# Documentation

## Backend pour l’application CHU

Ce dépôt contient le **backend de l’application CHU**.

---

## Commandes pour lancer le projet

- `npm install`  
  Permet d’installer l’ensemble des dépendances du projet.

- `npm install drizzle-orm drizzle-kit`  
  Installe **Drizzle ORM** ainsi que l’outil de gestion des migrations.

- `npm install helmet`  
  Installe **Helmet** pour la sécurité des en-têtes HTTP.

- `npm run dev`  
  Lance le serveur backend en mode développement.

---

## Structure du projet

- **src/controllers**  
  Contient la logique métier et le traitement des requêtes HTTP.

- **src/routes**  
  Définit les différentes routes de l’API et leur association avec les contrôleurs.

- **src/middleware**  
  Middlewares pour l’authentification, l’autorisation et l’audit des actions.

- **src/db**  
  Configuration de la base de données et définition des schémas.

- **src/config**  
  Fichiers de configuration globaux, notamment pour l’authentification.

- **src/utils**  
  Fonctions utilitaires (authentification, chiffrement, audit, etc.).

- **src/validation**  
  Schémas de validation des données d’entrée.

- **drizzle**  
  Gestion des migrations et du schéma de la base de données via Drizzle ORM.

---

## Base de données

- Utilisation de **Drizzle ORM** pour l’accès et la gestion de la base de données.
- Migrations SQL stockées dans le dossier `drizzle`.
- Configuration définie dans le fichier `drizzle.config.ts`.

---

## Technologies utilisées

- Node.js
- TypeScript
- Drizzle ORM
- Base de données relationnelle (PostgreSQL ou équivalent)
- Express (ou framework backend équivalent)
- npm / pnpm

## Arborescence du Backend


```
ChuAppBack
└─ backend
   ├─ .env.example
   ├─ drizzle
   │  ├─ 0000_gigantic_silhouette.sql
   │  ├─ 0001_curved_spyke.sql
   │  ├─ 0002_colossal_pepper_potts.sql
   │  ├─ 0003_clean_peter_quill.sql
   │  ├─ 0004_thin_amphibian.sql
   │  ├─ 0005_wooden_fenris.sql
   │  ├─ 0006_bent_iron_man.sql
   │  ├─ 0007_safe_masked_marvel.sql
   │  ├─ 0008_parched_meggan.sql
   │  ├─ 0009_sturdy_chronomancer.sql
   │  ├─ 0010_neat_marvel_zombies.sql
   │  ├─ 0011_nifty_lady_ursula.sql
   │  ├─ 0012_loose_naoko.sql
   │  ├─ 0013_white_joseph.sql
   │  ├─ 0014_misty_chameleon.sql
   │  ├─ 0015_narrow_leopardon.sql
   │  ├─ 0016_migrate_roles.sql
   │  ├─ 0017_bouncy_the_initiative.sql
   │  ├─ 0018_dazzling_magneto.sql
   │  └─ meta
   │     ├─ 0000_snapshot.json
   │     ├─ 0001_snapshot.json
   │     ├─ 0002_snapshot.json
   │     ├─ 0003_snapshot.json
   │     ├─ 0004_snapshot.json
   │     ├─ 0005_snapshot.json
   │     ├─ 0006_snapshot.json
   │     ├─ 0007_snapshot.json
   │     ├─ 0008_snapshot.json
   │     ├─ 0009_snapshot.json
   │     ├─ 0010_snapshot.json
   │     ├─ 0011_snapshot.json
   │     ├─ 0012_snapshot.json
   │     ├─ 0013_snapshot.json
   │     ├─ 0014_snapshot.json
   │     ├─ 0015_snapshot.json
   │     ├─ 0017_snapshot.json
   │     ├─ 0018_snapshot.json
   │     └─ _journal.json
   ├─ drizzle.config.ts
   ├─ package-lock.json
   ├─ package.json
   ├─ pnpm-lock.yaml
   ├─ README.md
   ├─ src
   │  ├─ config
   │  │  └─ auth.ts
   │  ├─ controllers
   │  │  ├─ adminController.ts
   │  │  ├─ auditController.ts
   │  │  ├─ authController.ts
   │  │  ├─ chuController.ts
   │  │  ├─ patientController.ts
   │  │  ├─ statsController.ts
   │  │  └─ templateController.ts
   │  ├─ db
   │  │  ├─ index.ts
   │  │  └─ schema.ts
   │  ├─ index.ts
   │  ├─ middleware
   │  │  ├─ auditMiddleware.ts
   │  │  └─ authMiddleware.ts
   │  ├─ routes
   │  │  ├─ adminRoutes.ts
   │  │  ├─ auditRoutes.ts
   │  │  ├─ authRoutes.ts
   │  │  ├─ chuRoutes.ts
   │  │  ├─ patientRoutes.ts
   │  │  ├─ statsRoutes.ts
   │  │  └─ templateRoutes.ts
   │  ├─ scripts
   │  │  ├─ check_patient.ts
   │  │  └─ seedAdmin.ts
   │  ├─ utils
   │  │  ├─ audit.ts
   │  │  ├─ auth.ts
   │  │  └─ crypto.ts
   │  └─ validation
   │     ├─ authSchema.ts
   │     ├─ dynamicSchema.ts
   │     └─ patientSchema.ts
   └─ tsconfig.json

```
>>>>>>> f5d607c29d3cddd461a3160b1e129ed9b00b8b01
