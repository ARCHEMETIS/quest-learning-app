# Wiring the remaining UI: Leaderboard, Stats, Streak Card, App Shell, Profile Drawer

Type: handoff note (English by design — dense technical mapping, precision over Thai idiom)
Companion to: [09-integrate-ui.md](09-integrate-ui.md) (this is the "remaining 6 pages" follow-up it points to)
Written by: Claude (frontend/design side), for whoever wires this in next
Date: 2026-07-21

## What landed on `frontend/add-leaderboard-streak-stats-appshell`

| File | Status | Notes |
|---|---|---|
| `src/components/LeaderboardPage.jsx` | **new** | Drop-in, still mock-data pattern (see below) |
| `src/components/StatsPage.jsx` | **new** | Drop-in, still mock-data pattern |
| `src/components/StreakCardPage.jsx` | **new** | Drop-in, still mock-data pattern |
| `src/components/AppShell.jsx` | **new** | Persistent nav shell — **does not match current routing model, see "Architecture mismatch" below** |
| `src/components/ProfileDrawer.jsx` | **new** | Slide-out overlay — **also affected by the mismatch** |
| `src/components/LuiQuestLogo.jsx` | modified | `LuiQuestFavicon` gained an optional `size` prop (default 44, matches old hardcoded size) — non-breaking, safe to use immediately, no wiring needed |

`DailyQuestPage.jsx` and `CoachChatPage.jsx` were **not** touched — the design-side copies of those files are stale relative to what's already wired in (ticket #09's first pass, commit `9f08d0f`). Overwriting them would have deleted real API integration, so this PR leaves them alone. (Caught this by diffing before committing — see git history on this branch for the reverted attempt.)

## Architecture mismatch — read this before wiring AppShell/ProfileDrawer

`AppShell.jsx` and `ProfileDrawer.jsx` were designed against `design-brief-ui.md`'s original mental model: **one PWA shell, tab-switching in place, no page reloads**. Concretely, as delivered:

- `AppShell` holds `const [tab, setTab] = useState(initialTab)` and mounts `DailyQuestPage`/`CoachChatPage`/`LeaderboardPage` all at once, toggling `hidden` — no routing at all inside it.
- `ProfileDrawer` is an overlay (`position: fixed`, backdrop) opened by tapping the avatar in `AppShell`'s header — not a navigable destination.

The app as actually built uses **React Router** (`src/App.jsx`), one independent route per page (`/quest`, `/coach`, `/leaderboard`, `/profile`, `/stats/:handle`), each with its own data-fetching wrapper in `src/pages/`. There is currently **no persistent chrome at all** — no bottom nav, no header, no way to reach `/profile` (nothing links to it yet; it's still `<Placeholder title="Profile" />`). `Quest.jsx`/`Coach.jsx` navigate to each other via `useNavigate()` calls passed as props (`onOpenCoach`, `onBack`) — there's no shared shell they're rendered inside of.

So `AppShell.jsx` cannot just be dropped in and mounted — it would either duplicate routing (bad) or need to become the thing that routing renders *into*, not a replacement for routing. **Recommended shape:**

```jsx
// src/components/AppShellLayout.jsx (new file, adapted from AppShell.jsx)
// - Same header/logo/avatar/bottom-nav *markup* as AppShell.jsx, none of its tab-state.
// - Bottom nav items use <NavLink to="/quest">, <NavLink to="/coach">, <NavLink to="/leaderboard">
//   instead of onClick={() => setTab(...)} — "active" comes from NavLink's isActive, not local state.
// - Renders <Outlet /> (react-router) where AppShell currently inline-mounts the three pages.
// - Avatar button toggles local `profileOpen` state and renders <ProfileDrawer open={profileOpen} onClose={...} .../>
//   as a global overlay ON TOP of whatever route is active — /profile itself does not need to be a route
//   users navigate to; the drawer is reachable from every screen inside the shell instead. (See open
//   question below about what to do with the existing /profile route.)
```

```jsx
// src/App.jsx — wrap the three authenticated in-shell routes in a layout route
<Route element={<RequireAuth><AppShellLayout /></RequireAuth>}>
  <Route path="/quest" element={<Quest />} />
  <Route path="/coach" element={<Coach />} />
  <Route path="/leaderboard" element={<Leaderboard />} />
</Route>
```

`/login`, `/onboarding`, and `/stats/:handle` stay **outside** the shell (login/onboarding are single-moment full-bleed screens by design; `/stats` is the public no-auth page — showing app chrome there would leak "this is an app you'd need an account for" framing onto a page meant for outsiders/professors).

**Per CONTRIBUTING.md, `src/App.jsx` is the one file both of us touch — heads up before either of us edits it for real, this doc is that heads-up.**

**Open question — what happens to `/profile`:** it's currently routed with a `RequireAuth` guard and a placeholder. Two options, need a decision:
1. Keep `/profile` as a route, but have it just do `useEffect(() => navigate('/quest'), [])` and rely on the drawer for actual profile access (simplest, avoids two UIs for the same thing).
2. Turn `/profile` into a *real* full-page version of ProfileDrawer's content (strip the slide-out chrome, keep XP/streak/rank/topics/invite/logout) for deep-linkability — more work, only worth it if there's a reason to link directly to a profile page (there doesn't appear to be one yet).

Recommend (1) unless there's a plan I'm not aware of.

## Wiring the 3 new mock-pattern components

`LeaderboardPage.jsx`, `StatsPage.jsx`, and `StreakCardPage.jsx` are still in the same "mock data + `PREVIEW_STATES` toggle" shape that `LoginPage`/`OnboardingFlow`/`DailyQuestPage`/`CoachChatPage` were in *before* ticket #09's first pass rewired them. Same treatment needed: replace the internal `MOCK` object with real props, keep `showStateToggle={false}` in production. Real data sources, per [10-growth-features.md](10-growth-features.md) and `supabase-schema.md`, are already deployed and need **no new Netlify Function** — direct `supabase-js` reads via `src/lib/supabaseClient.js`, same pattern `Coach.jsx` already uses for `chat_messages` history:

### Leaderboard (`src/pages/Leaderboard.jsx`, replacing the placeholder)

```js
const { data } = await supabase
  .from('leaderboard')            // view, RLS-safe: display_name/avatar_url/total_xp/current_streak/is_premium only
  .select('*')
  .order('rank', { ascending: true })
  .limit(50); // or whatever depth matches LeaderboardPage's "ready" (many) vs "few" (<10) states
```
Current user's own rank/row: either find it in the same result set (fetch enough rows) or a second query filtered `.eq('user_id', user.id)` if they might be ranked below the fetched slice — `LeaderboardPage.jsx`'s pin-card behavior assumes it always knows the current user's row even when it's off-screen.

### Stats (`src/pages/Stats.jsx`, replacing the placeholder)

```js
const { data: stats } = await supabase.from('public_stats').select('*').single();
const { data: growth } = await supabase.from('stats_daily_growth').select('*').order('day');
```
No auth required — `anon` role already has `select` grants on both views (see `supabase-schema.md` "สิทธิ์อ่าน view"). `StatsPage.jsx`'s "early" vs "ready" state should key off `registered_total` (or similar) crossing some threshold you pick.

**Open question — `/stats/:handle`:** the route currently takes a per-user `:handle` param, but `public_stats`/`stats_daily_growth` are site-wide aggregates with no per-user filter, and `design-brief-ui.md` explicitly specs `/stats` as a single public page with **no PII**, not a per-user page. These two don't match. Either the route should just be `/stats` (drop `:handle`), or there's a per-user stats concept planned that doesn't have a view yet — worth a 30-second Slack/chat check before building either direction.

### Streak Card (`src/components/StreakCardPage.jsx` — not a route)

No page wrapper needed. It's a modal/overlay triggered from within the quest flow. `Quest.jsx` already renders `<DailyQuestPage ... onOpenCoach={...} />` but does **not** currently pass `onShareStreak`/`onInvite` (`DailyQuestPage`'s "แชร์การ์ด streak" and "ชวนเพื่อนมาลุยด้วยกัน" buttons in the `done` state are currently no-ops). Wire it as:

```jsx
// Quest.jsx
const [showStreakCard, setShowStreakCard] = useState(false);
// ...
<DailyQuestPage ... onShareStreak={() => setShowStreakCard(true)} />
{showStreakCard && (
  <StreakCardPage
    showStateToggle={false}
    initialState={effectiveStreak > 0 ? 'streak' : 'zero'}
    streak={effectiveStreak}
    userName={profile.display_name}
    referralLink={`luiquest.app/invite/${profile.referral_code}`}  // see referral_code below
    onBack={() => setShowStreakCard(false)}
  />
)}
```
(Prop names above are illustrative — `StreakCardPage.jsx`'s current signature is still `{ initialState, onBack, onSaveImage, onShare, showStateToggle }` with all the actual streak/name/link values baked into its own `MOCK` — it needs the same real-prop rewrite as the others before this works. Listing the shape the real data should take, not claiming the file already accepts it.)

## Wiring `ProfileDrawer.jsx`

Current signature: `{ open, onClose, onSwitchTopic, onUpgrade, onShare, onLogout, initialState, showStateToggle }`. Real wiring per callback:

- **`onLogout`** → `useAuth().signOut()` then `navigate('/login')`.
- **`onSwitchTopic`** → `ProfileDrawer` shows a list of the user's saved topics/roadmaps with one marked active. Maps to `useProfile().roadmaps` (array, has `is_active`) → call `api.switchRoadmap(roadmapId, token)` (already exists in `api.js`) → `useProfile().refetch()`.
- **Invite/share link** → the user's own referral code lives on `profiles.referral_code` (see `netlify/functions/redeem-referral.js` — it reads `profiles.referral_code` for the *current* user too, so it's already in whatever `useProfile()`/`me.js` returns, or add it to the `me` function's select if it's missing). Link format: `luiquest.app/invite/<referral_code>`, redemption already live at `redeem-referral.js` (POST `{ referral_code }`, 20 XP to both sides, 7-day window on the new account, self-invite/double-redeem guarded).
- **`onUpgrade`** → **no premium/payment backend exists yet** (`api.js` has no payment-related call, no Netlify function for it, `profiles.is_premium` is presumably still manually flipped or unset). Recommend hiding/disabling this button for now rather than wiring it to a dead end — premium/payment is Wave 2 scope per `docs/planning/README.md`'s locked decisions.
- **Topic count / free-tier cap** (`ProfileDrawer`'s "capped" mock state — 3/3 topics on free tier) — cross-check against whatever free-tier topic limit is actually enforced server-side (if any) before trusting the UI's copy; didn't find an explicit cap enforced in `start-roadmap.js`/`switch-roadmap.js` from what I read, worth confirming.

## Prop-signature reference (mock → real), for consistency

These 4 already went through this exact rewrite in ticket #09's first pass — use them as the template for Leaderboard/Stats/StreakCard:

| Component | Mock signature (as designed) | Real signature (as wired) |
|---|---|---|
| `LoginPage` | `{ initialState, showStateToggle }` | `{ showStateToggle, status, onLogin }` |
| `OnboardingFlow` | `{ initialState, onComplete, showStateToggle }` | `{ showStateToggle, onComplete }` (nearly unchanged) |
| `DailyQuestPage` | `{ initialState, onOpenCoach, onShareStreak, onInvite, showStateToggle, heightClass }` | `{ showStateToggle, status, dateLabel, topicTitle, userInitial, quest, checklistItems, stats, onRetry, onClaim, claiming, claimError, onOpenCoach }` (`onShareStreak`/`onInvite` accepted but not yet passed from `Quest.jsx` — see Streak Card section above) |
| `CoachChatPage` | `{ initialState, onBack, onGoToQuest, showStateToggle, heightClass }` | `{ topicTitle, initialMessages, initialQuotaUsed, quotaTotal, onSend, onBack, onGoToQuest }` |

Notice the pattern: `initialState`/mock-toggle disappears, replaced by whatever real fields the page actually needs; `showStateToggle` usually stays (always `false` in production, just controls whether the internal preview-state pills render — harmless dead code path if left in, per ticket #09's "known follow-ups" note).

## Known gaps, not blocking this PR

- Premium/payment flow (blocks `onUpgrade` wiring — see above).
- `/stats/:handle` vs. site-wide `public_stats` mismatch (needs a decision, see above).
- Free-tier topic cap enforcement not confirmed server-side.
- `AppShellLayout` adaptation (nav via `<NavLink>`, `<Outlet/>`, drawer-not-route) is sketched above but not written yet — happy to do that pass once the `/profile` route question is settled, since it changes `App.jsx`.
