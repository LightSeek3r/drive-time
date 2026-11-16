# Contributing

Thanks for taking an interest in Drive Time. Bug reports, small fixes and translation
corrections are the most useful contributions. For anything bigger, open an issue first so we
can agree on the direction before you spend time on it.

## Setup

```sh
npm install
npm run dev        # UI on http://localhost:5173 (the /api/* routes are not served)
```

To exercise real travel times, put a free [TomTom](https://developer.tomtom.com/) key in a
gitignored `.dev.vars` file as `TOMTOM_API_KEY=...`, run `npm run build`, then `npx wrangler dev`.

## Before you open a pull request

```sh
npm run typecheck
npm test
npm run build
npx prettier --check .
```

CI runs the first three on every pull request. Prettier settings live in `.prettierrc`; files use
LF line endings.

## Guidelines

- Keep changes small and focused. One pull request, one concern.
- Add or update a test next to the code you change. Tests sit beside their source file.
- English and French strings live in `src/i18n`; a test keeps the two files in step, so add both.
- Do not add analytics, accounts or third-party trackers. The app is deliberately local-first.
- The TomTom key must stay server-side. Anything that moves it into the browser will not be merged.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`).

## Releases

Versions follow [Semantic Versioning](https://semver.org) loosely while the project is 0.x. A
release updates the version in `package.json`, moves the `Unreleased` entries of
[CHANGELOG.md](CHANGELOG.md) under a dated heading, and pushes a `v*` tag; the release workflow
publishes the GitHub release.

By contributing you agree that your contribution is licensed under the [MIT licence](LICENSE) and
that you will follow the [code of conduct](CODE_OF_CONDUCT.md).
