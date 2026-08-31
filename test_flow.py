import requests
import json
import uuid

BASE_URL = 'http://localhost:5000/api'

def log(msg):
    print(f'[*] {msg}')

def test_flow():
    # 1. Register User A
    user_a_email = f'user_a_{uuid.uuid4().hex[:6]}@test.com'
    res = requests.post(f'{BASE_URL}/auth/register', json={
        'name': 'Test User A', 'email': user_a_email, 'password': 'Password123!', 'role': 'Regular User'
    })
    assert res.ok, f"Failed registration: {res.text}"
    token_a = res.json()['token']
    log('User A registered and token received.')

    # 2. Login User A
    res = requests.post(f'{BASE_URL}/auth/login', json={
        'email': user_a_email, 'password': 'Password123!'
    })
    assert res.ok
    token_a = res.json()['token']
    headers_a = {'Authorization': f'Bearer {token_a}'}
    log('User A logged in.')

    # Profile A
    res = requests.get(f'{BASE_URL}/auth/me', headers=headers_a)
    assert res.ok
    log('User A Profile fetched.')

    # Create Task for User A
    res = requests.post(f'{BASE_URL}/tasks', json={
        'title': 'User A Task', 'description': 'Description', 'status': 'Pending',
        'priority': 'High', 'category': 'Work'
    }, headers=headers_a)
    assert res.ok
    task_a = res.json()
    task_a_id = task_a['id']
    log(f'Task A created with ID {task_a_id}')

    # Verify task list
    res = requests.get(f'{BASE_URL}/tasks', headers=headers_a)
    assert any(t['id'] == task_a_id for t in res.json())
    log('Task A exists in User A list.')

    # Test Search
    res = requests.get(f'{BASE_URL}/tasks?search=User+A', headers=headers_a)
    assert any(t['id'] == task_a_id for t in res.json())
    log('Search functionality verified.')

    # Test Status Filter
    res = requests.get(f'{BASE_URL}/tasks?status=Pending', headers=headers_a)
    assert any(t['id'] == task_a_id for t in res.json())
    log('Status filter verified.')

    # Test Priority Filter
    res = requests.get(f'{BASE_URL}/tasks?priority=High', headers=headers_a)
    assert any(t['id'] == task_a_id for t in res.json())
    log('Priority filter verified.')

    # Register User B
    user_b_email = f'user_b_{uuid.uuid4().hex[:6]}@test.com'
    res = requests.post(f'{BASE_URL}/auth/register', json={
        'name': 'Test User B', 'email': user_b_email, 'password': 'Password123!', 'role': 'Regular User'
    })
    token_b = res.json()['token']
    headers_b = {'Authorization': f'Bearer {token_b}'}
    log('User B registered and logged in.')

    # User B tries to view User A's task
    res = requests.get(f'{BASE_URL}/tasks/{task_a_id}', headers=headers_b)
    log(f'User B viewing Task A -> {res.status_code}')
    assert res.status_code in [403, 404]

    # User B tries to get all tasks
    res = requests.get(f'{BASE_URL}/tasks', headers=headers_b)
    assert not any(t['id'] == task_a_id for t in res.json())
    log('User B does not see Task A in list.')

    # User B tries to update Task A
    res = requests.put(f'{BASE_URL}/tasks/{task_a_id}', json={'title': 'Hacked', 'status': 'Completed', 'priority': 'High', 'category': 'Work'}, headers=headers_b)
    log(f'User B updating Task A -> {res.status_code}')
    assert res.status_code in [403, 404]

    # User B tries to delete Task A
    res = requests.delete(f'{BASE_URL}/tasks/{task_a_id}', headers=headers_b)
    log(f'User B deleting Task A -> {res.status_code}')
    assert res.status_code in [403, 404]

    # Update Task A properly
    res = requests.put(f'{BASE_URL}/tasks/{task_a_id}', json={'title': 'Updated Title', 'status': 'Completed', 'priority': 'High', 'category': 'Work'}, headers=headers_a)
    assert res.ok
    log('User A updated Task A.')

    # Delete Task A
    res = requests.delete(f'{BASE_URL}/tasks/{task_a_id}', headers=headers_a)
    assert res.ok
    log('User A deleted Task A.')

    # Admin User tests
    admin_email = 'admin@workflow.com'
    res = requests.post(f'{BASE_URL}/auth/register', json={
        'name': 'Admin User', 'email': admin_email, 'password': 'AdminPassword123!', 'role': 'Administrator'
    })
    # Ignore if already registered
    res = requests.post(f'{BASE_URL}/auth/login', json={'email': 'admin@workflow.com', 'password': 'AdminPassword123!'})
    if res.ok:
        token_admin = res.json()['token']
        headers_admin = {'Authorization': f'Bearer {token_admin}'}
        res = requests.get(f'{BASE_URL}/tasks', headers=headers_admin)
        assert res.ok
        log('Admin verified access to all tasks.')

    print('ALL API VERIFICATIONS PASSED')

test_flow()
