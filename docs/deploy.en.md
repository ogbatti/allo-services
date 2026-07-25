# Demo deployment (&lt; USD 20/month)

## Architecture

| Layer | Service | Indicative cost |
|-------|---------|-----------------|
| PostgreSQL | [Neon](https://neon.tech) (free) | USD 0 |
| API | [Fly.io](https://fly.io) | ~USD 0 (free allowance) |
| Web | [Vercel](https://vercel.com) | USD 0 (Hobby) |

## Variables

### API (Fly secrets)

- `DATABASE_URL` — Neon connection string (pooled, SSL)

### Web (Vercel env)

- `NEXT_PUBLIC_API_BASE_URL` — `https://allo-services-api.fly.dev/api/v1`

## Commands

```bash
fly auth login
fly apps create allo-services-api --org personal
fly secrets set DATABASE_URL="postgresql://..." -a allo-services-api
fly deploy -a allo-services-api

npx vercel login
npx vercel --prod --cwd apps/web
```

Use **synthetic data only** on this demo environment.
