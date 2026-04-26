# STS2 Viewer

A desktop app for browsing and analyzing your [Slay the Spire 2](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/) run history. Built with Electron + React.

![STS2 Viewer](https://placeholder)

## Features

- **Run list** — browse all your past runs with character, outcome, floor reached, and duration at a glance
- **Run detail** — per-run breakdown including HP over time chart, full map path with node details, final deck with card tooltips, and relic list
- **Card stats** — aggregate pick rate, win rate, and encounter stats across all recorded runs
- **Dashboard** — high-level win rate, character breakdown, and recent run history
- **Card tooltips** — card art, description, keywords, energy/star costs, enchantments, and runtime props (e.g. Genetic Algorithm's current block value) pulled live from the Spire Codex API
- **Co-op support** — switch between players in multiplayer runs
- **Light & dark theme** — follows your system preference
- **Cross-platform** — Windows, macOS, and Linux

## Installation

Download the latest release for your platform from the [Releases](../../releases) page.

| Platform | File |
|---|---|
| Windows | `.exe` installer (NSIS) |
| macOS | `.dmg` |
| Linux | `.AppImage` |

## Save file location

The app auto-detects your save directory. If it doesn't find your saves, you can set the path manually in **Settings**.

| Platform | Default path |
|---|---|
| Windows | `%APPDATA%\SlayTheSpire2\steam` |
| macOS | `~/Library/Application Support/SlayTheSpire2/steam` |
| Linux | `~/.steam/steam/userdata` |

## Development

**Prerequisites:** Node.js 20+

```bash
# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev

# Build for your current platform
npm run electron:build

# Build for a specific platform
npm run electron:build:win
npm run electron:build:mac
npm run electron:build:linux
```

### Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

## Credits

Card data, descriptions, and artwork are sourced from the **[Spire Codex API](https://spire-codex.com/)** — an unofficial community-maintained database for Slay the Spire 2. Please support their work.

## Disclaimer

This project is an independent, community-made tool and is **not affiliated with, endorsed by, or associated with Mega Crit Games or the Slay the Spire 2 development team** in any way. All game assets and content belong to their respective owners.

## License

MIT
