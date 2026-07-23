import urllib.request, json, zipfile, io
req = urllib.request.Request('https://api.github.com/repos/Ashutosh-rj/AI-Driven-Crime-Analytics-Visualization-Platform-ZOHO-2026/actions/runs?per_page=1')
res = urllib.request.urlopen(req)
run = json.loads(res.read())['workflow_runs'][0]
print("Run ID:", run['id'])
log_url = run['logs_url']
req2 = urllib.request.Request(log_url)
res2 = urllib.request.urlopen(req2)
z = zipfile.ZipFile(io.BytesIO(res2.read()))
for f in z.namelist():
    if 'security' in f.lower() or 'trivy' in f.lower():
        print(f"--- {f} ---")
        try:
            print(z.read(f).decode('utf-8'))
        except Exception as e:
            pass
