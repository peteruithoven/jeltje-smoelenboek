<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Project: Smoelenboek Repair Café Jeltje

Nuxt 4-app (Tailwind CSS v4, Vite+) waarmee vrijwilligers zich aanmelden voor het smoelenboek en
beheerders het als PDF downloaden. Zie README.md voor functionaliteit en deployment (Alwaysdata).

## Commando's

- Gebruik `vp run dev` en `vp run build`; die roepen `nuxt` aan. De ingebouwde `vp dev` en `vp build` starten gewone Vite en werken niet voor deze app.
- `vp check` controleert geen types in `.vue`-bestanden; daarvoor is `vp run typecheck` (vue-tsc, met TypeScript vastgezet op 6.0.3 omdat dlx anders TypeScript 7 pakt, dat vue-tsc niet kan laden).
- CI (`.github/workflows/ci.yml`) draait bij pull requests `vp check`, `vp run typecheck` en `vp run build`.
- pnpm staat in `devEngines` op 12.18.0, en de lockfile is daarmee gemaakt. Binnen de projectmap weigert `npx` (npm accepteert geen pnpm-`devEngines`); gebruik `vp exec <bin>`, of start `npx` buiten de projectmap met `--dir`. pnpm 12 weigert pakketten jonger dan een dag (`minimumReleaseAge`) en ziet genegeerde build-scripts als fout; esbuild staat daarom op `false` onder `allowBuilds` in `pnpm-workspace.yaml`.
- Beheerder aanmaken (lokaal in `.data`): `ADMIN_PASSWORD=... node scripts/admin.ts add <email> [naam]`.
- `vp run screenshots` maakt de README-screenshots (`docs/screenshots/`) met een eigen tijdelijke server en database op poort 3123, Chrome (`/usr/bin/google-chrome`, via `puppeteer-core`) en `pdftoppm`. De voorbeeldpersonen zijn verzonnen, met getekende avatars; gebruik geen echte foto's.

## Code

- UI-teksten zijn Nederlands. Huisstijlkleuren en fonts staan in `app/assets/css/main.css` (`@theme`) en `shared/utils/person.ts` (`COLORS`, ook gebruikt door de PDF).
- `PersonCard.vue` (web) en `server/utils/pdf.ts` (PDF, pdfkit) tonen hetzelfde kaartje; houd ze in sync.
- Database: `node:sqlite` (geen ORM), één bestand in `NUXT_DATA_DIR`, inclusief foto's. Schemawijzigingen = nieuwe entry in `MIGRATIONS` in `server/lib/database.ts` (nooit bestaande wijzigen; productie heeft al data).
- `server/lib/*` zijn pure modules zonder Nuxt auto-imports, omdat `scripts/admin.ts` en `scripts/screenshots.ts` ze direct met Node (type stripping) importeren.
- Bewerklinks: alleen de SHA-256-hash van het token staat in de database. Foto's en gegevens zijn alleen bereikbaar via de bewerklink of als beheerder; houd dat zo.
- Sessies: nuxt-auth-utils gebruikt `NUXT_APP_SECRET` (niet meer `NUXT_SESSION_PASSWORD`); in dev maakt het zelf een geheim aan.
- Formatter staat op `semi: false`: schrijf geen meerdere statements in één inline template-handler (`@click="a = 1; b = 2"`), oxfmt breekt die stuk. Gebruik een functie.

## Claude Code cloudsessies

- In cloudsessies (claude.ai/code, de Claude-app) installeert een SessionStart-hook de dependencies (`.claude/settings.json` draait `scripts/cloud-setup.sh`, dat lokaal niets doet). Ze gebruiken de `vp` van het project uit `node_modules/.bin`.
- De database begint daar leeg: maak een testbeheerder aan met `scripts/admin.ts` om het beheer te testen. Er is geen toegang tot de Alwaysdata-server of de productiedata, en die is ook niet nodig.
- Werk op een eigen branch en open een pull request; CI controleert die.

## Deployment

- Pushen of mergen naar `main` deployt automatisch naar productie (`.github/workflows/deploy.yml`: CI-controles, bouwen, rsync naar Alwaysdata, site herstarten via de API). Doe dat nooit zonder het eerst te vragen, elke keer opnieuw.
- Verander nooit iets op de server (`ssh smoelenboek`, `vp run deploy`, de Alwaysdata API) zonder het eerst te vragen. Alleen-lezen inspecteren mag, zeg dan wat je hebt gedraaid; lees geen secrets en geen gegevens uit de productiedatabase.
- De productiedatabase (`/home/jeltje-smoelenboek/smoelenboek-data/smoelenboek.sqlite`) bevat persoonsgegevens en foto's van vrijwilligers. Kopieer die nooit naar elders en overschrijf hem niet zonder uitdrukkelijk verzoek; stop de site eerst, want de app houdt het bestand open.
- Op de server wordt niets geïnstalleerd of gebouwd (daar is te weinig ruimte en geheugen voor); alleen de build gaat erheen (`scripts/deploy.sh`). `NUXT_DATA_DIR` moet in het Alwaysdata-panel een volledig pad zijn.
