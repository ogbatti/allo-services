# Roadmap Allô Services

Priorité : **prouver l’adoption par configuration** et préparer un partenaire État / bailleur — pas multiplier les microservices.

## Fait (MVP démo)

- [x] Socle multi-tenant + parcours JSON  
- [x] USSD / paiement / SMS simulateurs  
- [x] Back-office instructeur (JWT)  
- [x] Packs services : état civil, RDV, factures  
- [x] Instruction & SMS adaptés au `serviceCode`  
- [x] Tenant TG (complet) vs BJ (modules réduits)  
- [x] Démo publique (Vercel + Fly + Neon)
- [x] Connecteurs SMS / Mobile Money (`simulator` + stubs `stub-sms` / `stub-momo`)
- [x] Canal agent communautaire (mêmes parcours, `channel=agent`)
- [x] Tableau de bord démo (`GET /stats/demo`)
- [x] Pack pays documenté (checklist + templates + `scaffold-tenant` / `smoke-tenant`)
- [x] Rôles back-office (`instructor` / `supervisor` / `tenant_admin`)
- [x] Journal d'audit exportable (filtres + JSON / CSV)
- [x] Canaux WhatsApp / voix (stubs inbound + connecteurs sortants)

## P1 — Prochaine vague (partenaires)

1. **Connecteur réel pilote** — un SMS, MM, WhatsApp ou voix derrière l’interface existante (avec un partenaire).  

## P2 — Renforcement

- Tests e2e automatisés sur les parcours de référence
- Niveaux de rôle back-office (instructeur / superviseur / admin tenant)

## P3 — Écosystème

- Catalogue de packs métier additionnels (éducation, justice, etc.)  
- APIs portefeuille (Voix d’Afrique, MobiMarché, WCA Digital Trust) derrière les mêmes contrats  
- Transfert org GitHub / label bien public numérique selon critères

## Hors scope volontaire (pour l’instant)

- Microservices précoces  
- Brancher un vrai agrégateur MM / SMS avant partenaire pilote  
- Coder tous les services P1–P3 du CDC avant adoption
