# Architecture Allô Services (MVP)

## Objectif

Socle open source **multi-tenant**, **modulaire** et **paramétrable**, destiné à être déployé auprès des États. Le MVP démontre un parcours bout-en-bout : **demande d’acte de naissance (Togo) → paiement simulé → SMS simulé**.

## Modules

| Module | Statut MVP | Rôle |
|--------|------------|------|
| `platform-core` / tenants | Oui | Isolation pays, modules activés |
| `journey-engine` | Oui | Parcours déclaratifs JSON |
| `case-management` | Oui | Dossiers + statut + suivi |
| `channels-ussd` | Oui | Simulateur USSD |
| `payments` | Oui | Connecteur simulateur mobile money |
| `notifications` | Oui | Outbox SMS simulateur |
| `channels-web` | Oui | Console démo Next.js |
| voice / WhatsApp / agents / NLU | Non | Stubs / phases suivantes |

## Principes

1. **API-first** — toute UI passe par `/api/v1`.
2. **Config over code** — tenants et parcours dans `config/`.
3. **Connecteurs substituables** — `simulator` aujourd’hui, vrais opérateurs demain.
4. **Déploiement par modules** — liste `modules` dans le tenant.

## Stack

- API : NestJS + Prisma + PostgreSQL  
- Web : Next.js  
- Conteneurs : Docker Compose  
- Licence : Apache-2.0  

## Hébergement démo (&lt; 20 USD/mois)

Recommandation : **PostgreSQL Neon (free)** + **API Fly.io (free allowance)** + **Web Vercel/Cloudflare (free)** ≈ 0–10 USD.
