import re
with open('src/pages/profile/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\s*<button[^>]*\'security\'[^>]*>.*?Sessions & Security\s*</button>', '', content, flags=re.DOTALL)

with open('src/pages/profile/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
