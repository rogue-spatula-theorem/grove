# Grove — Changelog & Session Log

---

## Session 6 — 21 April 2026 (ICT test pass)
**Status: Audited v2 build. One critical fix deployed. PWA now actually offline-capable.**

### Fixed
- **Critical: Service worker registration was missing.** `sw.js` was updated to v2 during the Session 5 rebuild but the `navigator.serviceWorker.register('./sw.js')` call was dropped from `index.html`. Result: the PWA wasn't actually installing a worker — no offline shell, no cache, no home-screen install with cached assets. Re-added the registration block at the bottom of `index.html`.
- **Cache bump to `grove-v3`** so any previously-installed PWA picks up the fix on next load.
- **Dead element removed:** `<link id="app-icon" rel="apple-touch-icon">` had no `href` and nothing referenced it — deleted.

### Audited and cleared (no change)
- JS syntax across all 5 `<script>` blocks (Node `--check` pass)
- Inline handler → function resolution (0 unresolved)
- Duplicate ID scan in static HTML (0 duplicates)
- `innerHTML` interpolation XSS scan — all user fields pass through `esc()`; the one raw `${data.profile.name}` on the JSON-restore dialog is safe because `showDialog` uses `textContent`
- Navigation flow: `navTab('followups')` is intercepted by the override at end of screens block and pushes via `pushScreen` + `renderFollowups` — works
- MediaRecorder lifecycle: tracks released on stop
- localStorage writes wrapped in try/catch with quota-exceeded toast

### Outstanding (noted, not fixed)
- Viewport has `maximum-scale=1, user-scalable=no` — intentional for iOS PWA feel but a WCAG 2.1 zoom violation. Low priority.
- Supabase cloud sync, push notifications, real AI summarisation, real LinkedIn enrichment — all previously deferred.

---

## Session 5 — 21 April 2026 (late evening)
**Status: Major feature build + design polish. ~3,467 lines, 180KB. SW cache bumped to v2.**

### Built this session
- **Contact relationships** — bidirectional `relationships[]` field; pick type (spouse/family/friend/colleague/knows-via) + note + counterparty in a single sheet; mirrored on both contacts; one-tap remove cleans both sides; inverse cleanup on contact delete
- **Follow-ups screen** — dedicated screen reachable from dashboard quick-stat + attention overflow; 4 buckets (Overdue / Today / This week / Later); per-row Done / +1d / +1w / Dismiss
- **Voice notes on encounters** — MediaRecorder API, mime auto-detect (opus → webm → mp4 → aac), base64 dataURL stored in `_encDraft.voice`; play/delete controls; recording timer
- **VCF/CSV/JSON import** — `openImportPicker` sheet → 3 source types; vCard parser (FN, N, TEL incl. CELL/iPhone, EMAIL incl. WORK, ORG, TITLE, BDAY incl. partial dates, NOTE, URL→linkedin); CSV with header aliasing for First/Last/Email/Phone/Company etc.; Grove JSON backup restore via `DB.importProfile`; preview sheet with select-all and per-row checkboxes before commit
- **Skipped AI summary entirely** per request — no button, no scaffolding
- **Welcome security info** dialog wired to "find out how" link
- **Resize listener** re-renders boab on viewport change (rAF-debounced)
- **Init flow** — `loadTheme()` → 0 profiles ⇒ welcome / 1 profile or active id ⇒ enterApp / multi ⇒ profile picker

### Build pipeline
- Sliced into 7 chunks under `/sessions/youthful-nice-cray/grove-build/` for context-friendly authoring
- Concatenated → `index.html` (3,467 lines) → Node syntax-checked all `<script>` blocks pass
- ID audit clean (every `getElementById` target exists in DOM)
- Handler audit clean (every `onclick`/`oninput`/`onchange` target is defined or is an inline expression)

---

## Session 4 — 21 April 2026 (evening)
**Status: Claude Design system applied. Build rebuilt from scratch.**

### What was done this session
- Fetched Claude Design handoff bundle from `api.anthropic.com/v1/design/h/...` (Grove.html + modular JSX source)
- Audited existing 1,897-line `index.html` to catalogue every DOM ID and JS function the app depends on
- **Rewrote `index.html` completely** (2,687 lines) — visual layer replaced, data/logic layer preserved
- All existing IDs and JS functions kept intact — no data migration needed

### Design system applied
| Element | Detail |
|---|---|
| Themes | 4 total: Light + Obsidian + Forest Night + Ink |
| Theme switching | `prefers-color-scheme` auto-mode + manual picker in Settings (localStorage: `grove_theme`) |
| CSS architecture | Full custom-property token system per theme (--bg, --surface, --text, --green, --sep, --shadow, etc.) |
| Welcome screen | Boab tree SVG centerpiece (9 cubic-bezier branches, fruits placed via `getPointAtLength()` at runtime), GROVE wordmark (42px, ls 7), tagline "Tend the relationships that matter." |
| Tab bar | Changed from 5-tab (center-FAB) to **4-tab** (Home / Contacts / Search / Settings) |
| FAB | Floating green FAB on dashboard (Log encounter) + contacts (Add contact) |
| Dashboard | Gold-tinted attention card, horizontal upcoming scroll, recent activity list, stats grid |
| Contact detail | Hero card + quick action row (Call/Message/Email/LinkedIn), Info/Timeline/Memory pill tabs |
| Contacts list | Grouped by last-name initial with letter dividers |
| Onboarding | Live avatar preview as user types name + picks palette colour |

### New functions added
- `setTheme(t)` / `updateThemeUI()` — theme system
- `renderBoab()` — SVG boab tree with runtime fruit placement
- `aiSummarise()` — encounter text clean-up stub (placeholder for future LLM integration)
- `strengthChip(s)` / `strengthDot(s)` / `moodPill(m)` — theme-aware chip helpers
- `toggleProfiles()`, `updateObPreview()`, `cancelOnboarding()` — welcome/onboarding polish

### Verification
- Single inline `<script>` block syntax-checked cleanly via `new Function()`
- All 39 critical DOM IDs present
- All 23 critical functions present
- File size: 127 KB (up from ~62 KB — accommodates 4-theme token system + boab SVG + new helpers)

### What comes next (Session 5)
1. Matt tests rebuilt app on iPhone via Safari → Add to Home Screen (or refresh existing PWA)
2. Verify all 4 themes render correctly on device
3. Verify boab tree animates smoothly on welcome screen
4. Confirm existing profile data still loads (no migration should be needed — all IDs preserved)
5. Decide whether to wire `aiSummarise()` to a real LLM endpoint (currently local-only stub)

### Start of Session 5 instructions
Tell Claude: *"I've tested the rebuilt Grove on iPhone. Here's what works / what doesn't."* — or proceed with remaining deferred items (Supabase, push notifications, conversation recording, bulk contact import).

---

## Session 3 — 21 April 2026
**Status: Design phase complete. Awaiting Claude Design handoff.**

### What was done this session
- Researched Claude Design (launched 17 April 2026 by Anthropic Labs, research preview)
- Built a complete Claude Design prompt package in `grove-design-package/`:
  - `PROMPT.txt` — master prompt covering 6 screens with full iOS specs and design system
  - `grove-design-brief.docx` — 10-section brand/design system document for upload to Claude Design
  - `README.md` — step-by-step usage instructions
- Matt ran the package through Claude Design, generating high-fidelity mockups including **dark mode**
- Decision made: dark mode should follow iOS system setting (prefers-color-scheme) AND have a manual toggle in Settings

### Decisions locked this session
| Decision | Detail |
|---|---|
| Dark mode | System-auto (follows iOS) + manual toggle in Settings, stored in localStorage |
| Design style | Clean & minimal, iOS-native, premium |
| Design tool | Claude Design (Anthropic Labs) |
| Handoff method | Claude Code handoff bundle from Claude Design |

### What comes next (Session 4)
1. Matt drops the **Claude Design handoff bundle** into this Grove folder
2. Read the handoff to extract specs, components, colour tokens
3. Rebuild `index.html` with:
   - Full CSS custom property system (light/dark mode vars)
   - `prefers-color-scheme: dark` media query
   - Manual dark mode toggle (Settings screen, stored in localStorage)
   - All 6 screens redesigned to match Claude Design output
   - All existing JS/data logic preserved — CSS/HTML structure only changes
4. Test on iPhone via Safari → Add to Home Screen

### Start of Session 4 instructions
Tell Claude: *"I have the Claude Design handoff bundle in the Grove folder. Read it and rebuild index.html with the new design, including system + manual dark mode."*

---

## Session 2 — 14 April 2026
**Status: Working PWA delivered. Installed on iPhone.**

### What was done
- Rebuilt `index.html` from scratch (1,897 lines)
- Full iPhone PWA optimisations applied (safe areas, viewport-fit, apple-touch-icon)
- PWA manifest and service worker (`sw.js`) added
- App installed on iPhone via Safari → Add to Home Screen

### App features at end of Session 2
- Multi-profile support
- Full contact field set (identity, professional, personal, relationship, memory aids)
- Encounter logging (8 types, mood, follow-up)
- Dashboard with alerts, upcoming events, recent activity, quick stats
- Search (name, company, tags, key facts, interests)
- Settings: JSON export/import backup, delete profile
- localStorage database (local-first, no cloud yet)

---

## Session 1 — March 2026
**Status: Prototype built.**

### What was done
- Designed interactive prototype (`grove-prototype.html`)
- Established brand identity (Grove, forest green #2D6A4F, warm gold #C9A84C, tagline)
- Wrote full `CRM-Build-Prompt.md` spec for ongoing sessions

### Deferred (still pending)
- GitHub repo (URL not yet provided)
- Netlify deployment
- Supabase integration (cloud DB, auth, cross-device sync)
- Conversation recording + AI summarisation
- Push notifications
- Relationship connections
- Bulk VCF/CSV contact import

---

*Never delete this file. It is the project memory.*
