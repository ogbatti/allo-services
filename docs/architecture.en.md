# Allô Services architecture (MVP)

## Goal

An **open-source**, **multi-tenant**, **modular** and **highly configurable** platform that states can adopt by applying country parameters. The MVP proves one end-to-end journey: **birth certificate request (Togo) → simulated payment → simulated SMS**.

## Modules

| Module | MVP | Role |
|--------|-----|------|
| `platform-core` / tenants | Yes | Country isolation, enabled modules |
| `journey-engine` | Yes | Declarative JSON journeys |
| `case-management` | Yes | Cases, status, tracking |
| `channels-ussd` | Yes | USSD simulator |
| `payments` | Yes | Mobile-money simulator connector |
| `notifications` | Yes | SMS outbox simulator |
| `channels-web` | Yes | Next.js demo console |
| voice / WhatsApp / agents / NLU | No | Later phases / stubs |

## Design principles

1. **API-first** — every UI uses `/api/v1`.
2. **Config over code** — tenants and journeys live in `config/`.
3. **Swappable connectors** — `simulator` today, real operators tomorrow.
4. **Module-based rollout** — tenant `modules` list.

## Stack

- API: NestJS + Prisma + PostgreSQL  
- Web: Next.js  
- Containers: Docker Compose  
- License: Apache-2.0  

## Demo hosting (&lt; USD 20/month)

Recommended: **Neon Postgres (free)** + **Fly.io API (free allowance)** + **Vercel/Cloudflare web (free)** ≈ USD 0–10.
