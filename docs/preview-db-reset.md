# Preview DB reset and migration replay

This repository already has a preview database setup workflow at `.github/workflows/preview-db-setup.yml`. Use it as-is to rebuild the Vercel Preview database from scratch after it has been cleared.

## Steps
1. Ensure `PREVIEW_APP_DATABASE_URL` remains populated in GitHub Secrets (it should point to the empty preview database).
2. Trigger the **Preview DB Setup** workflow in GitHub Actions. No changes to the workflow are required; it already performs `prisma migrate deploy` followed by the seed step.
3. Wait for the workflow to complete successfully. If it fails, download or copy the full run logs for debugging.
4. After the workflow succeeds, verify that `GET /api/machine-masters` returns HTTP 200 in the preview environment.

> Note: Do not use `prisma db push` for the preview database reset. Only `prisma migrate deploy` should run.
