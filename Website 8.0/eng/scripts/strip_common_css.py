#!/usr/bin/env python3
import re
from pathlib import Path

ENG = Path('/workspaces/website5/eng')
KEYWORDS = [
    'space-bg','model-viewer','atlas-','@keyframes','.hero','hero-','team-grid',
    'service-card','category-card','card-container','logo','background: url','background:url',
    'services-grid','model-viewer','top-bar','lang-switch','backdrop-filter','radial-gradient',
    'coming-wrapper','.container','@keyframes','animation','opacity','box-shadow','model-viewer'
]
COMMON_SELECTORS = [
    '.site-header', '.header-inner', '.header-logo', '.main-nav', '.header-social',
    '.social-icon-svg', '.top-lang-switch', '.page-wrapper', '.page-title', '.page-sub',
    'footer.footer', '.footer-grid', '.footer-logo', '.footer-social', '.footer-address', '.footer-center'
]

html_files = list(ENG.rglob('*.html'))
changed = []
for p in html_files:
    s = p.read_text(encoding='utf-8')
    if '<style>' not in s:
        continue
    pre, style_and_rest = s.split('<style>',1)
    style_content, post = style_and_rest.split('</style>',1)
    css = style_content

    # Simple parser to split into top-level blocks (handles nested @media etc.)
    blocks = []
    cur = ''
    depth = 0
    i = 0
    while i < len(css):
        ch = css[i]
        cur += ch
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                blocks.append(cur)
                cur = ''
        i += 1
    # any leftover
    if cur.strip():
        blocks.append(cur)

    keep_blocks = []
    for block in blocks:
        lower = block.lower()
        # if block is @media ... { ... }
        if block.strip().startswith('@media'):
            # include if inside has any keyword
            if any(k in lower for k in KEYWORDS):
                keep_blocks.append(block)
            else:
                # skip media if only common selectors inside
                continue
        else:
            # check if block contains any page-specific keyword
            if any(k in lower for k in KEYWORDS):
                keep_blocks.append(block)
            else:
                # check selector line (before first '{')
                sel = block.split('{',1)[0]
                if any(common in sel for common in COMMON_SELECTORS):
                    # skip common header/footer rule
                    continue
                else:
                    # unknown block — to be safe, keep it
                    keep_blocks.append(block)

    new_css = '\n'.join(b.strip() for b in keep_blocks).strip()
    if new_css:
        new_style = '<style>\n' + new_css + '\n</style>'
    else:
        new_style = ''

    new_s = pre + new_style + post
    if new_s != s:
        p.write_text(new_s, encoding='utf-8')
        changed.append(str(p.relative_to('/workspaces/website5')))

print('Modified files:')
for c in changed:
    print(c)
print('Total modified:', len(changed))
