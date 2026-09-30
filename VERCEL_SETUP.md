# Use the same shop on Vercel

Vercel and Cloudflare can use the same D1 database. Cloudflare connects through
its `DB` binding. Vercel connects through server-only environment variables.

In your existing Vercel project, add these Production Environment Variables:

| Name | Value |
|---|---|
| CLOUDFLARE_ACCOUNT_ID | Your Cloudflare account ID |
| CLOUDFLARE_DATABASE_ID | The same D1 database ID used in `wrangler.jsonc` |
| CLOUDFLARE_D1_TOKEN | A private Cloudflare API token with D1 edit access for this account |

Use only the needed account/permission scope. These must be **server-only**:
never add a `VITE_` prefix and never put token values in GitHub.
Redeploy Vercel after setting environment variables.

If you already created the owner account on the Cloudflare website, login with
that same email/password on Vercel. Products, photos, phone and address are shared
because both hosts use the same database. Browser sessions are separate per domain.

For first-time setup or recovery directly on Vercel, also set `ADMIN_PASSWORD`
as a private server environment variable, using your setup/recovery code, then
redeploy. `ADMIN_EMAIL` is only needed for the legacy environment-based login and
can be omitted for a shop configured through the new setup screen.

The setup code is not the day-to-day shop login password. Create the login
password on `/admin`. No credentials are included in the changes ZIP.

The code keeps existing product and image APIs, validates same-origin owner
writes, and uses D1 parameterized queries. Database tables initialize automatically;
existing products and shop details are preserved.
