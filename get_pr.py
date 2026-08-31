import urllib.request
import json
url = 'https://api.github.com/repos/izzaeiman/cohort-9-dotnet-10667-izza/pulls/14'
req = urllib.request.Request(url)
req.add_header('Accept', 'application/vnd.github.v3+json')
with urllib.request.urlopen(req) as resp:
    d = json.loads(resp.read().decode())
    print('Head Repo:', d['head']['repo']['full_name'])
