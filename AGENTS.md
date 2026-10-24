# AGENTS.md

> AI Agent Guidelines, Canonical Commands, and Working Agreements for the project.

## Product and Stack

- **Product and Scope**: [PRODUCT.md](PRODUCT.md).
- **Architecture and Code Map**: [docs/architecture.md](docs/architecture.md).
- **Design Guidelines**: [docs/design.md](docs/design.md).
- **Quality Gates and Verification**: [docs/quality.md](docs/quality.md).
- **Setup History and Coverage**: [docs/setup.md](docs/setup.md).
- **Primary Stack**: Three.js WebGL (r128) + Procedural Web Audio API synthesizer (`ana_birthday_quest/`), Playwright test runner.
- **Secondary Stack**: Roblox Luau managed via Rokit (`DopamineCrush.rbxl`, `src/`), Selene linter, StyLua formatter.

## Canonical Commands

### WebGL Storybook (`ana_birthday_quest/`)
- Install: `npm --prefix ana_birthday_quest install`
- Playwright E2E Tests: `npm --prefix ana_birthday_quest test`
- Headed E2E Tests: `npm --prefix ana_birthday_quest run test:headed`
- Local Serve: `python -m http.server 8080 --directory ana_birthday_quest`

### Roblox Luau (`src/`)
- Toolchain Install: `rokit install`
- Wally Packages: `rokit run wally install`
- Lint: `& "$HOME\.rokit\bin\selene.exe" src`
- Format Check: `& "$HOME\.rokit\bin\stylua.exe" --check src`
- Format Fix: `& "$HOME\.rokit\bin\stylua.exe" src`

### Combined Foundation Check
```powershell
& "$HOME\.rokit\bin\selene.exe" src
& "$HOME\.rokit\bin\stylua.exe" --check src
npm --prefix ana_birthday_quest test
```

## Working Agreements

- **Read Before Acting**: Inspect relevant code, manifests, and contracts before editing. Distinguish observed facts from assumptions.
- **Ponytail (Smallest Sufficient Change)**: Deliver the smallest complete, working solution that satisfies the request. Reuse existing patterns and utilities.
- **Preserve Contracts**: Keep zero-asset procedural constraints, offline integrity, and public test hooks (`window.__GAME_STATE__`, `window.gameApp`) intact.
- **No Unrequested Frameworks**: Do not scaffold Next.js, Drizzle, or foreign stacks into this Three.js/Roblox project.
- **Verifiable Invariants**: Write or run deterministic checks rather than making assumptions. If a bug is found, reproduce it before fixing.
- **Caveman (Concise Communication)**: Keep conversation clear, direct, and concise in the user's language. Code, documentation, and commit messages maintain full, professional grammar.

## Subagent Delegation Policy

- **Disjoint File Sets**: Parallel subagents write only to independent, disjoint sets of files.
- **Coordinator Ownership**: Lockfiles (`package-lock.json`, `wally.lock`), shared configs (`AGENTS.md`, `.mcp.json`), and Git operations belong strictly to the coordinator.
- **Dynamic Capability Selection**:
  - Mechanical tasks, searches, localized linters: lightweight capability.
  - Architecture, security, core physics/audio engine loops: high-capability reasoning models.
- **Reviewers**: Subagent reviewers are strictly read-only. Findings return to the coordinator or responsible writer.

## Tools and Routing

- **Context7**: Query current official documentation for libraries (e.g. Three.js r128, Playwright) via configured MCP or documentation lookups. Never transmit private tokens or code.
- **Graphify**: Consult repository structure while respecting `.graphifyignore`.
- **Harness2 Native Adaptation**: Follow the bounded candidate comparison protocol in `docs/quality.md` when refining instructions or tooling after an observed failure.
- **Security Review**: Run the self-contained security review prompt in `docs/quality.md` for baseline audits; keep reports private and redacted.
- **Git & Safety**: Do not commit secrets, add pre-commit blockers, or push to remote repositories without explicit user instruction.
