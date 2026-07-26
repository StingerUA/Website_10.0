import os
import re
import shutil

# Root directory of the project
PROJECT_ROOT = r"C:\Users\eladg\Albaspace.websıte.2.0\website.2.0"

def get_html_files(root_dir):
    html_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".html") and file.startswith("product-"):
                html_files.append(os.path.join(root, file))
    return html_files

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find main image src
    # Pattern 1: id before src
    match = re.search(r'<img[^>]*id="mainImage"[^>]*src="([^"]+)"', content)
    if not match:
        # Pattern 2: src before id
        match = re.search(r'<img[^>]*src="([^"]+)"[^>]*id="mainImage"', content)
    
    if not match:
        print(f"Skipping {file_path}: No mainImage found")
        return

    main_image_src = match.group(1)
    # main_image_src is like "/assets/images/hat.png"
    
    # Resolve absolute path to image
    if main_image_src.startswith("/"):
        image_rel_path = main_image_src.lstrip("/")
        image_abs_path = os.path.join(PROJECT_ROOT, image_rel_path.replace("/", os.sep))
    else:
        # Relative path? Should handle, but let's assume absolute for now based on previous file reads
        # If relative, it's relative to the HTML file location.
        # But most likely it's absolute from root.
        print(f"Skipping {file_path}: Relative src {main_image_src} not supported yet")
        return

    if not os.path.exists(image_abs_path):
        print(f"Warning: Image file not found at {image_abs_path} for {file_path}")
        # Even if image is missing, we proceed if we can create dummies (which we can't without source)
        return

    # Create 4 dummy images
    # We need to handle the case where path has backslashes or forward slashes
    base, ext = os.path.splitext(image_abs_path)
    # For relative path in HTML, keep forward slashes
    base_rel, ext_rel = os.path.splitext(main_image_src)
    
    dummy_images = []
    for i in range(1, 5):
        new_image_abs = f"{base}{i}{ext}"
        new_image_rel = f"{base_rel}{i}{ext_rel}"
        dummy_images.append(new_image_rel)
        
        if not os.path.exists(new_image_abs):
            try:
                shutil.copy2(image_abs_path, new_image_abs)
                print(f"Created {new_image_abs}")
            except Exception as e:
                print(f"Error copying {image_abs_path} to {new_image_abs}: {e}")

    # Update HTML
    # Find galleryThumbs container
    # <div class="flex gap-4 overflow-x-auto pb-2" id="galleryThumbs">
    # ... content ...
    # </div>
    
    # Using non-greedy match for content
    gallery_pattern = re.compile(r'(<div[^>]*id="galleryThumbs"[^>]*>)(.*?)(</div>)', re.DOTALL)
    gallery_match = gallery_pattern.search(content)
    
    if not gallery_match:
        print(f"Skipping {file_path}: No galleryThumbs found")
        return

    gallery_start = gallery_match.group(1)
    gallery_content = gallery_match.group(2)
    gallery_end = gallery_match.group(3)

    # Check if dummy images are already in gallery_content
    # We check if the filename of the first dummy image is present
    dummy_filename = os.path.basename(dummy_images[0])
    if dummy_filename in gallery_content:
        print(f"Skipping {file_path}: Dummy images already present")
        return

    # Create new buttons HTML
    new_buttons_html = ""
    for img_src in dummy_images:
        # Note: 'active' class only on the first one (which is already in gallery_content)
        # Using f-string with proper escaping
        btn = f"""
          <button class="thumb-btn rounded-xl flex-shrink-0 w-20 h-20 md:w-24 md:h-24 overflow-hidden" onclick="changeImage(this, '{img_src}')">
            <img src="{img_src}" class="w-full h-full object-cover">
          </button>"""
        new_buttons_html += btn

    # Append new buttons to existing content
    # We construct the new content by replacing the matched group 2
    
    # We need to be careful with regex replacement if we use re.sub, but here we splice strings
    start_idx = gallery_match.start(2)
    end_idx = gallery_match.end(2)
    
    new_full_content = content[:start_idx] + gallery_content + new_buttons_html + content[end_idx:]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_full_content)
    print(f"Updated {file_path}")

def main():
    files = get_html_files(PROJECT_ROOT)
    print(f"Found {len(files)} product files")
    for file in files:
        try:
            process_file(file)
        except Exception as e:
            print(f"Error processing {file}: {e}")

if __name__ == "__main__":
    main()
