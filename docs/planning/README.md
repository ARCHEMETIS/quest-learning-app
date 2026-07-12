# Planning & Decision Log

This project is planned with a **wayfinding** approach: instead of a single upfront spec, the work is charted as a map of decision *tickets*, each resolving one open question before implementation starts. Tickets are worked one at a time; resolving one clears the "fog" and reveals the next.

The raw, living tracker (map + tickets) lives in [`../../.scratch/app-v2-spec/`](../../.scratch/app-v2-spec/). Ticket detail is written in Thai (the target market's language); this page is an English index of the process and the decisions locked so far.

## Destination

A complete, build-ready spec for a multi-user, multi-topic gamified learning app — every decision locked (name/positioning, audience, MVP features, architecture, free-tier strategy, business model, first-month growth plan) so implementation can begin.

## Decisions locked so far

| Decision | Outcome |
| --- | --- |
| **Topic scope** | Curated core of 6 tracks (Python, Data/ML, web dev, using AI, spreadsheets, personal finance) plus a free-form "type your own topic" mode. Thai-first resources, English as backup. Free-form mode may only attach whitelisted domains or search links — never fabricated deep URLs. |
| **Target audience** | First users are Thai engineering/CS/science students in the founder's own circle. Tech tracks featured first. Growth is word-of-mouth (peer sharing + university online groups) — so in-app invite/share mechanics are treated as core MVP, not extras. |
| **Gemini free-tier strategy** | Google no longer publishes free-tier numbers (verify in AI Studio dashboard at build time). Planning numbers: `gemini-3-flash` ~1,500 req/day, `flash-lite` ~1,000, `2.5-flash` cut to ~250 (no longer viable as primary). Real bottleneck is per-minute rate, not daily — solved by pre-generating daily quests overnight (scheduled function), lifetime-caching roadmaps, capping chat at 10 msgs/user/day, and a model fallback chain ending in static quests. Supports ~250–600 active users/day — ample. |
| **Login & onboarding** | Google Sign-in only (Supabase Auth) — no guest mode, every account is a verifiable real user. 3-step onboarding (topic → level → minutes/day), under one minute. First quest is served instantly from a pre-built library of 18 starter quests (6 topics × 3 levels) — zero AI quota at signup. |
| **MVP feature set** | Everything from ml-quest carries over (XP, streaks, phase progress, letter grade, AI coach chat, checklist-gated completion, PWA). New features ship in two waves: **Wave 1 (launch, ~2 weeks)** adds invite links with XP rewards, an XP leaderboard, and a shareable streak card; **Wave 2 (post-launch)** adds web-push streak reminders, a friends/duo system, and the paid tier. First free/premium line locked: free = one active topic at a time, premium = multiple concurrent topics. (Also surfaced: the real deadline is the full semester, not one month — the ~2-week Wave 1 target stands as a self-imposed pace.) |

## Open questions (frontier)

- App name & brand
- Business model (Business Model Canvas for the course pitch)
- Freemium monetization in the MVP — free tier + paid tier with real payments in month one (scope expanded 2026-07-12)
- Curated Thai learning sources for the 6 launch tracks *(research)*
- Tech stack, growth plan, core-screen prototype, final spec assembly *(downstream)*

## Constraints

- **Free tier only on the cost side** — no paid services at any point. Charging *users* (freemium) is in scope, but the payment channel itself must also be zero-cost.
- **~1 month timeline** to build and grow a real user base; graded on real usage.
- Solo developer.
