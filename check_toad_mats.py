import struct, json

with open('ana_birthday_quest/assets/models/Toadsworth.glb', 'rb') as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

for i, m in enumerate(gltf['materials']):
    pbr = m.get('pbrMetallicRoughness', {})
    tex = pbr.get('baseColorTexture')
    if tex is not None:
        source_idx = gltf['textures'][tex['index']]['source']
        img = gltf['images'][source_idx]
        print(f"Material {i:2d} ({m.get('name'):15s}): Image name={img.get('name')}")
    else:
        print(f"Material {i:2d} ({m.get('name'):15s}): NO TEXTURE, color={pbr.get('baseColorFactor')}")
