# esphome-ts

TypeScript client for the ESPHome native API.

## Read first

- `CONTEXT.md` — the domain vocabulary (Connection, socket stack, liveness, handshake).
- `docs/adr/` — standing decisions; `0001-connection-seam.md` is the load-bearing one.
- `docs/index.md` — the user-facing guide; README carries the version upgrade notes.

## Sandboxed sessions

`npm test` in a sandboxed terminal cannot open real TCP sockets: the three real-TCP spec files (`test/api/espDevice.spec.ts`, `test/api/client.spec.ts`, `test/api/tcpConnection.spec.ts`) fail with EPERM while every fake-based spec runs green. Snapshot that baseline on `main` before judging a run, then compare failure _sets_ in `reports/junit.xml` (vitest always emits it) — never compare counts. The full suite's final word must come from an unsandboxed run: hand `npm test` to the user once everything else is verified.

## Commits

Conventional Commits, GPG-signed. The signing key lives outside sandboxes: when a commit fails at gpg, stage everything, write the message to a scratch file, and hand the user `git commit -F <file>`. Commitlint and staged lint (husky + lint-staged) gate commits locally, so a rejected message means the hook caught it — fix the message, not the hook.
