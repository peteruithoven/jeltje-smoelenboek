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

Zie README.md voor functionaliteit en deployment (Alwaysdata). Aandachtspunten:

- UI-teksten zijn Nederlands. Huisstijlkleuren en fonts staan in `app/assets/css/main.css` (`@theme`) en `shared/utils/person.ts` (`COLORS`, ook gebruikt door de PDF).
- `PersonCard.vue` (web) en `server/utils/pdf.ts` (PDF) tonen hetzelfde kaartje; houd ze in sync.
- Database: `node:sqlite` (geen ORM). Schemawijzigingen = nieuwe entry in `MIGRATIONS` in `server/lib/database.ts` (nooit bestaande wijzigen).
- `server/lib/*` zijn pure modules zonder Nuxt auto-imports, omdat `scripts/admin.ts` ze direct met Node (type stripping) importeert.
- Sessies: nuxt-auth-utils gebruikt `NUXT_APP_SECRET` (niet meer `NUXT_SESSION_PASSWORD`).
- Formatter staat op `semi: false`: schrijf geen meerdere statements in één inline template-handler (`@click="a = 1; b = 2"`), oxfmt breekt die stuk. Gebruik een functie.
