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

## Commands

`help` lists the public ones: about, whoami, experience, research, projects,
finance, skills, achievements, leadership, education, certifications, interests,
contact, social, resume, neofetch, theme, banner, clear.

Unlisted: `sudo`, `matrix`, `vim`, `ls`, `cat`, `pwd`, `date`, `echo`,
`history`, `exit`, plus aliases (`work`, `awards`, `quant`, `por`, `certs`,
`hobbies`, `cv`).

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
