# Terminal Portfolio

A CRT-terminal portfolio: BIOS boot sequence, an ASCII-art portrait generated
from a photo, and ~25 commands. Next.js 16 + TypeScript, statically rendered.

## Editing the content

Everything visible on the site lives in **`lib/config.ts`** — name, experience,
projects, skills, achievements, contact details. Nothing else needs touching to
keep the site current.

## Regenerating the ASCII portrait

```bash
node scripts/img2ascii.mjs me.jpg      # writes lib/portrait.ts
node scripts/preview-ascii.mjs out.png # render it as an image to check it
```

The first run segments the subject from the background and caches the result as
`cutout.png`; delete that file after changing `OPTS.crop` so it re-segments.

Tunables sit in `OPTS` at the top of `scripts/img2ascii.mjs`:

| Option | Effect |
| --- | --- |
| `crop` | Region of the source photo to use. Crop tight to head-and-shoulders — a full-body shot leaves the face too small to read. |
| `width` / `smallWidth` | Character columns for the header portrait and for `neofetch`. |
| `equalise` | `0` keeps the photo's own tones, `1` fully flattens the histogram. Around `0.25` keeps a face legible. |
| `contrast`, `gamma` | Standard tone controls, applied after equalisation. |
| `alphaCut` | Alpha threshold for what counts as background. Raise it if a halo appears. |

## Live data

`app/api/stats/route.ts` pulls public GitHub and LeetCode figures — repo and
star counts, a language breakdown, the most-starred repos, problems solved by
difficulty — and the `gh` command renders them. The response is cached for an
hour and each provider is fetched independently, so one being down doesn't take
the other with it. Set `GITHUB_TOKEN` to lift the unauthenticated rate limit.

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
clicking a result runs the command that prints it in full. Idle, the sidebar
shows a contents list, a few counts and the outbound links.

The `find <term>` command runs the same search from the terminal, which is also
the fallback below 1100px where the sidebar is hidden.

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

Themes: `theme <name>` — phosphor, amber, ice, matrix, vapor, paper. `paper` is
a light theme and skips the CRT overlays.

`crt off` turns off the scanlines, vignette and phosphor glow when they get in
the way of reading; `crt on` brings them back. Both the theme and the CRT state
persist in `localStorage`, and the overlays are also suppressed automatically
for readers whose OS asks for reduced motion or increased contrast.

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build
```
