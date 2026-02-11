# Type2 Content OS

Mobile-first, minimal growth platform for `@type2future`.

## Core purpose

Help an operator publish better content every day and improve follower growth with fast feedback loops.

## Modules

- `Today`: KPI diagnostics, daily sprint checklist, next-best actions
- `Create`: signal-to-draft workflow, hook generator, draft scoring
- `Learn`: benchmark accounts, daily study assignments, notes
- `Review`: post logging and automatic pattern insights (winning format/pillar/source)

## Run

Open in browser:

`/Users/futurelabstudios/Downloads/type2future marketing/index.html`

No install or build step is required.

## Auto deploy (GitHub -> Netlify)

This repo uses GitHub Actions for Netlify production deploys on every push to `main`.

Required one-time setup:

1. In GitHub repo settings, add secret `NETLIFY_AUTH_TOKEN`.
2. In Netlify, create a Personal Access Token (User settings -> Applications -> Personal access tokens).
3. Push to `main` and verify workflow `Deploy to Netlify` succeeds.

Site ID is already wired in workflow: `cb986de0-029f-478e-bb4d-1051ec155f16`.

## Analytics CSV expected

- `Date`
- `Impressions`
- `Engagements`
- `New follows`

The parser tolerates wider X account overview exports.

## Storage

All state is stored in local browser storage on your machine.
