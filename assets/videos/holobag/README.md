# Holo-bag sample videos / Holo-bag örnek videoları

Four vertical clips appear in the Holo-bag service page at:
- https://albaspace.com.tr/holobag.html
- https://albaspace.com.tr/eng/holobag.html
- https://albaspace.com.tr/rus/holobag.html

Add these **exact filenames** to this folder:
1. `holobag-01.mp4`
2. `holobag-02.mp4`
3. `holobag-03.mp4`
4. `holobag-04.mp4`

Export recommendations:
- Aspect ratio: **9:16** (portrait)
- Resolution: **1080 × 1920** (or 720 × 1280 for smaller files)
- Duration: **~15 seconds per video**
- Video: H.264 / AVC, MP4 container, yuv420p
- Audio: AAC (optional)
- Web delivery: enable Fast Start / moov atom at start
- Keep individual files reasonably small for mobile viewing.

No sample files are present yet. The landing page renders four clear placeholders until the matching MP4s exist. `/assets/js/holobag-videos.js` checks file availability and automatically replaces placeholders with HTML5 players. No changes to the page templates are required when the MP4s are added.

**Important:** These are product showcase videos, not shop products. The WhatsApp button opens a pre-filled rental/pricing inquiry; it does not checkout or charge anyone.
