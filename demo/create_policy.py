import httpx

url = "https://q-f8z0.onrender.com"
headers = {"Authorization": "Bearer dummy_token_for_mvp"}

policy = {
    "name": "Block Database Drops",
    "description": "Prevents any agent from dropping databases",
    "policy_type": "tool_restriction",
    "conditions": {"tool_name": "drop_database"},
    "actions": {"type": "block"},
    "severity": "critical"
}

r = httpx.post(f"{url}/policies/", json=policy, headers=headers)
print("Policy Creation:", r.status_code, r.text)
