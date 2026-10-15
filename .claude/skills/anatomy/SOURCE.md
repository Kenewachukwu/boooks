# Where this skill came from

Installed on 2026-10-15 from https://github.com/wheresryan22/anatomy (main branch, MIT licence, see LICENSE), described at https://cellcog.ai/blog/anatomy-claude-skill/.

Copied unchanged into this project only (not a global install): SKILL.md, LICENSE, kit/, references/, agents/, scripts/ and examples/. The test suite, evals and repo meta files were left out.

Reviewed before installing: its code talks only to a local browser (Chrome DevTools on 127.0.0.1) for screenshots, has no eval, and deletes only temporary folders. `scripts/publish.mjs` can push a finished figure to GitHub through the `gh` CLI; per the skill's own references/publish.md it only runs when the user asks. Do not run it otherwise.

To update: re-copy from the upstream repo and re-check scripts/ for new network or file-deletion code.

## Examples are not in git
`examples/` (about 10 MB of full example figures that SKILL.md points to as the quality bar) is listed in the repo's .gitignore so it does not bloat the public history. It is present on the machine where the skill was installed. On a fresh clone, restore it with:

    git clone --depth 1 https://github.com/wheresryan22/anatomy /tmp/anatomy && cp -R /tmp/anatomy/examples .claude/skills/anatomy/examples
