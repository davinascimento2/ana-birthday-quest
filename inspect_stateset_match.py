import json, requests
from test_sketchfang.sketchfang.materials.stateset import index_statesets
from test_sketchfang.sketchfang.materials.sketchfab import parse_materials

osgjs_url = "https://media.sketchfab.com/models/d8c4d09007fc4e0589c3640d8fa7c6a4/167532d7f1f74cf6917b96bbea023e54/files/0fcb724ccc054237977feda024c47245/file.osgjs.gz"
res = requests.get(osgjs_url)
scene = res.json()

reg = index_statesets(scene)
print(f"Registry length: {len(reg)}")
for k, v in list(reg.items())[:10]:
    print(f"k={k}, name={v.name}, slot_id={v.material_slot_id}, uid={v.stateset_uid}")

opts = requests.get("https://sketchfab.com/i/models/d8c4d09007fc4e0589c3640d8fa7c6a4/options").json()
parsed_mats = parse_materials(opts)
print(f"Parsed materials from options count: {len(parsed_mats)}")
for k, v in list(parsed_mats.items())[:10]:
    print(f"ss_id={k}, name={v.name}")
