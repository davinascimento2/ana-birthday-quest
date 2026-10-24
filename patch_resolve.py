with open('test_sketchfang/sketchfang/materials/resolve.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''    for mat in registry.values():
        pbr = by_slot.get(mat.material_slot_id) if mat.material_slot_id else None'''

replacement = '''    for mat in registry.values():
        slot_key = mat.material_slot_id if mat.material_slot_id is not None else mat.stateset_uid
        pbr = by_slot.get(slot_key)'''

text = text.replace(target.replace('\r\n', '\n'), replacement)
text = text.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))

with open('test_sketchfang/sketchfang/materials/resolve.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched resolve.py successfully")
