#!/usr/bin/env python3
"""
Move alba player from after model-viewer to before it (above)
"""

import os
import re

dirs_to_scan = [
    '/workspaces/website-8.0/iss',
    '/workspaces/website-8.0/venus',
    '/workspaces/website-8.0/saturn',
    '/workspaces/website-8.0/hubble',
    '/workspaces/website-8.0/neptune',
    '/workspaces/website-8.0/uranus',
    '/workspaces/website-8.0/turksat-1A',
    '/workspaces/website-8.0/turksat-1B',
    '/workspaces/website-8.0/turksat-1C',
    '/workspaces/website-8.0/turksat-2A',
    '/workspaces/website-8.0/turksat-3A',
    '/workspaces/website-8.0/turksat-4A',
    '/workspaces/website-8.0/turksat-5A',
    '/workspaces/website-8.0/turksat-5B',
    '/workspaces/website-8.0/turksat-6A',
    '/workspaces/website-8.0/kepler',
    '/workspaces/website-8.0/exomars',
    '/workspaces/website-8.0/ingenuity',
    '/workspaces/website-8.0/perseverance',
    '/workspaces/website-8.0/opportunity',
    '/workspaces/website-8.0/spirit',
    '/workspaces/website-8.0/zhurong',
    '/workspaces/website-8.0/marsodyssey',
    '/workspaces/website-8.0/marsreconnaissance',
    '/workspaces/website-8.0/gokturk-1',
    '/workspaces/website-8.0/gokturk-2',
    '/workspaces/website-8.0/rasat',
    '/workspaces/website-8.0/imece',
    '/workspaces/website-8.0/voyager1',
    '/workspaces/website-8.0/eng/mars',
    '/workspaces/website-8.0/eng/gokturk-2',
    '/workspaces/website-8.0/eng/sputnik',
    '/workspaces/website-8.0/eng/turksat-2A',
    '/workspaces/website-8.0/eng/iss',
]

def move_alba_above_viewer(filepath):
    """Move alba player from after model-viewer to before it"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if alba player already exists BEFORE model-viewer
    alba_before_viewer = re.search(r'<!-- Alba Futuristic Audio Player -->.*?</div>\s*\n\s*<model-viewer', content, re.DOTALL)
    if alba_before_viewer:
        print(f"✓ Already above viewer: {filepath}")
        return False
    
    # Find alba player AFTER model-viewer
    alba_after_pattern = r'\n\s*<!-- Alba Futuristic Audio Player -->.*?</div>\s*\n\s*</div>'
    alba_match = re.search(alba_after_pattern, content, re.DOTALL)
    
    if not alba_match:
        return False
    
    # Extract alba HTML
    alba_html = alba_match.group()
    
    # Remove alba from after model-viewer
    content_without_alba = content[:alba_match.start()] + '\n  </div>' + content[alba_match.end():]
    
    # Find <model-viewer tag and insert alba before it
    model_viewer_match = re.search(r'(\n\s*)<model-viewer', content_without_alba)
    if model_viewer_match:
        indent = model_viewer_match.group(1)
        insert_pos = model_viewer_match.start(1)
        
        # Add alba player before model-viewer
        final_content = content_without_alba[:insert_pos] + alba_html + '\n' + content_without_alba[insert_pos:]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(final_content)
        
        print(f"✓ Moved above viewer: {filepath}")
        return True
    
    return False

def main():
    moved = 0
    for dir_path in dirs_to_scan:
        index_file = os.path.join(dir_path, 'index.html')
        if os.path.exists(index_file):
            if move_alba_above_viewer(index_file):
                moved += 1
        else:
            print(f"✗ Not found: {index_file}")
    
    print(f"\nTotal files moved: {moved}")

if __name__ == '__main__':
    main()
