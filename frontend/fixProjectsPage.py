import re

with open('src/pages/projects/ProjectsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import type { ProjectItem } from '../../data/projects';",
    "import type { ProjectItem } from '../../services/projectService';"
)

content = re.sub(r'<StatusBadge status=\{project\.status\} />', '<span>Active</span>', content)
content = re.sub(r'\{project\.team && <AvatarGroup users=\{project\.team\} max=\{3\} />\}', '', content)
content = re.sub(r'<div className=\{styles\.progressWrapper\}>.*?</div>\s*</div>', '</div>', content, flags=re.DOTALL)
content = re.sub(r'<div className=\{styles\.meta\}>.*?</div>\s*</div>', '</div>', content, flags=re.DOTALL) 

content = content.replace('project.progress', '0')

new_schema = '''const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
});'''
content = re.sub(r'const projectSchema = z\.object\(\{.*?\}\);', new_schema, content, flags=re.DOTALL)

with open('src/pages/projects/ProjectsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
