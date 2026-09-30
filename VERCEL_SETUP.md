# MAHI CREATION — Vercel update

આ update તમારી હાલની Cloudflare ZIPના code માટે છે. તમારી GitHub repositoryનું
નામ `mahicreation` છે. Design, logo અને product-management interface એ જ છે.

## ખર્ચ વિશે પહેલાં વાંચો

Vercelનું **Hobby plan માત્ર personal, non-commercial ઉપયોગ માટે છે**.
MAHI CREATIONમાં productsનું વેચાણ બતાવાય છે, એટલે production business site
માટે Vercel Pro અથવા Enterprise જરૂરી છે. આ updateને ₹0 business hostingનું
વચન માનશો નહીં. Code આપવાથી કોઈ paid subscription ચાલુ થતું નથી.

**તમારે ₹0 જ રાખવું હોય તો Cloudflare Workers Free વાપરો.** આ update પછી પણ
હાલનું `wrangler.jsonc` અને Cloudflare deployment ચાલુ રાખી શકાય છે.
Cloudflare Freeની database/API મર્યાદાઓ અગાઉના READMEમાં આપેલી છે.

## 1. GitHubમાં update કરો

1. `MAHI_CREATION_Vercel_FIX.zip`ને **Extract All** કરો.
2. GitHubમાં `jadejajaydeepsinh2904/mahicreation` ખોલો અને `main` branch પસંદ કરો.
3. **Add file → Upload files** દબાવો.
4. ZIPની અંદરની files અને `api`, `server`, `worker`, `src` foldersને repositoryના
   **મુખ્ય ભાગમાં** upload કરો. ZIP file પોતે upload ન કરવી.
5. આ files જૂની filesને replace કરશે. **Commit changes** કરો.
6. `src`ની બાકીની files, `public`, `migrations`, `index.html`, `vite.config.ts`, `wrangler.jsonc`
   તમારી પહેલાની repositoryમાં જ રહેવા દો. આ changes-only ZIPમાં તે નથી.

`package-lock.json` ખાસ replace થવું જોઈએ. જૂના lockfileમાં workspaceના
`../../sites/...` references હતા. નવા lockfileમાં માત્ર npm registry packages છે.
Repositoryમાં `node_modules` upload કરશો નહીં.

## 2. Cloudflare D1 database તૈયાર કરો

Vercel પર website અને server API ચાલશે. Products, photos, shop settings અને
login sessions **Cloudflare D1માં** સાચવાશે. Vercel માટે Cloudflare Worker
deploy કરવાની કે GitHubને Cloudflare સાથે connect કરવાની જરૂર નથી.

1. Cloudflare dashboardમાં **Storage & databases → D1** ખોલો.
2. જો પહેલાં `mahi-creation-db` બનાવ્યો હોય તો **એ જ database** ખોલો.
   ન બનાવ્યો હોય તો `mahi-creation-db` બનાવો અને Free plan રાખો.
3. **Database ID** અને તમારા **Account ID** copy કરો. બંને અલગ છે.
   Account ID dashboardના account overview/URLમાં અને Database ID D1ની
   વિગતોમાં મળે છે. Zone ID અહીં ન વાપરવો.
4. Databaseમાં `products`, `settings`, `images`, `sessions`, `login_attempts`
   tables પહેલેથી હોય તો ફરી SQL ચલાવવાની જરૂર નથી.
5. નવો ખાલી database હોય તો તેની **Console**માં repositoryની
   `migrations/0001_initial.sql`નું આખું SQL paste કરીને એક વાર ચલાવો.

## 3. Cloudflareનો D1 API token બનાવો

1. https://dash.cloudflare.com/profile/api-tokens ખોલો.
2. **Create Token → Create Custom Token** પસંદ કરો.
3. Token name: `MAHI Vercel D1`.
4. Permission: **Account → D1 → Edit**.
5. Account Resources: **Include → Specific account → તમારું account**.
   બધી permissions અથવા All accounts પસંદ કરવાની જરૂર નથી.
6. Summary તપાસો અને token બનાવો. તેને નીચેની Vercel settingમાં નાખો.

આ token પસંદ કરેલા accountના D1 databases માટે અધિકાર આપે છે. તેને password
જેમ private રાખો. GitHub, chat, screenshots કે frontendમાં token ન મૂકવો.
તેને બદલો અથવા revoke કરો તો Vercelની setting પણ update કરવી પડે.

## 4. Vercel Environment Variables

Vercel → તમારો **mahicreation project → Settings → Environment Variables**.
આ પાંચ variables ઉમેરો. Production environment પસંદ કરો.

| Name | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | તમારા Cloudflare accountનો ID |
| `CLOUDFLARE_DATABASE_ID` | `mahi-creation-db`નો Database ID |
| `CLOUDFLARE_D1_TOKEN` | ઉપર બનાવેલો D1 Edit token |
| `ADMIN_EMAIL` | દુકાનના login માટે તમારું email |
| `ADMIN_PASSWORD` | તમારા પસંદનો મજબૂત ખાનગી password |

Token અને password માટે Sensitive વિકલ્પ ઉપલબ્ધ હોય તો ચાલુ રાખો.
આ variable names આગળ **`VITE_` ન લગાડવું**: તે browserમાં જાહેર થઈ શકે.
આ server-only settings છે. `wrangler.jsonc`ની variables Vercel વાંચતું નથી.

Preview deploymentને આ જ production database આપશો તો Previewમાં કરેલા
product edits પણ live data બદલે છે. Previewને અલગ test database આપો,
અથવા હમણાં Productionમાં જ variables રાખો.

## 5. Vercel build settings અને Redeploy

**Settings → Build and Deployment**માં આ values રાખો:

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | Repository root; ખાલી રાખો |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | `22.x` |

`vercel.json`માં પણ આ configuration સામેલ છે. અગાઉ `Next.js`, `next build`,
અથવા બીજી custom settings રાખી હોય તો ઉપર મુજબ બદલો.

1. **Deployments** ખોલો.
2. GitHubના **નવા commit**નું deployment પસંદ કરો. જૂનું `1bf6057` નહીં.
3. **Redeploy** કરો. **Use existing Build Cache** હોય તો આ વખત માટે બંધ રાખો.
4. `Ready` થયા પછી **Visit**થી website ખોલો.

ખાલી build successful થવાથી database setup પૂરું થયું એવું નથી.
પાંચ variables અને D1 tables હોવા જરૂરી છે. Setup બાકી હોય તો site સ્પષ્ટ
error બતાવે છે; productsનો સાચવેલો data browser/localStorage પર આધારિત નથી.

## 6. Product અને Sold Out

1. Websiteના URL પછી `/admin` ખોલો.
2. `ADMIN_EMAIL` અને `ADMIN_PASSWORD`થી login કરો.
3. **દુકાનની વિગતો**માં WhatsApp number અને address નાખો.
4. **પ્રોડક્ટ ઉમેરો**થી name, category, price, photo અને details ભરો.
5. Product sold out હોય તો **સ્ટોકમાં ઉપલબ્ધ**નો tick કાઢીને Save કરો.
6. બીજા browser/incognitoમાં website ખોલીને સાચવેલો product તપાસો.

Photos browserમાં JPEGમાં optimize થાય છે: લાંબી બાજુ 900px સુધી,
અને photo દીઠ વધુમાં વધુ 180 KB. મૂળ photos તમારા પાસે સાચવો.
Sample productsને sample તરીકે બતાવાય છે; તેમના orders મોકલાતા નથી.

## Troubleshooting

- **EMISSINGTARGET / ../../sites/**: જૂનો `package-lock.json` હજુ છે અથવા
  Vercel જૂનો commit build કરે છે. નવો lockfile અને નવો commit ચકાસો.
- **Setup બાકી છે**: પાંચ variablesના names, values અને Production scope તપાસો;
  પછી Redeploy કરો. Token/password chatમાં મોકલવા નહીં.
- **Could not connect or save**: D1 ID, account ID, tokenનો D1 Edit અધિકાર અને
  database tables તપાસો. Provider quota/rate limit પર પણ request fail થઈ શકે.
- **Incorrect email or password**: Vercelમાં રાખેલા ADMIN valuesથી login કરો.
- **Too many attempts**: 15 મિનિટ પછી ફરી પ્રયાસ કરો.
- **/admin 404**: `vercel.json` repository rootમાં છે તે ચકાસો.
- **Product દેખાય પણ photo ન દેખાય**: `api/media/[id].ts` સહિત આખું `api`
  folder upload થયું છે તે તપાસો.

## Capacity and deployment notes

- Vercel uses Cloudflare's HTTPS D1 query API, with a server-only token. No
  Cloudflare account token is included in the JavaScript sent to visitors.
- The REST API has account/user rate limits in addition to D1 quotas. The
  standard Cloudflare API limit is 1,200 requests per five minutes, shared with
  other API/dashboard usage. One visitor action may issue several queries.
- This adapter suits a modest catalog and light traffic. For more traffic,
  the existing direct Cloudflare Worker/D1 binding avoids that REST API limit.
- Uploaded images have immutable URLs and public browser/CDN caching headers.
  Catalog and admin responses use `Cache-Control: no-store`.
- No live Vercel account, database token or paid plan was configured for you.
  Local validation is recorded in `VALIDATION_VERCEL.txt`.

Official references (checked 30 September 2026):
- https://vercel.com/docs/limits/fair-use-guidelines
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/frameworks/frontend/vite
- https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/
- https://developers.cloudflare.com/fundamentals/api/reference/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
