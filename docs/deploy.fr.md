# Déploiement démo (&lt; 20 USD/mois)

## Architecture

| Couche | Service | Coût indicatif |
|--------|---------|----------------|
| PostgreSQL | [Neon](https://neon.tech) (free) | 0 USD |
| API | [Fly.io](https://fly.io) | ~0 USD (free allowance) |
| Web | [Vercel](https://vercel.com) | 0 USD (Hobby) |

## Variables

### API (Fly secrets)

- `DATABASE_URL` — chaîne Neon (pooled, SSL)

### Web (Vercel env)

- `NEXT_PUBLIC_API_BASE_URL` — `https://allo-services-api.fly.dev/api/v1`

## Commandes

```bash
# API
fly auth login
fly apps create allo-services-api --org personal
fly secrets set DATABASE_URL="postgresql://..." -a allo-services-api
fly deploy -a allo-services-api

# Web
npx vercel login
npx vercel --prod --cwd apps/web
```

Données : **uniquement fictives** sur cet environnement démo.
