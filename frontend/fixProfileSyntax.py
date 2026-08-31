import re
with open('src/pages/profile/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(") : activeTab === 'activity' ? (\n        <ActivityTimeline activities={INITIAL_ACTIVITIES} />\n      ) }", ") : activeTab === 'activity' ? (\n        <ActivityTimeline activities={INITIAL_ACTIVITIES} />\n      ) : null }")

with open('src/pages/profile/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
