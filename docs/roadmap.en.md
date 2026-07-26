# Allô Services roadmap

Priority: **prove adoption by configuration** and get ready for a state / donor partner — not early microservices.

## Done (demo MVP)

- [x] Multi-tenant core + JSON journeys  
- [x] USSD / payment / SMS simulators  
- [x] Instructor back-office (JWT)  
- [x] Service packs: civil status, appointments, bills  
- [x] Instruction & SMS adapted to `serviceCode`  
- [x] Tenant TG (full) vs BJ (thinner modules)  
- [x] Public demo (Vercel + Fly + Neon)

## P1 — Next wave (partners)

1. **Clean connector stubs** — SMS / Mobile Money interfaces + one fake provider (operator extension point).  
2. **Community agent channel** — same journey, assisted entry (inclusion / last mile).  
3. **Demo dashboard** — case / SMS volumes per tenant (live slide).  
4. **Documented country pack** — “new state in N days” checklist (config + secrets + smoke tests).

## P2 — Hardening

- WhatsApp / voice (stubs, then pilot connectors)  
- Back-office roles (instructor / supervisor / tenant admin)  
- Exportable audit trail  
- Automated e2e tests on reference journeys

## P3 — Ecosystem

- Additional service-pack catalogue (education, justice, etc.)  
- Portfolio APIs (Voix d’Afrique, MobiMarché, WCA Digital Trust) behind the same contracts  
- GitHub org transfer / DPG labelling as criteria allow

## Deliberately out of scope (for now)

- Early microservices  
- Wiring a real MM / SMS aggregator before a pilot partner  
- Building every CDC P1–P3 service before adoption
