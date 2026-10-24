import requests, json

url = "https://sketchfab.com/i/models/d8c4d09007fc4e0589c3640d8fa7c6a4/options"
data = requests.get(url).json()
mats = data.get("materials")
print("Type of materials:", type(mats))
if isinstance(mats, dict):
    for k, v in list(mats.items())[:5]:
        print(f"k={k}, type(v)={type(v)}, v={v}")
elif isinstance(mats, list):
    for v in mats[:5]:
        print(f"type(v)={type(v)}, v={v}")
