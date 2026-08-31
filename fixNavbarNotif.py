import re
with open('frontend/src/components/layout/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove notification bell
content = re.sub(r'\{/\* Notification Bell \*/\}.*?\{/\* Notifications Dropdown \*/\}.*?\{/\* User Profile Menu \*/\}', '{/* User Profile Menu */}', content, flags=re.DOTALL)

# Remove MdNotificationsNone import
content = re.sub(r'\s*MdNotificationsNone,', '', content)

with open('frontend/src/components/layout/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
