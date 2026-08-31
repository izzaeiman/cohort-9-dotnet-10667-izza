import re
with open('src/pages/profile/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<AppButton\s+variant=\"outlined\"[^>]*onClick=\{\(\) => setToastMessage\(\'Avatar upload placeholder[^\']+\'\)\}[^>]*>\s*Upload Avatar\s*</AppButton>', '', content, flags=re.DOTALL)

with open('src/pages/profile/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
