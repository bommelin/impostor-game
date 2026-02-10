# Impostor!

A local **pass-the-phone party game** played on one device.  
Everyone is in the same room. The app handles setup and secret roles — the rest happens face to face.

---

## What is the game?

You are a group of players.

- Most players know a secret word.
- One or more players are **impostors** and do not know the word.
- Players take turns saying clues out loud without making the word obvious.
- After a few rounds, players vote (currently handled off-device).

Very rarely, a round may occur where **everyone is the impostor**.  
This is not announced during play and is only revealed at the end.

---

## How to play

1. Set up players and impostors.
2. Choose categories (built-in and/or custom).
3. Pass the phone around so everyone privately sees their role.
4. The app selects a starting player.
5. Play the game out loud:
   - Each player gives a short clue.
   - Don’t say the word directly.
6. After your chosen number of rounds, vote manually.

---

## Features

### Player setup
- Choose the number of players
- Enter player names (saved between games)
- Choose the number of impostors

### Categories and words
- Select from built-in categories
- Create **Custom Categories**:
  - Add your own words using comma-separated input
  - Edit and delete custom categories
  - Select multiple custom categories at once
  - Custom categories are saved between games

### Private role reveal
- Pass-the-phone flow so each player sees their role privately
- Anti-peek interaction before revealing a role
- Full-screen transition between players
- Random starting player

---

## Setup (local development)

### Requirements
- Node.js (recommended: latest LTS)
- npm (included with Node)

### Install dependencies
Run `npm install` in the project folder.

### Start the development server
Run `npm run dev`.

The app will be available at a local address shown in the terminal (usually http://localhost:5173).

### Build the app
Run `npm run build` to create a production build.

### Preview the production build locally
Run `npm run preview`.

---