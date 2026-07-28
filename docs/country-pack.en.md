# Country pack — “new state in N days” checklist

Goal: add a country **by configuration**, without forking business code.  
References: Togo (`tg`) full pack · Benin (`bj`) thinner pack.

Solo estimate: **1–3 days** for a minimal civil-status demo pack.

---

## Day 0 — Decisions

- [ ] Tenant id (`sn`, `ci`, …) and ISO `countryCode`
- [ ] Locales (`fr`, `en`, …) and currency
- [ ] USSD / SMS sender codes (fine if fictional in sandbox)
- [ ] Enabled modules (`service-pack-*`)
- [ ] Connectors: `simulator` (sandbox) or stubs / future operator
- [ ] Hosting: product sandbox **separate** from real citizen data

---

## Day 1 — Config

### Fast path (script)

```powershell
# From the monorepo root (APPS folder), not apps/web
cd "C:\Users\GBATTI\Projects\ALLO SERVICES\APPS"

powershell -ExecutionPolicy Bypass -File scripts\scaffold-tenant.ps1 `
  -TenantId sn -CountryCode SN -NameFr "Sénégal" -NameEn "Senegal" `
  -UssdShortCode "*850#" -FeeAmount 400
```

### Manual

1. Copy `config/tenants/_template.json` → `config/tenants/{id}.json` (no `_` prefix).
2. Copy `config/journeys/_template-civil-status.json` → `*.{id}.json`  
   - Journey `id` must be **unique** (e.g. `civil-status-birth-certificate-sn`)  
   - `tenantId` = country id  
   - Adjust fees, copy, steps
3. Add an instructor in `config/instructors/demo.json` (or another file in that folder).
4. Useful modules:

| Module | Effect |
|--------|--------|
| `service-pack-civil-status` | Birth-certificate USSD menu |
| `service-pack-appointments` | Appointments |
| `service-pack-bill-payment` | Bills |
| `channels-agent` | Agent desk |
| `partner-backoffice` | Instruction |

5. `connectors.payment` / `connectors.sms`: `simulator` | `stub-momo` | `stub-sms`

---

## Day 2 — Wire-up

- [ ] `npm run build:shared && npm run db:push && npm run dev:api`
- [ ] Check `GET /api/v1/tenants` lists the new id
- [ ] Check `GET /api/v1/journeys?tenantId={id}`
- [ ] Check `GET /api/v1/connectors/{id}`
- [ ] Instructor login `POST /api/v1/auth/login`
- [ ] Smoke USSD / agent (script below)
- [ ] Deploy API (Fly bakes `config/` into the image) + restart
- [ ] UI: citizen tenant selector is API-driven — no hardcode required  
      (back-office: add demo email in UI if desired, or type it manually)

---

## Day 3 — Smoke & partner demo

```powershell
# From the monorepo root (APPS folder), not apps/web
cd "C:\Users\GBATTI\Projects\ALLO SERVICES\APPS"

powershell -ExecutionPolicy Bypass -File scripts\smoke-tenant.ps1 -TenantId sn
```

Live demo checklist:

- [ ] USSD / agent menu shows the right services
- [ ] Case created + SMS outbox
- [ ] Back-office: instruct + service-specific SMS
- [ ] Dashboard: counters for the new tenant
- [ ] Partner pack: README + architecture + this checklist

---

## Secrets & state production

| Variable | Where | Notes |
|----------|--------|--------|
| `DATABASE_URL` | API | Sovereign / sandbox Postgres |
| `AUTH_SECRET` | API | Required outside demo |
| `PAYMENT_CONNECTOR` / `SMS_CONNECTOR` | API | Default if omitted on tenant |
| `NEXT_PUBLIC_API_BASE_URL` | Web | Public API URL |

Never commit real secrets. Passwords in `config/instructors/` are **demo sandbox only**.

---

## Out of scope for this pack

- Wiring a real MM/SMS aggregator (interface already ready)
- Microservices
- Full translation of every journey without local business validation
