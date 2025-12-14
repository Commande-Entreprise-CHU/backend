# Backend pour l’application CHU

Ce dépôt contient le **backend de l’application CHU**. Il fournit les endpoints API pour l'authentification, la gestion des consultations et la génération de PDF.

## Stack Technique

- **Runtime**: Node.js avec [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de données**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)
- **Sécurité**: [Helmet](https://helmetjs.github.io/), [Bcrypt](https://www.npmjs.com/package/bcryptjs), JWT

---

## Commandes pour lancer le projet

### Prérequis

- Node.js (v18+)
- pnpm (recommandé) ou npm
- Une base de données PostgreSQL

### Installation

```bash
pnpm install
```

### Configuration

Copiez le fichier `.env.example` en `.env` et remplissez les valeurs requises :

- `DATABASE_URL`: Chaîne de connexion PostgreSQL
- `JWT_SECRET`: Clé secrète pour la signature JWT
- `PORT`: Port du serveur (défaut: 3000)

### Lancer le serveur

Mode développement (avec hot-reload) :

```bash
pnpm dev
```

### Déploiement

Pour déployer l'application en production :

1. **Construire le projet** :

   ```bash
   pnpm build
   ```

   Cela va compiler le TypeScript dans le dossier `dist/`.

2. **Appliquer les migrations de base de données** :

   ```bash
   pnpm db:migrate
   ```

3. **Lancer le serveur en production** :

   ```bash
   pnpm start
   ```

---

## Structure du projet

- **src/controllers** : Logique métier et traitement des requêtes HTTP.
- **src/routes** : Définition des routes de l’API.
- **src/middleware** : Middlewares (auth, audit, etc.).
- **src/db** : Configuration DB et schémas Drizzle.
- **src/config** : Configuration globale.
- **src/utils** : Utilitaires (crypto, auth, etc.).
- **src/validation** : Schémas Zod.
- **drizzle** : Migrations SQL.

---

## Base de données

- Utilisation de **Drizzle ORM**.
- Migrations stockées dans `drizzle/`.
- Config dans `drizzle.config.ts`.

