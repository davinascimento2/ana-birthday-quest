import struct, json

def mult_mat_vec(m, v):
    # m is column-major 16-element array
    # v is [x, y, z, 1.0]
    return [
        m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12]*v[3],
        m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13]*v[3],
        m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3],
        m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3],
    ]

with open('ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = gltf['nodes']
meshes = gltf['meshes']
accessors = gltf['accessors']

root = nodes[126]
children = root['children']

print("Analyzing children nodes and their world bounds:")

for idx in children:
    node = nodes[idx]
    mesh_idx = node.get('mesh')
    if mesh_idx is None:
        continue
    mat = node.get('matrix', [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    ])
    
    prim = meshes[mesh_idx]['primitives'][0]
    acc = accessors[prim['attributes']['POSITION']]
    min_pt = acc.get('min', [0, 0, 0])
    max_pt = acc.get('max', [0, 0, 0])
    center_local = [
        (min_pt[0] + max_pt[0]) / 2.0,
        (min_pt[1] + max_pt[1]) / 2.0,
        (min_pt[2] + max_pt[2]) / 2.0,
        1.0
    ]
    
    center_world = mult_mat_vec(mat, center_local)
    
    name = node.get('name', '')
    mat_name = ''
    if 'material' in prim:
        mat_name = gltf['materials'][prim['material']].get('name', '')
    
    print(f"Node {idx:3d} ({name:20s}): CenterWorld = [{center_world[0]:7.2f}, {center_world[1]:7.2f}, {center_world[2]:7.2f}], Mat: {mat_name}")
