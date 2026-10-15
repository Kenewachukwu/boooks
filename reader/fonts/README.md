# Fonts

The studio is set in **MD Nichrome** (big, bold, condensed), like the Aardvark Book Club reference. It is a commercial font, so the files are not in the repo.

Put your licensed web files here and the studio picks them up with no code change:

- `MDNichrome-Regular.woff2`
- `MDNichrome-Bold.woff2`

Until then the studio uses **Archivo** (condensed, from Google Fonts) as a stand-in, and the browser console shows two harmless 404s for the missing files. The `@font-face` rules are at the top of `studio/studio.css`.

The reader's story templates (Poster, Newsprint, Handwritten, Quiet serif) use free Google fonts and need nothing here.
