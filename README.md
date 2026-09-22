# Terminal Portfolio

A CRT-terminal portfolio: BIOS boot sequence, an ASCII-art portrait generated
from a photo, and ~25 commands. Next.js 16 + TypeScript, statically rendered.

## Editing the content

Everything visible on the site lives in **`lib/config.ts`** — name, experience,
projects, skills, achievements, contact details. Nothing else needs touching to
keep the site current.

## Regenerating the ASCII portrait

```bash
node scripts/calibrate-ramp.mjs        # measure the font, writes lib/ramp.json
node scripts/img2ascii.mjs me.jpg      # writes lib/portrait.ts
node scripts/preview-ascii.mjs out.png # render it as an image to check it
```

Three things decide how good the output is.

**Tone.** Luminance is dithered (Floyd–Steinberg) rather than rounded, so a
gradient dissolves into a mix of two glyphs instead of banding into flat steps.

**Structure.** Edges are found with a Sobel filter and drawn with glyphs that
follow their direction — `|` `/` `\` `_` `-`. This is what lets a pair of
glasses and a jawline read as lines rather than as smudges of roughly the right
darkness.

**The ramp.** `calibrate-ramp.mjs` rasterises each candidate character in the
font the site actually renders with, measures its ink coverage, and picks the
twelve whose coverage is most evenly spaced. Guessing which characters look
darker is what produces banding: two glyphs that feel different often carry
near-identical coverage, so a stretch of skin flattens into one tone. The
measured ramp turned out to need `r`, `c` and `h` in the mid-range — none of
which an intuitive ramp like `@#*+=:.` contains.

The first run segments the subject from the background and caches the result as
`cutout.png`; delete that file after changing `OPTS.crop` so it re-segments.

Tunables sit in `OPTS` at the top of `scripts/img2ascii.mjs`:

| Option | Effect |
| --- | --- |
| `crop` | Region of the source photo to use. Crop tight to head-and-shoulders — a full-body shot leaves the face too small to read. |
| `width` / `smallWidth` | Character columns for the header portrait and for `neofetch`. |
| `equalise` | `0` keeps the photo's own tones, `1` fully flattens the histogram. Around `0.25` keeps a face legible. |
| `exposure` | Lightens everything before quantising. Dithering fills flat areas with texture, so this is usually what you reach for when the result reads too heavy. |
| `dither` | How much quantisation error carries into neighbouring cells. |
| `edges` | Threshold for directional glyphs; `0` disables them. |
| `contrast`, `gamma` | Standard tone controls. |
| `alphaCut` | Alpha threshold for what counts as background. Raise it if a halo appears. |

## Live data

`app/api/stats/route.ts` reports both GitHub accounts and LeetCode. The `gh`
command renders the figures, `contrib` draws the calendars, and the sidebar
shows a language donut and contribution grid per account. The response is
cached for an hour and each source is fetched independently, so one being down
doesn't take the others with it.

Tokens are optional; see `.env.example`. Without them the route falls back to
public data, which for an account with no public repositories is nothing at
all — that account is then simply omitted from the charts.

**On the work account.** Its repositories are private, so the route reads the
language split from the private side and returns *only the aggregate
percentages*. Repository names, descriptions and URLs are never included in the
response for such an account, and the contribution calendar is daily counts
alone. The published page can therefore say what the work is written in and how
much of it there is, without saying anything about what the work is.

## Graphics

Four visual layers, all built from the same data the text commands use:

- `contrib` draws the GitHub contribution grid in block characters. The
  calendar is GraphQL-only, so without `GITHUB_TOKEN` it falls back to roughly
  90 days reconstructed from public events and says so on screen.
- The portrait carries a cursor torch — a second copy at full brightness,
  clipped to a disc that follows the pointer. It is done with a CSS mask rather
  than per-character state because the portrait is ~4,500 spans.
- The sidebar renders a card per account — a language donut and a full
  contribution calendar with month labels — plus LeetCode difficulty bars, all
  as inline SVG in the theme's own colour. The divider between the two panes
  drags, so the split is the reader's to choose — double-click resets it, arrow
  keys adjust it when focused, and the width persists. Because the sidebar can
  be any width, it is a container query: past 440px its lists split into
  columns rather than stretching label and value to opposite margins.
- After two minutes untouched the portrait dissolves into a drifting-character
  screensaver that gathers and scatters on a slow cycle. Any input wakes it,
  and it never starts for readers who ask for reduced motion.

## Sharing

Running a content command writes it to the URL, so `?c=projects` opens straight
to that section — useful when sending the link for a particular role. `clear`
drops the parameter again.

`app/opengraph-image.tsx` renders the share card at build time: the full ASCII
portrait beside the name and prompt, in JetBrains Mono (bundled under
`assets/fonts/`, since the image is rendered outside the browser). The layout
also emits JSON-LD describing the person.

## Search

`lib/search.ts` builds a flat index over everything in `config.ts` — 64 entries
at present — and scores queries by where the term lands: a whole word in a
title outranks a prefix, which outranks a substring buried in the body. Every
query term has to match somewhere for an entry to count.

The sidebar searches as you type and highlights the matches; `/` on an empty
prompt or ⌘K anywhere jumps to the box, Escape returns to the terminal, and
clicking a result opens *that entry alone* via `show <id>`, with a line
offering the rest of its section.

Every entry is formatted by one renderer in `lib/render.ts`, which both the
section commands and `show` call. A result opened from search therefore reads
exactly as it does in its section, and there is no second copy of the
formatting to drift out of step. Idle, the sidebar
shows a contents list, a few counts and the outbound links.

The `find <term>` command runs the same search from the terminal, which is also
the fallback below 1240px where the sidebar is hidden.

## Small screens

Output is wrapped in JavaScript rather than by CSS, because the hanging indents
that make a bullet list readable cannot be expressed with `pre-wrap` alone. The
column count therefore has to follow the viewport: the terminal measures its own
character width and re-wraps every block when the window changes size. A block
keeps the command that produced it, not the resulting text, so the lines can be
derived again at any width.

Below 1240px the sidebar and its divider are hidden and `find` covers the same
ground. Below 820px the type shrinks, the header centres and the quick commands
grow to a comfortable thumb target. The prompt's real input carries a 16px font
regardless — the visible text is a sibling span, so it costs nothing visually
and stops iOS zooming the page when the input takes focus.

## Commands

`help` lists the public ones: about, whoami, experience, research, projects,
finance, skills, achievements, leadership, education, certifications, interests,
contact, social, resume, neofetch, theme, banner, clear.

Unlisted: `sudo`, `matrix`, `vim`, `ls`, `cat`, `pwd`, `date`, `echo`,
`history`, `exit`, plus aliases (`work`, `awards`, `quant`, `por`, `certs`,
`hobbies`, `cv`, `grep`, `search`).

Typing shows an inline suggestion in dim text — Tab or → accepts it, and Tab on
an ambiguous prefix prints all matches.

The terminal fills the viewport: the header and output scroll inside their own
region while the prompt stays pinned above the quick-command chips, so typing
never requires chasing the input down the page. Scrolling up to re-read
something is respected during a stream, but finished output always lands back
at the prompt.

Output streams in a word at a time, the way a model's response lands. Any key
or click jumps to the end, and readers whose OS asks for reduced motion get the
whole block at once. `components/StreamedLines.tsx` holds the pacing: long
output takes bigger bites so a block finishes in roughly 1.8s regardless of
length, and punctuation draws a short breath.

Themes: six swatches sit under the header, each painted in the colours it
selects, alongside a switch for the CRT overlays. `theme <name>` and `crt on` /
`crt off` do the same from the prompt.

`paper` is the default, so its colours are what `:root` carries and the CRT
overlays are opt-in — a class the client adds for any non-light theme — which
means the first paint needs no JavaScript to look right. A small script in the
document head then applies a stored preference before that paint, since a
reader who chose a dark theme should not get a frame of white on every visit.

Both preferences are written when they change rather than from an effect
watching the value — an effect keyed on state runs once with the default before
the stored value has been read, which saves the default over the preference.

`crt off` turns off the scanlines, vignette and phosphor glow when they get in
the way of reading; `crt on` brings them back. Both the theme and the CRT state
persist in `localStorage`, and the overlays are also suppressed automatically
for readers whose OS asks for reduced motion or increased contrast.

## Analytics

`@vercel/analytics` is mounted in the root layout. It reports nothing when run
locally — the package detects development and logs to the console instead — and
starts collecting once the site is deployed and Web Analytics is enabled for
the project in the Vercel dashboard.

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build
```
