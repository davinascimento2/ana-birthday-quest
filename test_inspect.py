import json

with open("ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb", "rb") as f:
    f.seek(12)
    chunk_len = int.from_bytes(f.read(4), "little")
    f.seek(20)
    gltf = json.loads(f.read(chunk_len).decode("utf-8"))

nodes = gltf["nodes"]
meshes = gltf["meshes"]
materials = gltf["materials"]

for i in range(29):
    node = nodes[i]
    m_idx = node.get("mesh")
    mat_name = "None"
    if m_idx is not None:
        prim = meshes[m_idx]["primitives"][0]
        mat_idx = prim.get("material")
        if mat_idx is not None:
            mat_name = materials[mat_idx]["name"]
    print(f"Node {i:2d}: name={node.get('name', ''):22s} mat={mat_name:20s}")
