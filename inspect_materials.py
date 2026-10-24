import struct, json, sys

def inspect_glb(path):
    print("=== Inspecting", path, "===")
    with open(path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_bytes = f.read(chunk_len)
        gltf = json.loads(json_bytes.decode('utf-8'))
        
        print("Total nodes:", len(gltf.get('nodes', [])))
        print("Total meshes:", len(gltf.get('meshes', [])))
        print("Total materials:", len(gltf.get('materials', [])))
        
        for i, m in enumerate(gltf.get('materials', [])):
            pbr = m.get('pbrMetallicRoughness', {})
            tex = pbr.get('baseColorTexture')
            print(f"Material {i:2d}: name='{m.get('name')}' tex={tex}")

if __name__ == '__main__':
    inspect_glb(sys.argv[1])
