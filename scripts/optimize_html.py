import re

def minify_css(css_content):
    # Remove comments
    css_content = re.sub(r'/\*[\s\S]*?\*/', '', css_content)
    # Remove extra whitespace
    css_content = re.sub(r'\s+', ' ', css_content)
    # Remove space around symbols
    css_content = re.sub(r'\s*([:;{}])\s*', r'\1', css_content)
    # Remove last semicolon in block
    css_content = re.sub(r';}', '}', css_content)
    return css_content.strip()

def optimize_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Minify Inline CSS
    def replace_css(match):
        return '<style>' + minify_css(match.group(1)) + '</style>'
    
    new_content = re.sub(r'<style>(.*?)</style>', replace_css, content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Optimized {file_path}")

if __name__ == "__main__":
    optimize_html("c:\\Users\\hhcre\\Desktop\\Zeyad\\Zencode\\website\\index.html")
