# ALBAMEN Cosmos illustrations

`manifest.json` is the image routing table for the game. Its `quiz` entries use
the actual question IDs (for example, `Q-PLN-001`); its `cards` entries use the
actual study-card IDs (for example, `FC-PLANET-006`). Each entry has a `front`
image and a `back` image, with paths relative to this directory.

**Do not match a question and a study card by their position.** Their ordering
differs: for example, the hottest-planet quiz question and the Venus study card
both use `02-planets/venus.png`, despite having different numbers. This routing
is shared by Turkish, English and Russian, including randomly shuffled quizzes.

Images are grouped by subject and named for the illustrated concept. Square
uploads are preferred when both square and portrait versions exist. Existing
batch IDs are retained for telescope, mission and cosmology artwork. Older
variants are kept in each subject's `variants` directory. The source archives
and original generation prompts are also preserved.

`asset-renames.json` records every original image path, its new path, original
dimensions and SHA-256. Every unique original PNG is retained byte for byte;
byte-identical duplicates share one file. One corrected exoplanet image was
recovered from the existing ZIP archive. `placeholders` contains the two legacy
placeholder images for reference; neither is assigned to a playable item.

The current game has 100 quiz questions and 100 study cards. Their existing
artwork is mapped individually. `context_only` lists items for which the upload
has contextual artwork, rather than a dedicated depiction of that precise
phenomenon (for example, rocket launches or sunspots). Replacing those entries
with dedicated artwork later requires only editing the routing table.

`reserved` records the supplied batch IDs for future topics. The currently
locked topics retain their existing game behavior.

The original files include both square and portrait images. The game displays
them in square containers, preserving the entire source image with `contain`.
To replace an image, keep its documented path or update the matching entry in
`manifest.json`, and increase the media version in `topic-card-visuals.js` and
the three language entry pages to refresh browser caches.
