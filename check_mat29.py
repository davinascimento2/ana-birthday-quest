import struct, json

with open('ana_birthday_quest/assets/models/Ju_Ju_and_Duan_Duan.glb', 'rb') as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(chunk_len).decode('utf-8'))

m = gltf['materials'][29]
tex_idx = m['pbrMetallicRoughness']['baseColorTexture']['index']
img_idx = gltf['textures'][tex_idx]['source']
img = gltf['images'][img_idx]
print("Material 29 image name/uri:", img.get('name'), img.get('uri'))
