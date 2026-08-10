import os
import emoji

def remove_emojis_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # replace_emoji removes emojis. 
    clean_content = emoji.replace_emoji(content, replace='')
    
    if clean_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(clean_content)
        print(f"Removed emojis from {filepath}")

def process_directory(directory, extensions):
    for root, _, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                remove_emojis_from_file(filepath)

if __name__ == "__main__":
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/src'))
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/app'))
    
    print(f"Processing frontend: {frontend_dir}")
    process_directory(frontend_dir, ['.js', '.jsx'])
    
    print(f"Processing backend: {backend_dir}")
    process_directory(backend_dir, ['.py'])
    
    print("Done!")
