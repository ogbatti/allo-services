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

## P1 — Prochaine vague (partenaires)

1. **Connecteurs stub propres** — interfaces SMS / Mobile Money + un faux provider (point d’extension opérateur).  
2. **Canal agent communautaire** — même parcours, saisie assistée (inclusion / dernier kilomètre).  
3. **Tableau de bord démo** — volumes dossiers / SMS / par tenant (slide live).  
4. **Pack pays documenté** — checklist « nouvel État en N jours » (config + secrets + smoke tests).

## P2 — Renforcement

- WhatsApp / voix (stubs puis connecteurs pilotes)  
- Niveaux de rôle back-office (instructeur / superviseur / admin tenant)  
- Journal d’audit exportable  
- Tests e2e automatisés sur les parcours de référence

## P3 — Écosystème

- Catalogue de packs métier additionnels (éducation, justice, etc.)  
- APIs portefeuille (Voix d’Afrique, MobiMarché, WCA Digital Trust) derrière les mêmes contrats  
- Transfert org GitHub / label bien public numérique selon critères

## Hors scope volontaire (pour l’instant)

- Microservices précoces  
- Brancher un vrai agrégateur MM / SMS avant partenaire pilote  
- Coder tous les services P1–P3 du CDC avant adoption
