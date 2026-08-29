# Google Images for Orbital Launches

`worker-with-rocket-images.js` now uses the official Google Custom Search JSON API with `searchType=image`. It does **not** scrape Google Images HTML and it rejects Wikimedia/Wikipedia image hosts.

## Required Google configuration

1. In Google Cloud, enable **Custom Search API** for the project that will own the API key.
2. Create an API key.
3. Create a **Programmable Search Engine** and configure it to search the web. Enable image search.
4. Copy the Programmable Search Engine ID (`cx`).

## Cloudflare Worker secrets

From `cloudflare-worker/` run:

```bash
wrangler secret put GOOGLE_CSE_API_KEY
wrangler secret put GOOGLE_CSE_CX
wrangler deploy
```

Do not put either value in `wrangler.toml` or commit them to GitHub.

## Search behaviour

For each launch vehicle the Worker searches for:

```text
<vehicle name> rocket launch
```

The Google request uses:

- `searchType=image`
- `imgType=photo`
- `imgSize=large`
- SafeSearch
- a Creative Commons / public-domain rights expression that permits commercial and derivative reuse

The ranking code strongly prefers an exact vehicle-name match, launch/rocket context, large photos, and known official spaceflight sources. Results from `wikimedia.org` and `wikipedia.org` are rejected even when Google returns them.

The selected upstream image is proxied through `/api/orbital/rocket-image?vehicle=...` and cached by Cloudflare. The public metadata endpoint is `/api/orbital/rocket-image-meta?vehicle=...`.

Until the Google-backed Worker is deployed, `orbital-launch-images.js` deliberately rejects metadata from the older Wikimedia implementation so incorrect Commons photos are not shown.
