# ROADMAP.md: backlog and candidate features

**Status:** A living backlog, not a locked plan. There is deliberately **no hard line** between this file and the MVP in [PLAN.md](PLAN.md): items here may move into the MVP, and MVP items may move here, once the MVP contents are decided. The "Placement" column is a tentative guess, not a commitment. Entries stay short on purpose; detail is written when an item is about to be built.
**Date:** 2026-10-12
**Purpose:** One place for features the founder wants on the roadmap, so they are not lost and so the MVP does not make choices that block them. Sizes are rough guesses and labelled as such. Anything tagged **(verify)** comes from my background knowledge and was not checked today.

## The rule these features must respect

The brief says the writer stays in control: no auto-generated books, and any AI is optional and clearly a suggestion. The founder confirmed on 2026-10-12 what that means for the AI features below:

- **AI does not write.** It does not draft, extend or rewrite the author's text, plot or dialogue.
- **AI assists polishing and visualisation.** It cleans up and illustrates what the author wrote, so readers are drawn into the author's mind and world.
- **The author directs.** AI proposes, the author approves, and nothing is published automatically.

## At a glance

| # | Feature | In one line | Depends on | Earliest trigger | Rough size (guess) | Placement (tentative) |
|---|---|---|---|---|---|---|
| A | **Interest feed** ("Discover") | Readers see public books and threads matched to their interests | Public content in volume, topics, moderation tooling, read analytics | Beta shows people publish and share; enough public content that a new reader's first feed is not empty | v1: 25 to 35 dev-days | Later |
| B1 | **AI polish** (suggestions only) | Spelling, clarity, rhythm, shown as accept or reject suggestions | Stable text model, suggestion layer | Beta shows people finish and publish | 8 to 12 dev-days | Later, cheap enough to move up |
| B2 | **AI illustrate a page or entry** | One-tap illustration for one page or entry, in a chosen style | Image provider, own image storage, provenance fields, moderation | B1 shipped or strong demand for visuals | 15 to 20 dev-days | Later |
| B3 | **AI auto mode: comic or illustrated story** | Take a whole rough draft to a storyboard, then illustrate it as a comic or picture-book | B2, binding pieces into a book, comic layout templates, async jobs, cost metering | A consistency prototype passes on real beta drafts | 35 to 50 dev-days | Later |
| C | **Full ingestion** (beyond import-lite) | Bring in PDFs, zip archives, Google Docs, WhatsApp chat exports and exports from other writing sites | Import-lite from [PLAN.md](PLAN.md) Revision 2, async job runner | Beta writers use import-lite and ask for other sources | Each source 4 to 12 dev-days | Import-lite is in the plan; the rest later |
| D | **Dream mode** | A dream journal: write down what you dreamt, private by default, optionally shared with close friends only | D1: a piece kind and private visibility. D2: a friends layer and signed-in readers | D1: beta writers ask for private journaling. D2: the friends layer exists | D1: 5 to 8 dev-days. D2: 15 to 25 dev-days | D1 could move up; D2 later |
| E1 | **Creator analytics** | Views, unique readers, read-through and where readers came from, per piece | Reader events already planned (opened, read-through), bot filtering | Writers ask "did anyone read it?" | Basic counts: 3 to 5 dev-days. Full dashboard: 8 to 12 | Basic counts are a strong MVP candidate |
| E2 | **Likes** | One-tap like with a count | Signed-in readers | Readers exist beyond friends | 2 to 3 dev-days | Could move into the MVP |
| E3 | **Public comments** | Readers comment on a piece; the author can hide or delete | Signed-in readers, moderation tools, notifications | Likes work and moderation capacity exists | 10 to 15 dev-days | Later |
| E4 | **Audio on a piece** | The author's voice note at the end, or a reading of the piece | Browser recording, storage, playback on all browsers | Poets and thinkers ask for voice | 10 to 15 dev-days | Later |
| E5 | **Badges and weekly stats** | Milestones and streaks for writing and reading | Read-through and native-writing events | Habit data from the beta | 8 to 12 dev-days | Could move into the MVP |
| E6 | **Leaderboards** | Optional ranking by writing or reading | E5, enough active users | E5 shows people care | 6 to 10 dev-days | Later |

Feed and AI are independent. My suggested order, to be settled from beta data: B1, then B2, then A, then B3. Reason: visuals raise the quality of public content, and a feed needs enough good public content to be worth opening. **Dream mode** splits in two: D1 (a private dream journal) is small and can slot in anywhere after the MVP; D2 (sharing with close friends) needs a friends layer that the feed and any followers feature would also use, so plan those together. **Engagement (E)** items are small to medium and mostly independent; E1 and E2 are the cheapest and the best candidates to move into the MVP.

---

## A. Interest-based feed

### The idea

A user has a feed of content based on their interests. A reader who follows no one still finds something worth reading, and a writer with no audience can be found. This is the planned answer to the brief's cold-start risk ("empty profiles and no audience"), and it is listed in the brief as P2 (followers, discovery feed, likes and comments).

### Why it waits

A feed with little content, no moderation and no reader analytics is worse than none. The MVP first has to prove people write, publish and share.

### Scope sketch for v1

- **Interests:** a curated list of topics (roughly 30 to 50), chosen by the reader at onboarding. Writers tag a publish with up to three topics. No free-form hashtags at first. Optional later: AI-suggested topic tags, which classify the content and never change it.
- **Eligible content:** only items the author published as **public** (not link-only). Raw-thought threads are eligible only if the author opts in at publish time.
- **Ranking:** simple and explainable. Topic match, recency, and a quality floor from read-through and report rate. No machine-learned recommender in v1. Each item can show "why am I seeing this".
- **Surfaces:** a Discover tab, "more from this author" at the end of a book or thread, and a "because you read" strip.
- **Not in v1:** likes, comments, reader messaging, followers (these stay P2 in the brief).

### Prerequisites (must exist first)

1. Enough public content that a new reader's first feed is not empty. Set the threshold from beta data.
2. Moderation beyond the MVP's report link and suspend switch: a review queue, takedown handling and a written content policy, because a feed amplifies content.
3. Topics stored on content and reader interests stored per user.
4. Reader-side analytics: opened, pages or entries read, read to the end.
5. Spam and abuse controls on publishing.

### Data and infrastructure sketch

- Tables: `topics`, `book_topics`, `user_interests`, and a reads log (PostHog events at first).
- Feed query on Postgres, with precomputed candidate lists per topic. No separate recommender service.
- Later: embeddings in Postgres (the `pgvector` extension, which Supabase offers **(verify)**) for "similar to this" once there is enough content.

### How we measure it

Share of public items that get at least one read from someone outside the author's own circle (the cold-start fix); feed-driven opens; reader-to-writer conversion; reader 7-day return; reports per thousand views.

### Risks

- **Cold start:** too little public content, because the MVP defaults to link-only.
- **Privacy regret:** thoughts become discoverable by strangers. Keep opt-in per publish and be clear about who can see what.
- **Moderation load** grows with the feed.
- **Distraction:** a feed can pull attention away from writing, which is the core loop. Keep it on the reader side.

### Cheap steps in the MVP that keep this possible

- Public, link-only and private visibility from day one (already in the plan), so feed eligibility is a flag that already exists.
- Report link and suspend switch (already in the plan).
- A subject on every thread and a tagline on every book, which later seed topic suggestions.
- PostHog events for opened and read-through (Phase 3 analytics), so reader signals exist before the feed does.

---

## B. AI assist: polish and visualise (never write)

### The vision, in the founder's words

Take your entire rough draft and illustrate it fully, as a comic or a fuller illustrated story, so other readers are drawn into your mind and your world. The AI helps polish and visualise. It does not write.

### Contract with the author

1. **The author's words stay.** Captions, speech bubbles and text blocks use the author's text verbatim unless the author accepts a suggested edit.
2. **Polish is suggestion only.** Spelling, grammar, clarity, tightening that keeps the author's voice, and line-break rhythm for poems. Each suggestion is shown as a diff and accepted or rejected one at a time. There is no "rewrite it all" button, and the AI never adds new sentences, plot points or dialogue.
3. **AI visuals are labelled.** Each generated image carries a visible "made with AI" mark, and the book shows an "illustrated with AI" credit. Provenance is stored with every image.
4. **The author is the director.** Auto mode goes from draft to a **storyboard** with one tap, and the author edits and approves it before anything is rendered. Nothing is published automatically.
5. **Reversible.** The author can turn AI visuals off and get back the plain-text version with the original words intact. The raw text stays as the "time capsule" original, and the AI layer sits on top of it.

> **Reading of "fuller story"** (to confirm, see Q1): I read it as a *visually* fuller story, a picture-book or comic version of the author's own text, not a longer text. That fits the "AI does not write" rule.

### The ladder (each step ships on its own)

| Step | What the user gets | Notes |
|---|---|---|
| **B1. Polish** | Inline suggestions for spelling, clarity and rhythm; accept or reject each | Text only, cheapest, no image provider. Fits the brief's P1 "optional AI nudges". |
| **B2. Illustrate a page or entry** | Pick a style, get an illustration for one page or entry, regenerate, swap or remove | Builds on the MVP's image tray, with AI images next to stock photos. |
| **B3. Auto mode** | One tap turns the whole draft into a storyboard, the author approves it, then it renders as a **comic** (panels with lettering) or an **illustrated story** (picture-book layout) | The big one. Depends on thread-to-book binding. |

### How auto mode would work

1. **Read** the whole draft (all entries or pages).
2. **Analyse** with a language model: split into beats and scenes, list characters, settings and mood. Output is descriptions only, never new story text.
3. **Art direction:** the author picks a style (comic, watercolour picture-book, collage and so on) and reviews an editable **character and setting sheet**, which is what keeps the look consistent.
4. **Storyboard:** one panel or page per beat, each with its assigned excerpt of the author's text (verbatim) and a visual description. The author edits, reorders, merges or deletes panels, then approves.
5. **Render** each panel with an image-generation model as an asynchronous job, with progress and per-panel regenerate.
6. **Compose:** lettering, captions and speech bubbles are **live text overlays** using the author's words, placed by comic or picture-book layout templates (the same templates-as-data system as the MVP).
7. **Review and publish,** as any other book.

### Hard problems (the honest list)

| Problem | Why it is hard | Direction |
|---|---|---|
| **Character and style consistency across panels** | Today's image models drift between images. This is the central quality risk. | Character sheets, reference images, one fixed style per book. Run a bake-off across providers on real drafts before committing. |
| **Text inside images** | Generated lettering is unreliable. | Never render the author's text in the image; always overlay live text. |
| **Cost** | Many images per book, plus retries and regenerations. | Meter usage and set limits. This forces a stance on credits or plans, and monetisation is out of scope for now (Q4). |
| **Latency** | A whole book takes minutes, not seconds. | Asynchronous jobs, a progress screen, and a way to come back (email or in-app notice). |
| **Moderation** | Prompts and outputs can be unsafe, and memory books mention real people. | Check prompts and outputs; set a policy on depicting real people (Q6). |
| **Ownership, licensing and disclosure** | Rules for AI images differ by provider, platform and country. Some publishing platforms ask for AI disclosure **(verify)**. | Read the provider terms at selection time; get legal advice before print or Kindle (P2); label AI images from day one. |
| **Sameness** | Many users get the same look, so "your world" feels generic. | Strong art-direction controls, author-edited character sheets, several distinct styles. |
| **Provider dependence** | Quality, terms and prices change. | Keep the image step behind a thin adapter; store generated originals in our own storage. |

Text analysis (beats, descriptions, polish suggestions) needs a language model, and rendering needs a separate image-generation model. Choose providers by a bake-off when the work starts rather than now.

### What to keep possible in the MVP (cheap now, expensive later)

- **Structured content in named slots** with stable ids per entry and page, so a storyboard can point at exact source text (already in the plan).
- **Templates as data**, so comic and picture-book layouts are new templates, not new engine code (already in the plan). Comic panels will need a panel-grid slot type, to be added then.
- **`images.source` is an enum** that already includes `upload`; add `ai` later, with provenance (model, prompt, created by) and an AI-disclosure flag.
- **Own storage for original images.** AI images cannot be hotlinked the way Pexels images are.
- **Author text is never rewritten by the system.** A separate suggestion layer proposes changes and the author applies them. The MVP's content model already keeps text only in the author's slots.
- **Async job table pattern** (status, progress, retries), which the Pexels mirror and PDF export also need.
- **Binding pieces into a book** (Revision 2 in PLAN.md), since auto mode starts from a book.

### How we measure it

Share of books that use polish and illustrate; storyboard approval rate; per-panel regenerate rate; completion and share rate of illustrated books against plain ones; reader read-through on illustrated books; **cost per approved book**.

### Risks

- Inconsistent art disappoints users and costs money to fix.
- Cost grows faster than revenue, because the feature is expensive per use.
- Backlash, or disclosure and ownership problems, if AI use is not visible and clear.
- The feature drifts into writing for the author, which breaks the product's core promise.
- Unsafe or unwanted images of real people in personal books.

### Earliest trigger and first step

Start only when the beta shows people publish and share, and users ask for visuals or use images heavily. First step is a **prototype of 5 to 8 days** on five real beta drafts, scored on character consistency, how well each panel matches its text, cost per book and how often the author accepts the storyboard unchanged. The pass bar is agreed before the prototype is built.

---

## C. Full ingestion (beyond import-lite)

### The idea

Users upload everything they have already written, and we ingest it and populate it on the platform. This is the founder's request from 2026-10-12. The first slice, **import-lite** (pasted text and `.txt`, `.md` and `.docx` files, with a review screen, landing as private drafts), is in [PLAN.md](PLAN.md) Revision 2 because it fixes cold start and gives poets value in their first session. This section is everything after that slice.

### Later sources and capabilities

| Item | Notes |
|---|---|
| **PDF** | Best-effort text extraction. Line breaks and indentation are often lost, which hurts poems, so show a clear warning and a stronger review screen. |
| **Zip archives** | A folder of mixed files in one upload. Needs per-file progress and a report of partial failures. |
| **Google Docs and Drive** | Read-only connection to chosen files. Google's app verification rules apply **(verify)**. |
| **WhatsApp chat export** | The user's own messages only, with their timestamps, behind an explicit review step, since exports contain other people's messages. The export format must be checked before building **(verify)**. |
| **Exports from other writing sites and note apps** | Each has its own export format. Pick by what beta users actually use (Q8). |
| **OCR for scanned pages** | Separate, costly and error-prone. Only if demand is clear. |
| **Smarter splitting and kind detection** | A model may classify and suggest splits. It never rewrites text. Same rule as section B. |
| **Duplicate handling** | Within one account first (re-importing the same file), near-duplicate detection across accounts later, as an abuse control. |
| **Re-import and sync** | Re-running an import without creating duplicates, and keeping each piece linked to its source file. |
| **Scale** | Thousands of pieces: queued processing, resumable jobs, per-file progress, throttled so one user cannot starve the others. |

### How we measure it

Import-to-publish conversion; time from first upload to first published piece; share of imports that needed manual fixes on the review screen; failure rate per file format; share of imported pieces that are later edited. Report imported and native work separately.

### Risks

- **Copyright dumping.** Bulk import makes it easy to upload other people's work. Controls: private by default, publish as the control point, ownership attestation, report and takedown, later near-duplicate detection.
- **Privacy.** Chat and note exports can hold private content about other people.
- **Format sprawl.** Every extra source is maintenance. Add one only on evidence of demand.
- **Drift into a generic hosting site.** Keep import in service of the writer's presentation and sharing, which is the product.

### Earliest trigger

Beta writers use import-lite and report or attempt formats we do not support. Count failed attempts by format and let that order the work.

---

## D. Dream mode

### The idea

Users write down what they actually dreamt last night, the random and crazy stories that come to them while asleep. It may not launch with the product. The audience is the writer first, and optionally **close friends only**, never the public by default. A dream is also a natural time capsule: a record of one night.

### The ladder

| Step | What the user gets | Needs |
|---|---|---|
| **D1. Private dream journal** | A quick way to write a dream, a written date set to the night of the dream, optional tags and mood, a filter for dreams in the library. Private by default. | Only things the MVP already has: pieces, a piece kind, private visibility. |
| **D2. Close friends** | Share a dream with a chosen list of friends and nobody else. | A friends layer: invites and acceptance, an audience list, signed-in readers, block and remove. |
| **D3. Patterns and visuals** | Recurring people, places and symbols across months; resurfacing ("a year ago"); optional AI illustration of a dream in a surreal style, under the section B rules. | Enough dreams per user; section B. |

### What makes dreams different from other pieces

- **Fast capture.** Dreams fade within minutes of waking. The entry point must be one tap to a blank dream, and device dictation should work in the editor. A home-screen shortcut and a morning reminder help; push reminders for installed web apps on iPhone have been supported only in recent versions **(verify)**.
- **Dates.** A dream uses the same two dates as any piece: the written date, which the author sets to the night of the dream, and the posted date. No separate dream date is needed.
- **No forced structure.** Dreams are fragments and jumps. The template should accept a few loose lines as readily as a long account, with optional tags (people, places, feelings) and no required fields.
- **Not interpretation.** The product records dreams and does not claim to explain them or to offer psychological or medical advice. Nightmares can be upsetting, so keep the tone gentle and avoid streak pressure.

### Close-friends audience (D2)

This is a new kind of visibility between private and link-only, and it is a real piece of work.

- **Who is a close friend:** people the author picks from accounts that accepted their invite. Invitations travel by link, naturally through WhatsApp. No contact-book upload.
- **Readers must be signed in** so we know who they are. This is the opposite of public pieces, which guests can read without an account. A dream's link preview must therefore show no content, only "shared with you" or nothing at all.
- **Access control:** enforced in the database with row-level security plus an audience table (author, friend, status), not only in the interface. Block and remove must take effect at once.
- **Honest limits:** we cannot stop a friend from taking a screenshot or copying text. "Close friends" is a social promise, not a technical lock. Do not market stronger privacy than we deliver. End-to-end encryption is a separate and large project that would also rule out search, previews and the AI features.
- **Real people in dreams.** Friends and family appear in dreams. No tagging or notifying people named in a dream in the first version, so nobody is surprised by a post about them.
- **Reports and takedown** must work even for restricted content, and legal duties on illegal content apply whatever the visibility **(verify with counsel)**.
- **Reuse:** the friends layer is also the base for followers and the feed, so build it once.

### Cheap steps in the MVP that keep this possible

- `kind` on a piece is an extensible type, so `dream` is a new value and not a schema change.
- `visibility` is an extensible type that can later gain `friends` without migrating existing rows.
- Private is a real, tested visibility from day one (already in the plan), with RLS on every owner table.
- Every piece carries a written date and a posted date from day one (see PLAN.md, Revision 2), which also covers dreams.
- Account deletion and data export (Phase 3) already cover dreams as ordinary pieces.

### How we measure it

Dreams logged per writer per week; D7 and D30 return among dream writers; for D2, share of dreams shared with at least one friend, friends who open them, and invitations accepted.

### Risks

- **Privacy regret:** a dream shared by mistake, or a friend who copies it. Default private, explicit audience picker, clear "who can see this" on every dream.
- **Sensitivity:** intimate or distressing content. Be careful with copy and with any reminders, and give people an easy delete.
- **Real people named in dreams** can cause friction between friends.
- **A friends layer is a big surface** (invites, blocks, notifications, moderation of private content). It should not be built for dream mode alone.
- **Fit:** dreams are a personal journal and may pull the product away from sharing and discovery. Validate demand with D1 before investing in D2.

### Earliest trigger

D1: beta writers ask for private journaling, or a share of their pieces are private and personal. D2: the friends layer exists for another reason (followers, the feed) or D1 shows strong habit and people ask to share.

---

## E. Engagement, recognition and creator tools

Short entries on purpose. Each is a candidate that can move between the MVP and later.

**E1. Creator analytics.** A dashboard for writers: views, unique readers, how many read to the end, shares, and where readers came from (for example WhatsApp), per piece and over time, with bots filtered out. Aggregates only, never who read what (Q14). The MVP already plans link-opened and read-through events, so a simple "views and finished reads" count per piece is cheap and a strong MVP candidate. The full dashboard comes later.

**E2. Likes.** One tap, a count, signed-in readers only. Small. It is the first interaction readers get and shows whether comments are worth their moderation cost.

**E3. Public comments.** Visible under a piece, signed-in readers only. The author can turn comments off per piece and hide or delete any comment; readers can report. Needs rate limits, a block feature and notifications to the author. This is the biggest item here because public comments create a moderation load, so build report, hide and block first. The brief lists comments as out of scope and P2; this keeps them on the map without committing.

**E4. Audio on a piece.** Two uses: a voice note at the end where the author talks to readers, and a reading of the piece, which suits poets. Start with the author's own audio and a length cap, and leave reader voice replies for later (Q17). Watch: browsers record in different formats (iPhone Safari and Chrome differ), so playback may need conversion **(verify)**. Audio needs storage, a transcript for accessibility (a faithful transcription, not a rewrite), and some way to moderate it.

**E5. Badges and weekly stats.** Milestones such as first piece published, a 7-day writing streak and pieces read this week, plus a private weekly summary the user can share. A status level (for example reader and writer tiers) can come from the same counts. It extends the brief's P1 streaks. Two rules matter: count a piece as **read** only when the reader reaches the end after a minimum time, not just on open; and count only **native** writing as written, never imported or pasted archives, or a new user's back catalogue would earn every badge on day one. Private by default.

**E6. Leaderboards.** Optional ranking by writing or reading over a week. Risks: it rewards volume over quality (spam, skimming), discourages new users, and feels wrong for journal-style writers. If built: opt-in, scoped to friends or a topic rather than global, reset weekly, and based on consistency (days active) rather than raw word counts. It needs enough active users to mean anything and fits after the friends layer from D2.

**Shared prerequisites.** Signed-in readers (accounts exist from Phase 1), reader events with bot filtering and `origin` (Phase 3), report, hide and suspend tools, notifications (email first), and audio storage. Most of this is already in or near the MVP plan.

---

## Questions for the founder on these features

| # | Question | My default |
|---|---|---|
| Q1 | "Fuller story": a visually richer version of the author's own text (my reading), or also longer text? | Visuals only. Text is never expanded by AI. |
| Q2 | Should polish ever reword, or only correct (spelling, grammar, rhythm) and offer clarity tweaks the author accepts one at a time? | Suggestions only, one at a time, tone-preserving. |
| Q3 | For the feed: public only, with raw-thought threads eligible only on opt-in? | Yes. |
| Q4 | How is AI paid for: a free allowance then credits, or a paid plan? Monetisation is out of scope now, but AI costs money per use. | Decide before B2. A free allowance and a cap. |
| Q5 | Must AI images always be visibly labelled? | Yes. |
| Q6 | Memory-keeper books mention real people. Which styles are allowed for depicting them (illustration only, no photorealism)? | Illustration styles only, no photorealistic real people. |
| Q7 | Which comes first once the beta ends, feed or AI? | B1 and B2, then the feed, then B3. |
| Q8 | Where do your users keep their existing writing (Word, Google Docs, phone notes, WhatsApp, a blog site)? This orders the import sources in section C. | Word and text files first (import-lite), then whatever the beta shows. |
| Q9 | Dream mode: who counts as a "close friend": people who accepted your invite (mutual), or anyone you pick from existing accounts? | Mutual, invited by a link you can send in WhatsApp. |
| Q10 | Can friends react to or comment on a dream, or only read it? | Read only to begin with. |
| Q11 | Can a dream name or tag real people? | Free text only. No tagging and no notifications in the first version. |
| Q12 | Should dreams ever be public? | No. Private or close friends only. |
| Q13 | Is dream mode its own space (a "Dreams" tab) or a kind of piece with a quick-capture button and a filter? | A kind of piece, with a quick-capture button and a filter. |
| Q14 | Creator analytics: aggregate counts only, or can a writer see who read their piece? | Aggregate only. |
| Q15 | Comments: signed-in readers only, with the author able to turn them off per piece and hide any comment? | Yes. |
| Q16 | Leaderboards: opt-in, scoped to friends or a topic, based on consistency? | Yes, and only after badges and weekly stats show people care. |
| Q17 | Audio: the author's own voice note only at first, with a length cap? | Yes. Reader voice replies later. |

---

## Already deferred elsewhere

These are parked in other documents. They are listed here so the roadmap is complete, with no new detail.

| Item | Where it is documented |
|---|---|
| PDF export | Brief P1; [PLAN.md](PLAN.md) section 3.9 |
| Writing streaks, daily prompts, reminders | Brief P1 |
| Unpublish and visibility controls beyond the MVP set | Brief P1; promoted to P0 in PLAN.md (C2, C3) |
| Additional templates and palettes | Brief P1 |
| Upload your own images | PLAN.md C1, Q1 |
| Timeline of thought (ordering and grouping by written date), thread resurfacing ("a month ago", "on this day"), sealed capsules, letters to future you | PLAN.md, Revision 2 |
| Bind pieces into a book (paged book view, cover, page-flip reader) | PLAN.md, Revision 2 |
| Import-lite (paste, `.txt`, `.md`, `.docx`, review screen) | PLAN.md, Revision 2 (recommended for the beta) |
| Quote cards for sharing a piece (9:16 and 1:1) | PLAN.md, Revision 2 |
| Followers | Brief P2 (likes and comments are now in section E) |
| Print-on-demand and EPUB export | Brief P2 |
| Collaboration and co-authoring | Brief P2 |
| Native apps | Brief P2; PLAN.md C7 |
