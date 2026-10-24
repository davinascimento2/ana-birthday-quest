with open('test_sketchfang/sketchfang/pipeline.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'bin_map = {"model_file.binz": model_bin, "model_file.bin": model_bin}',
    'bin_map = {"model_file.binz": model_bin, "model_file.bin": model_bin, "model_file.bin.gz": model_bin}'
)

with open('test_sketchfang/sketchfang/pipeline.py', 'w', encoding='utf-8') as f:
    f.write(text)

with open('test_sketchfang/sketchfang/osgjs/buffers.py', 'r', encoding='utf-8') as f:
    btext = f.read()

target = '''        if blob is None:
            raise KeyError(f"Missing binary file {fname!r} (have {list(bin_map)})")'''

replacement = '''        if blob is None and bin_map:
            blob = next(iter(bin_map.values()))
        if blob is None:
            raise KeyError(f"Missing binary file {fname!r} (have {list(bin_map)})")'''

btext = btext.replace(target.replace('\r\n', '\n'), replacement)
btext = btext.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))

with open('test_sketchfang/sketchfang/osgjs/buffers.py', 'w', encoding='utf-8') as f:
    f.write(btext)

print("Patched pipeline.py and buffers.py")
