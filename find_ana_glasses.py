import struct, json

with open('ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = gltf['nodes']
meshes = gltf['meshes']
materials = gltf['materials']
accessors = gltf['accessors']

root = nodes[126]
children = root['children']

print("=== CHECKING NODES NEAR ANA'S EYES/FACE ===")
for idx in children:
    node = nodes[idx]
    mesh_idx = node.get('mesh')
    if mesh_idx is None:
        continue
    mat = node.get('matrix')
    tx, ty, tz = mat[12], mat[13], mat[14]
    if tx > 0:
        continue
    
    prim = meshes[mesh_idx]['primitives'][0]
    mat_idx = prim.get('material')
    mat_name = materials[mat_idx]['name'] if mat_idx is not None else ''
    
    acc = accessors[prim['attributes']['POSITION']]
    min_pt = acc.get('min', [0, 0, 0])
    max_pt = acc.get('max', [0, 0, 0])
    
    # Check if this node is at eye level (around Z ~ 9..10 or Y ~ -1.5..-2.0)
    print(f"Node {idx:3d}: Name='{node.get('name'):20s}' Mat='{mat_name:20s}' Trans=({tx:6.2f},{ty:6.2f},{tz:6.2f}) BoundsZ=[{min_pt[2]:5.2f},{max_pt[2]:5.2f}]")
