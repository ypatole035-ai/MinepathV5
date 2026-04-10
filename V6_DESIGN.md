# 🐔 MINEPATH V6 — Final Master Documentation
> Complete polish plan, feature additions, and Easter egg system
> Compiled: April 2026 | For implementation in next development session

---

## 📋 TABLE OF CONTENTS
1. Name Your Chicken System
2. Critical Bugs & Game Feel
3. UI & Layout Polish
4. Gameplay Feel & Mechanics
5. Shop & Progression
6. Audio & Feedback
7. Screens & Navigation
8. Micro Details
9. Easter Egg Universe — The Lost Chicken
10. Easter Egg Universe — The Midnight Level
11. Hidden Achievements (Full List)
12. Priority Implementation Order

---

## 1. 🐔 NAME YOUR CHICKEN SYSTEM

### First Launch Experience
- On very first game open, before home screen loads, a simple naming screen appears
- The chicken bounces excitedly while player types
- Input field: max 12 characters, friendly placeholder text like "Name your chicken..."
- After confirming, chicken does a small celebration animation — wings flap, jumps once
- A "Let's go!" or "Ready!" moment before transitioning to home screen

### Where The Name Appears
- **Home screen** — displayed as a nameplate beneath the chicken. Small badge style, warm color
- **Game over screen** — "Better luck next time, [Name] 💀" feels personal and emotional
- **Leaderboard** — each score entry shows the chicken's name instead of generic "Player"
- **Level complete screen** — subtle, like "Great run, [Name]! +120 🌾"
- **Pause screen** — shown at top of pause panel
- Nowhere during active gameplay — keep the grid clean

### Name Change
- Accessible from a Settings option (small ⚙️ on home screen)
- Simple screen — current name shown, tap to edit, confirm button
- No cost, no restriction, change anytime

### Technical Notes
- Store name in localStorage key `minepath_chicken_name`
- Default fallback if somehow empty: "Clucky"
- Sanitize input — no special characters, trim whitespace

---

## 2. 🔴 CRITICAL — Game Feel Breakers

### 2.1 Farm World Should Have No Hearts
**Problem:** Hearts from level 1 kill tension. V1 was one-hit-kill and was addictive because every tap mattered.

**Fix:**
- Farm world (levels 1-9) → no hearts, instant game over on mine hit — exactly like V1
- Cave world (level 10) → introduce 2 hearts as a reward, feels earned
- Volcano world (level 20) → 3 hearts
- Space world (level 30) → 4 hearts
- This makes early game intense, teaches respect for the grid, progressively gets more forgiving

---

### 2.2 Hearts Must Be Persistent Per World — Not Per Level
**Problem:** `getMaxHearts(level)` grows as level increases, accidentally refilling lost hearts at level boundaries mid-world. Feels random and inconsistent.

**What it should be:**
- Enter Cave with 2 hearts → lose one at level 12 → have 1 heart for levels 13, 14, 15, 16, 17, 18, 19
- Enter Volcano (level 20) → hearts fully reset to world max (3)
- Hearts are a persistent pool per world, resetting ONLY at world boundaries

**Fix notes:**
- Only restore hearts fully when `worldNum` changes
- `getMaxHearts` applies on world entry only, not every level transition
- Current bug: `setHearts(h => Math.min(h, mh))` runs every `initLevel()` call

---

### 2.3 Grid Floats at Bottom — Huge Wasted Space
**Problem:** Screenshots confirm grid is stuck in bottom third of screen. Massive empty dark green area above taking up nearly half the screen.

**Fix:**
- Grid should be vertically centered in available space between HUD and screen bottom
- Calculate available height properly: `vh - HUD height - ability bar - powerup bar - padding`
- Currently cell size uses `vh * 0.56` which is wrong — doesn't account for all UI elements above grid

---

### 2.4 Permanent Peek Cost Label Is Confusing
**Problem:** `👁️ -6s` shown under timer at all times. Players think they already lost 6 seconds.

**Fix:**
- Remove permanent label from HUD entirely
- Show it only as a brief floating text when player actually long-presses a tile
- Or mention it only in the pause screen tip section

---

### 2.5 Accessory Stacks on Skin Hat — Visual Bug
**Problem:** Skins with hats (Royal 👑, Space 👨‍🚀) render both the skin hat AND the equipped accessory hat simultaneously. Two hats on one chicken.

**Fix:**
- If equipped skin has a `hat` property, hat-type accessories (tophat, helmet) should be hidden or shown as incompatible in shop
- Non-hat accessories (shades, bow) still work fine with any skin
- In gameplay: `ck-accessory` and `ck-helmet` need mutual exclusion logic

---

### 2.6 Skins Feel Like Recolors — Not Real Characters
**Problem:** Classic and Royal look almost identical in gameplay. Only a faint color tint changes. Buying skins feels pointless.

**Each skin needs:**
- A unique **silhouette change** — different hat size, body shape variation, distinct eye style
- **Bold saturated colors** — Royal = deep purple, Ninja = pure black, Ghost = near-white translucent
- A **unique idle animation** with personality:
  - Royal → slow regal bob
  - Ninja → completely still, then sudden twitch
  - Ghost → slow fade in/out pulse
  - Space → slight float/hover
  - Robot → occasional mechanical head twitch
  - Dragon → small wing flap every few seconds
- Shop preview needs to be at least 80px with features clearly visible
- Shop preview should be **live animated**, not a static circle
- Each skin = a character, not a palette swap

---

### 2.7 Chicken Size Doesn't Scale With Grid
**Problem:** Chicken has hardcoded ~48px CSS size. On a 9x9 Space world grid with ~30px tiles, chicken covers adjacent tiles making them hard to tap.

**Fix:**
- Chicken dimensions should scale with `cellSize.w` via CSS variable `--cell`
- Chicken width should be `cellW * 1.0` to `cellW * 1.1` max
- Shadow and glow ring under chicken must also scale
- Currently a player can accidentally tap the chicken thinking they're tapping a tile

---

## 3. 🟡 UI & LAYOUT POLISH

### 3.1 Home Screen — Too Many Buttons
**Problem:** 7+ buttons overwhelming first impression.

**Fix:**
- Primary: PLAY / CONTINUE — big, centered, unmissable
- Secondary row: Shop + Leaderboard side by side
- Everything else (Achievements, World Select, Endless, How to Play) → small ☰ menu
- Seeds counter and best level: small, not taking a full row
- Bouncing chicken should be tap-interactive — tapping it plays a cluck sound

---

### 3.2 HUD During Gameplay — Too Cramped
**Problem:** Level + hearts + timer + seeds + pause all in one row. Elements overlap on small phones.

**Fix:**
- Split into two rows:
  - Top row: Level badge + timer bar + pause button
  - Bottom row: Hearts + seeds + active powerup indicator
- Seeds counter should animate/count up when earned — not snap
- Combo display and powerup bar need fixed dedicated positions — currently overlap

---

### 3.3 Ability HUD Dots Too Small
- Currently tiny dots that are unreadable at a glance
- Replace with a pill shape or larger filled/empty circles
- Active powerup icon should pulse softly as a reminder it's active

---

### 3.4 Overlay Queue — Never Stack
**Problem:** WorldBanner + BossBanner + WorldBriefing + AbilityTutorial can all fire simultaneously on level 10. Visual chaos.

**Fix:**
- Strict single-overlay queue at all times
- Priority order: WorldBriefing > BossBanner > WorldBanner > AbilityTutorial > AchievementNotif
- Each waits for previous to fully clear before showing
- Already partially fixed — needs stricter enforcement

---

## 4. 🟡 GAMEPLAY FEEL & MECHANICS

### 4.1 Timer Should Drain Faster, Not Just Start Shorter
**Problem:** V1 used a `timerSpeed` multiplier making timer drain faster as levels increased — escalating dread. V5 just gives shorter starting time which feels punishing not tense.

**Fix:**
- Restore drain-rate multiplier — early levels drain slowly, later levels drain faster
- Creates natural escalating tension
- Peek cost on Farm world should be 2 seconds flat (currently 6) — players never peek because cost too high, removes a core mechanic

---

### 4.2 Adjacent Mine Numbers Hard to Read
**Fix:**
- Distinct bold color per number: 1=bright green, 2=yellow, 3=orange, 4=red, 5=magenta, 6=cyan, 7=purple, 8=white
- Numbers larger — fill at least 50% of tile height
- Number tiles should have slightly different background from empty revealed tiles

---

### 4.3 Peeked Safe Tiles Show No Mine Count
**Problem:** Peek reveals mine/safe but safe tiles show no adjacent mine number — wasted information.

**Fix:**
- Show adjMine count on peeked tiles same way as revealed tiles
- Peeking is supposed to give information — currently gives less than stepping

---

### 4.4 Long Press Has No Charge Indicator
**Fix:**
- Small circular progress ring around tile while holding (filling over 400ms)
- Makes it feel intentional not accidental
- Players currently unsure if they're doing it right

---

### 4.5 Swipe Has No Visual Confirmation
**Fix:**
- Brief directional arrow flash in swipe direction
- Or subtle motion blur on chicken in swipe direction
- Player can't currently tell if swipe registered

---

### 4.6 Checkpoint Tile Doesn't Draw the Eye
**Fix:**
- Constant gentle pulse glow on checkpoint at all times
- When chicken is within 2 tiles, pulse speeds up like increasing heartbeat
- Most important tile on board should look like it

---

### 4.7 Progression Milestones Feel Invisible
**Fix:**
- First time entering each world → full screen splash (1.5s) not just a banner
- Boss levels → pre-level warning screen, not a mid-level banner
- Level milestones (5, 10, 15, 20...) → brief celebration + small seed bonus
- "Grid expanded!" message when grid size increases — currently completely silent

---

### 4.8 Endless Mode Lacks Identity
**Fix:**
- Personal best line on screen: "Beat your record at Wave X!"
- Wave transitions should feel more intense than campaign level transitions
- Unique endless-only cosmetic reward to grind toward
- Escalating ambient music intensity as waves increase

---

## 5. 🟡 SHOP & PROGRESSION

### 5.1 Merge Shop Tabs — 8 is Too Many
**Fix:**
- Merge mines + trails + accessories → single "Cosmetics" tab with internal sections
- Merge upgrades + powerups → single "Upgrades" tab
- Result: 5 tabs — Skins | Cosmetics | Upgrades | Bundles | Themes
- Themes last, clearly marked as visual only

---

### 5.2 Skin Equip Has No Satisfying Feedback
**Fix:**
- Equipped skin card flashes golden border pulse animation on equip
- Play dedicated equip sound (not just purchase sound)
- Equip button immediately changes to clearly distinct state
- Equipped items need much stronger visual distinction — bright background, gold glow

---

### 5.3 Shop "Can Afford" Has No Visual Hint
**Fix:**
- Items player can afford → subtle green glow/highlight
- Already owned items → sort to bottom or visually muted
- Prices larger and more readable
- "Recommended for you" guidance for new players

---

### 5.4 Shop Toast Messages Are Generic
**Fix:**
- Each skin gets unique equip message:
  - Royal: "👑 Royal equipped — long live the king!"
  - Ninja: "🥷 Ninja equipped — stealth mode on!"
  - Ghost: "👻 Ghost equipped — boo!"
  - Space: "🚀 Space equipped — one small step!"
  - Robot: "🤖 Robot equipped — initiating sequence"
  - Dragon: "🐉 Dragon equipped — flames incoming!"
- Error: show exact shortfall "Need 50 more seeds 🌾" not generic message
- Toast should appear near seeds counter at top, not center screen

---

### 5.5 No Confirmation on Expensive Purchases
**Fix:**
- Items over 200 seeds → brief confirmation step "Spend 300 🌾 on Royal skin?"
- Prevents accidental purchases
- Bundles and upgrades especially need this

---

## 6. 🟢 AUDIO & FEEDBACK

### 6.1 No Button Tap Sounds in Menus
- Every button in Home, Shop, Achievements, Leaderboard, Pause needs a short satisfying click
- Very light tap sound — not the powerup collect sound
- This alone makes the whole app feel 10x more responsive

### 6.2 No Haptic Feedback
- Mine hit → single strong vibration
- Level complete → short double-tap pattern
- Achievement unlock → triple light tap
- Button press → very subtle single tap

### 6.3 No Mute / Music Toggle
- Background music with no way to turn it off is a real usability gap
- Simple 🔊/🔇 toggle in pause menu AND home screen
- Some players use their own music or play in public

### 6.4 Timer Audio Doesn't Escalate
- Under 10 seconds: faster ticking
- Under 5 seconds: very fast ticking, slight pitch increase
- Current `audio.timerLow()` fires randomly at 30% chance — too unpredictable

### 6.5 Mine Hit Has No Screen Flash
- Brief red vignette flash on screen edges when mine is hit
- Currently shake alone feels underwhelming especially when hearts absorb the hit

### 6.6 Level Complete Audio Gets Repetitive
- After long sessions the same jingle is annoying
- 2-3 variations of level complete sound, randomly selected

---

## 7. 🟢 SCREENS & NAVIGATION

### 7.1 Game Over Screen Misses Opportunity
**Fix:**
- Show reason: "⏰ Time ran out!" vs "💥 Stepped on a mine!"
- Show comparison: "Your best: Level 14 | This run: Level 8"
- "Play Again" significantly larger than "Home"
- Random gameplay tip at bottom — different each time
- If player dies on same level 3+ times → specific tip for that level/world type
- Use chicken name: "Better luck next time, Clucky 💀"

### 7.2 Level Complete — No Player Control Over Pacing
**Fix:**
- Show "TAP TO CONTINUE" prompt after 1 second
- Auto-advance after 3 seconds if no tap
- Fast players get control, slow players get the safety net

### 7.3 Leaderboard Shows Incomplete Info
**Fix:**
- Separate tabs: Campaign scores | Endless scores
- Each entry: chicken name, level reached, world name, seeds earned, date
- Personal best entry pinned or highlighted differently

### 7.4 World Select Shows No Useful Info
**Fix:**
- Best level per world shown on each card
- Locked worlds show unlock condition: "Clear level 9 to unlock"
- Option to replay from level 1 of any cleared world

### 7.5 Pause Menu Missing Info
**Fix:**
- Show current seeds balance
- Rename buttons clearly: "Restart Level" vs "Quit to Menu (lose progress)"
- Show chicken name at top of pause panel

---

## 8. 🟢 MICRO DETAILS

- Seeds counter on home screen shows stale data after returning from game — needs refresh on focus
- Hidden tiles show literal `?` text — looks like placeholder UI, should be blank or subtle texture
- Confetti on level complete fires but chicken just sits — should do a jump or run to center
- No visual difference between fresh level and replayed level — first time on new world should feel special
- `adjMines` numbers don't appear on peeked tiles — wasted information
- Leaderboard has no way to tell which entry is yours
- Shop "Upgrades" tab empty state message needs improvement — currently cold and plain

---

## 9. 🥚 EASTER EGG UNIVERSE — "THE LOST CHICKEN"

*A silent lore mystery told in fragments across normal gameplay. No text explanations anywhere. Players piece it together themselves.*

---

### The Story (Never Told Directly)
Somewhere in the game's world, there was another chicken before yours. It went too deep into the minefield. It never came back. What it left behind are fragments — scratch marks, shadows, whispers. Your chicken is walking the same path.

---

### Fragment 1 — The Scratches
**Trigger:** After player completes level 10 for the first time
**What happens:** A single faint scratch mark appears on one random hidden tile per level going forward. Nothing happens when you step on it. No sound, no reward. Just a scratch. Like something was clawing at the tile from underneath.
**Visibility:** Extremely subtle — most players will never notice

---

### Fragment 2 — The Shadow
**Trigger:** Player has stepped on 3 scratch tiles across different levels
**What happens:** Occasionally — very rarely — when chicken stands still for 5+ seconds, a faint shadow of another chicken appears one tile away for exactly half a second, then vanishes. No sound.
**Effect:** Players who see this will genuinely question if they imagined it

---

### Fragment 3 — The Message
**Trigger:** The golden egg tile — roughly 1-in-300 chance per level, a golden egg 🥚 replaces one normal hidden tile
**What happens:** When player steps on it, screen goes black for exactly 2 seconds. A single line appears in small text, centered:

> *"still here"*

Then gameplay resumes completely normally. No achievement popup, no sound, nothing. Just those two words. This is the rarest fragment — player might play 50 hours and never see it.

---

### Fragment 4 — The Tap Pattern (Secret Trigger)
**Trigger:** Player taps the home screen chicken exactly 5 times quickly then holds for 2 seconds
**Signal that it worked:** The bouncing chicken goes completely still for 3 seconds. No bounce, no blink. Just standing. Then resumes normally.
**Requirement to proceed:** Player must have witnessed all 3 previous fragments first. If not, nothing happens.

---

### Fragment 5 — The Coop (Secret Level)
**Trigger:** Tap pattern performed after all 3 fragments witnessed
**Transition:** Screen cracks open (not a normal transition) — golden light through the crack, then darkness
**The level:**
- Dark mirror of level 1 — exact same grid layout but inverted
- Everything inverted: dark tiles, white mines, chicken appears slightly worn and darker
- No music, no HUD, no timer shown (timer exists invisibly)
- Checkpoint is in the starting corner — player must walk backwards
- Mine emoji replaced with 👁️ — just an eye
- No explosion sound on mine hit — just silence and slow fade to black
- Completing it reveals 3 silent images: the other chicken, the mine it stepped on, the scratch marks it left. Then it ends.

---

### Rewards — The Lost Chicken
| Discovery | Permanent Home Screen Change |
|-----------|------------------------------|
| Fragment 1 (scratch tiles) | Subtle scratch marks visible on home screen background |
| Fragment 2 (shadow) | Faint shadow chicken occasionally visible behind your chicken on home screen |
| Fragment 3 (golden egg / "still here") | Golden egg trophy sits permanently on home screen, wobbles when tapped, cracks slightly more each tap |
| Fragment 4 (tap pattern) | Golden crack effect on home screen background — glowing faintly |
| Fragment 5 (complete The Coop) | Golden Chicken skin (never available in shop, ever) + home screen gets permanent golden shimmer + game over screen shows golden chicken emoji next to name |

---

### Cross-Connection With Midnight Level
- The scratch marks from Fragment 1 also appear in The Midnight Level
- The shadow from Fragment 2 appears more frequently during The Midnight Level
- The 👁️ mine in The Coop is the same eye used in The Midnight Level
- Players who find both Easter eggs will realize they're part of the same story

---

## 10. 🌙 EASTER EGG UNIVERSE — "THE MIDNIGHT LEVEL"

*A time-gated challenge that only exists between 12:00am and 1:00am on the device's real clock.*

---

### The Signal
No announcement. No hint anywhere in the game. Between midnight and 1am, the home screen chicken stops bouncing. Completely still. Not blinking. Just standing.

Players who notice and tap the still chicken enter The Midnight Level.

---

### The Level Atmosphere
- Screen dims slowly to near-black over 3 seconds
- No level banner, no world name, no music
- Only silence and very faint ambient wind sound
- Grid loads but player can only see one tile radius around chicken — total darkness beyond
- Previously visited tiles slowly fade back to darkness after 10 seconds
- Player navigates by memory

---

### Different Rules
- No hearts
- No powerups  
- No combo
- No seeds earned
- Timer exists but is completely hidden — pressure without knowing how much time remains
- Peek costs nothing but only lasts 1 second
- Checkpoint is invisible until player is exactly one tile away
- Mine emoji replaced with 👁️ (same eye as The Coop — intentional connection)
- No explosion sound on mine hit — silence and slow fade to black
- Chicken doesn't walk — it glides

---

### The Eerie Details
- If chicken stands still for 10 seconds, a single distant cluck sound plays — not yours
- Scratch marks from The Lost Chicken lore appear on random tiles here
- Shadow chicken from Fragment 2 appears more frequently here
- If player has completed The Coop, the worn darker chicken skin appears automatically in this level

---

### Progressive Difficulty — Nightly Streak
The level gets harder every night:
- Night 1: 5x5 grid, light radius 1 tile
- Night 2: 6x6 grid, light radius 1 tile, mines move once
- Night 3: 7x7 grid, mines move, scratch tiles deal 5 second invisible timer penalty
- Night 4+: 8x8 grid, mines move twice, shadow chicken actively blocks one path
- Night 7: Maximum difficulty — this is the streak goal

Missing a night resets streak to Night 1.

---

### Rewards — The Midnight Level
| Achievement | Reward |
|-------------|--------|
| Complete Night 1 | Moon badge 🌙 on home screen nameplate — silver, glowing faintly |
| Complete 7 consecutive nights | Second moon badge 🌙🌙 — the only way to get it, ever |

---

### The Time Gate
- Level disappears exactly at 1:00am — if player is mid-level it continues but no new entries after 1am
- The still chicken resumes bouncing at 1:00am as if nothing happened
- Next night the chicken goes still again at midnight

---

## 11. 🏅 HIDDEN ACHIEVEMENTS — COMPLETE LIST

### Regular Hidden (shown as "X hidden remaining" teaser)
| ID | Icon | Name | Condition | Reward |
|----|------|------|-----------|--------|
| brave_fool | 💀 | Brave Fool | Step on 50 mines total | 50 🌾 |
| ghost_run | 👻 | Ghost Run | 5 levels in a row without losing a heart | 200 🌾 |
| lucky_cluck | 🎰 | Lucky Cluck | Collect 3 powerups in one level | 100 🌾 |

---

### Easter Egg Hidden (NOT counted in teaser — completely invisible until found)

**The Lost Chicken Series:**

| ID | Icon | Name | Condition | Reward shown |
|----|------|------|-----------|--------------|
| scratch_found | 🪶 | Echoes | Stepped on a scratch tile | None — just description |
| shadow_seen | 🌑 | You Saw It | Witnessed the shadow chicken | None |
| still_here | 🥚 | Still Here | Stepped on the golden egg tile | None |
| the_coop | 🐔 | The Coop | Completed the secret level | None |

Achievement descriptions shown after unlock:
- Echoes: *"Something was here before you."*
- You Saw It: *"Or did you?"*  
- Still Here: *"Some things can't be bought or earned. Only found."*
- The Coop: *"Not many have seen this. You have."*

**The Midnight Series:**

| ID | Icon | Name | Condition | Reward shown |
|----|------|------|-----------|--------------|
| night_owl | 🌙 | Night Owl | Complete The Midnight Level | None |
| haunted | 🌙🌙 | Haunted | Complete 7 consecutive midnight levels | None |

Achievement descriptions shown after unlock:
- Night Owl: *"Some levels only exist when everyone else is asleep."*
- Haunted: *"It knows your schedule now."*

**Rules for Easter Egg Achievements:**
- Never appear in achievements list until unlocked — not even as ❓
- Not counted in the "X hidden remaining" teaser number
- No seed reward shown at any point — reward is the home screen transformation
- Golden card style in achievements screen — visually distinct from all other achievements
- No reward amount ever shown — the mystery is the point

---

## 12. 📊 PRIORITY IMPLEMENTATION ORDER

### Phase 1 — Critical (Do First)
| # | Item |
|---|------|
| 1 | Fix grid floating at bottom — center it properly |
| 2 | Remove Farm world hearts — instant game over |
| 3 | Fix hearts persistence per world |
| 4 | Remove permanent peek cost label from HUD |
| 5 | Fix accessory + skin hat stacking bug |
| 6 | Name Your Chicken — first launch screen + name in home/game over/leaderboard |

### Phase 2 — High Impact Polish
| # | Item |
|---|------|
| 7 | Skins visual overhaul — unique silhouettes + idle animations |
| 8 | Chicken scales with grid cell size |
| 9 | Strict overlay queue — no simultaneous popups |
| 10 | Home screen button reduction — max 3 visible |
| 11 | Adjacent mine number color coding |
| 12 | Game over screen — reason + name + tip |
| 13 | Tap to continue on level complete |
| 14 | Timer drain rate escalation — V1 style |
| 15 | Skin equip feedback animation + sound |

### Phase 3 — Medium Polish
| # | Item |
|---|------|
| 16 | Merge shop tabs to 5 |
| 17 | Shop "can afford" highlight |
| 18 | Unique skin equip toast messages |
| 19 | Checkpoint pulse animation |
| 20 | Seeds count-up animation |
| 21 | Mute / music toggle |
| 22 | HUD two-row split |
| 23 | Show mine count on peeked tiles |
| 24 | Long press charge ring animation |
| 25 | World select — best level + unlock conditions |
| 26 | Leaderboard — names + separate campaign/endless |

### Phase 4 — Micro Details
| # | Item |
|---|------|
| 27 | Button tap sounds in all menus |
| 28 | Haptic feedback — mine/complete/achievement |
| 29 | Timer audio escalation under 10s |
| 30 | Mine hit screen edge red flash |
| 31 | Swipe visual confirmation |
| 32 | Remove `?` from hidden tiles |
| 33 | Stale seeds on home screen — refresh on focus |
| 34 | Pause menu — seeds balance + better button labels |
| 35 | Progression milestone celebrations |

### Phase 5 — Easter Eggs (Last, After All Polish Done)
| # | Item |
|---|------|
| 36 | The Lost Chicken — Fragment 1 (scratch tiles from level 10) |
| 37 | The Lost Chicken — Fragment 2 (shadow chicken) |
| 38 | The Lost Chicken — Fragment 3 (golden egg tile + "still here") |
| 39 | The Lost Chicken — Fragment 4 (tap pattern trigger) |
| 40 | The Lost Chicken — Fragment 5 (The Coop secret level) |
| 41 | Home screen transformations per fragment discovered |
| 42 | The Midnight Level — full implementation |
| 43 | Midnight Level progressive nightly difficulty |
| 44 | All Easter egg hidden achievements |
| 45 | Cross-connections between both Easter egg systems |

---

*Total items: 45*
*Phases: 5*
*Easter egg achievements: 7 (3 regular hidden + 4 Lost Chicken + 2 Midnight = 9 total hidden)*
*Compiled: April 2026 — MinePath V5 Polish & Easter Egg Master Plan*
