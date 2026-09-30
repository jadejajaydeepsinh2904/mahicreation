# MAHI CREATION — Cloudflare Free + GitHub

A standalone boutique website. Customers do not need ChatGPT or an account.
Modern white design, new logo, Gujarati/English, sarees, clothing, jewellery,
accessories, bags, filters, search, prices, stock, product details, shopping bag
and WhatsApp orders. Owner login is at `/admin`.

**Hosting: Cloudflare Workers Free with Static Assets.**
**Products, shop details and compact product photos: Cloudflare D1 Free.**
No Netlify, Supabase, R2, paid image service or payment gateway is required.

## પહેલાં આ જાણો

- This is source code. It is not already deployed in your Cloudflare account.
- Keep your Cloudflare account on **Workers Free**. Do not enable a paid plan,
  paid add-ons or R2. A free `mahi-creation.YOUR-SUBDOMAIN.workers.dev` URL is enough.
- A custom `.com`/`.in` domain is optional and may cost money to buy.
- Cloudflare static assets are served directly; these requests are free and unlimited.
  Product APIs, logins and uploaded photo requests use Worker/D1 free daily quotas.
- Free does not mean unlimited database/API usage. If those quotas are exceeded,
  APIs can return errors until the daily reset. No unlimited uptime is promised.
- This design has no Netlify monthly-credit pause or Supabase inactivity pause.
- Photos are optimized to JPEG, at most 900px on the long edge and 180 KB each.
  They are catalog photos, not full-resolution originals. Keep original photos yourself.
  Storing compact catalog photos in D1 avoids enabling a billable object-storage service.

## 1. GitHub પર કોડ અપલોડ કરો

1. Unzip `MAHI_CREATION_Cloudflare_GitHub.zip`.
2. Create a personal GitHub repository named `mahi-creation`.
3. Upload the ZIP contents to the repository root. At the top level you must have:
   `package.json`, `wrangler.jsonc`, `src`, `worker`, `migrations`, `public`, `index.html`.
4. Commit. Do not upload passwords, `.dev.vars`, `node_modules`, `.wrangler`, or `dist`.

## 2. Cloudflare માં D1 ડેટાબેઝ બનાવો

1. Sign in at https://dash.cloudflare.com using a Free account.
2. Open **Storage & databases > D1** (dashboard labels may vary).
3. Create a database named **`mahi-creation-db`**.
4. Copy its **Database ID**.
5. In GitHub, edit `wrangler.jsonc`:
   - Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with that Database ID.
   - Replace `CHANGE_TO_YOUR_EMAIL` in `ADMIN_EMAIL` with your shop login email.
   - Keep the database name `mahi-creation-db` and binding `DB`.
6. Open the database Console in Cloudflare and run all of `migrations/0001_initial.sql`
   **once**. This creates product, image, settings, session and login-limit tables.
   Do not rerun this initial SQL against an already initialized database.

## 3. GitHub થી Cloudflare પર વેબસાઇટ ચાલુ કરો

1. In Cloudflare, open **Workers & Pages > Create application**.
2. Choose the **Workers** GitHub import/connect flow, not a Pages-only static project.
3. Connect your GitHub account and select the `mahi-creation` repository.
4. Use this configuration:

| Setting | Value |
|---|---|
| Worker name | `mahi-creation` (same as `wrangler.jsonc`) |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | Repository root |
| Node version | 22.13 or newer |

5. Deploy. Wrangler reads the D1 binding and static assets from `wrangler.jsonc`.
6. In the Worker **Settings > Variables and Secrets**, add:
   - Name: **`ADMIN_PASSWORD`**
   - Type: **Secret**
   - Value: a strong password that only you know.
   Save and deploy/apply it. Do not add this password to GitHub.
7. Check the Worker bindings show **DB → mahi-creation-db**.
8. Open the generated `.workers.dev` link.

If Cloudflare asks to buy Workers Paid, do not proceed with that upgrade.
The app uses only Free-compatible Workers Static Assets and D1 functionality.
No external service keys are required.

## 4. પ્રોડક્ટ ઉમેરો

1. Open your website and click **દુકાન લોગિન**, or visit `/admin`.
2. Sign in using the email in `ADMIN_EMAIL` and the password in `ADMIN_PASSWORD`.
3. In the collection area select **દુકાનની વિગતો**.
4. Enter your WhatsApp number with country code (India `91`) and address. Save.
5. Select **પ્રોડક્ટ ઉમેરો**.
6. Enter name, Gujarati name (optional), category, price, photo, description and stock.
7. Save. Customers see the real product immediately. No code rebuild is needed.
8. Use **પ્રોડક્ટ મેનેજ કરો** to edit/delete products.

Sample products are clearly labelled and cannot be ordered. Once you add your
own products, samples disappear. If all real products are deleted, the sample
collection appears again. WhatsApp orders are messages; you confirm final
price, delivery and availability with the customer.

## ફ્રી મર્યાદાઓ — 30 September 2026 ને તપાસેલી

- Static assets: free and unlimited requests when served without invoking the Worker.
- Worker APIs: 100,000 requests/day on Free, shared at account level; 10ms CPU per invocation.
- D1: 5 million rows read/day, 100,000 rows written/day, 5 GB total free storage;
  the Free maximum size for a single database is 500 MB.
- A photo uses up to 180 KB plus database overhead. Monitor the actual D1 size;
  catalog capacity depends on photo sizes and other records.
- Daily quotas reset at 00:00 UTC. At a quota/storage limit, operations can fail;
  delete unneeded data or wait for the daily reset. Do not upgrade if you require ₹0.
- Git-based builds also have a Free plan quota; avoid needless code commits/deploys.
  Adding/editing products does not trigger a GitHub commit or a new website build.

Sources:
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/d1/platform/pricing/
https://developers.cloudflare.com/d1/platform/limits/
https://developers.cloudflare.com/workers/static-assets/
https://developers.cloudflare.com/workers/ci-cd/builds/

## Optional: PC થી setup / deploy

Install Node.js 22.13 or newer and run in the extracted folder:

```bash
npm install
npx wrangler login
npx wrangler d1 create mahi-creation-db
```

Copy the returned real Database ID into `wrangler.jsonc`. Set `ADMIN_EMAIL` there.
Then:

```bash
npm run db:remote
npx wrangler secret put ADMIN_PASSWORD
npm run build
npx wrangler deploy
```

The `deploy` npm script can apply pending migrations before deploying:

```bash
npm run deploy
```

Use **either** the dashboard initial SQL setup or Wrangler migrations for a new
production database. If you initialized tables in the dashboard, do not run the
initial migration again via Wrangler unless you first reconcile migration tracking.
The recommended GitHub dashboard deploy command intentionally does not rerun SQL.

### Local testing

Copy `.dev.vars.example` to `.dev.vars`, choose a test password, set `ADMIN_EMAIL`
in `wrangler.jsonc`, then:

```bash
npm install
npm run db:local
npm run dev
```

Wrangler prints the local URL. Local data is separate from production.

## Technical notes

- React + Vite front end, Cloudflare Worker API, SQLite-compatible D1 migrations.
- No browser-only product storage; all product data/photos persist in D1.
- Admin sessions use random tokens with hashed tokens stored in D1, HttpOnly
  SameSite cookies and an eight-hour expiry. Sign in again when expired.
- Login attempts are limited to ten per IP per 15-minute bucket.
- Admin write endpoints verify the session and reject cross-origin requests.
- Uploads accept compact JPEG output from the browser photo optimizer;
  original selection supports JPG/PNG/WebP up to 8 MB.
- Product deletion/replacement cleans unused referenced images; abandoned uploads
  older than 24 hours are cleaned during subsequent uploads.
- The worker uses parameterized SQL and immutable photo cache URLs.
- For larger catalogs/high traffic, a future paid architecture may be needed;
  this package deliberately avoids those services for your ₹0 requirement.

## Validation

TypeScript, the production frontend build, Cloudflare packaging dry run and local
D1 migrations were checked. See `VALIDATION.txt` for the local API integration result.
The real Cloudflare account/binding/password must still be configured by you.
