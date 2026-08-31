import re

with open('src/components/layout/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the searchWrap div block
content = re.sub(r'<!-- Search bar -->.*?<div className=\{styles\.searchWrap\}>.*?</div>', '', content, flags=re.DOTALL)
content = re.sub(r'\{\/\* Search bar \*\/\}\s*<div className=\{styles\.searchWrap\}>.*?</div>', '', content, flags=re.DOTALL)

# Remove the keyboard shortcut effect
content = re.sub(r'// Global Ctrl\+K.*?\}\, \[\]\);', '', content, flags=re.DOTALL)

with open('src/components/layout/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
