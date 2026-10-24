import struct, json

with open('ripped_models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes.decode('utf-8'))

for i, node in enumerate(gltf.get('nodes', [])):
    m = node.get('matrix')
    t = node.get('translation')
    r = node.get('rotation')
    s = node.get('scale')
    if m or t or r or s:
        print(f"Node {i} ({node.get('name')}): trans={t} rot={r} scale={s} mat={m is not None}")
