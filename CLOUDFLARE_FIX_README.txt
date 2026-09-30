MAHI CREATION — Cloudflare build fix

Error: sh: 1: tsc: not found

1. ZIPને Extract All કરો.
2. GitHub → jadejajaydeepsinh2904/mahicreation → main branch ખોલો.
3. Add file → Upload filesમાં આ ત્રણ files મુખ્ય ભાગમાં upload કરો:
   package.json
   package-lock.json
   .npmrc
4. Commit changes કરો.
5. Cloudflare → Workers & Pages → mahi-creation → Deploymentsમાં નવા commitનો
   build જુઓ. જરૂર પડે તો એ નવા build પર Retry build કરો.

Build command: npm run build
Deploy command: npx wrangler deploy
Root directory: repository root (/)
Node version: 22.x

.npmrcમાં include=dev છે. એટલે TypeScript, Vite અને Wrangler જેવા build tools
production installationમાં પણ સામેલ થાય છે. Lockfileમાં જૂના local folderના
references કાઢીને registry packages રાખ્યા છે.

નવા logમાં mahi-creation@1.1.0 build દેખાવું જોઈએ.
હજી 1.0.0 દેખાય તો જૂનો commit build થઈ રહ્યો છે; નવો commit પસંદ કરો.

src, public, worker, migrations, wrangler.jsonc વગેરે જૂની files રહેવા દો.
Database ID કે ADMIN_EMAIL/password આ ZIPમાં નથી બદલાતા.
આ ZIP માત્ર build dependenciesનો સુધારો છે; સંપૂર્ણ website source નથી.

આ dependency pairનું clean npm ci અને Node 22 પર TypeScript/Vite build
અગાઉ સફળતાપૂર્વક ચકાસેલું છે. Live Cloudflare deployment હજી ખાતામાં ચકાસવાનું છે.

https://docs.npmjs.com/cli/v11/commands/npm-ci/
https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
