# Supabase Migrations — GitHub Actions

This workflow (`.github/workflows/supabase-migrations.yml`) runs `supabase db push` automatically whenever `supabase/migrations/**` changes on `main`. It's a belt-and-suspenders complement to the dashboard's native GitHub integration — the workflow gives you an explicit, readable log per push (Actions tab → run → step output), rather than only the integration's PR-comment preview.

You can use either or both together; running the same already-applied migrations twice is a no-op, since Supabase tracks which timestamped files have been applied.

## Required GitHub secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**, and add:

| Secret name | Where to find it |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase dashboard → click your profile icon (top right) → **Access Tokens** → **Generate new token**. This authenticates the CLI as you, not as the project. |
| `SUPABASE_PROJECT_REF` | Your project's dashboard URL: `https://supabase.com/dashboard/project/<this-part>`, or **Project Settings → General → Reference ID**. |
| `SUPABASE_DB_PASSWORD` | The database password you set when creating the project. If you don't remember it, **Project Settings → Database → Reset database password** (this only affects direct DB connections, not your app's anon/service keys). |

## What happens on first push

Since these 10 migration files are new to Supabase, the first run applies all of them in order. After that, only newly added migration files get applied on subsequent pushes.

## If a run fails

Check the Actions log — `supabase db push` reports which specific SQL statement failed. Common cause: a migration was already partially applied by hand (e.g. via the SQL Editor) before the workflow existed, so an object it tries to create already exists. Fix by either aligning what's already in the database with the migration history (`supabase migration repair`) or resolving the specific conflicting object.
