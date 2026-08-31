import re
with open('frontend/src/pages/profile/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix activeTab typing
content = content.replace("<'profile' | 'activity' | 'security'>", "<'profile' | 'activity'>")

# Remove tab button
content = re.sub(r'\s*<button\s+role=\"tab\"\s+aria-selected=\{activeTab === \'security\'\}.*?onClick=\{\(\) => setActiveTab\(\'security\'\)\}\s*>\s*Sessions & Security\s*</button>', '', content, flags=re.DOTALL)

# Remove tab content
content = re.sub(r':\s*\(\s*<div className=\{styles\.card\} style=\{\{ gap: \'16px\' \}\}>.*?Active Sessions & Security.*?</div>\s*\)', '', content, flags=re.DOTALL)

# Remove MdDevices import if any
content = re.sub(r',\s*MdDevices', '', content)
content = re.sub(r'MdDevices,\s*', '', content)
content = re.sub(r'MdDevices', '', content)

with open('frontend/src/pages/profile/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
