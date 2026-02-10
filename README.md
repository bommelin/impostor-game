# Impostor!

Pass-the-phone party game played locally on one device.

## Author
Felix Bommelin

## Play Online
[https://bommelin.github.io/impostor-game/](https://bommelin.github.io/impostor-game/)

## Home Screen Preview
![Home screen demo](public/home-screen-demo.svg)

## Run Locally
```bash
npm install
npm run dev
```

## Current Game Loop
1. **Home**: `New Game`, `Play Again`, `More Categories`
2. **Choose players**: set player count, impostor count, and names
3. **Choose Category**:
   - pick built-in categories
   - open custom-category selection via `More Categories`
   - start with `Let's Play!`
4. **Pass/reveal loop**:
   - pass screen (`I'm ready`)
   - swipe-to-peek private role reveal
5. **Ready to play** screen:
   - starting player
   - selected categories
   - impostor count
   - timer controls
6. **End Game**
7. **Round Over**: `Play Again`, `Back`, `Exit`

## Category Flows
- **Built-in categories**: configured in `src/wordBank.js`
- **Custom categories (management)**: Home → `More Categories`
  - create/edit/delete custom categories
  - browse predefined templates
  - copy templates into personal custom categories
- **Custom categories (selection-only)**: Choose Category → `More Categories`
  - select/deselect from existing saved custom categories only
  - no create/edit/delete in this flow

## Rules
- 2–12 players
- 1 to `N - 1` impostors
- Random word from selected category pool
- Random impostor assignment
- Random starting player
- Rare hidden all-impostor round, revealed only after the round
- Voting is manual/off-device

## Persistence
- Saved players and setup values
- Last selected categories
- Custom categories in local storage
