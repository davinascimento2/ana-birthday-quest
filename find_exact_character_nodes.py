import struct, json

with open('ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = gltf['nodes']
meshes = gltf['meshes']
materials = gltf['materials']
accessors = gltf['accessors']

root = nodes[126]
children = root['children']

print("=== ALL 126 NODES IN JU JU & DUAN DUAN ===")
for idx in children:
    node = nodes[idx]
    mesh_idx = node.get('mesh')
    if mesh_idx is None:
        continue
    mat = node.get('matrix', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
    # matrix is column major. translation is mat[12], mat[13], mat[14]
    tx, ty, tz = mat[12], mat[13], mat[14]
    
    prim = meshes[mesh_idx]['primitives'][0]
    mat_idx = prim.get('material')
    mat_name = materials[mat_idx]['name'] if mat_idx is not None else 'None'
    
    acc = accessors[prim['attributes']['POSITION']]
    min_pt = acc.get('min', [0, 0, 0])
    max_pt = acc.get('max', [0, 0, 0])
    
    # Check vertex count
    count = acc.get('count', 0)
    
    node_name = node.get('name', '')
    print(f"Node {idx:3d}: Name='{node_name:20s}' Mat='{mat_name:20s}' Verts={count:5d} Trans=({tx:7.2f}, {ty:7.2f}, {tz:7.2f}) BoundsX=[{min_pt[0]:6.2f}, {max_pt[0]:6.2f}]")
