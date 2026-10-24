import struct, json

with open('ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

for i, m in enumerate(gltf['materials']):
    name = m.get('name', '')
    pbr = m.get('pbrMetallicRoughness', {})
    col = pbr.get('baseColorFactor')
    tex = pbr.get('baseColorTexture')
    print(f"Mat {i:2d} ({name:20s}): col={col} tex={tex is not None}")
