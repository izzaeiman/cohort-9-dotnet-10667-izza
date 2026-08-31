import re

with open('Controllers/UsersControllerTests.cs', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('controller.GetUsers()', 'controller.GetUsers(null)')

with open('Controllers/UsersControllerTests.cs', 'w', encoding='utf-8') as f:
    f.write(content)
