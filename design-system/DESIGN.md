# booooks design system (v0, draft)

Source: styling of aardvarkbookclub.com, read from its published CSS and rendered page on 2026-10-13. Colours, radii and the tag/button/card patterns are copied from there. Typeface is **MD Nichrome**, as you asked. Tokens live in [tokens.css](tokens.css).

## Character

Loud, playful, flat. Saturated colour blocks with black type, huge tight headings, pill tags, rounded cards, no shadows and no borders on cards. Depth comes from colour, not elevation. For a writing product this means the chrome is bold and the reading surface is calm (see "Reading surface").

## Typeface: MD Nichrome

- One family for display and body. Weights 400 and 700.
- **It is a commercial font.** I did not add font files. Buy or confirm the web licence, then put `MDNichrome-Regular.woff2` and `MDNichrome-Bold.woff2` in `public/fonts/`. Until then the stack falls back to Helvetica Neue, Arial and the system font, so layout will shift slightly when the real font loads.
- I assumed "md nichrome system font" means this one family is the product's typeface. If you meant something else (for example, an installed system font or a different weight set), tell me.
- Check before relying on it: that it covers the languages you need, has a readable regular weight at 16px for long text, and renders poem line breaks and indentation well. The reference site sets headings in a bold display face at line-height about 0.8. Do not use 0.8 for anything over two lines; use 1.0 for subheadings.
- Reference site's separate handwritten accent font is dropped, since there is one family.

## Colour

| Role | Token | Value |
|---|---|---|
| Page | `--surface-page` | #ffffff |
| Brand surface (hero) | `--surface-brand` | #ffd24a |
| Primary action | `--action-primary-bg` | #fd48f2, black text |
| Secondary action | `--action-secondary-bg` | #faed8f, black text |
| Inverse action | `--action-inverse-bg` | #000, text #faed8f |
| Focus ring | `--focus-ring` | #3b308f |

Full palette (yellow, orange, pink, magenta, cyan, blue, violet, periwinkle, wine, green, olive, each with pale and soft tints) is in tokens.css.

**Contrast rules**
- Black text on any pale, soft, yellow, orange, cyan, pink or green block.
- White text only on violet, wine, black and blue (#006fff). Do not put white on magenta, periwinkle or pink for small text (below about 4.5:1; I have not measured each pair, so run a contrast check before shipping).
- Never use colour alone to carry meaning (kind, status). Tags always have text.

## Shape and space

- Pill buttons and cards: radius 1rem. Tags: 0.8rem. Square buttons: 0.25rem. Inputs: 0.8rem. Icon buttons: circle.
- 4px spacing scale, 1.5rem page margin, 44px minimum tap target.
- No shadows.

## Components (in tokens.css)

- **Button** `.btn`: pink, bold, 1rem radius. Variants: `--secondary` (pale yellow), `--inverse` (black), `--square`, `--icon`.
- **Tag** `.tag`: small pill. Use for piece kind (poem, story, post, review), visibility and status. Suggested mapping: poem periwinkle, story cyan, post yellow, review pink, private black.
- **Card** `.card`: flat colour block. One colour per card, black text.
- **Input** `.input`: white, 2px black outline, because the reference site's inputs have no visible border, which is weak for accessibility.

## Reading surface (booooks-specific, not from the reference)

Writers and readers spend their time in long text. The playful palette belongs to the frame (navigation, cards, tags, buttons, empty states), not the page of text.
- Piece text: white or pale-soft background, black text, 18 to 20px, line-height 1.5 to 1.7, measure 60 to 70 characters, no tight letter-spacing (use `letter-spacing: 0` here, not the body default).
- Poems: `white-space: pre-wrap`, preserve indentation, no justified text.
- Themes for pieces (later) can reuse the soft tints as page backgrounds.

## Motion

Short, springy transitions (120 to 240ms, ease-out), scale on press. The reference site uses large animated hero illustrations and smooth scroll; those are not adopted. Everything respects `prefers-reduced-motion` (tokens go to 0ms).

## Not copied

Logo, illustrations, book imagery, copy and the Champ and Degular fonts belong to Aardvark Book Club. Only the general visual language (palette values, proportions, component patterns) is reused. Pick your own logo and illustration style, and consider shifting the palette a little so the product does not read as a clone.

## Open questions

1. Is MD Nichrome licensed for web use, and do you have the files?
2. Keep Aardvark's exact palette, or shift it to be your own?
3. Do you want this as Tailwind theme config next? The plan uses Tailwind, so tokens.css can map into `@theme` directly.
