# Env Contract Check — visual thesis

## Direction: the configuration print room

Env files look precise while hiding differences in interpretation. The site treats each parser as a separate risograph ink plate: cyan Node, vermilion Docker, and violet Python. When plates align, a dark registration mark appears; when they drift, the offset is visible. Paper grain, rough rules, overprint shadows, and clipped labels make parser semantics tangible without turning the interface into decoration.

This is deliberately a single-mode, warm-paper treatment. It fits a command-line tool whose work is inspection and proof: closer to a marked-up press sheet than a generic SaaS dashboard.

## Tokens

- Paper/background `#F4EBD6`; raised paper `#FFF8E8`; code paper `#171A18`.
- Ink/text `#17211D`; muted ink `#575B50`.
- Registration blue `#075E68`; interactive blue `#07545D`; blue tint `#B7D9D3`.
- Vermilion/accent `#C43B28`; violet `#563D76`; yellow `#E0A924`.
- Success `#17613B`; warning `#7A4C00`; danger `#9E271E`.
- All body/text pairings meet WCAG AA (4.5:1 or better). State also uses icon, label, and shape.

## Type and spacing

The display face is self-hosted **Fraunces**, a soft, print-conscious variable serif used only for large editorial headings. The working face is the self-hosted **IBM Plex Mono**, chosen because environment keys and terminal output must align. Both files are local WOFF2 subsets with `font-display: swap`; fallbacks are Georgia and ui-monospace.

The scale is 14 / 16 / 20 / 28 / 44 / 68 px. Body copy is at least 16 px. Spacing follows a strict 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96. Reading measure is capped around 68 characters.

## Layout and interaction grammar

Sections behave like sheets pinned to a workbench rather than interchangeable cards. A heavy registration rule anchors the header. Labels are small uppercase slugs with letterspacing. Buttons use an offset ink shadow that closes on press; focus uses a 3 px blue outline with a 3 px paper gap. Code and diagnostic areas use a dark plate, while explanatory content stays directly on paper.

The mobile edition stacks all plates, keeps actions at least 44 px, shortens the navigation to two essential destinations, and turns wide comparison rows into labeled blocks. There are no fixed bars, so safe areas and browser zoom remain unimpeded.

## Motion

Only state change moves. On entry, the three ink plates settle from a 4 px registration offset over 240 ms. Buttons close their 3 px print-shadow over 120 ms. Demo results fade and rise 6 px over 180 ms. No looping motion or parallax. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and states change instantly.

## Original asset plan and provenance

- `site/public/registration-press.webp`: original hero illustration generated for this product using the factory image generator (`/opt/fleet/lib/gen-image.sh`, `factory-image` deployment), then inspected and resized/encoded locally as 1440×960 WebP (241 KB), with a 720×480 responsive derivative (58 KB). The exact generator prompt and deployment record are preserved in `.factory/registration-press.prompt.json`; the prompt describes three translucent Node/Docker/Python risograph plates meeting at a registration target on torn paper, with explicit constraints against readable words, logos, gradients, photorealism, and watermarks. The image is explanatory atmosphere and has descriptive alt text.
- `site/public/env-contract-check-social.webp`: a 1200×630 center crop of the original registration-press art, made locally with ImageMagick for social previews. No new source material was introduced.
- `site/public/apple-touch-icon.png`: a local raster rendering of the hand-made registration mark and project palette.
- Registration marks, terminal rules, icons, and dot textures are hand-made in CSS. They are simple product-native interface motifs, not borrowed assets.

Generated art is project-owned output. Fonts use their upstream OFL licenses and are self-hosted; attribution files are kept with the font assets.
