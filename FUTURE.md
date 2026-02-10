## Future Feature (NOT MVP): AI-Generated Custom Categories

### Status
Planned for the future. **Do NOT implement in the MVP.**

### Concept
Allow users to generate custom word categories using AI, tailored to specific needs (e.g. age group, difficulty, themes).  
This feature will be behind a paywall.

### Product intent
- This is a premium utility feature, not core gameplay.
- The core game and manual custom categories must remain fully usable without AI.
- AI-generated categories are optional enhancements for power users.

### Intended placement in the app
- Entry point lives inside **Custom Categories** management.
- UI concept:
  - Button: “Generate with AI” (locked 🔒)
  - Tapping opens a paywall before access.
- This feature should **NOT** appear on the Home screen.

### Intended user flow (future)
1. User opens **Custom Categories**
2. Selects **“Generate with AI”** (locked)
3. Completes paywall
4. Enters:
   - Category name
   - Short description / constraints (e.g. “kid-friendly”, “hard mode”, “office jobs”)
5. AI generates a draft list of words
6. User reviews and edits the list
7. User saves the category

### Design constraints
- AI-generated categories must never auto-save.
- Generated word lists must always be editable before saving.
- AI should generate familiar, discussable words suitable for a social guessing game.
- No offensive, niche, or obscure content.

### Monetization
- Feature will be gated behind a paywall.
- Manual custom categories remain free.
- AI usage should be limited per generation to control costs.

### Important
This note is for documentation only.  
**Do NOT implement, stub, or partially add this feature until explicitly requested.**
