# Deployment

How Brand X Lucknow is deployed, and how to run, change and reset the live site.

**Live site:** https://brandx-dealer.vercel.app

## What runs where

| Part | Service | Notes |
| --- | --- | --- |
| The site | [Vercel](https://vercel.com) (Hobby plan) | Builds from the `main` branch of the GitHub repo on every push. |
| Where the code runs | Singapore (`sin1`) | Set in `vercel.json`. Vercel's default is Washington, D.C., far from the database. |
| Database | [Neon](https://neon.tech) Postgres, AWS Singapore (`ap-southeast-1`) | The same region as the functions, so every query is a short trip. |
| AI | Groq (OpenAI-compatible API) | Optional. Without a key the AI features fall back to template text. |
| Checks | GitHub Actions | Lint, types, tests, a dependency check, a throwaway database for the database tests, and a build. |

## Environment variables

Set these in Vercel under **Settings, Environment Variables**. Vercel does not read the local `.env` file.

| Name | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Neon's **pooled** connection string (the host contains `-pooler`) | What the running site uses. |
| `DATABASE_URL_UNPOOLED` | Neon's **direct** connection string (no `-pooler`) | Used by migrations. |
| `NEXTAUTH_SECRET` | A long random string, **different from the one on your computer** | Signs logins and the stop-messages links. Make one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `NEXTAUTH_URL` | `https://brandx-dealer.vercel.app` (no slash at the end) | The links in messages, the sitemap and the canonical addresses all use it. |
| `AUTH_TRUST_HOST` | `true` | Tells the login library to trust the address Vercel serves the site from. |
| `LLM_API_KEY` | A Groq API key | Optional. |
| `LLM_MODEL`, `LLM_BASE_URL` | Optional | Switch the AI model or provider without changing code. |
| `SHOW_DEMO_LOGINS` | `false` hides the demo logins box | Shown when empty. |

A change to an environment variable only applies to the **next** deployment: after editing one, redeploy (Deployments, the three dots, Redeploy).

## First deployment (what was done)

1. Push the repo to GitHub.
2. In Vercel: **Add New, Project, Import** the repo. The Next.js preset is detected; leave the build settings alone.
3. Add the environment variables above before the first deploy, then **Deploy**.
4. Check **Settings, Domains** shows the expected address. If it differs from `NEXTAUTH_URL`, correct the variable and redeploy.

Do not add Vercel's own Prisma Postgres integration: it would create a second, empty database next to the Neon one.

## The database

- **Migrations are not run by the Vercel build.** After adding a migration, run `npx prisma migrate deploy` against the live database **before** pushing the code that needs it, or the live site will look for a table that does not exist yet. Running it again when nothing is pending is harmless.
- **Sample data** comes from `npm run seed`. It **clears every table first**, then fills in the sample cars, prices, showrooms, used cars, consultants and leads. It also puts the demo password back on every account. Run it to reset the site, and never against a database whose data you want to keep.
- **In this setup the local computer and the live site share one database.** So, once the site is live: do not run `npm run seed` or `npm run test:db` locally except as a deliberate reset, and expect changes made on the live site (an edited price, a deleted car) to show locally too. To separate them, create a child branch in Neon for local work and put its connection strings in the local `.env`.
- The database tests (`npm run test:db`) run automatically in CI on their own throwaway database, so they do not need to be run locally.

## Day-to-day

- **Deploy a change:** commit and push to `main`. Vercel builds and publishes it; CI runs alongside.
- **Roll back:** in Vercel, open **Deployments**, pick an earlier good one, and choose **Promote to Production**.
- **Hide the demo logins** when the review period is over: set `SHOW_DEMO_LOGINS=false` and redeploy. The box and the password disappear from the sign-in page itself.
- **Reset the sample data:** `npm run seed` from a computer whose `.env` points at the live database.
- **Rotate the secret:** change `NEXTAUTH_SECRET` and redeploy. Everyone is signed out, and stop-messages links sent earlier stop working, so do it only if the secret may have leaked.

## If something goes wrong

| Symptom | Likely cause |
| --- | --- |
| The build fails with a missing variable | One of the variables above is missing or misspelled. Names are case-sensitive. |
| Sign-in shows an "UntrustedHost" error | `AUTH_TRUST_HOST` is missing. |
| Links in messages or the sitemap say `localhost` | `NEXTAUTH_URL` is missing or wrong, or the site was not redeployed after fixing it. |
| A page fails with "relation ... does not exist" | A migration has not been applied: run `npx prisma migrate deploy`. |
| The site is slow on every page | The functions are not in Singapore. Check `vercel.json` and that the latest deployment used it. |
| The AI assistant always shows the template | `LLM_API_KEY` is missing or invalid, or the provider is rate-limiting. |
| Sign-in says "Too many wrong attempts" | Someone made five wrong attempts. It clears after 15 minutes, or run `delete from "LoginFailure";` in Neon's SQL editor. |
