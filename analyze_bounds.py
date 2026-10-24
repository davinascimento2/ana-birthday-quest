import struct, json

with open('ripped_models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes.decode('utf-8'))
    
    bin_chunk_len, bin_chunk_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_chunk_len)

accessors = gltf['accessors']
buffer_views = gltf['bufferViews']
meshes = gltf['meshes']

print(f"Total meshes: {len(meshes)}")

# For each mesh, find its min and max position bounds from the POSITION accessor
for i, m in enumerate(meshes):
    name = m.get('name', f'mesh_{i}')
    prim = m['primitives'][0]
    pos_acc_idx = prim['attributes']['POSITION']
    acc = accessors[pos_acc_idx]
    min_pt = acc.get('min', [0, 0, 0])
    max_pt = acc.get('max', [0, 0, 0])
    center_x = (min_pt[0] + max_pt[0]) / 2.0
    center_y = (min_pt[1] + max_pt[1]) / 2.0
    center_z = (min_pt[2] + max_pt[2]) / 2.0
    print(f"Mesh {i:3d} ({name:20s}): X=[{min_pt[0]:6.2f}, {max_pt[0]:6.2f}] Y=[{min_pt[1]:6.2f}, {max_pt[1]:6.2f}] Z=[{min_pt[2]:6.2f}, {max_pt[2]:6.2f}] CenterX={center_x:6.2f}")
