import re

with open('src/services/projectService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('status?: string;', 'status?: any;')
content = content.replace('team?: any[];', 'team?: any;')

with open('src/services/projectService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
