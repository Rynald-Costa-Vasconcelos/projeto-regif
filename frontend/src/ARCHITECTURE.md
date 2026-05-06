# Frontend Architecture

## Layering

- `app/*`: application bootstrap (routes, providers, config).
- `layouts/*`: route shells and shared page chrome.
- `pages/*`: route-facing page layer (stable import surface for `app/routes`).
- `features/*`: domain implementation (hooks, components, pages, api, types).
- `shared/*`: cross-domain concerns (auth/session, api contracts).
- `lib/*`: framework-agnostic client setup (axios instance, helpers).

## Route Rule

`app/routes` should import only from `pages/*` and never directly from `features/*`.

This keeps routing stable while feature internals evolve.

## Page Rule

`pages/*` may:

- implement UI directly for simple screens, or
- act as a thin facade that re-exports a feature page.

Both approaches are valid, but routes must remain decoupled from feature internals.
