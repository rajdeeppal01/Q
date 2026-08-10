import subprocess
import time
import urllib.request
import os

env = os.environ.copy()
env["DATABASE_URL"] = "postgresql://neondb_owner:npg_DU8jW0ErJNli@ep-polished-unit-axyqhvt0-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"

p = subprocess.Popen(
    ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
    cwd=r"c:\Users\rajde\OneDrive\Desktop\projects\q\backend",
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)
time.sleep(3)

try:
    url = "http://127.0.0.1:8001/agents/register"
    data = b'{"name": "test"}'
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error hitting local API: {e}")

p.kill()
stdout, _ = p.communicate()
print("--- UVICORN LOGS ---")
print(stdout)
