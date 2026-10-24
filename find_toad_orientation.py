import struct, json

with open('ana_birthday_quest/assets/models/Toadsworth.glb', 'rb') as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = gltf['meshes']
accessors = gltf['accessors']
materials = gltf['materials']

for i, m in enumerate(meshes):
    name = m.get('name')
    prim = m['primitives'][0]
    mat_name = materials[prim['material']]['name'] if 'material' in prim else ''
    acc = accessors[prim['attributes']['POSITION']]
    min_pt = acc.get('min', [0, 0, 0])
    max_pt = acc.get('max', [0, 0, 0])
    center = [(min_pt[j] + max_pt[j]) / 2.0 for j in range(3)]
    print(f"Mesh {i:2d} ({name:15s} / {mat_name:15s}): Center = ({center[0]:5.2f}, {center[1]:5.2f}, {center[2]:5.2f}) BoundsZ=[{min_pt[2]:5.2f}, {max_pt[2]:5.2f}]")
