
# Image Update Script
import os
import re

def update_html_files(root_dir):
    img_tag_pattern = re.compile(r'(<img\s+[^>]*src=["\'])([^"\']+\.)(jpg|png)(["\'][^>]*>)', re.IGNORECASE)
    
    for dirpath, _, filenames in os.walk(root_dir):
        if 'node_modules' in dirpath:
            continue
            
        for filename in filenames:
            if filename.endswith('.html'):
                filepath = os.path.join(dirpath, filename)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Function to replace match
                def replace_ext(match):
                    prefix = match.group(1)
                    path = match.group(2)
                    ext = match.group(3)
                    suffix = match.group(4)
                    # Check if it's a favicon (usually in link tags, but just in case img tag has favicon class?)
                    # The regex ensures it is an <img> tag.
                    # We also want to skip if it's some external URL?
                    # The path capture includes everything before extension. 
                    # If it starts with http/https AND is external, we might not have converted it.
                    # But our cwebp loop only converted local files in images/.
                    # So we should strictly only replace if the path contains 'images/'?
                    # or just replace all local looking paths.
                    # Let's check if new file exists?
                    # It's safer to just replace. We converted everything in images/.
                    
                    new_ext = 'webp'
                    return f"{prefix}{path}{new_ext}{suffix}"
                
                new_content = img_tag_pattern.sub(replace_ext, content)
                
                if new_content != content:
                    print(f"Updating {filepath}")
                    with open(filepath, 'w') as f:
                        f.write(new_content)

if __name__ == "__main__":
    update_html_files('.')
