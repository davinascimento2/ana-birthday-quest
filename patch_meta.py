with open('test_sketchfang/sketchfang/api/metadata.py', 'r', encoding='utf-8') as f:
    text = f.read()

old_func = '''def model_file_url(osgjs_url: str) -> str:
    if "file.binz" in osgjs_url:
        return osgjs_url.replace("file.binz", "model_file.binz")
    if osgjs_url.endswith(".binz"):
        return osgjs_url[:-5] + "_model.binz"
    return osgjs_url.rsplit("/", 1)[0] + "/model_file.binz"'''

new_func = '''def model_file_url(osgjs_url: str) -> str:
    if "file.binz" in osgjs_url:
        return osgjs_url.replace("file.binz", "model_file.binz")
    if "file.osgjs.gz" in osgjs_url:
        return osgjs_url.replace("file.osgjs.gz", "model_file.bin.gz")
    if "file.osgjs" in osgjs_url:
        return osgjs_url.replace("file.osgjs", "model_file.bin")
    if osgjs_url.endswith(".binz"):
        return osgjs_url[:-5] + "_model.binz"
    return osgjs_url.rsplit("/", 1)[0] + "/model_file.bin.gz"'''

text = text.replace(old_func.replace('\r\n', '\n'), new_func)
text = text.replace(old_func.replace('\n', '\r\n'), new_func.replace('\n', '\r\n'))

with open('test_sketchfang/sketchfang/api/metadata.py', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated metadata.py successfully")
