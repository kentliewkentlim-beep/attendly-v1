# Security Checklist

## Secrets

- Keep the following values only in Vercel project environment variables:
  - DATABASE_URL
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser. It must only run on the server.

## Rotation (Recommended)

### Supabase database password

- Supabase Dashboard → Project Settings → Database → Reset database password
- Update Vercel `DATABASE_URL` to the new password.

### Supabase keys

- Supabase Dashboard → Project Settings → API → rotate keys if needed
- Update Vercel environment variables:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY

## Deployment

- Keep only one Vercel project connected to the repository to avoid deployment rate limits.
- Prefer batching multiple changes into one push to main.

