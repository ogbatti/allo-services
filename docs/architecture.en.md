# Allô Services architecture (MVP)

## Goal

An **open-source**, **multi-tenant**, **modular**, and **highly configurable** platform that states can adopt by applying country parameters in `config/` — not by forking business logic.

The public demo proves:

1. Multi-service citizen journeys (simulated USSD)  
2. Simulated payment and SMS  
3. Back-office instruction **adapted per service type**  
4. Two tenants: **Togo (full pack)** vs **Benin (thinner pack)**

## Overview

```mermaid
flowchart LR
  subgraph channels [Channels]
    USSD[USSD sim]
    WEB[Citizen web]
    BO[Back-office]
  end

  subgraph api [NestJS API /api/v1]
    AUTH[Instructor auth]
    JOURNEY[Journey engine]
    CASES[Cases]
    PAY[Payments sim]
    SMS[Notifications sim]
  end

  subgraph config [On-disk config]
    T[tenants/*.json]
    J[journeys/*.json]
  end

  subgraph data [PostgreSQL]
    DB[(Neon / local)]
  end

  USSD --> JOURNEY
  WEB --> JOURNEY
  JOURNEY --> CASES
  JOURNEY --> PAY
  CASES --> SMS
  BO --> AUTH
  BO --> CASES
  T --> api
  J --> JOURNEY
  api --> DB
```

## Modules

| Module | Status | Role |
|--------|--------|------|
| `platform-core` | Yes | Tenant isolation, Prisma sync |
| `journey-engine` | Yes | Declarative JSON journeys |
| `case-management` | Yes | Cases, transitions, tracking |
| `partner-backoffice` | Yes | Instruction + instructor JWT |
| `channels-ussd` / `channels-web` / `channels-sms` | Yes | Simulators |
| `channels-agent` / `channels-whatsapp` / `channels-voice` | Yes | Inbound stubs (same journeys) |
| `payments` / `notifications` | Yes | `simulator` / stub connectors |
| `service-pack-civil-status` | Yes | Birth certificate |
| `service-pack-appointments` | Yes | Appointment booking |
| `service-pack-bill-payment` | Yes | Bill payment (TG) |
| NLU | No | Later phases |

A tenant’s USSD home menu = **journeys whose `service-pack-*` is listed in `modules`**.

## Reference tenants

| | Togo `tg` | Benin `bj` |
|---|-----------|------------|
| USSD | `*855#` | `*711#` |
| Locales | fr, ee, en | fr, en |
| Packs | civil + appointments + bills | civil + appointments |
| Birth fee | 500 XOF | 300 XOF |

## Service-specific instruction

Same status engine (`in_review` → ready / incomplete / rejected → delivered / closed), but **action labels and SMS** depend on `serviceCode`:

- `ETC_ACTE_NAISSANCE` — certificate ready / missing document  
- `RDV_SANTE` — confirm appointment / other slot  
- `PAY_FACTURE` — validate receipt / correction  

Defined in `packages/shared` (API) with a web UI mirror.

## Connectors (operator extension)

Interfaces live in `apps/api/src/connectors/`:

| Id | Channel | Role |
|----|---------|------|
| `simulator` | payment / SMS / WhatsApp / voice | Local / TG default demo |
| `stub-momo` | payment | Fake mobile-money aggregator |
| `stub-sms` | SMS | Fake SMS gateway |
| `stub-whatsapp` | WhatsApp | Fake BSP (Meta Cloud API later) |
| `stub-voice` | voice | Fake IVR / telephony |

Selection: `config/tenants/*.json` → `connectors.payment` / `sms` / `whatsapp` / `voice` (wins), else env `PAYMENT_CONNECTOR` / `SMS_CONNECTOR` / `WHATSAPP_CONNECTOR` / `VOICE_CONNECTOR`, else `simulator`.

Runtime catalogue: `GET /api/v1/connectors` · per tenant: `GET /api/v1/connectors/:tenantId`.

To plug a real operator: implement the matching connector interface, register it in `ConnectorsModule`, reference the id on the tenant.

**Demo reference** — TG = simulators · BJ = `stub-momo` / `stub-sms` / `stub-whatsapp` / `stub-voice`.

## Design principles

1. **API-first** — every UI uses `/api/v1`.  
2. **Config over code** — tenants and journeys live in `config/`.  
3. **Swappable connectors** — same interface for simulator / stub / real SDK.  
4. **Modular monolith** — no microservices at MVP stage.  
5. **Sovereignty** — real citizen data stays with the state; product sandbox is separate.

## Stack

- API: NestJS + Prisma + PostgreSQL  
- Web: Next.js  
- Containers: Docker Compose  
- License: Apache-2.0  

## Demo hosting

Neon (Postgres) + Fly.io (API) + Vercel (web) — see [deploy.en.md](deploy.en.md).

## Next

See [roadmap.en.md](roadmap.en.md) · [country-pack.en.md](country-pack.en.md).
