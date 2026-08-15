import json
import urllib.request
import os
import glob

url_workflows = "https://vps-6207995-x.dattaweb.com/api/v1/workflows"
headers = {
    "X-N8N-API-KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZjI5YWYwZS1lNDRjLTRlMGEtYWQ0My05YjQxODAzNGQxY2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjY1MGJlNjUtNGFhOS00MDEwLWIyODUtZjk3ZWVjNGRmMjNhIiwiaWF0IjoxNzg1NTA3NjMzLCJleHAiOjE3ODgwNTg4MDB9.6W8_mPeQ6ZE8lhSngNBZ_jZy2bZvMO3CtUtllHD5i-Q",
    "Content-Type": "application/json"
}

# New tag mapping
tag_mapping = {
    "Fonbec": "yzko98g7sECVjyXu",
    "NFC_Gym": "EzLQuEXLVTkkoXRo"
}

# 1. Fetch all workflows from new instance
req = urllib.request.Request(url_workflows, headers=headers, method="GET")
with urllib.request.urlopen(req) as res:
    new_workflows = json.loads(res.read().decode()).get("data", [])

new_wf_map = {wf["name"]: wf for wf in new_workflows}

# 2. Read local workflows to find tag associations
files = glob.glob("workflows_n8n/*.json")

success_count = 0
for file in files:
    with open(file, "r") as f:
        old_wf = json.load(f)
    
    wf_name = old_wf.get("name")
    old_tags = old_wf.get("tags", [])
    
    if not old_tags:
        continue
        
    if wf_name not in new_wf_map:
        print(f"Workflow {wf_name} not found in new instance.")
        continue
        
    new_wf = new_wf_map[wf_name]
    new_wf_id = new_wf["id"]
    
    # Map old tags to new tag objects
    new_wf_tags = []
    for ot in old_tags:
        t_name = ot.get("name")
        if t_name in tag_mapping:
            new_wf_tags.append({"id": tag_mapping[t_name], "name": t_name})
            
    if not new_wf_tags:
        continue

    # 3. Update the workflow in the new instance
    req_get = urllib.request.Request(f"{url_workflows}/{new_wf_id}", headers=headers, method="GET")
    with urllib.request.urlopen(req_get) as res:
        full_wf = json.loads(res.read().decode())
    
    allowed_keys = ["name", "nodes", "connections", "pinData", "staticData"]
    update_payload = {k: v for k, v in full_wf.items() if k in allowed_keys}
    update_payload["settings"] = {}
    
    update_payload["tags"] = [t["id"] for t in new_wf_tags] # Depending on API, arrays of IDs are often preferred for relationships
    
    data = json.dumps(update_payload).encode("utf-8")
    req_put = urllib.request.Request(f"{url_workflows}/{new_wf_id}", data=data, headers=headers, method="PUT")
    
    try:
        with urllib.request.urlopen(req_put) as response:
            print(f"Successfully updated tags for {wf_name}")
            success_count += 1
    except urllib.error.HTTPError as e:
        if e.code == 400:
            # Let's fallback to array of objects if array of IDs fails
            update_payload["tags"] = new_wf_tags
            data = json.dumps(update_payload).encode("utf-8")
            req_put2 = urllib.request.Request(f"{url_workflows}/{new_wf_id}", data=data, headers=headers, method="PUT")
            try:
                with urllib.request.urlopen(req_put2) as response:
                    print(f"Successfully updated tags for {wf_name} (using object format)")
                    success_count += 1
            except Exception as e2:
                print(f"Error updating {wf_name} on fallback: {e2}")
                if hasattr(e2, "read"):
                    print(e2.read().decode())
        else:
            print(f"Error updating {wf_name}: {e}")
            if hasattr(e, "read"):
                print(e.read().decode())

print(f"Successfully updated tags for {success_count} workflows.")
