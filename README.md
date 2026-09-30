# MAHI CREATION

Gujarati / English boutique storefront with owner login, product photos and prices,
stock management, shopping bag and WhatsApp orders. Source repository:
`jadejajaydeepsinh2904/mahicreation`, production branch `main`.
Cloudflare Worker name remains `mahi-creation`.

## Update an existing deployment

Extract the changes ZIP. Upload its files **and folders** to the root of the
`mahicreation` repository on `main`, preserving their paths. Commit the upload.
Both connected hosting builds will run. No dependency additions are required.
Build: `npm run build`. Cloudflare deploy: `npx wrangler deploy`.

Do not upload the ZIP itself, `node_modules`, `.dev.vars`, database test state,
passwords or API tokens. The supplied changes ZIP contains no credentials.

## First-time owner setup — Cloudflare

1. Open your existing Worker `mahi-creation` in Cloudflare.
2. In **Settings > Variables and Secrets**, create a **Secret** named
   `ADMIN_PASSWORD`. Use a long, private random setup/recovery code.
   Save/deploy it. Keep this code in your password manager, not in GitHub.
3. Open your Cloudflare website and click **દુકાનનું લોગિન** (`/admin`).
4. Enter that setup code, your chosen login email, a new password of at least
   12 characters, the shop WhatsApp number, and optionally the address.
5. Select **દુકાન શરૂ કરો**. This establishes the owner account and signs you in.

The setup endpoint checks the server-side secret before creating an owner.
The first public visitor cannot claim the shop. Existing valid environment-based
owner credentials continue to work, and can be migrated from the setup link.

D1 tables are initialized automatically using `CREATE TABLE IF NOT EXISTS`.
Existing products, images, settings and data are preserved. The Worker must have
its existing **DB** binding connected to the correct D1 database.
No manual SQL step is needed for this update. Idempotent migration files are also
included for deployments that use Wrangler migrations.

`ADMIN_EMAIL` is optional after website setup: login email/password are stored in
D1. The `ADMIN_PASSWORD` hosting secret becomes an owner-only recovery code.
Your login password is stored as a salted PBKDF2 hash, never as readable text.

## Manage the shop

- Login opens the management controls in the collection section.
- **પ્રોડક્ટ ઉમેરો**: name, optional Gujarati name, category, decimal price,
  photo, description/size/colour and stock availability.
- Select a JPG, PNG or WebP up to 8 MB. The browser creates a compact JPEG
  before storing it in D1. Keep original photos separately.
- **બદલો / દૂર કરો**: edit products or delete them after confirmation.
- **WhatsApp / સરનામું**: save the number and address. A 10-digit Indian mobile
  number automatically receives the country code `91`. Gujarati digits work too.
- **Email / Password**: change login details using the current password.
  Older sessions stop working immediately after a change.
- **Password ભૂલી ગયા?**: reset using the private hosting recovery code.
- Logout ends the current session. Sessions expire after eight hours.

Real products and shop details persist in D1 across reloads, devices and code
uploads. They are never committed to GitHub. Products saved on the same database
appear on both hosts. A Vercel domain requires the D1 connection described in
`VERCEL_SETUP.md`; a successful frontend build alone does not configure it.

## Customer flow

Customers browse/filter/search, view product details and images, and put items
in their bag. The bag persists on that browser. WhatsApp opens a message with
product names, quantities, prices, total and product links. Customers send the
message themselves; payment, final pricing and delivery are agreed with the shop.
Out-of-stock items cannot be ordered. Demo products are labelled and cannot be
ordered; after owner setup they do not reappear when the last real product is deleted.

## Validation

Run `npm run build` for TypeScript and the production frontend build. The update
was also exercised against a local Cloudflare Worker with a fresh D1 database and
through API integration tests. Live secrets and real product/contact data
must be supplied by the owner on the deployed website.

Cloudflare deployment connected.
