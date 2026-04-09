# 🐔 MINEPATH V5 — Master Polish & Improvement Notes
> Compiled from code review, V1 comparison, gameplay screenshots, and discussion
> These are notes only — no code yet

---

## 🔴 CRITICAL (Game Feel Breakers)

### 1. Skins Feel Like Recolors — Not Real Skins
**Problem:** Classic and Royal look almost identical in gameplay. Only a faint color tint changes. At tile scale the chicken is so small color difference is invisible. Players feel buying skins is pointless.

**Notes:**
- Each skin needs a unique **silhouette change** — not just color. Different hat size, body shape variation, different eye style
- Skin colors need to be **more saturated and bold** — Royal should be deep purple not faded lavender, Ninja should be pure black not dark grey, Ghost should be near-white/translucent
- Each skin needs a **unique idle animation** personality:
  - Royal → slow regal bob
  - Ninja → stays dead still, then twitches
  - Ghost → slow fade in/out pulse
  - Space → slight float/hover
  - Robot → occasional mechanical head twitch
  - Dragon → small wing flap
- Shop skin preview circle is 38px — way too small to see any detail. Needs to be at least 80px with the unique features clearly visible
- Shop preview should show a **live animated preview**, not a static circle
- Each skin should feel like a character, not a palette swap

---

### 2. Accessory Stacks on Top of Skin Hat — Visual Bug
**Problem:** If a skin already has a hat (Royal 👑, Space 👨‍🚀), equipping a hat accessory renders both on top of each other. Two hats on one chicken.

**Notes:**
- If equipped skin has a `hat` property, hat-type accessories (tophat, helmet) should either be hidden or shown as incompatible
- In gameplay the `ck-accessory` div and `ck-helmet` div both render simultaneously — needs mutual exclusion
- Non-hat accessories (shades, bow) should still work fine with any skin

---

### 3. Hearts Reset Wrong — Should Be Persistent Per World
**Problem:** Currently `getMaxHearts(level)` grows as level increases, which accidentally "refills" lost hearts when crossing level boundaries mid-world. Hearts feel random and inconsistent.

**What it should be:**
- Enter Farm world → 3 hearts (no hearts in Farm actually, see note 4)
- Lose a heart at level 12 → 3 hearts left
- Play level 13, 14, 15 → still 3 hearts (not refilled)
- Enter Volcano (level 20) → hearts reset to world max (4)
- Hearts are a **persistent pool per world**, only resetting at world boundaries

**Notes:**
- Only restore hearts fully when `worldNum` changes — same boundary check used for abilities
- `getMaxHearts` should still grow per world but only apply on world entry, not every level transition
- Current code: `setHearts(h => Math.min(h, mh))` runs every level — this is the bug

---

### 4. Farm World Should Have No Hearts — Restore V1 Tension
**Problem:** V1 was one-hit-kill and was addictive. V5 gives hearts from level 1 which kills tension completely. Every tap feels low stakes.

**Notes:**
- Farm world (levels 1-9) → **no hearts, instant game over on mine** — exactly like V1
- Cave world (level 10) → introduce 2 hearts as a reward, feels earned
- Volcano world (level 20) → 3 hearts
- Space world (level 30) → 4 hearts
- This makes early game intense and teaches respect for the grid, then progressively gets more forgiving as difficulty increases

---

### 5. Grid Floats at Bottom — Huge Wasted Space Above
**Problem:** Screenshots show grid stuck in bottom third of screen with a massive empty dark green area above it taking up nearly half the screen. Terrible use of space.

**Notes:**
- Grid should be **vertically centered** in the available space between HUD and bottom of screen
- The `grid-container-v3` has `flex: 1` and `align-items: center` but something in the layout chain is breaking the centering
- The HUD + ability bar + powerup bar take up more height than accounted for, pushing grid down
- Fix: calculate available height properly and center grid within it

---

### 6. Peek Cost Label Shows Permanently — Confusing
**Problem:** `-6s` shows under the timer at all times. Players think they already lost 6 seconds. It reads as a penalty not a hint.

**Notes:**
- Remove the permanent `👁️ -6s` label from the HUD
- Instead show it **only when the player long-presses** a tile — brief floating text that fades after 1 second
- Or put it in the pause screen tip only: "Long press to peek (-6s)"

---

## 🟡 MEDIUM (Noticeable Polish)

### 7. Timer Feels Punishing, Not Tense
**Problem:** V1 used a `timerSpeed` multiplier that made the timer drain *faster* as levels increased — escalating dread. V5 just gives you a shorter starting timer which feels cheap and unfair.

**Notes:**
- Restore a drain-rate multiplier — early levels drain slowly, later levels drain faster
- This creates natural escalating tension without just feeling like punishment
- Peek cost on Farm world should be **2 seconds flat** (currently 6) — players never peek because cost is too high, which removes a core mechanic

---

### 8. Multiple Overlays Stack Simultaneously
**Problem:** On level 10 (new world + boss level), WorldBanner + BossBanner + WorldBriefing + AbilityTutorial can all fire within seconds of each other. Visual chaos.

**Notes:**
- Strict overlay queue — only one overlay visible at any time
- Priority order: WorldBriefing > BossBanner > WorldBanner > AbilityTutorial > AchievementNotif
- Each waits for previous to fully clear before appearing
- Already partially fixed in bug fix session but needs stricter enforcement

---

### 9. Home Screen — Too Many Buttons (7+)
**Problem:** 7+ buttons on home screen. Players don't know where to look. First impression is overwhelming.

**Notes:**
- Primary: **PLAY / CONTINUE** — big, centered, impossible to miss
- Secondary row: Shop + Leaderboard
- Everything else (Achievements, World Select, How to Play, Endless Mode) → collapse into a small ☰ menu or move to pause screen
- Seeds counter and best level should be small, not taking up a full row
- Bouncing chicken should be tap-interactive — tapping it plays a cluck sound, small personality moment

---

### 10. Skin Equip Has No Satisfying Feedback
**Problem:** Tapping equip shows a small text toast for 2.3 seconds then nothing. No animation, no sound, no visual confirmation that something changed.

**Notes:**
- Equipped skin card should flash a **golden border pulse animation** on equip
- Play `audio.powerupCollect()` or a dedicated equip sound on equip (not just on purchase)
- The equip button should immediately and permanently change to a clearly different state — bright filled ✅ not a subtle badge
- Equipped items in the list need a **much stronger visual distinction** — brighter background, gold glow, not just a faint border tint

---

### 11. Adjacent Mine Numbers Hard to Read Under Pressure
**Problem:** Numbers 1-8 on revealed tiles have similar styling and small size. Hard to parse the board quickly when timer is running.

**Notes:**
- Distinct bold color per number: 1=bright green, 2=yellow, 3=orange, 4=red, 5=magenta, 6=cyan, 7=purple, 8=white
- Numbers should be larger — fill at least 50% of tile height
- Number tiles should have a slightly different background from empty revealed tiles — readable at a glance

---

### 12. Chicken Size Doesn't Scale With Grid
**Problem:** Chicken CSS has hardcoded sizes (~48px). On a 9x9 Space world grid where tiles might be 30-35px, chicken covers adjacent tiles and makes them hard to tap.

**Notes:**
- Chicken dimensions should scale with `cellSize.w` via CSS variable `--cell`
- Target: chicken width = `cellW * 1.0` to `cellW * 1.1` max — just slightly bigger than one tile
- Shadow and glow ring under chicken also need to scale
- Currently a player can accidentally tap the chicken thinking they're tapping a tile

---

### 13. Game Over Screen Doesn't Explain Why You Lost
**Problem:** Both "time ran out" and "stepped on mine" produce identical looking game over screens. Player has no feedback on what went wrong.

**Notes:**
- Show reason clearly: `⏰ Time ran out!` vs `💥 Stepped on a mine!`
- Show comparison: "Your best: Level 14 | This run: Level 8"
- "Play Again" button should be significantly larger/more prominent than "Home"
- Add a random gameplay tip at the bottom — different each time, feels helpful not punishing
- If player dies on same level 3+ times in a row, show a specific tip for that level/world type

---

### 14. Level Complete Has No Player Control Over Pacing
**Problem:** Level complete auto-advances after 2.5 seconds. Player has no say. Interrupts the rhythm for fast players and feels too quick for new players.

**Notes:**
- Add a "TAP TO CONTINUE" prompt after 1 second
- Auto-advance after 3 seconds if player doesn't tap
- This gives fast players control and slow players a safety net

---

### 15. Shop Has 8 Tabs — Too Many
**Problem:** 8 horizontally scrolling tabs on a phone. Players miss entire tabs. Navigation is exhausting.

**Notes:**
- Merge `mines + trails + accessories` → single **"Cosmetics"** tab with internal sections
- Merge `upgrades + powerups` → single **"Upgrades"** tab
- Result: 5 tabs — Skins | Cosmetics | Upgrades | Bundles | Themes
- Themes tab should be last and clearly marked as visual-only

---

### 16. Shop "Can Afford" Has No Visual Hint
**Notes:**
- Items player can currently afford should have a **subtle green glow or highlight**
- Items already owned should sort to the bottom or be visually muted
- Prices should be larger and more readable — currently blend into card design
- No "recommended" item guidance — new players have no idea what to buy first

---

## 🟢 LOW (Micro Details & Polish)

### 17. No Button Tap Sounds Anywhere in Menus
**Notes:**
- Every button press in Home, Shop, Achievements, Leaderboard, Pause needs a small satisfying click sound
- Should be a very short, light tap sound — not the powerup collect sound
- This alone makes the whole app feel 10x more responsive

---

### 18. No Haptic Feedback
**Notes:**
- Mine hit → single strong vibration
- Level complete → short double-tap pattern
- Achievement unlock → triple light tap
- These are small but make mobile feel native and polished

---

### 19. No Mute / Music Toggle
**Notes:**
- Background music plays with no way to turn it off
- Need a simple 🔊/🔇 toggle — ideally in the pause menu and on the home screen
- Some players play with their own music, or in public — no mute option is a real usability gap

---

### 20. Checkpoint Tile Doesn't Draw the Eye
**Notes:**
- Checkpoint (🌻/💎/🔥/🛸) sits static in the corner — no animation
- Should have a constant gentle pulse glow so player's eye is always drawn to it
- When chicken gets within 2 tiles of checkpoint, pulse should speed up — like a heartbeat
- Goal tile is the most important tile on the board, it should look like it

---

### 21. Seeds Counter Snaps — No Animation
**Notes:**
- When seeds are earned (level complete, achievement), the counter just jumps to the new value
- Should do a brief **count-up animation** — numbers rolling up to new value over 0.5s
- Also seeds counter on home screen shows stale data after returning from a game — needs refresh on screen focus

---

### 22. Swipe Has No Visual Confirmation
**Notes:**
- Swipe gesture works but player can't tell if it registered
- Brief directional arrow flash in the swipe direction would confirm input
- Or a subtle motion blur on the chicken in the swipe direction

---

### 23. Long Press Has No Charge Indicator
**Notes:**
- Long press to peek has no visual feedback while holding — feels accidental
- A small circular progress ring around the tile while holding (filling over 400ms) would make it feel intentional and satisfying
- Currently players aren't even sure if they're doing it right

---

### 24. Peeked Safe Tiles Show No Mine Count
**Notes:**
- When you peek a safe tile that has adjacent mines, you get no number shown
- V5 shows adjMine numbers on revealed tiles but NOT on peeked tiles
- This is wasted information — peeking is supposed to give you information
- Should show the adjMine count on peeked tiles the same way revealed tiles do

---

### 25. Timer Audio Doesn't Escalate
**Notes:**
- Timer goes red at 25% but audio is the same throughout
- Tick sounds should get progressively faster as timer drops
- Under 10 seconds: fast ticking. Under 5 seconds: very fast with slight pitch increase
- Currently `audio.timerLow()` fires randomly at 30% chance when under 5s — too unpredictable

---

### 26. Mine Explosion Has No Screen Flash
**Notes:**
- Mine explosion has a shake and sound but no visual impact
- A brief **red flash on the screen edges** (vignette flash) on mine hit would make it feel impactful
- Currently the shake alone feels underwhelming, especially with hearts absorbing the hit

---

### 27. Shop Toast Messages Are Generic
**Notes:**
- `"Equipped Ninja!"` has no personality
- Should be: `"🥷 Ninja equipped — stealth mode on!"` or `"👑 Royal equipped — long live the king!"`
- Each skin should have a unique equip message
- Error toast should show exact shortfall: `"Need 50 more seeds 🌾"` not just `"Not enough seeds"`
- Toast should appear near the seeds counter at top, not center screen

---

### 28. Pause Menu Missing Useful Info
**Notes:**
- Pause screen doesn't show current seeds balance — players often pause to decide if a run is worth continuing based on seeds earned
- No clear distinction between "Restart" (replay this level) and "Home" (lose all progress) — players accidentally go home
- Restart and Home buttons should have warning labels: "Restart Level" vs "Quit to Menu (lose progress)"

---

### 29. Leaderboard Shows Incomplete Info
**Notes:**
- Top 10 entries with no indication of which is yours
- Campaign and Endless scores mixed together — should be separate tabs
- Should show: level reached, world name, seeds earned, date
- No personal best highlight — your best entry should be pinned or highlighted differently

---

### 30. World Select Shows No Useful Info
**Notes:**
- World cards show no best level per world
- Locked worlds show 🔒 but no unlock condition text (`"Clear level 9 to unlock"`)
- No way to replay from level 1 of an already-cleared world — can only continue from saved level
- Should show: best level, total seeds earned in that world, replay from start option

---

### 31. Hidden Tile Shows `?` Text — Placeholder Feel
**Notes:**
- Hidden tiles show a literal `?` character which looks like placeholder UI
- Should be a subtle texture, pattern, or just left empty/blank
- The `✨` powerup indicator on hidden tiles is good — keep that
- The `?` cheapens the look of the whole board

---

### 32. Progression Milestones Feel Invisible
**Notes:**
- Hitting level 5, 10, 15, 20 etc. should feel like an event — currently nothing special happens at non-boss levels
- Simple milestone flash: "Level 5 reached! 🌾 +50 bonus seeds" would go a long way
- First time entering each world should have a **full-screen splash** (1.5 seconds) not just a banner
- Boss levels need a pre-level warning screen, not a banner that appears during the level

---

### 33. Endless Mode Lacks Identity
**Notes:**
- Endless mode feels identical to campaign after a few waves
- No personal best line on screen showing "You beat your record at wave X!"
- No unique endless-only cosmetic reward to grind for
- Wave transitions are the same as level transitions — no escalating music or intensity feel

---

## 📋 PRIORITY ORDER FOR NEXT SESSION

| # | Item | Priority | Impact |
|---|------|----------|--------|
| 4 | Remove Farm hearts — instant game over | 🔴 Critical | Game feel |
| 3 | Fix hearts persistence per world | 🔴 Critical | Game logic |
| 5 | Fix grid floating at bottom / centering | 🔴 Critical | Layout |
| 6 | Remove permanent peek cost label | 🔴 Critical | UI clarity |
| 2 | Fix accessory + skin hat stacking bug | 🔴 Critical | Visual bug |
| 1 | Make skins visually distinct / unique animations | 🔴 Critical | Core value |
| 8 | Strict overlay queue — no stacking | 🟡 Medium | Polish |
| 9 | Home screen button reduction | 🟡 Medium | First impression |
| 11 | Mine number color coding | 🟡 Medium | Readability |
| 12 | Chicken scales with grid | 🟡 Medium | Layout |
| 13 | Game over reason + tip | 🟡 Medium | Retention |
| 14 | Tap to continue on level complete | 🟡 Medium | Pacing |
| 7 | Timer drain rate escalation | 🟡 Medium | Tension |
| 15 | Merge shop tabs to 5 | 🟡 Medium | Navigation |
| 10 | Skin equip feedback animation | 🟡 Medium | Satisfaction |
| 17 | Button tap sounds in menus | 🟢 Low | Polish |
| 18 | Haptic feedback | 🟢 Low | Mobile feel |
| 19 | Mute / music toggle | 🟢 Low | Usability |
| 20 | Checkpoint pulse animation | 🟢 Low | Visual |
| 21 | Seeds count-up animation | 🟢 Low | Juice |
| 23 | Long press charge ring | 🟢 Low | Feel |
| 24 | Show mine count on peeked tiles | 🟢 Low | Gameplay info |
| 25 | Timer audio escalation | 🟢 Low | Tension |
| 26 | Mine hit screen edge flash | 🟢 Low | Impact |
| 27 | Unique skin equip messages | 🟢 Low | Personality |
| 31 | Remove `?` from hidden tiles | 🟢 Low | Visual |
| 22 | Swipe visual confirmation | 🟢 Low | Input feel |

---

*Total: 33 polish items | 6 Critical | 9 Medium | 18 Low*
*Compiled: April 2026 — MinePath V5 Polish Phase*
