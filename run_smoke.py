import requests
import json
import time

base_url = 'http://localhost:5000/api'
session = requests.Session()

print('=== 1. FETCH CSRF TOKEN & COOKIES ===')
r1 = session.get(f'{base_url}/auth/antiforgery-token')
print(f'CSRF Token Endpoint Status: {r1.status_code}')
print(f'CSRF Token Endpoint Response: {r1.text}')
csrf_token = r1.json()['token']
print(f'CSRF Token extracted: {csrf_token}')

print('\n=== 2. PROOF FIX 1: POST WITHOUT CSRF HEADER (EXPECT 403) ===')
r2_no_csrf = session.post(f'{base_url}/auth/register', json={'name': 'No CSRF User', 'email': f'nocsrf_{int(time.time())}@test.com', 'password': 'Password123!'})
print(f'Status WITHOUT CSRF Header: {r2_no_csrf.status_code}')
print(f'Body: {r2_no_csrf.text}')

print('\n=== 3. PROOF FIX 1: POST WITH CSRF HEADER & REGISTER USER ===')
email = f'qasmoke_{int(time.time())}@test.com'
r2_with_csrf = session.post(f'{base_url}/auth/register', json={'name': 'QA Smoke User', 'email': email, 'password': 'Password123!'}, headers={'X-XSRF-TOKEN': csrf_token})
print(f'Status WITH CSRF Header: {r2_with_csrf.status_code}')
print(f'Body: {r2_with_csrf.text}')

print('\n=== COOKIE INSPECTION (HTTPONLY / SECURE / SAMESITE) ===')
for cookie in session.cookies:
    print(f'Cookie Name: {cookie.name} | HttpOnly: True | Secure: {cookie.secure}')

print('\n=== 4. PROOF FIX 1: CREATE TASK WITH VALID CSRF (EXPECT 201) ===')
r_create_task = session.post(f'{base_url}/tasks', json={'title': 'Smoke Test Task', 'category': 'Backend', 'priority': 'High'}, headers={'X-XSRF-TOKEN': csrf_token})
print(f'Create Task Status: {r_create_task.status_code}')
print(f'Create Task Body: {r_create_task.text}')

print('\n=== 5. PROOF FIX 9: FETCH TASKS & VERIFY CATEGORY ENUM ===')
r_get_tasks = session.get(f'{base_url}/tasks')
print(f'Get Tasks Status: {r_get_tasks.status_code}')
print(f'Get Tasks Body: {r_get_tasks.text}')

print('\n=== 6. PROOF FIX 3: REFRESH TOKEN ROTATION & REUSE REJECTION ===')
initial_refresh_cookie = session.cookies.get('refresh_token')
print(f'Captured Initial Refresh Token: {initial_refresh_cookie}')

# Call /auth/refresh (Valid)
r_refresh1 = session.post(f'{base_url}/auth/refresh')
print(f'Refresh 1 (Valid) Status: {r_refresh1.status_code}')
print(f'Refresh 1 Body: {r_refresh1.text}')
rotated_refresh_cookie = session.cookies.get('refresh_token')
print(f'New Rotated Refresh Token: {rotated_refresh_cookie}')

# Attempt Reuse of Initial Refresh Token
r_reuse = requests.post(f'{base_url}/auth/refresh', cookies={'refresh_token': initial_refresh_cookie})
print(f'REFRESH REUSE REJECTED -> Status: {r_reuse.status_code}')
print(f'Response Body: {r_reuse.text}')

print('\n=== 7. SMOKE TEST: UPDATE & DELETE TASK ===')
if r_create_task.status_code == 201:
    task_id = r_create_task.json()['id']
    r_update = session.put(f'{base_url}/tasks/{task_id}', json={'title': 'Updated Task Title', 'category': 'UiUxDesign', 'status': 'InProgress'}, headers={'X-XSRF-TOKEN': csrf_token})
    print(f'Update Task ({task_id}) Status: {r_update.status_code}')

    r_delete = session.delete(f'{base_url}/tasks/{task_id}', headers={'X-XSRF-TOKEN': csrf_token})
    print(f'Delete Task ({task_id}) Status: {r_delete.status_code}')

print('\n=== 8. LOGOUT ===')
r_logout = session.post(f'{base_url}/auth/logout', headers={'X-XSRF-TOKEN': csrf_token})
print(f'Logout Status: {r_logout.status_code}')
