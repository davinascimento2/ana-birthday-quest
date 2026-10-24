import os
import sys
import xml.etree.ElementTree as ET

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ref_counter = 0
def get_ref():
    global ref_counter
    ref_counter += 1
    return f"RBX_{ref_counter}"

def add_prop(elem, prop_type, name, val):
    p = ET.SubElement(elem, prop_type, {"name": name})
    p.text = str(val)
    return p

def add_cframe(elem, name, x, y, z, rx=0, ry=0, rz=0):
    cf = ET.SubElement(elem, "CoordinateFrame", {"name": name})
    ET.SubElement(cf, "X").text = str(x)
    ET.SubElement(cf, "Y").text = str(y)
    ET.SubElement(cf, "Z").text = str(z)
    ET.SubElement(cf, "R00").text = "1"
    ET.SubElement(cf, "R01").text = "0"
    ET.SubElement(cf, "R02").text = "0"
    ET.SubElement(cf, "R10").text = "0"
    ET.SubElement(cf, "R11").text = "1"
    ET.SubElement(cf, "R12").text = "0"
    ET.SubElement(cf, "R20").text = "0"
    ET.SubElement(cf, "R21").text = "0"
    ET.SubElement(cf, "R22").text = "1"
    return cf

def add_vector3(elem, name, x, y, z):
    v = ET.SubElement(elem, "Vector3", {"name": name})
    ET.SubElement(v, "X").text = str(x)
    ET.SubElement(v, "Y").text = str(y)
    ET.SubElement(v, "Z").text = str(z)
    return v

def add_color3(elem, name, r, g, b):
    c = ET.SubElement(elem, "Color3", {"name": name})
    ET.SubElement(c, "R").text = str(r / 255.0)
    ET.SubElement(c, "G").text = str(g / 255.0)
    ET.SubElement(c, "B").text = str(b / 255.0)
    return c

MAT_MAP = {
    "SmoothPlastic": "256",
    "Neon": "288",
    "ForceField": "1568",
    "Metal": "1088",
    "WoodPlanks": "512",
    "Glass": "1584",
    "Grass": "1280",
    "Cobblestone": "1312",
    "Foil": "1072",
    "Fabric": "1328"
}

SHAPE_MAP = {"Block": "1", "Cylinder": "2", "Ball": "0"}

def create_part(parent, name, size, pos, color, material="SmoothPlastic", shape="Block", can_collide=True, transparency=0.0):
    item = ET.SubElement(parent, "Item", {"class": "Part", "referent": get_ref()})
    props = ET.SubElement(item, "Properties")
    add_prop(props, "string", "Name", name)
    add_prop(props, "bool", "Anchored", "true")
    add_prop(props, "bool", "CanCollide", "true" if can_collide else "false")
    add_prop(props, "float", "Transparency", transparency)
    add_prop(props, "token", "Material", MAT_MAP.get(material, "256"))
    add_prop(props, "token", "shape", SHAPE_MAP.get(shape, "1"))
    
    add_vector3(props, "size", size[0], size[1], size[2])
    add_cframe(props, "CFrame", pos[0], pos[1], pos[2])
    add_color3(props, "Color", color[0], color[1], color[2])
    add_prop(props, "token", "TopSurface", "0")
    add_prop(props, "token", "BottomSurface", "0")
    return item

def create_billboard(parent, name, size, offset, text, color, text_size=24):
    gui = ET.SubElement(parent, "Item", {"class": "BillboardGui", "referent": get_ref()})
    gprops = ET.SubElement(gui, "Properties")
    add_prop(gprops, "string", "Name", name)
    add_prop(gprops, "bool", "AlwaysOnTop", "true")
    
    u2 = ET.SubElement(gprops, "UDim2", {"name": "Size"})
    ET.SubElement(u2, "XS").text = "0"
    ET.SubElement(u2, "XO").text = str(size[0])
    ET.SubElement(u2, "YS").text = "0"
    ET.SubElement(u2, "YO").text = str(size[1])
    
    add_vector3(gprops, "StudsOffset", offset[0], offset[1], offset[2])
    
    label = ET.SubElement(gui, "Item", {"class": "TextLabel", "referent": get_ref()})
    lprops = ET.SubElement(label, "Properties")
    add_prop(lprops, "string", "Name", "Label")
    add_prop(lprops, "float", "BackgroundTransparency", 1.0)
    add_prop(lprops, "string", "Text", text)
    add_color3(lprops, "TextColor3", color[0], color[1], color[2])
    add_color3(lprops, "TextStrokeColor3", 15, 15, 20)
    add_prop(lprops, "float", "TextStrokeTransparency", 0.1)
    add_prop(lprops, "float", "TextSize", text_size)
    add_prop(lprops, "token", "Font", "17")
    return gui

# ==============================================================================
# 1. ARCADE CLAW MACHINE (MÁQUINA DE GARRA 3D)
# ==============================================================================
def create_claw_machine(parent, pos):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = "ClawMachine_Arcade"
    
    px, py, pz = pos
    
    # Platform pedestal
    create_part(m, "PedestalBase", (18, 1.5, 18), (px, py + 0.75, pz), (30, 32, 48), material="SmoothPlastic")
    create_part(m, "PedestalNeonRim", (19, 0.4, 19), (px, py + 1.4, pz), (255, 215, 0), material="Neon")
    
    # Cabinet Base (Glossy Cyber Magenta)
    create_part(m, "CabinetLower", (12, 6, 12), (px, py + 4.5, pz), (230, 30, 110), material="SmoothPlastic")
    create_part(m, "CoinInsertSlot", (2.5, 1.2, 0.4), (px, py + 5.5, pz + 6.1), (255, 215, 0), material="Neon")
    create_part(m, "PrizeDropChute", (4.5, 3.5, 1.0), (px, py + 3.0, pz + 5.8), (15, 18, 25), material="Metal")
    
    # Control Console Deck (Joystick + 2 Big Arcade Buttons)
    create_part(m, "ConsoleDesk", (10, 1.2, 3.5), (px, py + 7.2, pz + 6.0), (45, 50, 70), material="SmoothPlastic")
    create_part(m, "JoystickBase", (0.8, 0.4, 0.8), (px - 2.5, py + 8.0, pz + 6.0), (10, 10, 15), shape="Cylinder")
    create_part(m, "JoystickStick", (0.3, 1.4, 0.3), (px - 2.5, py + 8.8, pz + 6.0), (200, 200, 210), material="Metal")
    create_part(m, "JoystickBall", (0.9, 0.9, 0.9), (px - 2.5, py + 9.6, pz + 6.0), (255, 40, 40), material="Neon", shape="Ball")
    create_part(m, "ArcadeButton1", (1.1, 0.5, 1.1), (px + 1.2, py + 8.0, pz + 6.0), (0, 240, 255), material="Neon", shape="Cylinder")
    create_part(m, "ArcadeButton2", (1.1, 0.5, 1.1), (px + 3.2, py + 8.0, pz + 6.0), (255, 220, 0), material="Neon", shape="Cylinder")
    
    # Transparent Glass Showcase (4 Sides)
    create_part(m, "GlassFront", (11.6, 9.0, 0.4), (px, py + 12.0, pz + 5.8), (180, 240, 255), material="Glass", transparency=0.65)
    create_part(m, "GlassBack", (11.6, 9.0, 0.4), (px, py + 12.0, pz - 5.8), (180, 240, 255), material="Glass", transparency=0.65)
    create_part(m, "GlassLeft", (0.4, 9.0, 11.6), (px - 5.8, py + 12.0, pz), (180, 240, 255), material="Glass", transparency=0.65)
    create_part(m, "GlassRight", (0.4, 9.0, 11.6), (px + 5.8, py + 12.0, pz), (180, 240, 255), material="Glass", transparency=0.65)
    
    # 4 Corner Pillars
    for dx in (-5.9, 5.9):
        for dz in (-5.9, 5.9):
            create_part(m, "CornerPost", (0.8, 9.2, 0.8), (px + dx, py + 12.0, pz + dz), (255, 215, 0), material="Neon")
            
    # Top Canopy & Marquee
    create_part(m, "CanopyRoof", (12.5, 3.2, 12.5), (px, py + 18.0, pz), (130, 20, 210), material="SmoothPlastic")
    create_part(m, "MarqueeSign", (11.0, 2.2, 0.6), (px, py + 18.0, pz + 6.3), (255, 240, 60), material="Neon")
    
    # Internal Crane Trolley & Mechanical Gantry
    create_part(m, "CraneRailX", (10.8, 0.4, 0.8), (px, py + 15.8, pz), (180, 180, 190), material="Metal")
    create_part(m, "CraneTrolley", (2.2, 0.8, 2.2), (px, py + 15.4, pz), (255, 215, 0), material="Neon")
    create_part(m, "CraneCable", (0.25, 4.0, 0.25), (px, py + 13.0, pz), (120, 120, 120), material="Metal")
    create_part(m, "ClawHub", (1.2, 0.8, 1.2), (px, py + 10.8, pz), (255, 230, 80), material="Neon", shape="Ball")
    # 4 Chrome Claw Prongs
    create_part(m, "ClawProng1", (0.3, 1.4, 0.8), (px + 0.8, py + 9.8, pz), (220, 220, 230), material="Metal")
    create_part(m, "ClawProng2", (0.3, 1.4, 0.8), (px - 0.8, py + 9.8, pz), (220, 220, 230), material="Metal")
    create_part(m, "ClawProng3", (0.8, 1.4, 0.3), (px, py + 9.8, pz + 0.8), (220, 220, 230), material="Metal")
    create_part(m, "ClawProng4", (0.8, 1.4, 0.3), (px, py + 9.8, pz - 0.8), (220, 220, 230), material="Metal")
    
    # Colorful Prize Capsules inside Pit
    prizes = [
        ("EggMythic", (px - 2.5, py + 8.0, pz - 2.5), (255, 50, 120), "Ball"),
        ("EggGold", (px + 2.5, py + 8.0, pz - 2.0), (255, 215, 0), "Ball"),
        ("GemDiamond", (px - 1.5, py + 7.8, pz + 2.0), (0, 240, 255), "Block"),
        ("HoneyJar", (px + 2.0, py + 7.8, pz + 2.2), (255, 180, 0), "Cylinder"),
        ("CosmicDipperPrize", (px, py + 8.0, pz), (180, 50, 255), "Block"),
    ]
    for p_name, p_pos, p_col, p_shp in prizes:
        create_part(m, p_name, (2.2, 2.2, 2.2), p_pos, p_col, material="Neon", shape=p_shp)
        
    # Floating Header Billboard & Prompt
    create_billboard(m, "ClawGui", (380, 80), (0, 22.0, 0), "🕹️ MÁQUINA DE GARRA MÍTICA 🕹️\n[CLAW TOKENS: Role Ovos, Chaves & Dippers!]", (255, 220, 40), text_size=24)
    
    return m

# ==============================================================================
# 2. TYCOON HIVE PLOTS (COLMÉIAS MULTIPLAYER 1 A 6)
# ==============================================================================
def create_hive_plot(parent, index, pad_pos, wall_pos, base_color):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = f"HivePlot_{index}"
    
    px, py, pz = pad_pos
    wx, wy, wz = wall_pos
    
    # 1. Baseplate platform
    create_part(m, "PlotBaseplate", (50, 2, 50), (px, py - 1.0, pz), (35, 40, 55), material="Cobblestone")
    create_part(m, "PlotNeonBorder", (52, 0.5, 52), (px, py + 0.1, pz), base_color, material="Neon")
    
    # 2. Central Honey Convert Pad
    pad = create_part(m, "ConvertPad", (14, 0.8, 14), (px, py + 0.4, pz), (255, 180, 20), material="Neon", shape="Cylinder")
    create_part(m, "ConvertPadCenter", (8, 1.0, 8), (px, py + 0.5, pz), (255, 235, 80), material="Neon", shape="Cylinder")
    create_billboard(pad, "PadGui", (320, 60), (0, 4.0, 0), f"🍯 COLMÉIA #{index}\n[Pise para Converter Pólen]", (255, 235, 80), text_size=22)
    
    # 3. Giant Honeycomb Hive Wall at the back
    create_part(m, "HiveWallBacking", (38, 24, 4), (wx, wy, wz), (220, 150, 30), material="WoodPlanks")
    create_part(m, "HiveWallRimTop", (40, 2, 5), (wx, wy + 12.0, wz), (255, 215, 0), material="Neon")
    
    # Hexagonal Honeycomb cells (5x4 grid = 20 cells)
    for row in range(4):
        for col in range(5):
            cx = wx - 14 + (col * 7.0)
            cy = wy - 7.5 + (row * 5.5)
            cz = wz - 2.2
            cell_color = (255, 200, 30) if (row + col) % 2 == 0 else (240, 160, 20)
            create_part(m, f"HexCell_{row}_{col}", (5.5, 4.5, 1.2), (cx, cy, cz), cell_color, material="SmoothPlastic", shape="Cylinder")
            # Glowing core
            create_part(m, f"HexCore_{row}_{col}", (2.8, 2.5, 1.4), (cx, cy, cz), (255, 235, 100), material="Neon", shape="Cylinder")
            
    # Floating Plot Claim / Owner Billboard
    create_billboard(m, "PlotSignGui", (340, 60), (0, 16.0, 0), f"🐝 COLMÉIA #{index} [LIVRE]\nReivindique ao Encostar!", (0, 240, 255), text_size=24)
    
    return m

# ==============================================================================
# 3. POLLEN FLOWER FIELDS (6 CAMPOS EXPANSIVOS)
# ==============================================================================
def create_pollen_field(parent, name, display_name, center_pos, bounds, base_color, flower_palette, req_level):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = name
    
    cx, cy, cz = center_pos
    bx, by, bz = bounds
    
    # 1. Field Soil Bed
    create_part(m, "FieldGround", (bx, 2.0, bz), (cx, cy - 1.0, cz), base_color, material="Grass")
    
    # 2. Perimeter Stone Fence & Glowing Lantern Posts
    create_part(m, "FenceNorth", (bx + 2, 1.5, 2), (cx, cy + 0.75, cz - bz/2), (180, 180, 190), material="Cobblestone")
    create_part(m, "FenceSouth", (bx + 2, 1.5, 2), (cx, cy + 0.75, cz + bz/2), (180, 180, 190), material="Cobblestone")
    create_part(m, "FenceEast", (2, 1.5, bz + 2), (cx + bx/2, cy + 0.75, cz), (180, 180, 190), material="Cobblestone")
    create_part(m, "FenceWest", (2, 1.5, bz + 2), (cx - bx/2, cy + 0.75, cz), (180, 180, 190), material="Cobblestone")
    
    # Glowing Corner Lanterns
    for dx in (-bx/2, bx/2):
        for dz in (-bz/2, bz/2):
            create_part(m, "CornerPost", (2.0, 5.0, 2.0), (cx + dx, cy + 2.5, cz + dz), (60, 65, 80), material="Metal")
            create_part(m, "LanternGem", (1.8, 1.8, 1.8), (cx + dx, cy + 5.5, cz + dz), flower_palette[0], material="Neon", shape="Ball")
            
    # 3. Dense 3D Flowers grid inside field
    # 6x6 = 36 physical decorative flower blooms
    step_x = (bx - 16) / 5.0
    step_z = (bz - 16) / 5.0
    for ix in range(6):
        for iz in range(6):
            fx = (cx - bx/2 + 8) + (ix * step_x)
            fz = (cz - bz/2 + 8) + (iz * step_z)
            col = flower_palette[(ix + iz) % len(flower_palette)]
            
            # Stem
            create_part(m, f"Stem_{ix}_{iz}", (0.5, 1.8, 0.5), (fx, cy + 0.9, fz), (40, 160, 60), material="SmoothPlastic")
            # Bloom Petal (Cylinder or Ball)
            create_part(m, f"Petal_{ix}_{iz}", (2.8, 0.8, 2.8), (fx, cy + 2.0, fz), col, material="Neon", shape="Cylinder")
            # Center Stamen
            create_part(m, f"Core_{ix}_{iz}", (1.2, 1.0, 1.2), (fx, cy + 2.3, fz), (255, 240, 120), material="Neon", shape="Ball")
            
    # 4. Field Signboard Billboard
    sign_pos = (cx, cy + 12.0, cz - bz/2 - 2)
    anchor = create_part(m, "SignAnchor", (1, 1, 1), sign_pos, (255, 255, 255), transparency=1.0, can_collide=False)
    create_billboard(anchor, "FieldSignGui", (360, 60), (0, 0, 0), f"{display_name}\n[Requer Nível {req_level}]", flower_palette[0], text_size=24)
    
    return m

# ==============================================================================
# 4. NPC BEARS (BLACK BEAR & SCIENCE BEAR)
# ==============================================================================
def create_bear_npc(parent, name, display_title, pos, fur_color):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = name
    
    px, py, pz = pos
    
    # Pedestal
    create_part(m, "Pedestal", (7, 1.5, 7), (px, py + 0.75, pz), (45, 50, 65), material="Cobblestone")
    create_part(m, "PedestalRim", (7.4, 0.4, 7.4), (px, py + 1.4, pz), (255, 215, 0), material="Neon")
    
    # Body
    create_part(m, "Torso", (5.0, 6.0, 4.0), (px, py + 4.5, pz), fur_color, shape="Ball")
    create_part(m, "Head", (4.2, 4.0, 4.0), (px, py + 8.5, pz), fur_color, shape="Ball")
    # Snout
    create_part(m, "Snout", (2.0, 1.5, 1.5), (px, py + 8.0, pz + 2.0), (240, 200, 160), shape="Cylinder")
    create_part(m, "Nose", (0.8, 0.6, 0.4), (px, py + 8.4, pz + 2.8), (20, 20, 25), shape="Ball")
    # Eyes
    create_part(m, "EyeL", (0.6, 0.6, 0.3), (px - 1.2, py + 9.2, pz + 1.8), (20, 20, 25), shape="Ball")
    create_part(m, "EyeR", (0.6, 0.6, 0.3), (px + 1.2, py + 9.2, pz + 1.8), (20, 20, 25), shape="Ball")
    # Ears
    create_part(m, "EarL", (1.2, 1.2, 0.6), (px - 1.8, py + 10.6, pz), fur_color, shape="Ball")
    create_part(m, "EarR", (1.2, 1.2, 0.6), (px + 1.8, py + 10.6, pz), fur_color, shape="Ball")
    # Honey Pot in paws
    create_part(m, "HoneyPot", (2.2, 2.6, 2.2), (px, py + 4.5, pz + 2.5), (180, 100, 40), shape="Cylinder")
    create_part(m, "HoneyLid", (2.4, 0.5, 2.4), (px, py + 5.8, pz + 2.5), (255, 200, 20), material="Neon", shape="Cylinder")
    
    # Overhead Quest Billboard
    create_billboard(m, "NpcGui", (320, 60), (0, 12.0, 0), f"🐻 {display_title}\n[Fale para Obter Missão!]", (255, 230, 80), text_size=22)
    return m

# ==============================================================================
# 5. SHOPS (TOOLS & BACKPACKS)
# ==============================================================================
def create_shop_kiosk(parent, name, title_text, pos, awning_color):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = name
    
    px, py, pz = pos
    # Base booth
    create_part(m, "Counter", (12, 4, 6), (px, py + 2.0, pz), (120, 75, 45), material="WoodPlanks")
    create_part(m, "CounterTop", (12.5, 0.8, 6.5), (px, py + 4.2, pz), (200, 160, 110), material="SmoothPlastic")
    # 4 Roof Poles
    create_part(m, "PoleFL", (0.6, 8, 0.6), (px - 5.5, py + 8.0, pz + 2.5), (80, 50, 30), material="WoodPlanks")
    create_part(m, "PoleFR", (0.6, 8, 0.6), (px + 5.5, py + 8.0, pz + 2.5), (80, 50, 30), material="WoodPlanks")
    create_part(m, "PoleBL", (0.6, 8, 0.6), (px - 5.5, py + 8.0, pz - 2.5), (80, 50, 30), material="WoodPlanks")
    create_part(m, "PoleBR", (0.6, 8, 0.6), (px + 5.5, py + 8.0, pz - 2.5), (80, 50, 30), material="WoodPlanks")
    # Striped Awning Roof
    create_part(m, "RoofAwning", (13.5, 1.5, 7.5), (px, py + 12.5, pz), awning_color, material="Fabric")
    create_part(m, "RoofNeonTrim", (14.0, 0.5, 8.0), (px, py + 12.0, pz), (255, 235, 80), material="Neon")
    
    create_billboard(m, "ShopGui", (340, 60), (0, 15.0, 0), title_text, (255, 230, 80), text_size=22)
    return m

# ==============================================================================
# 6. MOBS (LADYBUG, RHINO BEETLE & SPIDER BOSS)
# ==============================================================================
def create_ladybug_mob(parent, pos):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = "Mob_Ladybug"
    px, py, pz = pos
    # Red Shell with spots
    create_part(m, "Body", (4.5, 3.0, 5.0), (px, py + 1.5, pz), (255, 40, 40), shape="Ball")
    create_part(m, "Head", (2.0, 1.8, 1.8), (px, py + 1.2, pz + 2.6), (20, 20, 25), shape="Ball")
    # Black dots
    create_part(m, "Spot1", (0.8, 0.2, 0.8), (px - 1.2, py + 2.9, pz + 0.8), (20, 20, 25), shape="Cylinder")
    create_part(m, "Spot2", (0.8, 0.2, 0.8), (px + 1.2, py + 2.9, pz + 0.8), (20, 20, 25), shape="Cylinder")
    create_part(m, "Spot3", (0.8, 0.2, 0.8), (px - 1.0, py + 2.9, pz - 1.0), (20, 20, 25), shape="Cylinder")
    create_part(m, "Spot4", (0.8, 0.2, 0.8), (px + 1.0, py + 2.9, pz - 1.0), (20, 20, 25), shape="Cylinder")
    create_billboard(m, "MobGui", (220, 45), (0, 4.0, 0), "🐞 LADYBUG\nHP: 30", (255, 60, 60), text_size=18)
    return m

def create_beetle_mob(parent, pos):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = "Mob_RhinoBeetle"
    px, py, pz = pos
    create_part(m, "Body", (5.5, 3.5, 7.0), (px, py + 1.8, pz), (30, 45, 90), material="Metal")
    create_part(m, "Horn", (0.8, 3.5, 0.8), (px, py + 3.2, pz + 4.2), (180, 190, 220), material="Metal")
    create_billboard(m, "MobGui", (240, 45), (0, 4.5, 0), "🪲 RHINO BEETLE\nHP: 120", (0, 200, 255), text_size=18)
    return m

def create_spider_boss_mob(parent, pos):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = "Mob_SpiderBoss"
    px, py, pz = pos
    # Massive Black / Violet Abdomen
    create_part(m, "Abdomen", (10.0, 7.0, 12.0), (px, py + 4.5, pz - 4.0), (25, 20, 35), shape="Ball")
    create_part(m, "Cephalothorax", (7.0, 5.0, 6.0), (px, py + 3.5, pz + 4.0), (45, 25, 65), shape="Ball")
    # 8 Glowing Red Eyes
    for ex in (-1.8, -0.6, 0.6, 1.8):
        create_part(m, f"EyeTop_{ex}", (0.5, 0.5, 0.3), (px + ex, py + 5.5, pz + 6.8), (255, 0, 50), material="Neon", shape="Ball")
        create_part(m, f"EyeBot_{ex}", (0.4, 0.4, 0.3), (px + ex, py + 4.8, pz + 6.9), (255, 0, 50), material="Neon", shape="Ball")
    # Poison Fangs
    create_part(m, "FangL", (0.8, 2.0, 0.8), (px - 1.2, py + 2.0, pz + 7.2), (0, 255, 150), material="Neon")
    create_part(m, "FangR", (0.8, 2.0, 0.8), (px + 1.2, py + 2.0, pz + 7.2), (0, 255, 150), material="Neon")
    create_billboard(m, "BossGui", (320, 60), (0, 10.0, 0), "🕷️ GIANT SPIDER (BOSS)\nHP: 850", (255, 50, 50), text_size=24)
    return m

# ==============================================================================
# 7. PROGRESSION LEVEL GATES
# ==============================================================================
def create_level_gate(parent, name, pos, size, req_text, color):
    m = ET.SubElement(parent, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(m, "Properties"), "string", {"name": "Name"}).text = name
    px, py, pz = pos
    sx, sy, sz = size
    # Pillars
    create_part(m, "PillarL", (3, sy, 3), (px - sx/2, py + sy/2, pz), (40, 45, 60), material="Metal")
    create_part(m, "PillarR", (3, sy, 3), (px + sx/2, py + sy/2, pz), (40, 45, 60), material="Metal")
    create_part(m, "ArchTop", (sx + 4, 3, 4), (px, py + sy + 1.5, pz), (255, 215, 0), material="Neon")
    # ForceField Barrier
    barrier = create_part(m, "ForcefieldGate", (sx - 3, sy, 1.5), (px, py + sy/2, pz), color, material="ForceField", transparency=0.4)
    create_billboard(barrier, "GateGui", (360, 60), (0, 4.0, 0), req_text, (255, 235, 80), text_size=24)
    return m

# ==============================================================================
# MAIN WORLD GENERATOR
# ==============================================================================
def generate_world_rbxmx(filepath):
    root = ET.Element("roblox", {
        "xmlns:xmime": "http://www.w3.org/2005/05/xmlmime",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "version": "4"
    })
    
    zones_folder = ET.SubElement(root, "Item", {"class": "Folder", "referent": get_ref()})
    ET.SubElement(ET.SubElement(zones_folder, "Properties"), "string", {"name": "Name"}).text = "Zones"
    
    # 0. Global Massive Safety Baseplate
    create_part(zones_folder, "GiantBaseplate", (800, 4, 800), (0, -2, -80), (35, 45, 60), material="SmoothPlastic")
    
    # 1. Central Hub Plaza (Between Hive Plots and Fields)
    hub = ET.SubElement(zones_folder, "Item", {"class": "Model", "referent": get_ref()})
    ET.SubElement(ET.SubElement(hub, "Properties"), "string", {"name": "Name"}).text = "CentralHubPlaza"
    create_part(hub, "HubFloor", (140, 2, 70), (0, 0, 30), (55, 65, 85), material="Cobblestone")
    create_part(hub, "HubNeonBorder", (142, 0.4, 72), (0, 1.1, 30), (255, 215, 0), material="Neon")
    
    # Spawn Location
    spawn = ET.SubElement(hub, "Item", {"class": "SpawnLocation", "referent": get_ref()})
    sprops = ET.SubElement(spawn, "Properties")
    add_prop(sprops, "string", "Name", "SpawnLocation")
    add_prop(sprops, "bool", "Anchored", "true")
    add_prop(sprops, "bool", "CanCollide", "true")
    add_prop(sprops, "int", "Duration", "0")
    add_vector3(sprops, "size", 16, 1, 16)
    add_cframe(sprops, "CFrame", 0, 1.0, 48)
    add_color3(sprops, "Color", 80, 220, 150)
    add_prop(sprops, "token", "Material", "288") # Neon
    add_prop(sprops, "token", "TopSurface", "0")
    add_prop(sprops, "token", "BottomSurface", "0")
    
    # 2. Arcade Claw Machine at Center Hub (Vector3.new(0, 0, 15))
    create_claw_machine(hub, (0, 0, 15))
    
    # 3. NPC Bears
    create_bear_npc(hub, "NPC_BlackBear", "BLACK BEAR", (-45, 0, 35), (35, 30, 25))
    create_bear_npc(hub, "NPC_ScienceBear", "SCIENCE BEAR", (45, 0, 35), (240, 240, 245))
    
    # 4. Shops
    create_shop_kiosk(hub, "Shop_Tools", "⚡ LOJA DE FERRAMENTAS\n[Compre Rake, Scythe e Dipper]", (-30, 0, 52), (0, 180, 255))
    create_shop_kiosk(hub, "Shop_Backpacks", "🎒 LOJA DE MOCHILAS\n[Compre Jar, Canister e Coconut]", (30, 0, 52), (180, 50, 240))
    
    # 5. 6 Hive Tycoon Plots (Along Z = 100)
    plots_data = [
        (1, (-160, 0, 100), (-160, 12, 125), (245, 215, 65)),
        (2, (-95, 0, 100), (-95, 12, 125), (80, 220, 150)),
        (3, (-30, 0, 100), (-30, 12, 125), (0, 200, 255)),
        (4, (35, 0, 100), (35, 12, 125), (255, 110, 180)),
        (5, (100, 0, 100), (100, 12, 125), (180, 75, 230)),
        (6, (165, 0, 100), (165, 12, 125), (255, 140, 50)),
    ]
    for idx, pad_pos, wall_pos, col in plots_data:
        create_hive_plot(zones_folder, idx, pad_pos, wall_pos, col)
        
    # 6. 6 Pollen Fields
    # Sunflower Field (Level 1)
    create_pollen_field(
        zones_folder, "SunflowerField", "🌻 SUNFLOWER FIELD",
        (-75, 1, -40), (90, 4, 90), (100, 80, 40),
        [(255, 220, 20), (255, 180, 0), (255, 255, 100)], 1
    )
    create_ladybug_mob(zones_folder, (-75, 1.5, -40))
    
    # Clover Patch (Level 2)
    create_pollen_field(
        zones_folder, "CloverPatch", "🍀 CLOVER PATCH",
        (75, 1, -40), (90, 4, 90), (40, 130, 60),
        [(50, 220, 90), (100, 255, 140), (30, 180, 60)], 2
    )
    create_beetle_mob(zones_folder, (75, 1.5, -40))
    
    # Level 4 Progression Gate between Tier 1 and Tier 2
    create_level_gate(zones_folder, "Gate_Level4", (0, 0, -95), (60, 16, 4), "🔒 REQUER NÍVEL 4 PARA PASSAR", (0, 240, 255))
    
    # Mushroom Glade (Level 4)
    create_pollen_field(
        zones_folder, "MushroomGlade", "🍄 MUSHROOM GLADE",
        (-120, 1, -160), (85, 4, 85), (80, 30, 50),
        [(255, 60, 60), (255, 120, 120), (180, 30, 50)], 4
    )
    
    # Spider Meadow & Cave (Level 6)
    create_pollen_field(
        zones_folder, "SpiderMeadow", "🕸️ SPIDER MEADOW & CAVE",
        (120, 1, -160), (85, 4, 85), (50, 50, 70),
        [(230, 240, 255), (160, 190, 230), (110, 130, 180)], 6
    )
    create_spider_boss_mob(zones_folder, (120, 1.5, -160))
    
    # Level 10 Progression Gate
    create_level_gate(zones_folder, "Gate_Level10", (-75, 0, -220), (50, 20, 4), "🔒 REQUER NÍVEL 10 (10 ABELHAS)", (255, 200, 30))
    
    # Pineapple Mountain (Level 10 - Elevated Plateau Y=20)
    create_pollen_field(
        zones_folder, "PineappleMountain", "🍍 PINEAPPLE MOUNTAIN",
        (-75, 20, -280), (90, 6, 90), (160, 140, 50),
        [(255, 200, 40), (255, 140, 20), (180, 220, 40)], 10
    )
    # Ramp up to Pineapple Mountain
    create_part(zones_folder, "PineappleRamp", (30, 2, 60), (-75, 10, -225), (120, 100, 60), material="Cobblestone")
    
    # Level 15 Progression Gate
    create_level_gate(zones_folder, "Gate_Level15", (75, 0, -220), (50, 30, 4), "🔒 REQUER NÍVEL 15 (CHAVE DO OASIS)", (0, 240, 255))
    
    # Coconut Oasis (Level 15 - Endgame Celestial Plateau Y=35)
    create_pollen_field(
        zones_folder, "CoconutOasis", "🥥 COCONUT OASIS (ENDGAME)",
        (75, 35, -280), (90, 6, 90), (50, 180, 160),
        [(0, 240, 255), (255, 240, 200), (50, 200, 150)], 15
    )
    # Cloud Steps up to Coconut Oasis
    for step in range(7):
        sy = 5.0 * (step + 1)
        sz = -220 - (step * 8.0)
        create_part(zones_folder, f"CloudStep_{step}", (24, 2, 8), (75, sy, sz), (230, 245, 255), material="Neon")

    tree = ET.ElementTree(root)
    ET.indent(tree, space="\t", level=0)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    tree.write(filepath, encoding="utf-8", xml_declaration=True)
    print(f"Successfully generated full Bee Swarm RPG & Claw Machine 3D World in {filepath}")

def generate_single_item_rbxmx(classname, name, properties, filepath):
    root = ET.Element("roblox", {
        "xmlns:xmime": "http://www.w3.org/2005/05/xmlmime",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "version": "4"
    })
    item = ET.SubElement(root, "Item", {"class": classname, "referent": get_ref()})
    props = ET.SubElement(item, "Properties")
    add_prop(props, "string", "Name", name)
    for p_type, p_name, p_val in properties:
        add_prop(props, p_type, p_name, p_val)
        
    tree = ET.ElementTree(root)
    ET.indent(tree, space="\t", level=0)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    tree.write(filepath, encoding="utf-8", xml_declaration=True)
    print(f"Generated {filepath}")

if __name__ == "__main__":
    generate_world_rbxmx("assets/World.rbxmx")
    generate_single_item_rbxmx("ColorCorrectionEffect", "JuiceColorCorrection", [
        ("bool", "Enabled", "true"),
        ("float", "Brightness", 0.05),
        ("float", "Contrast", 0.15),
        ("float", "Saturation", 0.35),
    ], "assets/ColorCorrection.rbxmx")
    generate_single_item_rbxmx("BloomEffect", "JuiceBloom", [
        ("bool", "Enabled", "true"),
        ("float", "Intensity", 1.2),
        ("float", "Size", 24.0),
        ("float", "Threshold", 1.8),
    ], "assets/Bloom.rbxmx")
