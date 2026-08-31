import urllib.request
import json

repo = 'izzaeiman/cohort-9-dotnet-10667-izza'
url = f'https://api.github.com/repos/{repo}/actions/runs'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    for run in data['workflow_runs'][:5]:
        print(f"Run {run['id']} - {run['name']} - {run['conclusion']} - {run['html_url']}")
