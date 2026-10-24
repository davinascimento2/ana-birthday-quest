# A Sinfonia de Ana Gleice

An interactive 3D WebGL storybook experience and birthday gift created by Davi (toadbigode) for Ana Gleice. Built with Three.js (r128) and procedural Web Audio API synthesis without external asset dependencies. The repository also houses the Roblox Luau project *DopamineCrush*.

## Run

### Web Application (`ana_birthday_quest`)
```powershell
cd ana_birthday_quest
npm install
npx playwright install chromium

# Serve locally using Python HTTP server:
python -m http.server 8080 --directory .
# Open http://localhost:8080/index.html in browser
```

### Verification & Quality Checks
```powershell
# WebGL Playwright test suite
npm --prefix ana_birthday_quest test

# Luau linter & formatter (via Rokit)
& "$HOME\.rokit\bin\selene.exe" src
& "$HOME\.rokit\bin\stylua.exe" --check src
```

## Documentation

- [Product and Scope](PRODUCT.md): Problem, audience, MVP flows, and acceptance criteria.
- [Local Preparation](docs/onboarding.md): Toolchains, prerequisites, and first-run instructions.
- [Structure and Architecture](docs/architecture.md): Two-stack code map, boundaries, and technical decisions.
- [Design and Interface](docs/design.md): Impeccable storybook aesthetics, color tokens, and layout guidelines.
- [Quality Checks](docs/quality.md): Canonical commands, Playwright tiers, Selene, and Harness2 native adaptation.
- [Agent Instructions](AGENTS.md): Working agreements, tool routing, and subagent delegation policy.
- [Setup and Evidence](docs/setup.md): Vibe Coding Toolkit adoption record, coverage matrix, and verified checks.

## Next Delivery

Resolve the 6 pre-existing mobile touch and timing test cases in `ana_birthday_quest/tests/` to reach 100% pass rate in the test suite.
