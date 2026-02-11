# Impostor Game (Pass-the-phone) — Product Brief for Codex

## What this app is
A local party game played on ONE device that is passed around.
Players are in the same room. No networking. No accounts.

## MVP goal
Implement the full "setup → category select → private role reveals → show starting player → post-game menu" loop.
No voting logic yet (manual voting happens off-device).

## Core game rules
- Players enter once and names persist between games.
- Setup has:
  - Player count (N) with +/-
  - Impostor count (K) with +/- and constraint: K <= N - 1
  - Names editable on the same screen
- Then: choose categories.
- Then: Play.
- Randomness per game:
  - Random word from selected category pool
  - Random assignment of K impostors among N players
  - Random starting player among N players
- Players should NOT be able to peek: role reveal must be protected by a "press and hold" or "slide to reveal", plus a blackout screen between players.

## Rare all-impostor outcome

There is NO "chaos mode" and NO special game mode.

During role assignment only:
- There is a small probability (5%) that ALL players are assigned as impostors.
- If this all-impostor outcome occurs, it is blocked for the next 9 games (it can happen again starting game 10 after the trigger).
- This is NOT announced.
- There is NO special UI or explanation during the game.
- The game proceeds exactly as a normal game.

Players should believe the game is normal while playing.

Only after the round is finished:
- Show a small reveal popup/message:
  "Everyone was the impostor!"

Implementation notes:
- This is handled purely in role assignment logic.
- Do not add flags, modes, or special screens.
- Do not change any other game flow.

## Screens (must match)
1. Home
   - Start Game
   - Exit
2. Choose Players (single screen)
   - Player count +/-; name fields; impostor count +/- with constraint
   - Player Presets button in the name section opens a dedicated Player Presets screen
   - Continue → Choose Categories
3. Player Presets
   - Dedicated screen for save/load/edit/delete presets (max 10)
   - Back returns to Choose Players
4. Choose Categories
   - Select one or more categories
   - Custom categories are selected from a dedicated selection-only screen
   - Play
5. Role Reveal Loop (pass-the-phone)
   - Gate screen: "Pass to {name}" + hold/slide to reveal
   - Reveal screen: show word for civilians, "Impostor" for impostors
   - Blackout 1–2s between players
6. Starting Player screen
   - Show starting player name
7. Post Game
   - New Game (same players) → Choose Categories
   - Choose Categories (same as above)
   - Edit Players → Choose Players
   - Exit
8. Import / Export Categories
   - Reachable from "My Custom Categories" (Saved tab)
   - Export selected saved custom categories to clipboard as formatted text
   - Import formatted text into saved custom categories with inline validation errors
   - Name collisions use an in-app overwrite confirmation modal
   - Back returns to "My Custom Categories" with the Saved tab active

Custom Categories screen behavior:
- Includes tabs: "My Custom Categories" and "Browse".
- The full "More Categories" screen opens on the "Browse" tab by default.
- "Browse" shows predefined templates (read-only) that can be copied into "My Custom Categories" with one tap.
- This full management screen is accessed from Home. The Choose Categories flow uses a separate selection-only screen.
- The selection-only "Select more categories" screen includes a full-width "Create & browse categories" button that opens the full management screen temporarily.
- Back behavior is origin-based: from Home it returns to Home, and from the selection-only flow it returns to "Select more categories".
- The selection-only screen controls which custom categories are enabled (visible) on Choose Categories.
- Enabled custom categories remain visible on Choose Categories even when unselected; they only disappear when disabled in selection-only.
- Choose Categories `Back` always returns to Choose Players.
- Selection-only `Select more categories` returns to Choose Categories on `Back` and on apply.
- Both "My Custom Categories" (Saved tab) and "Select more categories" include a Sort control:
  - Recently played (uses `lastPlayedAt`, descending; never-played at bottom)
  - Order of saving (uses `createdAt`, ascending)
- "My Custom Categories" (Saved tab) includes a destructive `Clear all` action that uses an in-app confirmation modal and deletes all saved custom categories.
- "My Custom Categories" (Saved tab) includes an `Import / Export` secondary full-width button directly under `+ Create New` that opens the dedicated Import / Export Categories screen.
- Import / Export `Back` returns to "My Custom Categories" with the Saved tab active.

## Persistence
Persist locally:
- players list (names)
- last N and K
- player presets (`playerPresets`)
- last selected categories (optional but recommended)

## Engineering guidance
- Keep it mobile-first (big buttons).
- Implement state machine for screens to avoid bugs.
- Back navigation should use a history stack and return to the previously visited screen, rather than hardcoded destinations.
- Prefer small, testable pure functions for: assigning roles, picking word, chaos logic.
- When changing behavior, update this AGENTS.md if it affects rules/flow.
- When adding larger features, update `README.md` in the same change so setup/usage docs stay current.

## Emoji usage rule (UI consistency)

- Emojis are allowed ONLY in gameplay-related screens:
  - Role reveal screens
  - End-of-round / end screens
- Emojis are NOT allowed in:
  - Home screen buttons or titles
  - Setup and configuration screens (Players, Categories, Custom Categories)
  - Navigation or action buttons (e.g. Continue, Back, Change players)

Emojis are used for expressive gameplay feedback, not for navigation or UI chrome.

## Confirmation dialogs (UI consistency)

- Do not use browser `alert()` or `confirm()` in the app.
- All destructive or irreversible actions must use the app-styled modal dialog with a dimmed overlay.
- Examples:
  - Deleting Custom Categories (Cancel / Delete)
  - Resetting the Timer (Cancel / Reset)
- Modal requirements:
  - Blocking overlay behind the dialog
  - Clear title + two actions
  - Cancel is the safe/default action
  - Buttons use the app’s pill style
