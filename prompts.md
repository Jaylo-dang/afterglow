# prompts.md


- **Student:** Haojia Dang
- **Course:** MGMT 6110 Human-AI Collaboration

---

# Week 1 — DropWatch (Problem Set 1)

- **User type:** External
- **User sentence:** A concert-ticket fan opens this screen to see which platform each of their artists' on-sales is happening on and when, and knows it worked when the on-sale they confirmed is counting down in front of them on the day.
- **Live link:** https://dropwatch-xi.vercel.app/
- **Repository:** https://github.com/Jaylo-dang/dropwatch
- **Built with:** Google AI Studio (Build), Gemini 3.8 Flash
- **Note:** The prompts below were sent to Gemini in AI Studio. Their wording was drafted with an assistant from my own specification; see `assessment.md` for the division of labour.

---

## Prompt 1 — the master prompt (R·G·O·G·C)

```
[R] ROLE
You are a senior front-end developer building a React web app.

[G] GOAL
Build the front end of DropWatch, a web product for concert-ticket fans who
chase on-sale moments. They are working adults and students, opening this on a
phone in the evening, and their job on this product is: "keep the on-sale times
for the artists I care about in one place, and make sure I am not asleep when
one opens." TWO screens, switched by a tab bar at the top, with no page reload
between them.

SCREEN 1 - "Discover":
1) A header reading "DropWatch" with a line underneath reading "Following 3 of
   9 artists" that updates as artists are followed and unfollowed.
2) A row of genre chips: All, Pop, Rock, Indie, Hip-hop, Electronic. They
   toggle and filter the list below immediately.
3) A list of exactly 9 artists as cards. Use these nine names and genres, and
   no others:
     - Aria Volt (Pop)
     - Novaline (Pop)
     - Rui & the Static (Rock)
     - Blue Cassette Club (Rock)
     - The Paper Lanterns (Indie)
     - Halcyon Grey (Indie)
     - Marta Fenn (Hip-hop)
     - Dune Prospect (Hip-hop)
     - Kenji Moroe (Electronic)
   Each card shows: artist name, genre, city and venue of their next show, the
   next on-sale date, how many upcoming on-sales they have, and a Follow /
   Following star button. Tapping the star toggles it and the count in the
   header changes at once.

SCREEN 2 - "My drops":
4) At the top, a REMINDER CARD for the one on-sale that opens tomorrow. It
   reads "On sale tomorrow" and shows artist, venue, city, the exact on-sale
   date and time, the platform name, and the price range. It has two buttons:
   "I'm going for it" and "Not this one".
5) Pressing "I'm going for it" turns the card into a confirmed state reading
   "You're in. The countdown starts when the doors open." with a green check.
   Pressing "Not this one" collapses the card to a single dismissed line with
   an Undo control.
6) Below that, a COUNTDOWN CARD for the one on-sale that opens today. It shows
   the artist, the platform, and a live countdown in HH:MM:SS that ticks down
   every second. Set its target to two hours and fifteen minutes after the app
   loads, so the countdown is always running when the page is opened. When it
   reaches zero the card reads "Doors are open" and stops.
7) Below those, the list of every upcoming on-sale for followed artists,
   grouped under date headings, oldest first. Each row shows: artist, venue and
   city, on-sale date and time, platform name, price range, and a tag reading
   either "Presale" or "General sale".
8) When no artists are followed, screen 2 shows "You are not following anyone
   yet. Follow an artist on Discover to see their on-sales here." instead of an
   empty list.

[O] OUTPUT
A running app. Keep every invented value in ONE data file of its own: the 9
artists named above, the 4 ticketing platforms named below, and at least 14
on-sale entries, so the screen looks real. One component per section (tab bar,
artist card, artist list, genre chips, reminder card, countdown card, on-sale
row, on-sale list). Every state change happens without reloading the page, and
following an artist on screen 1 is reflected on screen 2 immediately. Readable
on a phone at arm's length: cards stack in a single column below 480px and tap
targets are large. When you are done, list the files you created and what each
one holds.

[G] GUARDRAILS
Screens and invented data only. Do NOT call the Gemini API or any other model.
Do NOT call any outside service or fetch from any URL. No database, no login,
no sign-up, no user accounts, no analytics. No browser notifications, no
service worker, no push, no email, no SMS, no calendar integration - the
reminder and the confirmation are in-app state on screen 2 and nothing leaves
the page. No payment, no checkout, no links to any external site. No third
screen, no routing, no settings page. No features I did not list above.

NAMES ARE FIXED. Use exactly the nine artist names I listed above and exactly
these four ticketing platform names: TixNova, StageLine, Rialto Tickets,
Nimbus Live. Do NOT rename them, do NOT substitute names you consider more
realistic, do NOT add a tenth artist or a fifth platform, and do NOT change
them later when I ask for styling, layout or any other change. If you believe
a name should change, say so in one line and leave it as it is.

Use these four invented venue names only: Harbourline Arena, The Glasshouse,
Pier Nine Pavilion, Northgate Dome. Every date, time, price and seat figure is
invented. Do NOT use the name, logo or trademark of any real performer, band,
venue, ticketing company or promoter, and do not use names that closely
resemble real ones. Nothing confidential.

[C] CONTEXT
Individual Problem Set 1 for MGMT 6110 Human-AI Collaboration at SMU. Built in
Google AI Studio, pushed to GitHub, deployed on Vercel, and opened on a phone
by classmates in Week 3. I am not a programmer: when you make a choice I did
not specify, say so in one line rather than burying it.
```

**What came back:** Ran 200 seconds. A running preview with both screens, the
tab bar, the nine artists under their own names, the reminder card, and a
countdown ticking from 02:14. All nine artist names, four platform names and
four venue names came back exactly as specified. It also shipped a Gemini
client and a `GEMINI_API_KEY` line in `vite.config.ts`, despite the Guardrail
saying the app must call no model.

**What I changed next and why:** Nothing functional. I checked the preview
against Goal items 1 to 8 one at a time. Items 5 and 8 needed clicking to
verify, so I pressed both buttons on the reminder card and unfollowed all nine
artists to force the empty state. Both behaved as specified. Then I moved to
appearance.

---

## Prompt 2 — the design theme

```
Apply the "High Density" design theme to the app.
```

**What came back:** A denser dark layout, a slate palette, per-genre colour
badges. Every artist name, platform name, venue, city, date and price survived
unchanged.

**What I changed next and why:** Nothing, but this is the most important entry
in the log. In an earlier attempt at this problem set, this exact four-word
prompt silently rewrote all my invented data — several names changed, one
invented outright, a date range shifted — and I did not notice at all. The only
difference this time is the `NAMES ARE FIXED` block in the Guardrails, which was
written because of that failure and which explicitly says "do NOT change them
later when I ask for styling". The guardrail came out of a failure and then held
under the same attack that caused it.

---

## Prompt 3 — more colour, more energy

```
Make the visual design more colourful and more energetic - buying tickets the
moment they drop is an exciting, high-adrenaline moment and the page currently
feels too calm. Specifically:
- Move off the near-black slate background to a warmer, more saturated ground.
- Give the countdown card the loudest treatment on the page: it is the most
  exciting element and should read as urgent.
- Keep the per-genre colour tags, but let the colours carry more of the layout
  rather than sitting only in small badges.
- Keep text contrast high enough to read on a phone in a dark room.

This is a VISUAL change only. Do NOT change any artist name, platform name,
venue, city, date, time, price, seat count, or any other value in the data
file. Do NOT add, remove or rename any artist or platform. Do NOT add or remove
any section, button, tab or feature, and do NOT change what any control does.
Both screens keep exactly the eight behaviours they have now.
Change nothing else.
```

**What came back:** Ran 185 seconds. A warm dark ground, a crimson-to-amber
countdown card that was now clearly the loudest element on the page, and genre
colours carrying the card borders. Names and data again untouched.

**What I changed next and why:** Two things came out of checking this version.

First, I found a real defect, and it was mine rather than the model's. With no
artists followed, screen 2 still displayed the reminder card and the countdown
card for two artists I was not following. My own Goal item 8 says the empty
state replaces "an empty list" — I wrote only about the list, so the model
guarded only the list. The criterion caught exactly what it stated and nothing
more.

Second, I decided the dark palette was wrong for this product. Chasing a ticket
drop is an excited, anticipatory moment, and a near-black page reads as heavy.
That judgment is mine, and both changes went into the next prompt.

---

## Prompt 4 — light theme, and the empty-state fix

```
Two changes in this message. First the visual redesign, then one behaviour fix.

VISUAL: Switch to a LIGHT theme. The current dark palette feels heavy and
oppressive, and this product is about an exciting moment. Make it bright and
genuinely colourful.
- Replace the dark ground with a light, warm off-white page background.
- Cards sit on white or very light tinted surfaces with soft shadows, not on
  dark panels.
- Keep the five genre colours (Pop, Rock, Indie, Hip-hop, Electronic) and let
  them carry much more of the layout than before: coloured left accent bars,
  lightly tinted card fills in that genre's hue, coloured badges and coloured
  section headings. The page should read as multi-coloured, not as one accent
  colour on grey.
- The countdown card stays the single loudest element on the page. On a light
  ground that means a strongly saturated filled card with high-contrast digits,
  not a dark box.
- Legibility is not negotiable: body text is dark on light surfaces, text on any
  saturated fill is white or near-black with strong contrast, and nothing is
  pale text on a pale tint. It must be readable on a phone in daylight.
- Keep every existing section, card, button, chip, tab and badge exactly where
  it is. This is a colour and surface change, not a layout change.

BEHAVIOUR FIX: On "My drops", the reminder card and the countdown card
currently show even when their artist is not followed. Tie both cards to the
followed list: the reminder card appears only if the tomorrow on-sale's artist
is followed, and the countdown card appears only if today's on-sale artist is
followed. When no artists are followed at all, screen 2 shows only the line
"You are not following anyone yet. Follow an artist on Discover to see their
on-sales here." with no reminder card, no countdown card and no on-sale list.
When at least one artist is followed, all three come back as they are now.

NAMES AND DATA ARE FIXED. Do NOT change any artist name, band name, platform
name, venue, city, date, time, price, seat count or badge text. Do NOT add,
remove or rename any artist or platform. Do NOT add or remove any screen,
section, button, tab or feature, and do NOT change what any control does beyond
the behaviour fix described above. Both screens keep all eight behaviours from
the original specification.

Change nothing else.
```

**What came back:** Ran 169 seconds. A light, multi-coloured theme with a
white-on-crimson countdown card, genre-tinted artist cards and readable dark
text throughout. The empty state now correctly hides all three elements, and all
three return when an artist is followed. Names, venues, platforms and prices
unchanged for the third time in a row.

It also added a "Go to Discover" button to the empty state, which I had not
asked for and which the same message explicitly forbade — "Do NOT add or remove
any screen, section, button, tab or feature".

**What I changed next and why:** Nothing. I kept the button, because it is a
genuine improvement to a dead end, and the decision worth recording is that I
noticed it and chose to keep it rather than not noticing. What is more
interesting is the contrast inside one message: the instruction not to change
nine artist names, which I had listed one by one, held; the instruction not to
add any button, which was a category with no instances, did not.

This message also deliberately moved two variables at once — a visual change and
a behaviour fix — because I was short of time. That was a choice, not an
oversight, and it means a regression in this version could not have been
attributed to one of the two.

---

## Week 1 build log — decisions and failures that were not prompts

- **This is my second attempt at Problem Set 1.** I took a first version all the
  way to a live URL, then found I had misread the brief and rebuilt from
  nothing. The `NAMES ARE FIXED` guardrail came from that attempt.
- **The rebuild took a little over 20 minutes end to end**, against roughly three
  hours for the first attempt. Nothing about my ability to read code changed in
  between. What changed is that I already knew the click path, already had a
  prompt structure to fill in, and brought more of the specification myself.
- **I opened the Code tab and did not read it.** A full application written
  while I typed four messages; lines of code read by me: zero.
- **`vite.config.ts` reads `GEMINI_API_KEY`, and there is a `.env.example`.** I
  did not supply the key on Vercel: on a public repository behind a public URL,
  that config line would publish a live key into the JavaScript the browser
  downloads. The deployment loaded fine without it.
- **Verified on the live URL, not only in the preview.** Opened it in a private
  window and on a phone, followed and unfollowed artists, confirmed the reminder
  card, and watched the countdown tick.

---
---

# Week 2 — Afterglow (Problem Set 2)

- **Live link:** https://afterglow-sage.vercel.app/
- **Repository:** https://github.com/Jaylo-dang/afterglow
- **Health endpoint:** https://afterglow-sage.vercel.app/api/health
- **Sources:** Open-Meteo (no credential, CC-BY 4.0) and NASA APOD (credential in Vercel as `NASA_API_KEY`)
- **Note:** Same as Week 1 — these prompts were sent to Gemini in AI Studio, and their wording was drafted with an assistant from my own specification. See `assessment.md` for the division of labour.

**Why this is a different product.** Problem Set 2 opens by asking you to name
what your Problem Set 1 product could not do. I did that exercise on DropWatch
and found that all three of its claims — ticket price, on-sale time, countdown —
were unsourceable, because no free public API publishes concert on-sale
information. Prof. Roh's Saturday email allowed building from scratch, so I
built a product whose central claim can actually be sourced. The full
three-sentence exercise is at the top of `assessment.md`.

---

## Prompt 5 — the master prompt (two live sources behind api/)

```
[R] ROLE
You are a senior full-stack developer. Build a new Vite + React project from
scratch, with serverless functions that run on Vercel. I am not a programmer:
when you make a choice I did not specify, say so in one line rather than
burying it.

[G] GOAL
Build Afterglow, a web product for photographers in Singapore who shoot sunrise
and sunset. Their job is: "decide before I leave the house whether tonight is
worth carrying a tripod for, which spot to go to, and what time to be there."
ONE screen, two sections.

SECTION 1 - "Tonight":
1) A mode toggle: "Sunset" and "Sunrise". Sunset selected by default.
2) Today's exact sunset (or sunrise) time from the API, shown large.
3) A score from 0 to 100 for conditions at that moment, with a one-line verdict.
4) The four SOURCED numbers the score is built from, always visible: low cloud %,
   mid cloud %, high cloud %, visibility in KILOMETRES.
5) An expandable "How this score works" panel carrying this exact sentence:
   "This score is my own method, not a figure published by any weather service.
   The four numbers above are the sourced data."
6) A ranked list of the shooting spots for the selected mode, best first.

SECTION 2 - "Tonight's sky, from NASA":
7) NASA's Astronomy Picture of the Day: image, title, truncated explanation.
8) The credit line under it. This field is CONDITIONAL - see the guardrails.
9) A footer crediting both sources.

THE SPOTS. Use exactly these five, with these facings. Sunrise mode ranks only
the east-facing spots; sunset mode only the west-facing. The facing is my own
judgement and must not be changed:
  - Marina Barrage                1.2806, 103.8714   facing west
  - Henderson Waves               1.2780, 103.8180   facing west
  - Siloso Beach, Sentosa         1.2570, 103.8100   facing west
  - Bedok Jetty, East Coast Park  1.3070, 103.9380   facing east
  - Punggol Settlement            1.4110, 103.9100   facing east

THE SCORE. Use exactly this rule, for the hour containing the sunset (or
sunrise) time. Do not invent a different formula:
  midHigh    = (cloud_cover_mid + cloud_cover_high) / 2
  midHighPts = 100 - Math.abs(midHigh - 50) * 2
  lowPts     = Math.max(0, 100 - cloud_cover_low * 2.5)
  visKm      = visibility / 1000
  visPts     = Math.min(100, visKm / 20 * 100)
  score      = Math.round(0.5*midHighPts + 0.3*lowPts + 0.2*visPts)

[O] OUTPUT
THREE functions in an api/ folder at the PROJECT ROOT, siblings of
package.json, never inside src/:
 1) api/sky.js - one Open-Meteo call for all five spots using the
    comma-separated multi-location form. No credential.
 2) api/apod.js - NASA APOD with the key from process.env.NASA_API_KEY. BEFORE
    the fetch, if that variable is missing or empty, return 503 naming
    NASA_API_KEY and do NOT call upstream - a missing variable is sent as the
    word "undefined" and looks exactly like a wrong credential.
 3) api/health.js - keyConfigured as a boolean, the HTTP status each upstream
    returned, and a timestamp. NEVER print the credential or any part of it.
Make sure package.json contains "type": "module".
AFTER every fetch, check response.ok BEFORE reading the body. A refusal often
 arrives with an empty body, so calling .json() on it throws and the function
 dies with a 500 instead of telling me what happened.
Cache: weather s-maxage=1800, stale-while-revalidate=3600. APOD s-maxage=3600,
 stale-while-revalidate=7200.

ON THE SCREEN, a different sentence for each of these, not one spinner:
 a) loading
 b) the forecast does not cover the requested day, because the free tier only
    goes seven days ahead - this is NOT an error and must not read like one
 c) an upstream refused (non-2xx)
 d) an upstream could not be reached at all
 e) one spot came back but another did not
 f) one section works and the other failed - they fail independently

[G] GUARDRAILS
Never call either provider from browser code. Never create a variable whose
 name starts with VITE_. Never write the NASA key into any file, comment or
 README. No new npm packages. No database, no login, no map tiles. No second
 screen and no routing.

THESE ARE THE REAL FIELD NAMES AND UNITS, called by hand just now:
Open-Meteo:
 - visibility is in METRES. 6460 means 6.46 km. Divide by 1000. Never show a
   visibility figure larger than 100 km.
 - A SINGLE-location request returns an OBJECT. A MULTI-location request
   returns an ARRAY, and the FIRST element has no location_id field at all.
   Match spots to results by ARRAY INDEX ONLY, never by location_id.
 - hourly.time is local strings like "2026-09-12T19:00" with no offset.
 - The API snaps requested coordinates to its own grid.
NASA APOD:
 - The "copyright" field is CONDITIONAL. ABSENT when the image belongs to NASA,
   PRESENT when an outside photographer took it. Today it is absent. Never read
   it without checking it exists. Never render the string "undefined".
 - "media_type" is "image" most days and "video" on some. Only render an <img>
   when it is "image".
 - "url" and "hdurl" are https, so no rewriting is needed. Use "url".

[C] CONTEXT
Deployed on Vercel from GitHub. The NASA credential lives ONLY in a Vercel
environment variable named exactly NASA_API_KEY. Open-Meteo needs none; its
free tier is CC-BY 4.0 and non-commercial, which is why the footer credit is a
requirement rather than a nicety.

[Real Open-Meteo and NASA APOD responses, pasted from calls I made by hand,
were included here in the CONTEXT block.]
```

**What came back:** Ran 233 seconds. A working app with both sections. Every
field name landed correctly: visibility rendered as `11.2 km`, not `11200`; the
spots matched their coordinates; the NASA credit read `Image: NASA` rather than
`Image: undefined`. It also shipped a `@google/genai` dependency and a
`.env.example`, despite the Guardrails saying no new npm packages and no model
calls — the same uninvited scaffolding as in Week 1.

It also added a date dropdown I never asked for. I take that as a reasonable
inference from my own state (b), but it was its decision, not mine, and it has
a consequence I only noticed later (see the build log).

**What I changed next and why:** Nothing to the product. I went to the Code tab
and checked four things before pushing anything: that `api/` sat at the project
root beside `package.json` and not inside `src/`; that the screen called
`/api/sky` and not the provider directly; that the key appeared nowhere as a
literal; and that `package.json` had `"type": "module"`. All four held. Then I
cleaned up the leftover Gemini scaffolding, because in Week 1 exactly that
scaffolding was what produced a blank page on a green deployment.

---

## Prompt 6 — remove the Gemini scaffolding, and one question I made it answer

```
Remove the leftover Gemini scaffolding. This app makes no Gemini calls at all.
Remove the @google/genai dependency from package.json, any import of it, the
client it creates, the GEMINI_API_KEY handling in vite.config.ts, and the
.env.example file if it only exists for that key.

Also: my guardrails said "no new npm packages" and the project now depends on
lucide-react and motion. Tell me in one line whether each of those was already
in the starter template or whether you added it. Do not remove them yet.

Change nothing else. Do not touch api/sky.js, api/apod.js, api/health.js, or
the scoring rule.
```

**What came back:** Ran 50 seconds. `@google/genai` removed from
`package.json`; `GEMINI_API_KEY` removed from `.env.example`; confirmed no
Gemini imports or key handling anywhere else; the three api files and the
scoring formula untouched. And the answer to my question: *"Both lucide-react
and motion were already present in the starter template's initial package.json
and lockfile; neither package was added during implementation."*

**What I changed next and why:** Nothing, and this is the entry I would keep if
I could keep only one. The claim that the agent had violated my "no new npm
packages" guardrail did not come from the agent. It came from the assistant I
was working with, which saw those two packages in `package.json` and inferred a
violation — and went further, presenting it as a pattern across two weeks
(specific constraints hold, categorical ones fail). I did not accept it. I put
the question into the cleanup prompt and made the agent state the provenance
itself. The answer was that neither package was added.

If I had taken the inference at face value, my assessment would now contain a
conclusion I invented rather than observed. The thing that stopped it was not
knowledge; it was asking the party that actually knew.

---

## Prompt 7 — the overflow only a real phone showed

```
On a phone (viewport around 390px wide), the Sunset / Sunrise toggle overflows
the right edge of the screen. The toggle group is wider than its container, so
the "Sunrise" button and its dark pill are clipped by the viewport and part of
the control sits outside the card.

Fix the layout so nothing is cut off at that width: below about 640px, let the
date selector and the Sunset/Sunrise toggle wrap onto separate rows, and make
the toggle group fit inside the card with the same side padding as the rest of
the section. Neither the page nor any element may scroll horizontally at 390px.

Do not change any data, any field name, the scoring formula, the spot list, the
facings, the verdict sentences, or any of the screen states. The desktop layout
must stay exactly as it is.
Change nothing else.
```

**What came back:** Ran 106 seconds. The controls now wrap onto separate rows
below 640px, the toggle sits inside the card's padding, and `overflow-x-hidden`
was added at the root. Desktop unchanged; no data, endpoint or scoring change.

**What I changed next and why:** Nothing. What matters about this entry is
where the defect came from. The desktop preview in AI Studio was correct. The
deployed desktop page was correct. The bug existed only on a real phone at
390px, and I found it because the problem set says to open it on a phone rather
than a laptop. Nothing in my own verification routine would have caught it: I
had been checking numbers and states, not widths. A screen that is correct in
every value it displays can still be unusable.

---

## Prompt 8 — golden hour should look like golden hour

```
Redesign the colour scheme. The current near-black palette feels heavy, and
this product is about golden hour, so the page should look like golden hour.

Move to a LIGHT, WARM palette:
- The page ground becomes a warm off-white / pale cream, not dark. Cards sit on
  white or very lightly tinted warm surfaces with soft shadows.
- Body text is dark on light. Do not use pale text on pale tints anywhere.

Then make the accent family follow the selected mode, so the page changes
atmosphere when the toggle changes:
- SUNSET mode: deep amber and burnt coral warming into a dusky violet. The
  score card is the warmest, most saturated element on the page.
- SUNRISE mode: a cooler dawn - soft rose and peach lifting into pale gold,
  lighter and fresher than the sunset palette.
Use a smooth transition when the mode changes, no more than 400ms.

Legibility is not negotiable: every figure and label must be readable on a
phone in daylight, and any text sitting on a saturated fill must be white or
near-black with strong contrast. Keep the mobile wrapping fix from the last
change; nothing may overflow or scroll horizontally at 390px.

Do not change any data, any field name, the scoring formula, the five spots,
their coordinates, their facings, the verdict sentences, the API endpoints, or
any of the screen states. This is colour and surface only, not layout and not
logic.
Change nothing else.
```

**What came back:** A warm cream ground, and the accent family now follows the
mode: sunset renders amber into plum, sunrise renders rose into gold, and the
header mark and badge shift with it. Data, scoring and states untouched.

**What I changed next and why:** Nothing. This was my decision rather than a
correction: the dark palette was not a defect, it simply had nothing to do with
what the product is about. Tying the accent to the selected mode was also mine —
the agent would have produced one palette, and one palette would have been
adequate. It is the only change this week that came from thinking about how the
user feels rather than about whether a number is right.

---

## Week 2 build log — decisions, failures and verifications that were not prompts

- **I called both providers by hand before writing the prompt**, which the
  problem set says not to skip. Three things came out of that fifteen minutes,
  and all three ended up as guardrails:
  - Open-Meteo returns `visibility` in **metres**, while its own units block
    says `"visibility":"m"`. Displayed unconverted, the screen would have read
    "11160 km" — larger than the diameter of the Earth.
  - A single-location request returns an **object**; a multi-location request
    returns an **array**, and the **first element has no `location_id` field at
    all**. Pairing spots to results by `location_id` would have silently
    misassigned the first spot.
  - NASA's `copyright` field is **conditional** — absent on days when NASA owns
    the image, present when an outside photographer took it. On the day I
    called it, it was absent, so I could not have discovered this by testing.
    It went into the guardrails as a rule rather than as an observation.

- **I verified the score by hand, twice, against the live site.**
  On 12 September, sunset, with low 5 / mid 1 / high 71 / visibility 11120 m:
  0.5×72 + 0.3×87.5 + 0.2×55.6 = 73.4, and the screen read **73**.
  On 14 September, sunrise, with low 3 / mid 2 / high 100 / visibility 11.2 km:
  0.5×98 + 0.3×92.5 + 0.2×56 = 87.95, and the screen read **88**.
  Same day, same site: sunrise scored 88 and sunset scored 37. The product
  discriminates; it is not decorating a constant.

- **Four credential checks, and only one of them meant anything.** Before
  pushing I searched for my NASA key four different ways:
  1. AI Studio's in-file search — no match. **Valid**: it searches contents.
  2. GitHub's sidebar "Go to file" — "No matches found". **Proved nothing**: it
     searches file *names*, and a key is not a filename.
  3. GitHub code search — "0 files". **Proved nothing**: a yellow banner on the
     same page read *"This repository's code is being indexed right now."* It
     searched an empty index.
  4. Opening `api/apod.js` and reading lines 9 and 22 with my own eyes.
     **Conclusive**: `process.env.NASA_API_KEY`, interpolated at call time,
     no literal anywhere.
  Three of four reported a pass. One was one. The safe check was the least
  clever one.

- **The out-of-range state is unreachable from the interface.** The date
  dropdown the agent added lists only the seven days that have data, so a user
  cannot ask for a day outside the forecast. The sentence I specified for that
  case exists and is correct — I confirmed it by calling
  `/api/sky?mode=sunset&date=2026-10-30` by hand, which returns
  `{"outOfRange":true,...,"availableDates":[...]}`. But no user will ever see
  it. The agent prevented the state rather than presenting it, which is a
  product decision I did not make and did not notice until I went looking for
  the state on the screen and could not produce it.

- **Where I stopped prompting and did it by hand.** Everything from the GitHub
  push onwards: creating the repository, adding `NASA_API_KEY` in Vercel,
  redeploying. Asking an agent to talk me through those clicks would have been
  slower than doing them.

- **The step the problem set says everyone skips, I did not have to remember.**
  After saving `NASA_API_KEY` I had to redeploy for it to reach the build.
  Vercel surfaced this itself, as a blue prompt with a Redeploy button.
  `/api/health` then returned
  `{"keyConfigured":true,"upstreams":{"openMeteo":200,"nasa":200},...}` on the
  first try.

- **Verified on the live URL and on a phone**, not only in the AI Studio
  preview, which the problem set warns hands back function source code with a
  success code instead of running it.
