# ALBAMEN Cosmos — topic images

The same image pair is used in both **Quiz** and **Cards**.

Inside every topic folder keep exactly these filenames:

- `01 F.webp` — front/question image for item 01
- `01 B.webp` — back/answer image for item 01
- ...
- `10 F.webp`
- `10 B.webp`

`F` is shown before revealing/answering. `B` is shown after revealing/answering.

You can replace any `.webp` file manually in GitHub without changing the game code. Keep the filename unchanged.

Topic folders follow the category order used by the game:

1. `01-solar-system`
2. `02-planets`
3. `03-moon`
4. `04-stars`
5. `05-asteroids-comets`
6. `06-topic-06`
7. `07-topic-07`
8. `08-topic-08`
9. `09-topic-09`
10. `10-topic-10`

Folders 06–10 intentionally use neutral names so their mapping stays stable even if localized category titles change.

The `05-asteroids-comets` topic currently uses the real F/B images already supplied to the project while its files are still the generic placeholders. Replacing any of those `.webp` files with your own image automatically overrides the built-in asteroid/comet image for that slot.