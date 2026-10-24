import re

with open('ana_birthday_quest/js/models.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update createAnaCharacter
ana_start_target = """    createAnaCharacter() {
        const group = new THREE.Group();
        group.name = "Ana";"""

ana_start_replacement = """    createAnaCharacter() {
        const group = new THREE.Group();
        group.name = "Ana";

        const realModelGroup = new THREE.Group();
        realModelGroup.name = "AnaRealModelGroup";
        group.add(realModelGroup);

        const procGroup = new THREE.Group();
        procGroup.name = "AnaProcGroup";
        group.add(procGroup);"""

assert ana_start_target in code, "ana_start_target not found"
code = code.replace(ana_start_target, ana_start_replacement, 1)

# In createAnaCharacter, replace the specific group.add calls with procGroup.add
ana_add_targets = [
    ("group.add(bodyGroup);", "procGroup.add(bodyGroup);"),
    ("group.add(headGroup);", "procGroup.add(headGroup);"),
    ("group.add(armLGroup);", "procGroup.add(armLGroup);"),
    ("group.add(armRGroup);", "procGroup.add(armRGroup);"),
    ("group.add(legLGroup);", "procGroup.add(legLGroup);"),
    ("group.add(legRGroup);", "procGroup.add(legRGroup);"),
]
for tgt, rep in ana_add_targets:
    assert tgt in code, f"Ana target '{tgt}' not found"
    code = code.replace(tgt, rep, 1)

ana_end_target = """        armRGroup.add(parasol);

        return {"""

ana_end_replacement = """        armRGroup.add(parasol);

        this.loadGLTF('assets/models/ana_model.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const m = gltf.scene.clone();
                m.name = "AnaJuJuRealMesh";
                const box = new THREE.Box3().setFromObject(m);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 2.15 / (size.y || 1);
                m.scale.setScalar(scale);
                m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

                procGroup.visible = false;
                realModelGroup.add(m);
            }
        });

        return {"""

assert ana_end_target in code, "ana_end_target not found"
code = code.replace(ana_end_target, ana_end_replacement, 1)

# 2. Update createToadbigode
toad_start_target = """    createToadbigode() {
        const group = new THREE.Group();
        group.name = "Toadbigode";
        group.scale.set(0.78, 0.78, 0.78);"""

toad_start_replacement = """    createToadbigode() {
        const group = new THREE.Group();
        group.name = "Toadbigode";
        group.scale.set(0.78, 0.78, 0.78);

        const realModelGroup = new THREE.Group();
        realModelGroup.name = "ToadRealModelGroup";
        group.add(realModelGroup);

        const procGroup = new THREE.Group();
        procGroup.name = "ToadProcGroup";
        group.add(procGroup);"""

assert toad_start_target in code, "toad_start_target not found"
code = code.replace(toad_start_target, toad_start_replacement, 1)

toad_add_targets = [
    ("group.add(capGroup);", "procGroup.add(capGroup);"),
    ("group.add(head);", "procGroup.add(head);"),
    ("group.add(eye, catchlight);", "procGroup.add(eye, catchlight);"),
    ("group.add(spectaclesGroup);", "procGroup.add(spectaclesGroup);"),
    ("group.add(stacheGroup);", "procGroup.add(stacheGroup);"),
    ("group.add(belly);", "procGroup.add(belly);"),
    ("group.add(vestBody);", "procGroup.add(vestBody);"),
    ("group.add(frontBelly);", "procGroup.add(frontBelly);"),
    ("group.add(piping);", "procGroup.add(piping);"),
    ("group.add(button);", "procGroup.add(button);"),
    ("group.add(pants);", "procGroup.add(pants);"),
    ("group.add(foot);", "procGroup.add(foot);"),
    ("group.add(armLGroup);", "procGroup.add(armLGroup);"),
    ("group.add(armRGroup);", "procGroup.add(armRGroup);"),
]
for tgt, rep in toad_add_targets:
    assert tgt in code, f"Toad target '{tgt}' not found"
    code = code.replace(tgt, rep, 1)

toad_end_target = """        const balloon = this.createToadBalloon();
        group.add(balloon);

        return {"""

toad_end_replacement = """        const balloon = this.createToadBalloon();
        group.add(balloon);

        this.loadGLTF('assets/models/Toadsworth.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const m = gltf.scene.clone();
                m.name = "ToadsworthRealMesh";
                const box = new THREE.Box3().setFromObject(m);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 1.95 / (size.y || 1);
                m.scale.setScalar(scale);
                m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

                procGroup.visible = false;
                realModelGroup.add(m);
            }
        });

        return {"""

assert toad_end_target in code, "toad_end_target not found"
code = code.replace(toad_end_target, toad_end_replacement, 1)

# 3. Update createDaviCharacter
davi_start_target = """    createDaviCharacter() {
        const group = new THREE.Group();
        group.name = "Davi";"""

davi_start_replacement = """    createDaviCharacter() {
        const group = new THREE.Group();
        group.name = "Davi";

        const realModelGroup = new THREE.Group();
        realModelGroup.name = "DaviRealModelGroup";
        group.add(realModelGroup);

        const procGroup = new THREE.Group();
        procGroup.name = "DaviProcGroup";
        group.add(procGroup);"""

assert davi_start_target in code, "davi_start_target not found"
code = code.replace(davi_start_target, davi_start_replacement, 1)

davi_add_targets = [
    ("group.add(headGroup);", "procGroup.add(headGroup);"),
    ("group.add(body);", "procGroup.add(body);"),
    ("group.add(hoodRim);", "procGroup.add(hoodRim);"),
    ("group.add(string);", "procGroup.add(string);"),
    ("group.add(pocket);", "procGroup.add(pocket);"),
    ("group.add(backpackGroup);", "procGroup.add(backpackGroup);"),
    ("group.add(shortLeg, cargoPocket, leg, sock, sneaker, toeCap);", "procGroup.add(shortLeg, cargoPocket, leg, sock, sneaker, toeCap);"),
    ("group.add(armLGroup);", "procGroup.add(armLGroup);"),
    ("group.add(armRGroup);", "procGroup.add(armRGroup);"),
]
for tgt, rep in davi_add_targets:
    assert tgt in code, f"Davi target '{tgt}' not found"
    code = code.replace(tgt, rep, 1)

davi_end_target = """        armRGroup.add(skateboardGroup);
        procGroup.add(armRGroup);

        return {"""

davi_end_replacement = """        armRGroup.add(skateboardGroup);
        procGroup.add(armRGroup);

        this.loadGLTF('assets/models/davi_model.glb').then(gltf => {
            if (gltf && gltf.scene) {
                const m = gltf.scene.clone();
                m.name = "DaviDuanDuanRealMesh";
                const box = new THREE.Box3().setFromObject(m);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 2.25 / (size.y || 1);
                m.scale.setScalar(scale);
                m.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

                procGroup.visible = false;
                realModelGroup.add(m);
            }
        });

        return {"""

assert davi_end_target in code, "davi_end_target not found"
code = code.replace(davi_end_target, davi_end_replacement, 1)

# Preload trigger at the end of the script
preload_snippet = """
// Preload all real 3D models immediately into cache
if (typeof window !== 'undefined') {
    setTimeout(() => {
        if (typeof Models !== 'undefined' && Models.loadGLTF) {
            Models.loadGLTF('assets/models/ana_model.glb');
            Models.loadGLTF('assets/models/Toadsworth.glb');
            Models.loadGLTF('assets/models/davi_model.glb');
            Models.loadGLTF('assets/models/Field_Of_Flowers.glb');
            Models.loadGLTF('assets/models/Flower_Pack_Available_in_Fab.glb');
            Models.loadGLTF('assets/models/PSX_-_5_Skybox_Pack_I.glb');
        }
    }, 50);
}
"""

if "Preload all real 3D models immediately" not in code:
    code = code + preload_snippet

with open('ana_birthday_quest/js/models.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully integrated authentic 3D models into models.js!")
