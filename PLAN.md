# PLAN.md: Book Creation Platform, MVP implementation plan

**Status:** Draft for founder review. No production code has been written.
**Date:** 2026-10-12
**Source:** "Book Creation Platform - Product Brief for Claude Code" (claude.ai doc, rev 12), including the open comment thread on the team-size assumption.
**Backlog:** candidate features (interest feed, AI polish and illustration, dream mode, likes, comments, audio, badges, creator analytics) are in [ROADMAP.md](ROADMAP.md). There is no hard line between that file and this plan: items can move into the MVP, or out of it, once the MVP contents are decided.
**Conventions:** Facts I checked on the web are cited in [Appendix A](#appendix-a-sources-checked). Anything from my own knowledge that I could not check today is tagged **(verify)**. Effort is in ideal dev-days (one developer comfortable with the stack, including tests and review, excluding meetings).

## TL;DR: what I need you to decide

1. **Stack:** I confirm your suggested stack (Next.js on Vercel, Supabase, TipTap, Pexels, PostHog, Sentry) with six changes (section 2). The biggest: anonymous Supabase sign-in for guest drafting, email one-time codes instead of magic links, and no reliance on Background Sync.
2. **The brief has a hole at its centre:** persona 3 (the memory-keeper, "photo-led mini-book: a family story, a trip, a tribute") cannot be served by stock photos. Uploading your own photos is not in P0, P1 or P2. Decide before Phase 2 (open question Q1).
3. **Editor:** TipTap with a tightly restricted schema, gated by a 3-day device spike. A plain-text fallback is pre-agreed so a failed spike does not stall the project.
4. **Reorder slightly:** Phase 1 should end with a crude but complete write-to-public-link loop (a walking skeleton), so every later phase improves a working loop and the core question can be tested sooner.
5. **Size:** my bottom-up estimate is about 107 dev-days to the start of the beta, about 120 with a 25% buffer. That is roughly 30 weeks solo or 17 weeks with two developers. A lean path in section 5 removes about 15 to 20 days. This is far from the smallest thing that proves people finish and share, so please look at the cut ladder.
6. **Privacy default:** "unlisted" (link-only) visibility is promoted from P1 to P0. A public profile that lists family-photo books by default is a trust problem for exactly the persona you care about.

> **Revision 2 (proposed, updated after the founder's corrections):** the vision is wider than "writers making books": long-form posts, experiences and reviews, poets, and importing existing writing. Read the next section first. Sections 1 to 6 are still written books-first and are unchanged until you confirm the direction.

---

## Revision 2 (proposed): long-form writing, threads, poets and bringing your old work in

### What you told me

- People already write things out on their WhatsApp Status in **long format**: experiences, reviews and thinking out loud, often a series on one subject. They are not necessarily stories. This writing has no good form for other people to read and no structure of its own.
- **Poets** are core users, alongside story writers.
- Users should be able to **upload everything they have already written**, and we ingest it and populate it on the platform.
- A saved thread of thoughts is a **time capsule**: your ideas about a subject at one point in time.

> **Correction.** An earlier version of this section said Status posts vanish after 24 hours and built the pitch on that. You told me that is not the point, so I removed it and replaced the framing. The problem is presentation and structure, not disappearance.

In one line: **a permanent, well-presented home for everything you write, from a long thought to a finished book.**

### Two shifts this causes

1. **The unit of content is a piece, not a page.** A piece is one self-contained writing of any length and kind: a poem, a story, a post, a review, an experience. A **collection** arranges pieces, either as a **stream** (a thread on a subject, in date order) or as a **book** (paged, with a cover). Each piece can also be published and shared on its own link.
2. **Reading starts as a scroll.** Long text reads well as a reflowable page, and that avoids the fixed-aspect overflow problem from section 3.2 for most content. The paged, page-flip book is the polished stage, reached by "bind into a book".

My recommendation: **piece-first, stream first, book second.** Lead the beta with people who arrive with writing in hand: poets and long-form thinkers. Reasons: it matches what users actually write; imported files turn into pieces naturally; it is cheaper than books-first; and the book work is moved behind the beta, not removed.

### What a piece is

- **Fields:** `kind` (poem, story, post, review, other), optional title, body (the restricted rich text, any length), optional images, optional subject, `origin` (`native` or `imported`, with the original file kept), visibility, its own link, and two dates (next bullet).
- **Two dates.** `posted_at` is when the piece went up here; the system sets it, and it is the main date: it is shown first and orders streams and profiles by default. `written_at` is when the author wrote it: it defaults to now, comes from the source file when imported, and the author can edit it. Where the two differ, the piece shows both ("posted May 2026, written March 2021"). That gap is what shows how someone's thinking changed over time. Store both from day one, since the written date cannot be recovered later. Ordering by written date, or a timeline of thought, is a later nicety, not MVP work.
- **Reviews** are a template with a subject and an optional rating field. Templates are data, so this is cheap (Q3).
- **Time capsule:** both dates are visible on every piece, and edits show an "edited" mark. A thread is living, not frozen, by default (Q4). Later: a timeline ordered by written date, "a month ago" resurfacing, then sealed-until-a-date capsules.
- **Share images:** because text is long, the image is a **quote card**: the title plus an excerpt the author picks (a stanza of a poem, a pulled sentence of prose), in 9:16 and 1:1, made with the same `satori` pipeline as the link preview. The link carries the full text. WhatsApp has no public way to post a Status for someone, so the flow ends in the phone's share sheet, kept to two taps.
- **Capture:** write in the editor; paste; import files (below). Stretch: Android "share to app" through the PWA Web Share Target, which works for installed PWAs on Android Chrome and not on iOS **(verify)**.

### Poets

A poet usually arrives with a back catalogue of tens or hundreds of poems, scattered across Notes, documents and chats. What they need:

- **Faithful poem handling:** line breaks, stanza breaks and indentation preserved on import and on screen; one poem per screen when reading.
- **A library** of all their pieces (search, sort by date, filter by kind) and **multi-select to bundle** poems into a collection, which is a poetry book.
- **Per-poem sharing** with a quote card, and dates on poems, so a collection reads as a record of a period.
- **Import traps that are specific to poetry:** Markdown collapses single line breaks, PDFs lose them, `.docx` keeps them but often fakes indentation with spaces, and a splitter that cuts on blank lines would cut stanzas instead of poems. So splitting is always reviewed by the author (below), never silent.

### Bring your writing (import)

**What the user does:** choose files (or paste), see what we found, fix it, confirm.

1. **Sources.** MVP-lite: pasted text, and several `.txt`, `.md` and `.docx` files at once. Later (see [ROADMAP.md](ROADMAP.md), C): PDF, zip archives, Google Docs, WhatsApp chat exports, exports from other writing sites.
2. **Parse and propose.** One file becomes one or more pieces. Inside a file, split on headings, page breaks and separators such as `***`. Guess the kind with simple rules (poem: short lines and many line breaks; prose: long paragraphs). Suggest a title from a heading or the first line, and a written date from the file or from a date in the text. The posted date is set only when the piece is published. Every guess is editable and deterministic. AI, if used, may only classify or suggest splits, never rewrite.
3. **Review screen**, designed for a phone: "We found 23 pieces". Each row shows title, kind, date and first lines. The user can merge, split, rename, change kind, set the written date or remove, then import all or a selection. Nothing is guessed silently.
4. **Land as private drafts** in the library. Nothing is published automatically. Text is kept verbatim, and the original file is stored with each piece as its source.
5. **Then:** publish one piece at a time, or select pieces and make a collection (a stream or a book).
6. **Large archives** run as an asynchronous job with progress and resume. Limits on file size and count are set at launch.

**Rules and risks:**

- **Ownership.** The user confirms they own what they upload (terms of service). Bulk import is also an easy way to dump other people's copyrighted work onto a profile, so imports are private by default, publishing is the control point, and report and takedown handling from the MVP applies. Near-duplicate detection across accounts is a later option.
- **File safety.** Parse on the server with maintained libraries; never execute content; reject macros, encrypted files and oversized or zip-bomb archives. Uploads go straight to storage with signed URLs rather than through our functions.
- **Private content.** Chat exports can contain other people's messages. That is why chat exports are not in MVP-lite.
- **Quality expectations.** `.txt`, `.md` and `.docx` are reliable. PDFs are best effort, and scanned pages (OCR) are out of scope.
- **Metrics.** Imported pieces are already finished, so they would inflate completion and share rates. Every piece carries `origin`, and metrics are reported separately for native and imported work.

**Why it is worth building early:** it fixes cold start twice. A new user's profile is populated in minutes (the brief's "empty profiles" risk), and the first session delivers value before they write anything ("your five years of poems, looking good, in five minutes"). That is probably the strongest activation hook for poets.

### What changes in the plan

| Area | Change |
|---|---|
| Personas | Add **the thinker** (long-form posts, experiences, reviews, threads on a subject). Poets stay, with import as their main need. |
| Core question | Becomes: do people publish a piece, share it and come back? Book "finished" stays for books. New measures: pieces published, import-to-publish conversion, pieces per writer per week, with native and imported work reported separately. A7 gains definitions for each. |
| Data model | `books` and `pages` (3.3) are replaced as the core by `pieces` and `collections` (`presentation`: `stream` or `book`) with `collection_pieces (collection_id, piece_id, position)`. Pages become a **book-view** idea (pieces paginated or one poem per page). Needs a full rewrite of 3.3 once you confirm. |
| Editor | Pieces are long, so the mobile rich-text risk (R2) applies to every piece, not only books. An earlier line here said a plain textarea would be enough; that is withdrawn. TipTap stays, gated by the spike, with the textarea fallback. |
| Rendering | Reflowable reading is the default. The fixed-aspect page and the page-overflow problem (R6) move to the book view. |
| Templates | Poem, Story, Post and Review as piece templates (themes, typography, prompts); stream and book as collection presentations. |
| Phase 1 walking skeleton | Write a piece, publish it, open its public page with a link preview. |
| Phase 2 | Library, import-lite, quote-card share images, themes. |
| Phase 3 | Collections as streams, profile with the library, share polish, hygiene. |
| After the beta | Book view (pagination, cover generator, page-flip reader), mini-book template, image search, resurfacing. |
| Gates | Gate 1: the editor feels good on iOS and Android with long text. Gate 2: new users publish one piece (written or imported) in under 5 minutes, at least four of five. Gate 3: links and quote cards look right in WhatsApp. |

### Rough effect on effort (back-of-envelope, to be redone once you confirm)

| | Books first (this plan) | Piece-first with import-lite |
|---|---|---|
| Dev-days before the beta | about 94 | about 68 |
| With 25% buffer | about 118 | about 85 |

Piece-first includes the pieces and collections model, editor, autosave, library, public piece and stream pages, quote cards, **import-lite (about 13 dev-days: upload and limits 1.5, parsers 2, splitter and kind detection 2.5, mobile review screen 4, drafts and source storage 1.5, a test set of real samples 1.5)**, auth, profile, landing, analytics, account hygiene and hardening. It leaves out covers, the page-flip reader, pagination, the mini-book template and image search. Those are deferred, about 35 to 40 days.

### New risks

1. **Drift into a portfolio host.** With import, the product starts to look like a writing-hosting site. I have not researched writing and blogging platforms or journaling apps. A one-day competitor scan is worth doing before committing.
2. **Copyright and abuse through bulk import** (rules above).
3. **Import quality.** Poems with fake indentation, PDFs, and ambiguous splitting. Mitigated by the review screen and a test set of real samples from you.
4. **Lower perceived value of raw thoughts.** Presentation quality, quote cards and Gate 3 carry this.
5. **Higher privacy sensitivity.** Default stays link-only, `noindex`, with a clear control on who can see each piece.
6. **No automatic posting to Status.** The loop needs one manual step, so the share flow must be very short.

### Decisions I need from you

1. **Piece-first model:** pieces and collections, stream first, book later (my recommendation), instead of the books-first plan in sections 1 to 6?
2. **Import-lite in the first beta?** I recommend yes (paste and `.txt`, `.md`, `.docx`, with the review screen), and the rest in the roadmap.
3. **Reviews as a template now, or later?** It is cheap, but each template needs design time.
4. **Living or frozen threads?** My default is living, with visible timestamps.
5. **Can you give me 10 to 20 real samples** (poems, a story, a long status post, a review) in `.docx`, `.txt` and `.pdf`, to build and test the importer against?

---

## 1. Understanding and assumptions

### 1.1 The product, in my words

A phone-first web app where a casual writer turns an idea into a finished short book (3 to 30 pages) by following a guided, template-driven flow: pick a template, write page by page, accept image suggestions, pick an auto-generated cover, preview in a page-flip reader, and publish a link that previews well in WhatsApp and similar apps. A simple public profile lists a writer's published books. The writer stays in control: no ghostwriting, and any AI only nudges.

The MVP is an experiment. Its one question is: **do people finish a book and share it?** Everything is judged by that. A beta of 20 to 30 writers answers it. The product has to be valuable to a writer with zero audience, so the shareable link (and later PDF) is the product, and the profile is secondary.

### 1.2 Assumptions

| # | Assumption | Impact if wrong |
|---|---|---|
| A1 | 1 to 2 full-stack developers, managed services only. I have no competing stack preference (this answers your comment in the doc). | Estimates scale; with 2 devs, Phases 2 and 3 parallelise well, Phase 1 does not. |
| A2 | Estimates assume an experienced developer using AI coding assistants. Real-device debugging and design polish are not much faster for that. Accuracy is about ±40% until Phase 1 recalibrates velocity. | Re-estimate at Gate 1. |
| A3 | Someone provides visual design: template themes, cover presets, empty states. If nobody does, a freelancer is needed for roughly 5 to 8 days. | "Beautiful by default" is a core principle and cannot be coded around. |
| A4 | English only at launch. I build with CSS logical properties so right-to-left is not blocked later. Keyword extraction (stop words) is English-specific. | Image suggestions need rework per language. |
| A5 | Guests can read any published book without an account, and can start writing without one (anonymous session, converted on save). | Matches the brief. |
| A6 | One author per book, one live device per draft at a time. Conflicts are rare and handled with a prompt, not merged. | Collaboration is P2 and out of scope. |
| A7 | **"Book started"** = a book exists and its first page has at least 20 characters. **"Book finished"** = the writer taps the Finish step after meeting the template's minimum page count (Poem 1, Story 3, Mini-book 6) with no empty pages. The brief never defines either, and every metric depends on them. | Metrics change meaning. Please confirm. |
| A8 | Pages have a fixed portrait aspect ratio (2:3) on every device. Text and layout scale with the container. | See section 3.2; this is the biggest design decision after the stack. |
| A9 | PWA scope in the MVP is the manifest and icons only (install to home screen). No offline app shell. | Offline editing beyond brief connection drops is out. |
| A10 | Desktop browsers work (responsive) but are not optimised. Phone-sized screens drive every decision. | Matches the brief. |
| A11 | Beta analytics use PostHog; EU/UK users get cookieless or consent-gated tracking **(verify requirements for the actual launch market)**. | Legal work in Phase 3. |
| A12 | Moderation at MVP is a "Report this book" link plus an admin switch to suspend a book or user. No automated moderation. | Any public user-generated content needs at least this. |

### 1.3 Where the brief is vague or conflicts with itself

| # | Issue | My resolution |
|---|---|---|
| C1 | **Persona 3 vs scope.** The memory-keeper "cares most about images" and makes family and trip books, but the only image source is Pexels (the Image entity is `source (Pexels)`). No upload anywhere. | Open question Q1. Default plan: data model is upload-ready (`image.source` enum includes `upload`), upload is not built, and the beta leads with poets and story writers. A 4-day option is priced in Phase 2. |
| C2 | **P0 "publish toggle" vs P1 "unpublish".** A toggle already includes unpublishing. | Unpublish is P0. It is one status change. |
| C3 | **Visibility.** P0 has only public; P1 has public, unlisted, private. Publishing puts the book on a public profile. | `visibility` (private, unlisted, public) exists from day one. The publish sheet offers two choices: "Anyone with the link" (unlisted) and "Show on my profile" (public). Default to unlisted. |
| C4 | **"Under 10 minutes from landing to a shared book"** (Flow A) vs books of up to 30 pages. | Interpret as the happy path for a short poem. Gate 2 is defined as a timed usability test with a short poem (section 5). |
| C5 | **Analytics in P0** but not placed in any phase of the roadmap diagram. Phase 4 needs the funnel, and events cannot be back-filled. | Analytics scaffold in Phase 1, completed in Phase 3. |
| C6 | **Poem template "preserves line breaks and indentation"** but the editor's allowed formatting lists bold, italic, line breaks, headings, not indentation. | Preserve leading spaces with `white-space: pre-wrap` and offer a per-line indent toggle in the poem toolbar. Needs spike confirmation (section 4). |
| C7 | **PWA appears in three places:** installable (NFR), "mobile-first web app" (MVP), "native apps... wrap the web app first, for example as a PWA" (P2). | MVP = manifest and icons. A real service worker and native wrapper are P2. |
| C8 | **Local-first drafts with service-worker queue and background sync.** The Background Sync API is not available in Safari or Firefox **(verify)**, and iOS Safari can evict script-writable storage (including IndexedDB) after about 7 days without use **(verify)**. | IndexedDB is a short-lived write-ahead buffer. The server is the source of truth and we save to it aggressively. No dependence on Background Sync. |
| C9 | **Event entity vs PostHog.** The data model has an `events` table and the stack has PostHog. Two stores drift. | PostHog is the single analytics store, captured client-side and server-side. No `events` table in the MVP. |
| C10 | **"Do not make choices that block print, Kindle, ISBN later"** vs content model unspecified. | Content is stored as structured JSON (not HTML), image licence metadata is stored per image, and pages render through one renderer that can also print. See section 3.9. |
| C11 | **Cover "from the title and the chosen images"** before any image may exist (poems have optional images). | Cover works with title and author only, with a palette and typography preset. The image is optional. |
| C12 | **Phase 2 is overloaded.** It holds Pexels, suggestions, cover generator and all three templates, while Phase 3 holds the reader, sharing and profile. | Resourcing note in section 5: Phase 2 is the largest risk to schedule. The cut ladder starts there. |

---

## 2. Stack recommendation

### 2.1 Final pick

**Next.js (App Router) + TypeScript + Tailwind on Vercel. Supabase (Postgres with row-level security, Auth, Storage). TipTap with a per-template restricted schema, gated by the editor spike. Pexels via a server-side proxy. A custom scroll-snap reader with an optional flip effect. PostHog + Sentry. Resend (or Postmark) as SMTP. Cloudflare Turnstile. `satori` for cover and share-card images.**

Pin framework majors at kickoff (**verify** current stable versions on day one rather than trusting this plan).

### 2.2 Layer by layer

| Layer | Verdict | Final pick and trade-off |
|---|---|---|
| Framework and hosting | **Confirm** | Next.js on Vercel. Server rendering gives link previews and fast first paint on public pages; the React ecosystem helps (TipTap, dnd-kit, react-pageflip). Trade-off: Vercel cost grows with traffic and its hobby plan forbids commercial use **(verify)**; budget for a paid plan before beta. SvelteKit is leaner but the editor, drag-and-drop and reader libraries are weaker. |
| Database, auth, storage | **Confirm, with changes** | Supabase. Postgres with RLS suits books and pages, and moving off it later is realistic because it is plain Postgres. Changes: (a) custom SMTP from day one, since Supabase's default email sender has very low limits and is not meant for production **(verify)**; (b) a paid plan before beta, because free projects can pause after inactivity and lack production backups **(verify)**; (c) pick the region once, near the first audience (Q8). Firebase's document model is a worse fit for relational book/page/image data. |
| Auth flow | **Challenge** | Email **one-time code** (6 digits) plus Google. Not magic links: shared links are opened inside WhatsApp and Instagram in-app browsers, and a magic link then opens in a different browser without the session. Google sign-in is blocked inside embedded webviews **(verify)**, so the email code is the dependable path. Guest drafting uses Supabase **anonymous sign-in**, then links an email identity on save, so drafts have a real user id and RLS from the first keystroke and nothing needs migrating. Abuse control for anonymous users: Turnstile, a cap on books per anonymous user, and a purge of inactive guests. |
| Rich text editor | **Confirm, conditional** | TipTap (ProseMirror), one editor instance per visible page, schema restricted per template. Spike decides (section 4). Fallback: plain textarea with a tiny inline-markup subset. |
| Client state | **Add** | React state and `useReducer` for the editor, TanStack Query for image search. No global store until a need appears. |
| Local drafts | **Challenge** | IndexedDB (`idb`) as a write-ahead buffer written on every change (about 300 ms debounce), server save on a pause (about 1.5 s) with compare-and-set. Drop the service-worker queue and background sync; use `online`, `visibilitychange` and `pagehide` events plus a retry loop. |
| Images | **Confirm, with a decision** | Pexels called only from our server (key stays secret, caching, quota control). Store the reference and credit, not a copy, for the MVP; serve the documented size variants (`large`, `large2x`, `portrait`, `landscape`) directly from Pexels' CDN with `srcset`. Do not push Pexels images through Vercel's image optimiser, since the CDN already serves resized variants and optimiser usage is billed. Mirror chosen images into our own storage at publish time as a P1 hardening step, once Pexels confirms it is acceptable (open question Q4). Unsplash as a second source is out of scope. |
| Reader | **Decide in Phase 3** | Build a scroll-snap reader first (server-renders, accessible, reliable). Evaluate StPageFlip as a time-boxed 1-day add-on for the flip effect. It is MIT licensed and supports touch swipes, but I could not confirm recent maintenance from the repository page (see Appendix A), and its HTML mode clones DOM elements, which can fight with React. Ship the flip only if it passes on real iOS and Android devices. |
| Analytics and errors | **Confirm** | PostHog (funnels, session replay for the beta, feature flags) and Sentry. Fire `page_written` throttled (once per page per session) to avoid event spam. |
| Link-preview images | **Add (not in brief)** | `satori` (JSX to SVG/PNG) generates the cover PNG and a 1200x630 share card at publish time, stored in Supabase Storage. |
| Not in the brief but needed | **Add** | Custom SMTP provider; domain and DNS (SPF, DKIM); Cloudflare Turnstile; rate limiting (Vercel firewall or Upstash); Zod for schema validation; `fractional-indexing` for page order; `dnd-kit` for reordering; GitHub Actions CI; Playwright for end-to-end tests. |

### 2.3 Rough running cost (approximate, **verify current pricing**)

Hosting and Supabase paid plans are each in the region of $20 to $25 per month for the base tier. PostHog and Sentry have free tiers that should cover a 20 to 30 person beta. SMTP and Turnstile are free or near-free at this volume. A domain is about $15 per year. Expect roughly **$50 to $100 per month** during beta, excluding any designer and any real-device testing service. Tell me your ceiling (Q2) and I will tighten this.

### 2.4 Reply to the comment in the brief

Yes, I assumed a solo founder or tiny team on managed services, and Supabase plus Vercel is what I would pick too. The substantive changes are in the table above: anonymous auth for guest drafts, email codes over magic links, and no dependence on Background Sync.

---

## 3. Architecture and data model

### 3.1 Components

```
Phone browser (PWA-capable)                       Visitor (WhatsApp / IG / link)
  Editor, image tray, cover step                    Reader, profile
  IndexedDB write-ahead buffer
        |                                                   |
        +----------------+  Next.js on Vercel  +------------+
                         |  - React UI, route handlers (JSON API)
                         |  - server-rendered public book + profile pages
                         |  - Open Graph metadata, Pexels proxy + cache
                         v
   Supabase Auth     Supabase Postgres      Supabase Storage      Pexels API
   (anon, OTP,       (users, books, pages,  (cover PNGs, share    (search,
    Google)           images, templates)     cards, avatars)       credits)
                         |
                 PostHog, Sentry (client + server)
```

### 3.2 Key design decisions

1. **One renderer, fixed-aspect pages.** Every place a page appears (editor, preview, reader, cover thumbnails, later PDF) uses one `PageView` component. A page is a fixed 2:3 box whose font sizes and spacing use container query units (`cqw`), so a page looks the same on every screen and "preview exactly what a reader sees" is true by construction. Consequence: text can overflow a page. Each template defines a soft capacity (for example a word target) and the editor shows a "page is full, continue on the next page?" action that splits at the caret. This is a visible design decision and listed in open question Q6.
2. **Templates are versioned data.** A template is a JSON spec validated by Zod, stored in the repository and loaded into the `templates` table on deploy. A book pins `(template_id, template_version)`, so editing a template never changes a published book. The editor renders whatever the spec describes (page types, layouts, slots, allowed marks, themes, prompts), so a new template needs no editor change.
3. **Content is structured JSON, not HTML.** A page holds `layout` plus `content` made of named slots: `{ v: 1, slots: { body: <ProseMirror JSON>, heading?: ..., caption?: ..., image?: { imageId, focal: {x, y}, fit } }, unplaced: {...} }`. Changing layout or template re-maps slots by role; anything with no matching slot moves to `unplaced` and is kept, never deleted. That is how "changing the template must not lose content" holds. Tests cover every layout-to-layout pair.
4. **Reader and public pages do not load TipTap.** A small JSON-to-React renderer draws ProseMirror content, so reader bundles stay small.
5. **Covers are satori-safe JSX.** Cover presets use only the CSS subset that `satori` supports (flexbox, absolute positioning, text, background images) at a fixed logical size (600x900), scaled in the browser with CSS transform. The same JSX renders live in the cover step and to PNG on the server, so there is no drift between preview and share card. Pages themselves are not rendered through satori.
6. **Writes go through route handlers, reads through server components.** Autosave must work from `sendBeacon` and `fetch(keepalive)` on page hide, which server actions handle poorly. A stable JSON API also helps a future native wrapper. Owner writes use the user's JWT with RLS (defence in depth), not the service key.
7. **Public reads use a narrow server-only data module.** There is no anonymous SELECT policy on `books` or `pages`. `getPublishedBook(slug)` and `listPublicBooks(handle)` run server-side with the service key. Otherwise unlisted books could be enumerated through the database API.

### 3.3 Data model (sketch, not a migration)

```sql
-- enums
book_status:  draft | published
visibility:   private | unlisted | public
image_source: pexels | upload

profiles   (id uuid pk -> auth.users, handle citext unique null, display_name, bio,
            avatar_url, suspended bool default false, created_at, updated_at)

templates  (id text, version int, spec jsonb, active bool, pk(id, version))

books      (id uuid pk, owner_id -> profiles, template_id, template_version,
            title, tagline, status, visibility default 'unlisted',
            slug text unique null,           -- assigned at first publish: "{title-slug}-{id8}", lookup by id8
            cover jsonb,                     -- {preset, palette, imageId?}
            cover_path, share_card_path,     -- generated PNGs in Storage
            page_count int, finished_at, published_at,
            suspended bool default false, created_at, updated_at, deleted_at)  -- soft delete, purge after 30 days

pages      (id uuid pk, book_id -> books, position text collate "C",  -- fractional index, no renumbering
            layout text, content jsonb, rev int default 0, updated_at)

images     (id uuid pk, source, source_id, unique(source, source_id),
            src jsonb,                       -- documented size variants and URLs
            width, height, avg_color, alt,
            credit_name, credit_url, source_page_url, owner_id null, created_at)

page_images(page_id -> pages, image_id -> images)  -- referential integrity, powers the auto credits page

reports    (id, book_id, reporter_id null, reason, created_at)
```

- **Order:** fractional indexing so reorder touches one row.
- **Concurrency:** saves are `UPDATE pages SET content = $c, rev = rev + 1 WHERE id = $id AND rev = $base RETURNING rev`. A miss returns 409 and the client shows one non-blocking prompt: keep this version or load the other.
- **No Event table** (C9). **No payments or plan fields yet.**
- **RLS:** owners have full access to their own rows; there is no anonymous access to books, pages or images (decision 7 above). `images` is readable by any signed-in user and writable only via the server.

### 3.4 API routes

Pages and app screens:

| Route | Rendering | Purpose |
|---|---|---|
| `/` | static + example book | Landing, "Make your first book" |
| `/new` | client | Template picker with live previews |
| `/books` | server, auth | "My books": drafts by progress |
| `/books/[id]/edit?p=n` | client | Page editor |
| `/books/[id]/cover` | client | Cover step |
| `/books/[id]/preview` | client | Reader preview |
| `/books/[id]/publish` | client | Visibility and share |
| `/b/[slug]` | ISR, on-demand revalidate | Public book, Open Graph tags |
| `/@[handle]` | ISR, on-demand revalidate | Public profile |

JSON API (route handlers):

| Method and path | Notes |
|---|---|
| `POST /api/books` | `{templateId}`: creates book and starter pages from the template |
| `PATCH /api/books/:id` | Title, tagline, cover, template or theme switch |
| `DELETE /api/books/:id`, `POST /api/books/:id/duplicate` | Soft delete, copy |
| `POST /api/books/:id/pages`, `DELETE /api/pages/:id`, `POST /api/books/:id/pages/reorder` | Page lifecycle |
| `PATCH /api/pages/:id` | `{content, layout, baseRev}` returns `{rev}` or 409. Validated against the template spec. Size limit per page. |
| `GET /api/images/search?q=&page=` | Pexels proxy: cached, quota-guarded |
| `POST /api/images/suggest` | `{keywords: string[]}` normalised server-side, cached by keyword set |
| `POST /api/pages/:id/images` | `{pexelsId}` upserts the `images` row and attaches it |
| `POST /api/books/:id/publish`, `POST /api/books/:id/unpublish` | Assigns slug, renders cover and share card, revalidates tags |
| `GET/PATCH/DELETE /api/me`, `GET /api/me/export` | Profile, account deletion, data export |
| `POST /api/reports` | Report a book |

### 3.5 How images work

1. **Search and suggest.** The client sends keywords, not full page text (smaller payload, better privacy). The server normalises them (lowercase, top 3 terms, sorted), checks a cache (24 h), and only then calls Pexels. Cache hits do not count against Pexels limits.
2. **Quota.** Pexels defaults to 200 requests per hour and 20,000 per month, and offers unlimited free use if its attribution terms are met. At roughly 30 concurrent writers the hourly cap is reachable, so the request for higher limits goes out in week 1 (Appendix A).
3. **Insert.** One tap upserts an `images` row (deduplicated on source and id) and attaches it to the page. The row stores photographer name and link, photo page URL, dimensions and average colour.
4. **Credits.** Pexels' API terms ask for a prominent link to Pexels, and photographer credit where feasible. Its licence says attribution is optional. These differ, so we follow the stricter one: every published book gets an auto-generated, non-editable final "Image credits" page listing photographers with a "Photos provided by Pexels" link.
5. **Serving.** `srcset` over the documented variants, lazy loading, `avg_color` as placeholder. Broken-image fallback shows the colour block and the credit.
6. **Later:** mirroring chosen images to our storage (P1, needed anyway for PDF export), and uploads (Q1).

### 3.6 How sharing works

1. **Publish** assigns the slug (`my-poems-k3x9q2`, looked up by the trailing id so renames never break links), renders the cover PNG and a 1200x630 share card with `satori`, stores both, and revalidates `/b/[slug]` and the author's profile.
2. **Public page** is server-rendered with `og:title`, `og:description` (the one-line idea), `og:image` (the share card) and Twitter `summary_large_image`. Non-public or missing books return 404, not 403, so existence is not leaked. Default `noindex` for books and profiles until we choose otherwise (Q6).
3. **Share sheet** uses the Web Share API where available and falls back to copy-link and direct WhatsApp deep links. In-app browsers may not expose `navigator.share` or the clipboard API, so the fallback is tested, not assumed.
4. **Preview reliability.** Keep share-card images small (commonly cited as under about 300 KB for WhatsApp **(verify)**). WhatsApp and others cache previews hard, so a share URL can carry a version query parameter when a cover changes. Gate 3 is a test across WhatsApp, iMessage, Telegram, Instagram DMs, X and Facebook's debugger.
5. **Instrumentation.** `link_opened` is logged server-side with bot filtering. "Link shared" is share intent (share sheet opened or copy tapped); the platform cannot tell us it was actually sent.

### 3.7 Cross-cutting

| Area | Approach |
|---|---|
| Environments | Local (Supabase CLI), preview (per PR), production. Separate Supabase projects for dev and prod. |
| Performance budgets | Editor route interactive under 3 s on a mid-range Android over throttled 4G (brief). Proposed JS budget for the editor route: 180 KB gzipped **(a target to measure, not a known fact)**. Lighthouse CI on public pages. |
| Testing | Unit tests for template validation and slot re-mapping; integration tests for autosave compare-and-set; Playwright mobile-emulation flows for Flow A; manual real-device runs per gate. |
| Security | RLS on all owner tables, Zod validation on every write, content size limits, rate limits on search and publish, Turnstile on anonymous session creation, secrets in env only. |
| Privacy | Account deletion and data export are P0 in the NFRs and scheduled in Phase 3. Strip location data if uploads are ever added. |
| Accessibility | WCAG 2.1 AA target. Reader keyboard navigation, `aria-live` for saved state, reduced-motion respected. Checked with VoiceOver and TalkBack in Phase 3. |
| Observability | Sentry from day one; PostHog funnels per Flow A step from Phase 1. |

### 3.8 Keyboard and viewport handling (editor-critical)

The image tray must sit above the on-screen keyboard and the formatting toolbar must not jump. Chromium supports `interactive-widget=resizes-content` in the viewport meta tag, Safari does not **(verify)**, so the layout is driven by `window.visualViewport` with `position: fixed` bars computed from its height and offset. This is the first thing the spike measures.

### 3.9 Not blocking later work

| Later goal | What we do now so it stays possible |
|---|---|
| PDF export, print-on-demand | Fixed-aspect pages in one renderer that can print with print CSS; per-image licence metadata and original-resolution URLs stored; fonts self-hosted under open licences. |
| EPUB | Content is structured JSON, convertible to reflowable XHTML. |
| Monetisation | We own the user table and keep it plan-agnostic; no Stripe-shaped choices needed yet. |
| Native apps | Stable JSON API and session handling that works with a wrapper. |
| Social layer | Handles, profile pages, `visibility` and slug scheme exist already. |
| Interest feed ([ROADMAP.md](ROADMAP.md), A) | Public, link-only and private visibility from day one, so feed eligibility is a flag; report link and suspend switch; reader-side analytics events (opened, read-through). |
| AI polish and illustration ([ROADMAP.md](ROADMAP.md), B) | Author text lives only in the author's slots and the system never rewrites it; stable ids per entry and page; `images.source` stays an extensible enum; generated originals would live in our own storage; a reusable async job pattern. |
| Engagement and creator tools ([ROADMAP.md](ROADMAP.md), E) | Signed-in readers from Phase 1; reader events (opened, read to the end) with bot filtering and `origin` (native or imported) so imported text never counts as writing; report, hide and suspend tools; Supabase Storage already in the stack for audio. |
| Dream mode and close-friends sharing ([ROADMAP.md](ROADMAP.md), D) | Piece `kind` and `visibility` are extensible types (add `dream` and `friends` later without migrating rows); private is a real, tested visibility with RLS from day one; no friends tables yet. |

---

## 4. Editor decision

### 4.1 Options

| Option | For | Against |
|---|---|---|
| **A. TipTap (ProseMirror), restricted schema, one editor per page** | Proven; schema can forbid everything outside the template; undo/redo and paste handling included | contenteditable on mobile: autocorrect and IME composition, caret jumps, selection handles, keyboard resizing. The brief's top risk. |
| B. Plain `<textarea>` per text slot, inline marks as a tiny markup (`*italic*`, `**bold**`) | Native mobile typing, no caret bugs, tiny bundle, `pre-wrap` makes poems trivial | No live bold or italic; undo and formatting UX is rougher; looks less polished |
| C. Lexical | Modern, good performance | Smaller ecosystem for restricted schemas; mobile record not clearly better. No reason to switch |
| D. Custom contenteditable | Total control | Reinvents A's bugs. Reject |

### 4.2 Recommendation

**Go with A**, but treat it as a hypothesis the spike must pass. If it fails the gate, switch to **B** for Phase 1 and keep the rest of the plan intact. Content is stored in the same slot structure either way, so the fallback changes only the editing component and the marks stored.

### 4.3 The spike (3 days, time-boxed, first thing in Phase 1)

**Build:** one page, one text slot, one image slot, a swipe between two pages, autosave to a stub endpoint, a toolbar above the keyboard, and the same page implemented with option B for comparison.

**Devices (real hardware, not just emulators):** current and previous iOS Safari; Android Chrome with Gboard; a Samsung phone with Samsung Keyboard and Samsung Internet; at least one low or mid-range Android. Use a device-testing service for gaps only.

**Scenarios:**

1. Type 300 words with autocorrect and predictive text on; dictate a paragraph.
2. Long-press selection, handles, bold and italic from the toolbar.
3. Poem: line breaks, indent a line, preserve leading spaces.
4. Paste from Notes and from a web page (formatting stripped to the schema).
5. Undo and redo after autocorrect.
6. Swipe between pages with the keyboard open, no loss, no flicker.
7. Open the image tray above the keyboard while the caret stays visible.
8. Autosave firing mid-typing, caret must not move.
9. Go offline, type, come back online, content syncs.
10. Rotate, background the tab and return.

**Pass criteria for Gate 1** (all must hold on every device):

- No lost characters and no caret jumps in three 5-minute typing sessions per device.
- Toolbar and tray stay attached to the keyboard within one frame or so of it appearing, with no layout jumps.
- Typing latency feels instant on the mid-range Android (target p95 under 50 ms **to be measured**).
- Editor route meets the JS budget and interactive-time target in 3.7.

**Output:** a one-page spike report with the pass or fail per scenario per device, the chosen option, and known quirks with workarounds. Recalibrate the Phase 1 to 3 estimates from observed velocity.

---

## 5. Milestone plan

The four phases and three gates are the brief's. Changes I propose:

- **Phase 1 ends with a walking skeleton:** write, publish, and open a plain public page on the poem template. No flip, no polished preview, no profile. Every later phase then improves a loop that already works.
- **Analytics, auth hygiene and recruiting start earlier** than the roadmap shows.
- **Lead-time items start in week 1,** before they block anyone (see 5.6).

### 5.1 Summary

| Phase | Effort (dev-days) | With 25% buffer | Calendar, solo (about 4 effective days/week) | Calendar, 2 devs (about 7 effective days/week) | Gate at end |
|---|---|---|---|---|---|
| 1. Foundation | 31.5 | 39 | about 10 weeks | about 5.5 weeks | Gate 1: editor feels good on iOS and Android |
| 2. Look and feel | 30 | 37.5 | about 9.5 weeks | about 5.5 weeks | Gate 2: a short book can be finished in under 10 minutes |
| 3. Share and read | 33 | 41 | about 10 weeks | about 6 weeks | Gate 3: shared links preview well in chat apps |
| 4. Private beta | about 13 | n/a | 4+ weeks calendar | 4+ weeks calendar | Decision memo |
| **Total** | **about 107** | **about 120 before beta** | **about 30 weeks + beta** | **about 17 weeks + beta** | |

Estimates are rough (±40%) and will be recalibrated at Gate 1.

### 5.2 Phase 1: Foundation (31.5 days)

| ID | Task | Effort | Depends on |
|---|---|---|---|
| 1.1 | Repo, CI, preview deploys, Supabase dev and prod, Sentry and PostHog wiring, domain and SMTP DNS | 2.5 | none |
| 1.2 | **Editor spike** and Gate 1 report (section 4) | 3 | 1.1 |
| 1.3 | Schema v1, migrations, RLS policies, seed data, typed client | 2.5 | 1.1 |
| 1.4 | Auth: anonymous session, email code, Google, identity linking, SSR session, profile bootstrap | 3.5 | 1.3 |
| 1.5 | Template spec (Zod), Poem template, `PageView` renderer with `cqw` and themes | 3 | 1.2 |
| 1.6 | Books: create from template, "My books", rename, soft delete, duplicate | 3 | 1.3, 1.4, 1.5 |
| 1.7 | Editor shell: swipe and page strip, add, remove, reorder, progress, keyboard-safe layout, formatting toolbar | 5 | 1.2, 1.5 |
| 1.8 | Autosave pipeline: IndexedDB buffer, compare-and-set save, retry and backoff, "Saved" indicator, flush on page hide, conflict prompt | 4 | 1.3, 1.7 |
| 1.9 | Undo and redo, paste sanitising | 1 | 1.7 |
| 1.10 | Walking-skeleton publish: toggle, `/b/[slug]` crude public page, unpublish | 2.5 | 1.6, 1.8 |
| 1.11 | Typed analytics scaffold and the first events (book started, page written) | 1.5 | 1.1 |

**Definition of done:** Gate 1 passes on the device matrix (spike report plus real-device re-check of the built editor); a new guest can pick Poem, write three pages, sign up on save, publish, and open the link in another browser; killing the network mid-typing loses nothing; Sentry and PostHog receive events from preview and production.

**Cut ladder, in order:** duplicate book (1 day), Google sign-in (0.5), drag-reorder in favour of move up and down buttons (1), undo and redo UI (use native).

### 5.3 Phase 2: Look and feel (30 days, plus 4 if uploads are approved)

| ID | Task | Effort | Depends on |
|---|---|---|---|
| 2.1 | Pexels proxy, cache, quota guard, attribution capture, `images` upsert | 3 | 1.3, Pexels limit request |
| 2.2 | Image picker sheet: search, insert, replace, remove, credit | 3 | 2.1, 1.7 |
| 2.3 | Keyword extraction, debounce, suggestion tray above the keyboard, relevance evaluation on 50 sample pages | 4 | 2.1, 1.7 |
| 2.4 | Short-story template: spec, layouts, prompts, themes, chapter headings | 3 | 1.5 |
| 2.5 | Illustrated mini-book template: three image layouts, captions, themes | 4 | 1.5, 2.2 |
| 2.6 | Poem polish: themes, indentation, optional background image | 1.5 | 1.5, 2.2 |
| 2.7 | Layout and template switching with slot re-mapping and the no-loss guarantee, with tests | 3 | 1.5, 2.4, 2.5 |
| 2.8 | Cover generator: 4 to 6 satori-safe presets, palettes, cover step UI | 5 | 1.5 |
| 2.9 | Writing-prompts drawer and "page full, continue on next page" | 3 | 1.7 |
| 2.10 | Finish step, "book finished" definition (A7), progress and celebration states | 1.5 | 1.8 |
| 2.X | *Optional, decision needed (Q1):* upload own images with client-side resize, EXIF and location stripping, size limits, Storage policies | 4 | 1.3 |

**Definition of done (Gate 2):** a timed usability test with five people who have not seen the product: each makes a 3-page poem book with one image and a cover, unaided, with at least four of five finishing within 10 minutes of active time. The image tray shows a relevant suggestion for most test pages (measured on the 50-page sample, with the acceptance threshold agreed up front). Switching template or theme loses no content (automated test).

**Cut ladder, in order:** reduce cover presets from 6 to 4 (1 day); ship the mini-book template after the beta starts and run the beta on poem and story only (4 days); ship manual image search first and put suggestions behind a flag (4 days). This last cut hurts the differentiator, so it is last.

### 5.4 Phase 3: Share and read (33 days)

| ID | Task | Effort | Depends on |
|---|---|---|---|
| 3.1 | Reader: scroll-snap, keyboard and screen-reader support, server-rendered first page, time-boxed StPageFlip evaluation | 5 | 1.5 |
| 3.2 | Public book route: ISR with on-demand revalidation, `noindex`, 404 rules, auto credits page | 3 | 1.10, 3.1 |
| 3.3 | Publish flow: visibility choice, celebration, Web Share and copy-link fallback | 3 | 1.10 |
| 3.4 | Cover PNG and 1200x630 share card with satori at publish, invalidation on change | 3 | 2.8 |
| 3.5 | Link-preview test matrix and fixes (Gate 3) | 1.5 | 3.2, 3.4 |
| 3.6 | Profile: handle, name, bio, generated avatar, `/@handle` page, empty state | 4 | 1.4 |
| 3.7 | Landing page with a seeded example book; end-of-book "make your own" CTA with a `ref` parameter (Flow D) | 3 | 3.1 |
| 3.8 | Analytics completion: `link_opened` with bot filtering, share intent, funnels and dashboards | 2.5 | 1.11 |
| 3.9 | Account hygiene: delete, data export, terms and privacy pages, report link, admin suspend | 4 | 1.4 |
| 3.10 | Hardening: Turnstile and rate limits, accessibility pass on real screen readers, Lighthouse CI budgets, PWA manifest and icons | 4 | all |

**Definition of done (Gate 3):** published links render the right title and cover in WhatsApp, iMessage, Telegram, Instagram DMs, X and Facebook's debugger; a signed-out visitor can open a link on a phone, read to the end and reach "make your own"; unpublished and suspended books return 404; delete and export work end to end.

**Cut ladder, in order:** ship the scroll-snap reader without the flip effect (about 3 days); real avatar upload stays out; reduce hardening to the security items (1.5 days); landing page uses a plain seeded book (1 day).

### 5.5 Phase 4: Private beta (about 13 days of engineering, 4+ weeks calendar)

| ID | Task | Effort |
|---|---|---|
| 4.1 | Beta tooling: feedback form, session replay on, seeded example books and profiles to counter an empty profile layer | 3 |
| 4.2 | Bug-fix and polish reserve, driven by real-device sessions and replays | 8 |
| 4.3 | Analysis and decision memo | 2 |

**Calendar:** a cohort of 20 to 30 writers, at least two weeks of onboarding and writing, then a 7-day window for return rate, then analysis.

**Definition of done:** funnel per Flow A step and the five brief metrics (below) reported for the cohort; five or more recorded writer sessions reviewed; a written go, iterate or stop recommendation.

**Cut or extend:** if completion is low, do not add features; fix the step with the largest drop-off first and re-run. If the beta cohort is too small, extend the window instead of widening scope.

### 5.6 Lead-time items to start now (they block people, not code)

| Item | Why it cannot wait | Owner |
|---|---|---|
| Request higher Pexels API limits, and ask whether copying chosen images into our storage is acceptable (Q4) | Default is 200 requests per hour and 20,000 per month; approval needs a demo showing attribution | Founder, with a demo from Phase 2 |
| Domain, SMTP provider, SPF and DKIM | Email codes are the main login path | Founder or developer |
| Google OAuth consent screen; privacy policy and terms URLs | Production use needs published policies **(verify)** | Founder |
| Real test devices, including at least one low-end Android | Gate 1 is defined by them | Founder |
| Beta recruitment (20 to 30 writers) | Recruiting starts during Phase 2, not Phase 4 | Founder |
| Designer, if A3 is not covered | Templates and covers gate Phase 2 | Founder |

### 5.7 Lean path (if you want the smallest version)

Cut ladders applied together remove roughly **15 to 20 days**: reader without flip, four cover presets, beta on poem and story only, suggestions flagged on after manual search ships, duplicate and Google sign-in deferred, minimal hardening. The product still answers the core question. I would take this path unless the beta must include the illustrated mini-book.

### 5.8 Success metrics and instrumentation

The brief asked me to refine the proposed metrics. Definitions come first; targets come after the first cohort, as the brief says.

| Metric | Precise definition | Events needed |
|---|---|---|
| Completion rate | Books finished within 7 days of starting ÷ books started (A7), per writer's first book | `book_started`, `book_finished` |
| Time to first finished book | Median and p75 of active editing time (heartbeat while the editor is focused) from the first `book_started` to the first `book_published` | `editor_heartbeat` |
| Share rate | Two parts: finished ÷ published, and published ÷ share intent | `book_published`, `link_shared` (intent) |
| Reader conversion | Unique non-owner, non-bot opens of a shared link that lead to a `book_started` within 7 days, joined by the `ref` parameter | `link_opened`, `book_started` with `ref` |
| Return rate | Writers with a `page_written` on a calendar day other than their first, within 7 days | `page_written` |

**Guardrails** to watch alongside: data-loss incidents (target zero), save failure rate, editor interactive-time p75, image suggestion acceptance rate (shown to inserted), and drop-off per Flow A step.

**Honest limit:** with 20 to 30 writers, a difference between 35% and 50% completion is not statistically meaningful. Treat the beta as a funnel and qualitative diagnosis (drop-off per step, session replays, interviews), and avoid hard pass/fail numbers until a larger cohort exists. I suggest setting the numeric targets after reading the first cohort's funnel.

---

## 6. Risks and open questions

### 6.1 Risks, ordered by how much they could change the plan

| # | Risk | Effect on the plan | Mitigation in the plan |
|---|---|---|---|
| R1 | **Persona 3 cannot be served without own photos** (C1, Q1) | Adds about 4 days plus a legal and moderation surface, or drops a persona from the beta | Decision before Phase 2; data model upload-ready |
| R2 | **Mobile editor fails the spike** | Fallback B reduces rich text and adds polish work | Spike first, fallback agreed in advance |
| R3 | **Scope and time are larger than a solo founder expects** (about 107 to 120 days) | Needs the lean path or a second developer | Cut ladders, walking skeleton, recalibration at Gate 1 |
| R4 | **No designer** (A3) | Templates and covers look generic, and "beautiful by default" fails | Curated open-licence fonts and palettes; budget a freelancer |
| R5 | **Pexels terms and limits.** Default cap is 200 requests per hour; attribution rules differ between the API terms (prominent link) and the licence (optional); storing copies not confirmed | Could force caching, a mirror, or a second source | Cache, auto credits page, ask Pexels early (Q4) |
| R6 | **Fixed-aspect pages and overflow** (decision 3.2.1) | Changes template design and editor UX | "Page is full, continue" split action; decide in Q6 |
| R7 | **In-app browser quirks** (WhatsApp, Instagram): Google sign-in blocked, missing Web Share or clipboard APIs, no shared session with the default browser | Auth and share flows | Email codes, tested fallbacks, Gate 3 matrix |
| R8 | **iOS storage eviction** weakens "local-first" | Drafts must reach the server quickly | Server is source of truth; aggressive save |
| R9 | **Public user content with no moderation** | Abuse, takedown requests, store-policy trouble later | Report link, suspend switch, noindex default, terms |
| R10 | **Cold-start on profiles** (brief) | Empty profile layer | Link and PDF first; seeded example profiles in beta |
| R11 | **Image suggestion quality** (brief) | Gimmicky feature | Simple extraction, measured acceptance rate, flag-gated |
| R12 | **Flip library maintenance** | Reader polish | Scroll-snap base; flip only if it passes on devices |
| R13 | **Beta recruitment** | Too few writers to learn anything | Start in Phase 2; one tight community first |

### 6.2 Open questions, ordered by impact, with the default I will use if you do not answer

| # | Question | Default |
|---|---|---|
| Q1 | **Do users upload their own photos in the MVP?** The memory-keeper persona depends on it. Uploading adds storage, location-data stripping, moderation and abuse handling. | Not in the MVP. Lead the beta with poems and stories. Revisit at the start of Phase 2. |
| Q2 | **Team and timeline:** solo or two developers, and a launch date? **Budget ceiling** for hosting and services for the first 6 months? | Solo-capable plan with the lean path; about $50 to $100 per month. |
| Q3 | **Who does visual design,** and what is the budget? | Developer implements curated open-licence fonts and palettes; flag a freelancer if the Gate 2 test says the output looks plain. |
| Q4 | **May we contact Pexels** to request higher API limits and to confirm that copying chosen images into our storage is acceptable? Whose email and demo? | Start with reference-only storage and an auto credits page; contact Pexels once Phase 2 has a demo. |
| Q5 | **Which first test audience?** Poets, students, a specific community, and how recruited? The brief lists this; it should be answered during Phase 2. | One community that writes short pieces on phones. Poems first, because they are the fastest to finish and most directly test the core question. |
| Q6 | **Default privacy and indexing.** Is link-only the default, and may published books be indexed by search engines? | Default to "anyone with the link", `noindex`. Public profile listing is opt-in at publish time. |
| Q7 | **What does "finished" mean?** (A7) | The definition in A7. |
| Q8 | **Where are the first users?** This decides the Supabase and Vercel region, how much to optimise for low-end Android and slow networks, whether WhatsApp is the primary share channel, and language. | Region closest to the stated audience; English only; WhatsApp-first sharing. |
| Q9 | **Page overflow behaviour.** Are fixed-size pages with a "continue on next page" split acceptable? | Yes, per decision 3.2.1. |
| Q10 | **Languages and right-to-left** (from the brief) | English only; logical CSS properties so RTL is not blocked. |
| Q11 | **PWA vs native** (from the brief) | PWA manifest only in the MVP; native is P2. |
| Q12 | **Guests reading without an account** (from the brief) | Yes. |
| Q13 | **Reader: custom build or library?** (from the brief) | Custom scroll-snap reader; flip library only if it passes on devices in Phase 3. |
| Q14 | **Poem indentation:** is a per-line indent toggle plus preserved spaces enough? | Yes (C6). |

### 6.3 What I need from you to finalise

Answers to Q1, Q2, Q3 and Q8 change scope, schedule or cost; the rest have defaults I can proceed on. Once you approve (or amend) this plan, I will start with tasks 1.1 to 1.3 and the editor spike, and will not write production code before that.

---

## Appendix A: sources checked

Retrieved on 2026-10-12.

- Pexels API documentation: <https://www.pexels.com/api/documentation/> (default 200 requests per hour and 20,000 per month; higher limits on request; prominent link to Pexels required; photographer credit where feasible; eight image size variants; no documented caching or storage restriction; cannot replicate Pexels' core functionality).
- Pexels licence: <https://www.pexels.com/license/> (attribution optional; use in books and print allowed; redistribution on competing stock platforms and sale of unmodified copies not allowed).
- StPageFlip: <https://github.com/Nodlik/StPageFlip> (MIT; 97 commits, 885 stars, 43 open issues as shown; touch swipe support; React wrapper `react-pageflip`; last-commit date not visible in the page text I retrieved, so maintenance status is unconfirmed).

Everything tagged **(verify)** in this plan comes from my own background knowledge and was not checked today. Re-check it before depending on it, particularly vendor pricing and plan limits, Safari storage eviction, Background Sync support, `interactive-widget` support, Google OAuth in embedded webviews, and WhatsApp preview image limits.
