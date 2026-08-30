# Model narration scope

`assets/js/model-narrations-i18n.js` is intentionally limited to regular, non-Atlas model-viewer pages in the existing Turkish, English and Russian site trees.

The following MP3-synchronised demo slugs must not be overridden by the runtime narration registry:

- `gokturk-1`
- `rasat`
- `opportunity`
- `sojourner`
- `sputnik`

Paid Turkish `/atlas/atlas-*` pages continue to use `assets/js/atlas-narrations-tr.js`.

Arabic currently has no corresponding regular model-viewer page tree, so the narration router explicitly does not treat `/ar/` as a target language tree.
