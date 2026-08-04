# 🚀 Space Junkz

<p align="center">
  <strong>A fast, progression-driven arcade space shooter built from scratch with HTML5 Canvas and vanilla JavaScript.</strong>
</p>

<p align="center">
  Fight through handcrafted missions, destroy multi-stage bosses, recover WizzCoins and Salvage, unlock stronger weapons, open Legendary Caches and push deeper into hostile space.
</p>

<p align="center">
  <a href="https://space-junkz-shooter.vercel.app/game.html"><strong>Play Space Junkz</strong></a>
  ·
  <a href="https://github.com/999nike/space-junkz-shooter">GitHub Repository</a>
  ·
  <a href="https://junkz-shooter-landing.vercel.app">Project Landing Page</a>
</p>

> **Development status:** Active development. The core campaign loop, world map, HomeBase, persistent progression, multiple mission modules, boss encounters, mobile controls and upgrade systems are playable. Additional balancing, polish, content and optimisation are ongoing.

---

## About the game

**Space Junkz** is a browser-based arcade shooter designed around immediate combat and long-term progression.

The player begins in a cinematic opening battle, enters a navigable world map, selects missions, fights enemy formations and large bosses, collects resources, then returns to HomeBase to improve their ship and prepare for the next run.

The project does not use a commercial game engine. Its gameplay, rendering, input, progression, mission logic and visual effects are implemented directly in JavaScript using the HTML5 Canvas API.

---

## Core features

### High-speed arcade combat

- Responsive real-time shooting and movement.
- Gameplay designed for both desktop and mobile browsers.
- Enemy formations, projectile pressure and escalating mission difficulty.
- Normal enemies, heavy units, custom bosses and escort mini-bosses.
- Boss contact damage, ranged attacks, area pressure and unique movement patterns.
- Smoothed FPS reporting with support for displays up to 120 Hz.
- Dedicated explosion, hit-flash, shield, engine, reward and projectile effects.

### Mobile-first controls

The current mobile layout is designed for landscape play:

- **Left:** movement joystick.
- **Centre:** dedicated FIRE button.
- **Right:** independent aim joystick.

The controls support simultaneous multi-touch input so movement, aiming and firing remain independent. Portrait and compact landscape layouts are also handled by the responsive interface.

### Desktop controls

- Keyboard movement.
- Mouse aiming.
- Mouse-down firing.
- Spacebar firing.
- F3 developer FPS overlay toggle.

### Persistent player progression

The local profile stores:

- Player score.
- WizzCoins.
- Salvage.
- XP.
- Weapon level.
- Permanent unlocks.
- Legendary Cache count.
- Mission best scores.
- Total missions completed.
- Total enemies destroyed.
- Total bosses destroyed.
- Permanent ship-stat bonuses.

The game uses local browser storage for offline persistence and includes API hooks for player creation, stat synchronisation and leaderboard retrieval when deployed with the backend routes.

---

## Campaign structure

The current game flow is:

```text
Intro Battle
    ↓
Black Hole Transition
    ↓
World Map
    ↓
Mission Selection
    ↓
Combat / Boss Encounter
    ↓
Mission Results and Rewards
    ↓
World Map or HomeBase
    ↓
Upgrades and Continued Progression
```

The world map contains a connected route of mission nodes, completion states and campaign destinations.

### Intro battle

The opening sequence introduces the combat system through two major encounters:

- **Scorpion** — hover movement, claw attacks, close-range danger zones and a charging tail laser.
- **Gemini Warship** — orbiting movement, spread attacks and an increasingly aggressive combat phase.

The intro leads into the wider campaign through the game's black-hole transition and world-map flow.

### Mission 1 — Scarab Nebula: Drax Gauntlet

A four-command-ship gauntlet combining continuous enemy pressure with staged boss fights.

Features:

- Opening combat waves.
- Four distinct boss phases.
- Increasing boss health and pressure.
- Support enemies during key encounters.
- Reward and progression integration.
- Clean return to the World Map after completion.

Boss identities are styled around:

- Aries.
- Cancer.
- Taurus.
- Sagittarius.

### Mission 2 — Gemini Rift

A longer multi-boss campaign encounter built around alternating waves and boss phases.

Current boss sequence:

1. Cancer Dreadnought.
2. Drax Fighter Ace.
3. Leo Siege Cruiser.
4. Scorpion Assault Carrier.
5. Virgo Flagship.

The mission escalates through repeated wave-to-boss transitions before the final flagship battle.

### Mission 3 — Shattered Armada

A custom fleet-battle mission featuring a large Armada boss and its deployed escort wing.

Features:

- Dedicated mission-specific boss logic.
- Four escort mini-boss ships.
- Formation and regroup behaviour.
- Predictive aiming.
- Staggered 3–5-shot attack bursts.
- Maximum simultaneous-firing limits to keep patterns challenging but readable.
- Custom projectiles, rockets, bombs, turrets, flames and explosion assets.
- Large-scale boss presentation and cinematic effects.

### Mission 4 — The Void Frontier

A survival-focused mission in which the player holds the frontier before the incoming Void Boss arrives.

Features:

- Sustained enemy pressure.
- Timed boss arrival.
- Dedicated boss-bullet handling.
- Void-themed environment and encounter logic.

### Future route

The World Map already includes an additional unstable Void destination reserved for continued campaign expansion.

---

## Boss and enemy systems

Space Junkz uses both shared and mission-specific AI systems.

### Boss behaviour

Depending on the encounter, bosses can use:

- Hover and orbit movement.
- Player tracking.
- Predictive projectile aiming.
- Spread patterns.
- Burst attacks.
- Laser charging and firing phases.
- Close-range and outer-zone contact damage.
- Escort deployment.
- Timed phase transitions.
- Rage or pressure escalation.
- Dedicated health bars and destruction sequences.

### Escort mini-boss AI

The Shattered Armada escorts include:

- Formation positioning around the main boss.
- Independent movement and combat state.
- Predictive aiming based on player movement.
- 3–5-shot bursts.
- Staggered cooldowns.
- A cap of two escorts firing simultaneously.
- Firing restrictions while regrouping or outside active combat space.

### Enemy scaling

Standard enemy durability increases by mission, allowing the same core enemy families to remain relevant as the campaign advances.

---

## Weapons and combat progression

### Temporary in-mission weapon levels

Power pickups raise the active weapon level during a mission.

Current progression includes:

1. Base weapon.
2. Increased projectile spread/output.
3. Stronger multi-shot pressure.
4. Sidekick support with straight rockets.
5. Additional sidekick support with homing rockets.

Weapon power decays over time, creating a risk-and-reward loop around collecting and maintaining upgrades during combat.

### Permanent HomeBase unlocks

The currently active permanent upgrade path includes:

| Upgrade | Cost | Requirement | Effect |
|---|---:|---|---|
| Laser Core | 20 Salvage / 10 WizzCoins | None | Unlocks the laser weapon core |
| Rapid Fire | 30 Salvage / 15 WizzCoins | Laser Core | Increases weapon firing performance |
| Twin Shot | 35 Salvage / 18 WizzCoins | Laser Core | Adds a second firing path |

The upgrade tree also contains future branches for:

- Shield Matrix.
- Hull Plating.
- Sidekick Bay.
- Salvage Magnet.
- Coin Magnet.
- Plasma Lance.
- Ship Frame.

These future nodes are displayed in the HomeBase tree but remain intentionally inactive until their gameplay systems are completed.

### Sidekick drones

At higher temporary weapon levels, support drones join the player ship.

They include:

- Smooth formation movement.
- Directional orientation based on player movement.
- Engine-glow presentation.
- Straight rockets at Level 4.
- Homing rockets at Level 5.
- Independent projectile updates and collision handling.

---

## Loot and economy

### WizzCoins

The primary currency used alongside Salvage for permanent upgrades.

WizzCoins can be awarded through:

- Enemy destruction.
- Boss rewards.
- Pickups and reward bursts.
- Mission completion systems.

### Salvage

A progression resource used to purchase ship and weapon upgrades at HomeBase.

Salvage rewards can come from:

- Enemy drops.
- Boss kills.
- Mission reward logic.
- Permanent Salvage Bonus modifiers.

### XP and score

The game tracks both progression XP and arcade score. Mission performance is stored through best-score and lifetime-total records.

### Magnetic pickups

Normal currency and resource pickups can be attracted toward the player through the pickup-magnet system. Legendary Caches deliberately ignore this mechanic and must be opened through combat.

---

## Legendary Cache system

Full bosses can drop one **Legendary Cache**.

The cache is a combat object rather than a normal pickup:

- Player contact does not collect it.
- The pickup magnet ignores it.
- Player weapons must damage it.
- It has its own health pool.
- It breaks using a boss-scale explosion.
- Acquisition is counted exactly once.
- Cache totals persist in the local profile.
- A dedicated acquisition animation presents the reward at HomeBase.

### Legendary permanent rewards

Opening a Legendary Cache at HomeBase grants one weighted permanent stat increase.

Possible rewards include:

#### Offence

- Accuracy.
- Damage Bonus.
- Critical Chance.
- Critical Damage.
- Projectile Speed Bonus.
- Fire Rate Bonus.

#### Defence

- Shield Capacity Bonus.
- Shield Recharge Bonus.

#### Utility

- Movement Speed Bonus.
- Magnet Range Bonus.
- WizzCoin Bonus.
- Salvage Bonus.

Reward amounts are generated from controlled ranges and stored permanently in the player's local profile.

---

## HomeBase

HomeBase is the progression hub between missions.

Current areas include:

- Storage.
- Crafting interface.
- Legendary Cache vault.
- Upgrade Altar.

Players can inspect resources, open Legendary Caches, receive permanent stat rewards and purchase available upgrade-tree nodes.

The environment uses the Ankh Chamber visual theme and is integrated directly with the World Map and mission flow.

---

## World Map

The World Map is more than a level-selection menu. It maintains campaign position, mission availability and completion presentation.

Current locations include:

- HomeBase — Ankh Chamber.
- Scarab Nebula.
- Gemini Rift.
- Shattered Armada.
- The Void Frontier.
- Unstable Void Route.

The map includes:

- Connected route lines.
- Mission descriptions.
- Available and completed states.
- Boss-node visual treatment.
- Ship travel between nodes.
- Automatic hiding of combat controls while navigating.

---

## Mission records and results

The game tracks persistent campaign statistics:

- Best score per mission.
- Missions completed.
- Enemies destroyed.
- Bosses destroyed.
- WizzCoins earned.
- Salvage recovered.
- Legendary Caches acquired.

Mission reward calls are shared across normal enemies, bosses, pickups and caches so results remain consistent across the campaign.

---

## Leaderboard and player profiles

The deployed build includes interface and API integration for:

- Creating a named player profile.
- Loading stored player statistics.
- Updating score and currency records.
- Displaying ranked leaderboard entries.

The browser-only local server can still run the complete offline gameplay loop. Backend-dependent leaderboard functions require the project's API routes or compatible deployment environment.

---

## Visual and audio presentation

The renderer includes a growing collection of custom visual systems:

- Multi-layer explosions.
- Boss-scale destruction effects.
- Engine glows and tapered flames.
- Neon shields.
- Dust and energy fields.
- Bullet and rocket sprites.
- Homing projectile orientation.
- Enemy hit flashes.
- Damage feedback.
- Reward particles.
- Legendary Cache acquisition effects.
- Boss introductions and warning messages.
- Black-hole and cinematic transitions.
- Mission-specific backgrounds and video support.

The visual style combines dark space environments with electric blue, purple, gold and warning-red effects.

---

## Technical architecture

Space Junkz uses a modular browser-game architecture.

```text
index.html
└── game.html
    ├── assets.js       Global GameState, assets and local save profile
    ├── settings.js     Settings panel and profile controls
    ├── input.js        Keyboard, mouse and multi-touch controls
    ├── player.js       Player rendering and ship effects
    ├── enemies.js      Shared enemy rendering and behaviour support
    ├── logic.js        Core combat update, collisions, rewards and pickups
    ├── renderer.js     Core Canvas renderer and visual effects
    ├── engine.js       Game loop, intro flow, firing and mode routing
    ├── world.js        World Map navigation and mission nodes
    ├── homebase.js     Upgrade tree, vault and permanent rewards
    └── levels/
        ├── lvl2.js     Mission 1 — Drax Gauntlet
        ├── lvl3.js     Mission 2 — five-boss sequence
        ├── lvl4.js     Mission 3 — Shattered Armada
        └── lvl5.js     Void mission module
```

### Mode ownership

Only one primary game mode runs at a time:

- Intro/Core combat.
- World Map.
- HomeBase.
- Mission 1.
- Mission 2.
- Mission 3.
- Void mission.

The engine and update/render gates route control to the active mode, preventing multiple scenes from updating simultaneously.

### Technology

- HTML5.
- CSS3.
- Vanilla JavaScript.
- Canvas 2D API.
- Browser pointer and touch events.
- LocalStorage persistence.
- Optional HTTP API routes for online profiles and leaderboards.
- Static asset hosting, including local and Backblaze-hosted game art.

No build framework or third-party game engine is required for local gameplay.

---

## Running locally

### Requirements

- A modern browser.
- Python 3 for a simple local HTTP server.
- Node.js is optional for JavaScript syntax checks.

### Standard desktop setup

Clone the repository:

```bash
git clone https://github.com/999nike/space-junkz-shooter.git
cd space-junkz-shooter
```

Start a local server:

```bash
python -m http.server 8001
```

Open:

```text
http://127.0.0.1:8001/game.html
```

### Termux / Android setup

Project path used by the current mobile workflow:

```bash
cd ~/storage/shared/junkz/space-junkz-shooter-main
python -m http.server 8001
```

Open the game:

```text
http://127.0.0.1:8001/game.html
```

Start code-server in a separate Termux session:

```bash
code-server ~/storage/shared/junkz/space-junkz-shooter-main
```

Open code-server:

```text
http://127.0.0.1:8080
```

### Cache-busting during development

Use an outer page query while testing:

```text
http://127.0.0.1:8001/game.html?v=10001
```

Increase the number after patches. Script cache versions inside `game.html` should still be bumped separately for each edited JavaScript or CSS file.

---

## Development workflow

The project follows a minimal-diff patching workflow:

1. Read the relevant live code.
2. Implement one connected system at a time.
3. Avoid unrelated refactors.
4. Reuse existing architecture and helpers.
5. Bump only cache versions for edited scripts.
6. Run `node --check` on changed JavaScript files.
7. Test normal gameplay before using developer shortcuts.
8. Provide one concise final patch summary.

This keeps the browser build stable and reduces regressions in the shared game loop.

---

## Screenshots and gameplay media

Add current project captures to a repository folder such as `docs/screenshots/`, then replace the placeholders below.

```markdown
![World Map](docs/screenshots/world-map.png)
![Shattered Armada](docs/screenshots/shattered-armada.png)
![HomeBase Upgrade Tree](docs/screenshots/homebase-upgrades.png)
![Legendary Cache](docs/screenshots/legendary-cache.png)
```

Recommended media set:

- 15–30 second combat GIF.
- World Map screenshot.
- HomeBase screenshot.
- Four-escort Armada battle screenshot.
- Legendary Cache drop and opening sequence.
- Mobile control layout screenshot.
- Boss introduction montage.

---

## Roadmap

### Gameplay polish

- Final aim-stick sensitivity and smoothing pass.
- Continued mobile comfort tuning.
- Enemy and boss balance passes.
- More readable high-intensity projectile patterns.
- Additional impact, destruction and reward feedback.

### Progression

- Activate more HomeBase upgrade-tree branches.
- Expand permanent ship statistics.
- Add more Legendary reward types and presentation.
- Improve mission ranking and result screens.
- Expand collection and achievement systems.

### Campaign

- Complete the next Void-route destination.
- Add further handcrafted missions.
- Add new boss families and escort behaviours.
- Expand world-map regions and route choices.
- Introduce additional environmental hazards and mission objectives.

### Technical

- Continue performance optimisation for entity-heavy missions.
- Reduce unnecessary particle, bullet and audio overhead.
- Improve asset loading and offline packaging.
- Expand automated validation and development tooling.
- Continue desktop and high-refresh-rate testing.

### Long-term possibilities

- Multiplayer-ready systems.
- Ghost activity and presence indicators.
- Mission-specific leaderboards.
- New ships and weapon classes.
- Deeper crafting and inventory systems.
- Wider campaign universe under the W.I.Z.Z. LAB STUDIOS banner.

---

## Project philosophy

Space Junkz is being built around four principles:

1. **Immediate fun** — the ship should feel responsive and combat should begin quickly.
2. **Readable intensity** — battles can be busy without becoming unfair or visually meaningless.
3. **Meaningful progression** — upgrades should change how the game plays, not only increase numbers.
4. **Playable everywhere** — the game should run directly in a browser across desktop and mobile hardware.

---

## Known development notes

- The project remains under active construction; some displayed upgrade-tree nodes are future systems.
- Backend leaderboard features depend on deployment API routes and are not required for offline play.
- Some externally hosted boss assets require an internet connection unless copied into the local asset package.
- Mission labels in older source comments may not always match the current World Map numbering; the World Map is the player-facing campaign reference.
- Performance continues to be monitored during missions with large numbers of enemies, bullets, particles and effects.

---

## Author

Created and directed by **DevMaster / 999nike** under **W.I.Z.Z. LAB STUDIOS**.

- GitHub: [999nike](https://github.com/999nike)
- Game repository: [space-junkz-shooter](https://github.com/999nike/space-junkz-shooter)
- Landing page: [junkz-shooter-landing.vercel.app](https://junkz-shooter-landing.vercel.app)

---

## Licence

No licence has been declared in the reviewed project files.

Until a licence is added, the source should be treated as **all rights reserved** by the project owner. Add a `LICENSE` file before accepting external contributions or distributing reusable source assets.

---

<p align="center">
  <strong>Enter the Drax systems. Break the Armada. Survive the Void.</strong>
</p>
