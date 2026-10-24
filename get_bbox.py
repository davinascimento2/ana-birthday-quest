import struct, json, sys

def get_bbox(path):
    with open(path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        gltf = json.loads(f.read(chunk_len).decode('utf-8'))
    
    accessors = gltf['accessors']
    min_all = [float('inf'), float('inf'), float('inf')]
    max_all = [float('-inf'), float('-inf'), float('-inf')]
    
    for m in gltf['meshes']:
        for p in m['primitives']:
            acc = accessors[p['attributes']['POSITION']]
            mn = acc.get('min', [0, 0, 0])
            mx = acc.get('max', [0, 0, 0])
            for i in range(3):
                min_all[i] = min(min_all[i], mn[i])
                max_all[i] = max(max_all[i], mx[i])
    
    size = [max_all[i] - min_all[i] for i in range(3)]
    center = [(max_all[i] + min_all[i]) / 2.0 for i in range(3)]
    print(f"{path}:")
    print(f"  Min: {min_all}")
    print(f"  Max: {max_all}")
    print(f"  Size: {size}")
    print(f"  Center: {center}")

if __name__ == '__main__':
    get_bbox(sys.argv[1])
