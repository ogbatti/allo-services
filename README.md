# Allô Services

**FR** — Guichet numérique universel de services aux citoyens (USSD, voix, SMS, WhatsApp, web, agents).  
**EN** — Universal citizen service gateway (USSD, voice, SMS, WhatsApp, web, agents).

Open-source · [Apache-2.0](LICENSE) · Multi-tenant · Modular · Configurable

> **Posture** — *Publisher* (bien public numérique) **et** *opérateur* auprès des États : un État adopte la plateforme par **paramétrage**, pas par fork.

---

## Démo publique / Live demo

| | URL |
|---|---|
| Citoyen / Citizen | https://web-omega-bay-47.vercel.app |
| Agent communautaire | https://web-omega-bay-47.vercel.app/agent |
| WhatsApp (stub) | https://web-omega-bay-47.vercel.app/whatsapp |
| Voix / IVR (stub) | https://web-omega-bay-47.vercel.app/voice |
| Tableau de bord | https://web-omega-bay-47.vercel.app/dashboard |
| Journal d'audit | https://web-omega-bay-47.vercel.app/audit |
| Back-office | https://web-omega-bay-47.vercel.app/backoffice |
| API | https://allo-services-api.fly.dev/api/v1/health |

**Comptes instructeur (mot de passe `Demo2026!`)**

| Tenant | E-mail | Rôle |
|--------|--------|------|
| Togo (`tg`) | `instructeur@lome.tg` | instructeur |
| Togo (`tg`) | `superviseur@lome.tg` | superviseur |
| Togo (`tg`) | `admin@lome.tg` | admin tenant |
| Bénin (`bj`) | `instructeur@cotonou.bj` / `admin@cotonou.bj` | … |
| Sénégal (`sn`) | `instructeur@sn.demo` / `admin@sn.demo` | … |

---

## FR — Démo en 5 minutes

### Option A — Déjà en ligne

1. Ouvrir la [démo citoyen](https://web-omega-bay-47.vercel.app).
2. Choisir le tenant **TG** (pack complet) ou **BJ** (sans factures).
3. Composer le code USSD affiché → `1` (acte) ou `2` (RDV) ; sur TG aussi `3` (facture).
4. Noter le **n° de suivi**, ouvrir le [back-office](https://web-omega-bay-47.vercel.app/backoffice), se connecter, instruire le dossier (boutons adaptés au service).
5. Ouvrir le [journal d'audit](https://web-omega-bay-47.vercel.app/audit) pour exporter l'historique CSV / JSON des actions.
6. Vérifier le SMS simulé sur la page citoyen.

### Option B — En local

Prérequis : Node.js 20+, Docker Desktop.

```bash
docker compose up -d db
npm install
npm run build:shared
npm run db:generate
npm run db:push
npm run dev:api          # http://localhost:3001/api/v1
# autre terminal
npm run dev:web          # http://localhost:3000
```

PostgreSQL hôte : port **5434**.

### Ce qui est paramétrable (sans coder)

| Couche | Où | Exemple |
|--------|-----|---------|
| Tenant / pays | `config/tenants/*.json` | codes USSD, locales, devise, `modules[]` |
| Parcours | `config/journeys/*.json` | étapes, frais, libellés FR/EN/EE |
| Packs métier | modules `service-pack-*` | état civil, RDV, factures on/off |
| Instruction | packs partagés | libellés + SMS par `serviceCode` |
| Connecteurs | `connectors` + `apps/api/src/connectors/` | `simulator` / `stub-momo` / `stub-sms` |

**TG** = état civil + RDV + factures · connecteurs `simulator`.  
**BJ** = état civil + RDV · connecteurs `stub-momo` + `stub-sms` · USSD `*711#`.

Catalogue : `GET /api/v1/connectors`.

### Structure

```
apps/api           API NestJS
apps/web           Démo Next.js (citoyen + back-office)
packages/shared    Types + packs d'instruction
config/tenants     Paramètres pays
config/journeys    Parcours déclaratifs
docs/              Architecture, déploiement, roadmap
```

### Docs

- [Architecture](docs/architecture.fr.md)
- [Pack pays](docs/country-pack.fr.md)
- [Roadmap](docs/roadmap.fr.md)
- [Déploiement](docs/deploy.fr.md)

---

## EN — Demo in 5 minutes

### Option A — Live

1. Open the [citizen demo](https://web-omega-bay-47.vercel.app).
2. Pick tenant **TG** (full pack) or **BJ** (no bills).
3. Dial the shown USSD code → `1` (birth certificate) or `2` (appointment); on TG also `3` (bill).
4. Note the **tracking number**, open the [back-office](https://web-omega-bay-47.vercel.app/backoffice), sign in, instruct the case (service-specific actions).
5. Open the [audit log](https://web-omega-bay-47.vercel.app/audit) to export the action history as CSV / JSON.
6. Check the simulated SMS on the citizen page.

### Option B — Local

Requires Node.js 20+, Docker Desktop.

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

Postgres host port: **5434**.

### What you configure (no code)

| Layer | Where | Example |
|-------|--------|---------|
| Tenant / country | `config/tenants/*.json` | USSD codes, locales, currency, `modules[]` |
| Journeys | `config/journeys/*.json` | steps, fees, FR/EN/EE copy |
| Service packs | `service-pack-*` modules | civil status, appointments, bills on/off |
| Instruction | shared packs | labels + SMS per `serviceCode` |
| Connectors | `connectors` + `apps/api/src/connectors/` | `simulator` / `stub-momo` / `stub-sms` |

**TG** = civil + appointments + bills · `simulator` connectors.  
**BJ** = civil + appointments · `stub-momo` + `stub-sms` · USSD `*711#`.

Catalogue: `GET /api/v1/connectors`.

### Docs

- [Architecture](docs/architecture.en.md)
- [Country pack](docs/country-pack.en.md)
- [Roadmap](docs/roadmap.en.md)
- [Deploy](docs/deploy.en.md)

### Product posture

- **Publisher**: Digital Public Good, Apache-2.0  
- **Operator**: deploy and parameterize per state  
- Portfolio APIs (Voix d’Afrique, MobiMarché 360, WCA Digital Trust): **stubs / future connectors**

### Demo hosting (&lt; USD 20/month)

Neon (Postgres) + Fly.io (API) + Vercel (web). Guided script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-demo.ps1
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Prefer changes in `config/` over hard-coding a country.

## License

Apache License 2.0 — [LICENSE](LICENSE) · [NOTICE](NOTICE).
