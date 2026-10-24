# Local Preparation and Onboarding

## Prerequisites

- **Node.js**: `v20+` (verified on `v24.21.0`), npm `10+` (verified on `11.19.0`).
- **Python**: `3.10+` (verified on `3.14.8`).
- **Git**: `2.40+` (verified on `2.55.0.windows.5`).
- **Rokit**: `1.2.0` (for managing Roblox/Luau tools `selene`, `stylua`, `rojo`, `wally`).
- **Browsers**: Chromium for Playwright (`npx playwright install chromium`).

## First Run

### 1. Web Application (`ana_birthday_quest`)

Navigate to the project folder and install dependencies:
```powershell
cd ana_birthday_quest
npm install
npx playwright install chromium
```

To run the local development server (or view the static page):
```powershell
# Using Python built-in HTTP server:
python -m http.server 8080 --directory .
# Then open: http://localhost:8080/index.html
```

Or open `ana_birthday_quest/index.html` directly in a modern WebGL-capable browser.

### 2. Roblox Game (`DopamineCrush`)

To install Luau tools and Wally packages:
```powershell
rokit install
rokit run wally install
```

To serve through Rojo into Roblox Studio:
```powershell
rokit run rojo serve
```

## Verification

### Check WebGL Game & Playwright Suite
```powershell
npm --prefix ana_birthday_quest test
```

### Check Luau Code Quality
```powershell
& "$HOME\.rokit\bin\selene.exe" src
& "$HOME\.rokit\bin\stylua.exe" --check src
```

## AI Agents

Read [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) imports the same instructions. Consult [docs/setup.md](setup.md) for local skills, MCP connections, and configuration evidence.

## Known Issues

- **Playwright Mobile Touch Emulation**: Mobile D-Pad touch tests (`T3.14`, `T4.3`) require explicit synthetic touch events rather than mouse clicks; see `tests/e2e.spec.js`.
- **Rokit Path in Windows PowerShell**: When `rokit` binaries are not in global `$PATH`, invoke links directly via `~/.rokit/bin/<tool>.exe` or add `~/.rokit/bin` to the user environment PATH.
