# Pack pays — checklist « nouvel État »

Objectif : ajouter un pays **par configuration**, sans fork du code métier.  
Références : Togo (`tg`) pack complet · Bénin (`bj`) pack réduit.

Durée indicative solo : **1–3 jours** pour un pack civil-status minimal en démo.

---

## Jour 0 — Décisions

- [ ] Code tenant (`sn`, `ci`, …) et `countryCode` ISO
- [ ] Locales (`fr`, `en`, …) et devise
- [ ] Codes USSD / SMS sender (même fictifs en sandbox)
- [ ] Modules activés (`service-pack-*`)
- [ ] Connecteurs : `simulator` (sandbox) ou stubs / futur opérateur
- [ ] Hébergement : sandbox produit **séparé** des données citoyens réelles

---

## Jour 1 — Config

### Option rapide (script)

```powershell
# Depuis la racine du monorepo (dossier APPS), pas apps/web
cd "C:\Users\GBATTI\Projects\ALLO SERVICES\APPS"

powershell -ExecutionPolicy Bypass -File scripts\scaffold-tenant.ps1 `
  -TenantId sn -CountryCode SN -NameFr "Sénégal" -NameEn "Senegal" `
  -UssdShortCode "*850#" -FeeAmount 400
```

### Manuellement

1. Copier `config/tenants/_template.json` → `config/tenants/{id}.json` (pas de `_` en préfixe).
2. Copier `config/journeys/_template-civil-status.json` → `*.{id}.json`  
   - `id` de parcours **unique** (ex. `civil-status-birth-certificate-sn`)  
   - `tenantId` = id du pays  
   - Ajuster frais, textes, étapes
3. Ajouter un instructeur dans `config/instructors/demo.json` (ou fichier dédié du même dossier).
4. Modules utiles :

| Module | Effet |
|--------|--------|
| `service-pack-civil-status` | Menu USSD acte de naissance |
| `service-pack-appointments` | RDV |
| `service-pack-bill-payment` | Factures |
| `channels-agent` | Guichet agent |
| `partner-backoffice` | Instruction |

5. `connectors.payment` / `connectors.sms` : `simulator` | `stub-momo` | `stub-sms`

---

## Jour 2 — Branchement technique

- [ ] `npm run build:shared && npm run db:push && npm run dev:api`
- [ ] Vérifier `GET /api/v1/tenants` contient le nouveau id
- [ ] Vérifier `GET /api/v1/journeys?tenantId={id}`
- [ ] Vérifier `GET /api/v1/connectors/{id}`
- [ ] Login instructeur `POST /api/v1/auth/login`
- [ ] Smoke USSD / agent (voir script ci-dessous)
- [ ] Déployer API (Fly charge `config/` dans l’image) + redémarrage
- [ ] UI : le sélecteur citoyen charge les tenants via API — pas de hardcode requis  
      (back-office : ajouter l’e-mail démo dans l’UI si besoin, ou saisir manuellement)

---

## Jour 3 — Smoke & démo partenaire

```powershell
# Depuis la racine du monorepo (dossier APPS), pas apps/web
cd "C:\Users\GBATTI\Projects\ALLO SERVICES\APPS"

powershell -ExecutionPolicy Bypass -File scripts\smoke-tenant.ps1 -TenantId sn
```

Checklist démo live :

- [ ] Menu USSD / agent affiche les bons services
- [ ] Dossier créé + SMS outbox
- [ ] Back-office : instruction + SMS métier adapté
- [ ] Dashboard : compteurs du nouveau tenant
- [ ] Doc partenaire : lien README + architecture + ce pack

---

## Secrets & prod État

| Variable | Où | Notes |
|----------|-----|--------|
| `DATABASE_URL` | API | Postgres souverain / sandbox |
| `AUTH_SECRET` | API | Obligatoire hors démo |
| `PAYMENT_CONNECTOR` / `SMS_CONNECTOR` | API | Défaut si absent du tenant |
| `NEXT_PUBLIC_API_BASE_URL` | Web | URL API publique |

Ne jamais committer de vrais secrets. Les mots de passe dans `config/instructors/` sont **uniquement pour sandbox démo**.

---

## Hors scope de ce pack

- Brancher un vrai agrégateur MM/SMS (interface déjà prête)
- Microservices
- Traduction complète de tous les parcours sans validation métier locale
