# assessment.md

**Haojia Dang · MGMT 6110 Human-AI Collaboration · Problem Set 2**

- **Live product:** https://afterglow-sage.vercel.app/
- **Health endpoint:** https://afterglow-sage.vercel.app/api/health
- **Repository:** https://github.com/Jaylo-dang/afterglow
- **Prompt log:** `prompts.md` in the same repository, continuing from Problem Set 1

**On how this was made.** Gemini in AI Studio
wrote the code. Claude drafted the wording of my prompts, named three data traps
I would not have spotted on my own, and helped draft this document. What came
from me is what the product is, who it is for, which claims it makes, what it
looks like, and — as Q3 records — the decision on two occasions not to believe
something I had been told. I set this out once here rather than repeating it,
because the rest of this file is about where the boundary actually sat.

---

## Step 1 — what my Problem Set 1 product could not do

Before deciding anything about this week, I did the exercise this problem set
opens with, on my own Problem Set 1 product.

> My screen tells the user that Novaline's tickets cost **US$48–$135**, which
> right now is **invented**, and to be true it would have to come from **the
> ticketing platform's listing**. → No public API. Unsourceable.

> My screen tells the user the on-sale opens **Mon 7 Sep, 10:00 AM PDT**, which
> right now is **invented**, and to be true it would have to come from **the
> platform or promoter's announcement**. → No public API. Unsourceable.

> My screen tells the user there are **02:14:55 until the on-sale**, which right
> now is **not a countdown at all** — it counts from two hours fifteen minutes
> after page load and restarts on every refresh — and to be true it would have to
> count toward **a real on-sale timestamp**. → Depends on the second. Unsourceable.

The problem set predicts most people will find one claim of three cannot be
sourced. Mine was all three, and the reason is structural rather than bad luck:
on-sale information is owned by companies whose business is selling access to
it. Nobody gives it away.

That left me a choice. I could keep DropWatch and bolt a live figure onto its
edge — a currency conversion on an invented price — or I could build something
whose centre is sourceable. Prof. Roh's Saturday email allowed building from
scratch, so I took the second option. I was also offered four ready-made
suggestions and turned all four down before arriving at this one; a carpark
board and an exchange-rate tracker were technically easier, but I could not see
who would open them twice. Afterglow answers a question I have actually had:
whether it is worth carrying a tripod out before dawn.

---

## Step 6 — what "good" means for this product, and how it scores

### Front end

| # | Criterion | Why it matters to my user | How anyone can test it |
|---|---|---|---|
| **F1** | A first-time visitor on a phone can say what this is for within four seconds, without scrolling or asking. | Someone deciding whether to leave the house has no patience for a product that explains itself. | Hand your phone to someone who has not seen it and ask what it is for. |
| **F2** | The three parts of the one job — *is tonight worth it*, *which spot*, *what time* — are all reachable on a 390px screen without hunting. | Those three questions are the whole product. | Open it at 390px and find all three. |
| **F3** | Every figure is either sourced and labelled with its source, or visibly disclosed as my own calculation. | This is what Problem Set 2 is about: a product should be able to support what it claims. | Point at any number and find, in one step, where it came from. |
| **F4** | Nothing is clipped and nothing scrolls sideways at 390px. | The user is outdoors, on a phone, before dawn. | Open it on a real phone and swipe left. |
| **F5** | The product discriminates: different days, different modes and different spots produce genuinely different answers. | A recommendation that is the same whatever the weather is decoration. | Compare sunrise against sunset on one day, and compare the five spots against each other. |

**F1 — met.** The header reads "Golden hour decision tool for sunrise & sunset
photographers" and the pull-quote states the job in the user's own words.
Neither requires scrolling.

**F2 — partly met.** At 390px the time, the score and the verdict are visible
without scrolling. The ranked spot list is not — it sits below the four metric
cards, and "which spot to go to" is a third of the job. The winning spot's name
does appear in the time card, but the ranking that justifies it is further down
than it should be. If I rebuilt this I would put the winner beside the score.

**F3 — met.** The four atmospheric figures sit under a heading reading "SOURCED
ATMOSPHERIC METRICS" with "Source: Open-Meteo raw hourly metrics" beside them,
and the score carries a panel containing the sentence "This score is my own
method, not a figure published by any weather service."

This was a decision, not a formatting choice. The score is what the problem set
calls a Type B claim — a ranking nobody publishes — and the honest options were
to remove it or to disclose it. Removing it would have removed the product; the
whole point is a single answer to "is tonight worth it". So I kept it and made
two things true at once: the score is labelled as mine, and its four inputs stay
on screen beside it, so a reader who disbelieves my weighting can still read the
weather.

**F4 — met, but only since this afternoon.** Until today the Sunset/Sunrise
toggle overflowed the right edge at 390px and the Sunrise button was clipped.
It rendered correctly in the AI Studio preview and correctly on the deployed
desktop page. It was wrong only on an actual phone, which is where I found it.

**F5 — not met, and demonstrably so.** Between modes it discriminates clearly:
on 14 September the same site scored sunrise **88** and sunset **37**, with
different verdicts and different winning spots. Between *spots* it does not
always discriminate, and I established that by calling my own function rather
than by reasoning about it.

`/api/sky?mode=sunset` on 14 September returns, for Henderson Waves and for
Siloso Beach, byte-identical weather — `cloud_cover_low 9, cloud_cover_mid 4,
cloud_cover_high 6, visibility 9100` — and the same sunset time of 19:04. The
two are about 2.4 km apart and resolve to the same Open-Meteo forecast grid
cell. The other three spots return genuinely different figures, so the product
is not uniformly broken. But two of my five spots are one spot under two names,
and the screen ranks them first and second as though that order carried
information. It does not; it is array position.

I am recording this as **not met** rather than quietly deleting one of the pair,
because the criterion I wrote says the product must discriminate between spots
and it does not. With more time I would either drop one of them or print each
spot's raw figures in the ranked list, so a user can see for themselves that two
rows are identical.

### Back end

| # | Criterion | Why it matters to my user | How anyone can test it |
|---|---|---|---|
| **B1** | The credential is unreachable from the page and absent from the repository and its history. | My user is a stranger on a public URL. A leaked key is the one failure whose cost lands outside this classroom. | Search the repository. Read `api/apod.js`. Check `.gitignore`. |
| **B2** | Someone who is not me can find out whether the service is up, without asking me and without learning anything about the credential. | At 6am with a blank page, the user needs to know whether it is them or me. | Open `/api/health`. |
| **B3** | The product asks each source no more often than that source actually changes. | Both providers are free, and one is shared with a whole class. | Read the `Cache-Control` headers against each source's update rhythm. |
| **B4** | A failure produces a sentence the user can act on, and the two sections fail independently. | A photographer can act on "the forecast does not cover that day". Nobody can act on a spinner. | Break it and read the screen. |
| **B5** | The product behaves sensibly when a source is empty or out of range, not only when it is full. | The full case is the one every tutorial reaches. | Ask for something that does not exist. |

**B1 — met.** `api/apod.js` line 9 reads `process.env.NASA_API_KEY` and line 22
interpolates it at call time. There is no literal anywhere. `.gitignore`
contains `.env*` with `!.env.example`. The page calls `/api/sky` and `/api/apod`
on my own domain and never touches either provider directly. I checked this four
separate ways before pushing, and — as Q3 records — only one of those four
checks actually tested anything.

**B2 — met.** `/api/health` returns `keyConfigured` as a boolean, the HTTP
status each upstream returned, and a timestamp:
`{"keyConfigured":true,"upstreams":{"openMeteo":200,"nasa":200},"timestamp":"2026-09-14T09:00:46.250Z"}`.
It answers the question and reveals nothing about the key's value.

**B3 — met.** Open-Meteo updates hourly and is cached thirty minutes
(`s-maxage=1800, stale-while-revalidate=3600`). APOD changes once a day and is
cached an hour. One request serves all five spots through the multi-location
form rather than five separate calls.

**B4 — not met.** The six sentences exist, I specified them before prompting
rather than after, and I have read them in the code. I have seen exactly one of
them on a screen. I have never made either provider refuse me, never made either
unreachable, and never watched the two sections fail independently. The JSON
carries `"missingSpots":[]`, so the partial-failure path is implemented and has
simply never fired. What I have is a design for failure, not a tested one — and
the criterion asks what the product does when something is wrong.

**B5 — not met, and worse than not met.** The out-of-range case is the one
failure state I can produce, and only by calling the function directly:
`/api/sky?mode=sunset&date=2026-10-30` returns
`{"outOfRange":true,...,"availableDates":[...]}`, which is correct and even
helpful. But **no user can ever see it**, because the date dropdown offers only
the seven days that have data. The state is unreachable from the interface. I
did not design it that way. See Q5.

---

## Step 8 — assessing the collaboration

### Q1 — Where did the agent make me faster, and by how much?

About four and a quarter hours in total: roughly two hours deciding what to
build and calling both providers by hand, about an hour and a half from the
master prompt to a working deployment with a health endpoint and a credential in
the right place, and forty-five minutes today on two fixes. I have never written
a line of code.

The classification matters more than the number, because the problem set asks
what kind of task it was. This was not something I could have done slowly. A
serverless function is not a thing I could have written in a week. What the
agent gave me was not speed; it was access to a category of work that was closed
to me.

Where the time actually went is the part I would defend. The two hours before
any prompt were spent opening both APIs in a browser and reading the real
responses, which is the step this problem set says not to skip. That is why the
first build worked: visibility came out as 11.2 km rather than 11200, and the
NASA credit read "Image: NASA" rather than "Image: undefined", because both were
rules in my guardrails before they could become bugs on my screen.

And one part was genuinely faster by hand, as the problem set predicts.
Everything after the GitHub push — creating the repository, adding
`NASA_API_KEY` in Vercel, redeploying — took under two minutes by hand, and
longer than that by conversation. I stopped asking and started clicking.

### Q2 — Where did it cost me time, and whose fault was that?

The worst twenty minutes of my weekend were neither the agent misunderstanding
me nor my instruction being unfinished. They were a third kind: a confident
assertion of a fact nobody had checked.

I needed to add `NASA_API_KEY` in Vercel. I was told to click the row labelled
Production on the Environments page. I looked at that page and could not find
it. I was then given a direct URL —
`vercel.com/mbai/afterglow/settings/environment-variables` — assembled from the
team name shown in Vercel's own sidebar. That is a display name, not the URL
slug. The page returned 404. The next suggestion, editing the tail of the
working URL, also did not get me there.

What ended it was not a better sentence. I asked for the row to be marked on my
own screenshot, and got the same image back with a red circle drawn around the
row I had been staring at for twenty minutes. The original instruction — "click
Production" — had been textually correct the whole time and unusable the whole
time.

Two things I take from this. First, the failure mode: not wrong information and
not a vague request, but an unverified claim delivered with the same confidence
as a verified one. Second, and more useful for next time: when an instruction is
correct but cannot be located, more words do not help. Pointing does. I should
have asked for the picture after the second failed attempt rather than the
fifth.

### Q3 — Did it ever hand me something that looked right and was not?

Twice this weekend, and neither time was it Gemini.

**The packages.** After the first build I was told that the agent had violated
my "no new npm packages" guardrail, because `package.json` contained
`lucide-react` and `motion`. The claim came with a conclusion attached: that
across two weeks, guardrails naming specific instances hold while categorical
ones fail — and a suggestion that I write that pattern into this document. It
read very well. It was also exactly the kind of thing I have no way to
adjudicate, since I cannot tell a template dependency from an added one by
looking.

So I did not put it in this document. I put it in the next prompt instead, and
required the agent to state the provenance itself. The answer was: *"Both
lucide-react and motion were already present in the starter template's initial
package.json and lockfile; neither package was added during implementation."*

The thing that stopped it was not knowledge. It was refusing to let a claim
about a third party stand on the authority of someone who had not asked the
third party.

**The credential checks.** Before pushing, I searched for my NASA key four
ways. GitHub's sidebar search returned "No matches found" — that box searches
file *names*, and a key is not a file name. GitHub's code search returned "0
files" — beneath a yellow banner on the same page reading *"This repository's
code is being indexed right now."* It had searched an empty index. Both looked
precisely like a pass. The only check that established anything was opening
`api/apod.js` and reading line 9 with my own eyes.

Three of four security checks reported success and tested nothing. I would have
accepted the first two. What I notice about the one that worked is that it was
the least clever: no search syntax, no tooling, just opening the file.

**The phone.** A smaller case but the same shape. The desktop preview was
right, the deployed desktop page was right, and the product was broken at 390px
where my user actually stands. My verification routine was about numbers and
states. It had nothing in it about width.

### Q4 — What did I have to know in order to supervise it?

Two things, and only one is technical.

The first is a piece of physics: a good sunset needs mid and high cloud but a
**clear low sky**, because once the sun is below the horizon the light reaches
the cloud base from underneath, and low cloud sits in the way of that path. That
sentence is why the scoring rule penalises low cloud, pushes mid and high toward
50%, and reads 14 September — 100% high cloud over a nearly clear low sky — as
an 88 rather than as an overcast write-off. The weights themselves were drafted
for me, but I could check them against the physics, and the physics is what let
me say the output was plausible rather than merely present.

The second is not technical at all, and it is the one I would keep: **which of
my spots face west and which face east.** Open-Meteo knows the weather at a
coordinate. It does not know you cannot photograph a sunrise from Siloso Beach.
Without that distinction in the specification, sunrise mode would have ranked
west-facing spots, every number on the screen would have been correct, and the
recommendation would have been useless. A product can be accurate and wrong at
the same time, and only a person who knows the domain can tell.

Turning it around: what would I have had to know to catch what I did not catch?
Three data traps — that Open-Meteo returns visibility in metres while labelling
the field `"m"`, that a multi-location response is an array whose first element
has no `location_id`, and that NASA's `copyright` field is present some days and
absent others — were named for me from the responses I had pasted. I read those
same responses and saw none of them. Each would have produced a screen that
looked finished and was wrong: 11200 km of visibility, a spot paired with
another spot's weather, and the word "undefined" printed under a photograph.
That is an accurate picture of my ceiling this week.

And one I caught without knowing anything: the grid collision in F5. I did not
need to know Open-Meteo's grid resolution — I just called my own function and
read five sets of figures side by side. Worth recording that my hypothesis was
wrong in its particulars: I expected Marina Barrage and Henderson Waves to
collide, and those two are genuinely distinct. Right about the mechanism, wrong
about the instance, which is an argument for checking rather than for having
good instincts.

### Q5 — Which decisions did I keep, and should I have kept more or fewer?

Mine, in the order they happened: that DropWatch's claims could not be sourced
and the product therefore had to change; that four suggested alternatives were
not worth building and this one was; the user and the job; that the score must be
disclosed as my own rather than presented as sourced, and that its inputs stay
on screen beside it; that the palette should be golden hour and should follow
the selected mode, because a product about that moment should look like it;
which figures stay visible; and, twice, that something I had been told was not
good enough to act on.

Not mine, and I should say so: the five spots, their coordinates and their
facings were drafted for me, as were the scoring weights and the wording of
every prompt. I judged all of them and I would defend all of them, but judging
is not the same as authoring.

One I should have handed over sooner: the Vercel configuration, which I tried to
do by conversation before doing it by hand in two minutes.

One that never reached my list at all: **the date dropdown.** I never asked for
one. The agent inferred it from my own out-of-range state and added it, and in
adding it made that state unreachable — because the dropdown lists only days
that have data, no user can request a day the forecast does not cover. It looked
like a convenience. It was a decision about what my user is permitted to ask,
and it silently deleted one of the six sentences I had been careful to specify
in advance.

The problem set says the boundary moves when a decision arrives already made,
dressed as a technical detail, and is accepted because it looks like code rather
than like a choice. That is the exact shape of this one, and I did not notice
until I went looking for the state on the screen and could not produce it.

The honest ending is that I have still not decided what I think. Preventing a
bad request is arguably better design than explaining it afterwards. But it was
my call to make, it was made without me, and the thing that unsettles me is not
the decision — it is that I would never have found out if I had not gone looking
for something I had written myself.

### Q6 — What does this mean for a team of thirty?

### Q6 — What does this mean for a team of thirty?

Last week I ended with three pointers for an organisation, written from a
product where nothing was real. The three I would write now come from the same
place but have evidence behind them, and they are narrower for it.

What breaks at thirty is not the code; it is that the places where the boundary
moved are invisible in the finished product. What breaks at thirty is not the code; it is that the places where the boundary
moved are invisible in the finished product. Three decisions moved without me
this weekend — a dropdown that quietly removed a state, a guardrail violation I
was told about that had not happened, and three security checks that reported
passes and tested nothing — and not one of them can be seen by opening the URL.
So I would put the review before the merge rather than before the deploy, and I
would require the review to cover **the diff nobody asked for**, because the
requested change is the half everyone is already motivated to look at. I would
refuse to let an agent settle what the product says when a source fails, and I
would require whoever ships it to have *seen* each of those states on a screen
rather than read them in a file — by my own criteria above I have not met that
bar myself, which is the point. And the thing I do not believe an organisation
could check today is whether a stated verification verified anything: I ran four
credential checks and three of them were theatre, and a checklist that records
"checked" without recording what the check would have caught is a record of
confidence rather than of safety.
