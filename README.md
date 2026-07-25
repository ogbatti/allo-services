# Allô Services

**FR** — Guichet numérique universel de services aux citoyens (USSD, voix, SMS, WhatsApp, web, agents).  
**EN** — Universal citizen service gateway (USSD, voice, SMS, WhatsApp, web, agents).

Open-source · Apache-2.0 · Multi-tenant · Modular · Configurable

---

## FR — Démarrage rapide

### Prérequis

- Node.js 20+
- Docker Desktop

### Lancer la démo locale

```bash
# 1. Base de données
docker compose up -d db

# 2. Dépendances
npm install

# 3. Schéma + API
npm run build:shared
npm run db:generate
npm run db:push
npm run dev:api

# 4. Interface (autre terminal)
npm run dev:web
```

PostgreSQL est exposé sur le port hôte **5434** (évite le conflit avec un Postgres local sur 5432).

Ouvrir [http://localhost:3000](http://localhost:3000) — tenant par défaut **Togo (`tg`)**.

Parcours démo USSD : `1` → nom enfant → date `JJ/MM/AAAA` → commune → `1` (confirmer).  
Résultat : dossier + paiement simulé + SMS dans la boîte de démo.

### Structure

```
apps/api          API NestJS (modules métier)
apps/web          Console démo Next.js
packages/shared   Types partagés
config/tenants    Paramètres pays (tg.json)
config/journeys   Parcours déclaratifs
docs/             Architecture FR/EN
```

### Hébergement démo (&lt; 20 USD/mois)

| Composant | Option low-cost |
|-----------|-----------------|
| PostgreSQL | [Neon](https://neon.tech) free |
| API | [Fly.io](https://fly.io) free allowance |
| Web | [Vercel](https://vercel.com) Hobby free |

**Déploiement guidé (recommandé)** — dans un terminal PowerShell interactif :

```powershell
pwsh -File scripts/deploy-demo.ps1
```

Ou blueprint Render : [Deploy to Render](https://render.com/deploy?repo=https://github.com/ogbatti/allo-services)  
(après création, coller `DATABASE_URL` Neon + `NEXT_PUBLIC_API_BASE_URL`).

Détails : [docs/deploy.fr.md](docs/deploy.fr.md).

Les données citoyens réelles devront respecter la souveraineté nationale (hébergement pays) — le sandbox produit reste séparé.

---

## EN — Quick start

### Prerequisites

- Node.js 20+
- Docker Desktop

### Run the local demo

```bash
docker compose up -d db
npm install
npm run build:shared
npm run db:generate
npm run db:push
npm run dev:api
# other terminal
npm run dev:web
```

Postgres is exposed on host port **5434** (avoids clashes with a local Postgres on 5432).

Open [http://localhost:3000](http://localhost:3000) — default tenant **Togo (`tg`)**.

USSD demo path: `1` → child name → date `DD/MM/YYYY` → commune → `1` (confirm).  
Result: case + simulated payment + SMS in the demo outbox.

### Product posture

- **Publisher**: Digital Public Good, Apache-2.0  
- **Operator**: deploy and parameterize per state  
- Portfolio APIs (Voix d’Afrique, MobiMarché 360, WCA Digital Trust): **stubs / future connectors**

### Demo hosting

```powershell
pwsh -File scripts/deploy-demo.ps1
```

See [docs/deploy.en.md](docs/deploy.en.md).

### Docs

- [Architecture FR](docs/architecture.fr.md)
- [Architecture EN](docs/architecture.en.md)
- [Deploy FR](docs/deploy.fr.md) / [Deploy EN](docs/deploy.en.md)

---

## License

Apache License 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
