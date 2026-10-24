import struct, json

with open('ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

for i, n in enumerate(gltf['nodes'][:30]):
    name = n.get('name')
    mat = n.get('matrix')
    if mat:
        # Check scale on diagonal
        sx, sy, sz = mat[0], mat[5], mat[10]
        tx, ty, tz = mat[12], mat[13], mat[14]
        print(f"Node {i:2d} ({name:20s}): Scale=({sx:8.4f}, {sy:8.4f}, {sz:8.4f}) Trans=({tx:8.2f}, {ty:8.2f}, {tz:8.2f})")
