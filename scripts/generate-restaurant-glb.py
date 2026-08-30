#!/usr/bin/env python3
"""Generate a few small, self-contained restaurant GLB assets.

The geometry is intentionally simple and stylised: a plate plus a recognisable
food arrangement in each file.  This keeps the AR demo free to host on GitHub
Pages and quick to load on a phone.

The standalone porcelain plate adapts the revolved profile from Bullet's
``data/dinnerware/plate.obj`` model.  The redistributed source is covered by
Bullet's permissive zlib-style data license; see THIRD_PARTY_NOTICES.md.
"""
from __future__ import annotations

import base64
import json
import math
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "models" / "restaurant"
OUT.mkdir(parents=True, exist_ok=True)

MATERIALS = [
    {"name": "ceramic", "baseColorFactor": [0.94, 0.95, 0.98, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.22},
    {"name": "ceramicAccent", "baseColorFactor": [0.06, 0.72, 0.86, 1.0], "metallicFactor": 0.12, "roughnessFactor": 0.2},
    {"name": "steak", "baseColorFactor": [0.42, 0.075, 0.035, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.44},
    {"name": "grill", "baseColorFactor": [0.11, 0.035, 0.022, 1.0], "metallicFactor": 0.1, "roughnessFactor": 0.36},
    {"name": "greens", "baseColorFactor": [0.08, 0.42, 0.16, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.58},
    {"name": "lemon", "baseColorFactor": [1.0, 0.69, 0.05, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.42},
    {"name": "sauce", "baseColorFactor": [0.92, 0.17, 0.055, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.38},
    {"name": "glass", "baseColorFactor": [0.12, 0.66, 0.84, 0.72], "metallicFactor": 0.0, "roughnessFactor": 0.1, "alphaMode": "BLEND"},
    {"name": "drink", "baseColorFactor": [0.92, 0.16, 0.06, 0.85], "metallicFactor": 0.0, "roughnessFactor": 0.28, "alphaMode": "BLEND"},
    {"name": "cream", "baseColorFactor": [1.0, 0.78, 0.62, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.5},
    {"name": "chocolate", "baseColorFactor": [0.22, 0.045, 0.02, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.38},
    {"name": "blackCoffee", "baseColorFactor": [0.018, 0.006, 0.002, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.2},
    {"name": "latteGlass", "baseColorFactor": [0.08, 0.42, 0.52, 0.38], "metallicFactor": 0.0, "roughnessFactor": 0.08, "alphaMode": "BLEND"},
    {"name": "restaurantPorcelain", "baseColorFactor": [0.985, 0.978, 0.955, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.16},
]


def norm(v):
    length = math.sqrt(sum(x * x for x in v)) or 1.0
    return tuple(x / length for x in v)


def add_mesh(meshes, name, positions, normals, indices, material):
    meshes.append({"name": name, "positions": positions, "normals": normals, "indices": indices, "material": material})


def lathe(meshes, name, profile, material, segments=48, rotation=0.0, center=(0.0, 0.0, 0.0)):
    """Revolve a (radius,y) profile around Y."""
    positions, normals, indices = [], [], []
    cx, cy, cz = center
    for i, (radius, y) in enumerate(profile):
        prev_r, prev_y = profile[max(0, i - 1)]
        next_r, next_y = profile[min(len(profile) - 1, i + 1)]
        dr, dy = next_r - prev_r, next_y - prev_y
        nr, ny = norm((dy, -dr))
        for s in range(segments):
            angle = rotation + 2.0 * math.pi * s / segments
            c, si = math.cos(angle), math.sin(angle)
            positions.extend([cx + radius * c, cy + y, cz + radius * si])
            normals.extend([nr * c, ny, nr * si])
    rings = len(profile)
    for i in range(rings - 1):
        for s in range(segments):
            a = i * segments + s
            b = i * segments + (s + 1) % segments
            c = (i + 1) * segments + (s + 1) % segments
            d = (i + 1) * segments + s
            indices.extend([a, b, c, a, c, d])
    add_mesh(meshes, name, positions, normals, indices, material)


def sphere(meshes, name, center, scale, material, segments=28, rings=16):
    positions, normals, indices = [], [], []
    cx, cy, cz = center
    sx, sy, sz = scale
    for r in range(rings + 1):
        v = r / rings
        phi = math.pi * v
        sp, cp = math.sin(phi), math.cos(phi)
        for s in range(segments):
            u = s / segments * 2.0 * math.pi
            su, cu = math.sin(u), math.cos(u)
            positions.extend([cx + sx * sp * cu, cy + sy * cp, cz + sz * sp * su])
            normals.extend(norm((sp * cu / max(sx, 0.001), cp / max(sy, 0.001), sp * su / max(sz, 0.001))))
    for r in range(rings):
        for s in range(segments):
            a = r * segments + s
            b = r * segments + (s + 1) % segments
            c = (r + 1) * segments + (s + 1) % segments
            d = (r + 1) * segments + s
            indices.extend([a, b, c, a, c, d])
    add_mesh(meshes, name, positions, normals, indices, material)


def cylinder(meshes, name, center, radius, height, material, segments=40):
    lathe(meshes, name, [(0.0, -height / 2), (radius, -height / 2), (radius, height / 2), (0.0, height / 2)], material, segments, center=center)


def torus(meshes, name, center, major, minor, material, segments=48, sides=12):
    positions, normals, indices = [], [], []
    cx, cy, cz = center
    for i in range(segments):
        u = 2.0 * math.pi * i / segments
        cu, su = math.cos(u), math.sin(u)
        for j in range(sides):
            v = 2.0 * math.pi * j / sides
            cv, sv = math.cos(v), math.sin(v)
            radius = major + minor * cv
            positions.extend([cx + radius * cu, cy + minor * sv, cz + radius * su])
            normals.extend([cv * cu, sv, cv * su])
    for i in range(segments):
        for j in range(sides):
            a = i * sides + j
            b = ((i + 1) % segments) * sides + j
            c = ((i + 1) % segments) * sides + (j + 1) % sides
            d = i * sides + (j + 1) % sides
            indices.extend([a, b, c, a, c, d])
    add_mesh(meshes, name, positions, normals, indices, material)


def create_glb(path: Path, title: str, meshes):
    blob = bytearray()
    views, accessors, primitives, buffer_start = [], [], [], 0

    def append_blob(raw: bytes, target=None):
        nonlocal buffer_start
        while len(blob) % 4:
            blob.append(0)
        offset = len(blob)
        blob.extend(raw)
        view_index = len(views)
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(raw)}
        if target is not None:
            view["target"] = target
        views.append(view)
        buffer_start = len(blob)
        return view_index

    def accessor_for(view_index, component_type, count, type_name, values, minmax):
        acc = {"bufferView": view_index, "componentType": component_type, "count": count, "type": type_name}
        if minmax:
            acc["min"], acc["max"] = minmax
        accessors.append(acc)
        return len(accessors) - 1

    nodes, materials_json = [], []
    for mat in MATERIALS:
        pbr = {"baseColorFactor": mat["baseColorFactor"], "metallicFactor": mat["metallicFactor"], "roughnessFactor": mat["roughnessFactor"]}
        entry = {"name": mat["name"], "pbrMetallicRoughness": pbr}
        if mat.get("alphaMode"):
            entry["alphaMode"] = mat["alphaMode"]
            entry["doubleSided"] = True
        materials_json.append(entry)

    for mesh in meshes:
        pos = struct.pack(f"<{len(mesh['positions'])}f", *mesh["positions"])
        nor = struct.pack(f"<{len(mesh['normals'])}f", *mesh["normals"])
        idx = struct.pack(f"<{len(mesh['indices'])}H", *mesh["indices"])
        pos_view = append_blob(pos, 34962)
        nor_view = append_blob(nor, 34962)
        idx_view = append_blob(idx, 34963)
        p = mesh["positions"]
        minmax = ([min(p[0::3]), min(p[1::3]), min(p[2::3])], [max(p[0::3]), max(p[1::3]), max(p[2::3])])
        pos_acc = accessor_for(pos_view, 5126, len(p) // 3, "VEC3", p, minmax)
        nor_acc = accessor_for(nor_view, 5126, len(mesh["normals"]) // 3, "VEC3", mesh["normals"], None)
        idx_acc = accessor_for(idx_view, 5123, len(mesh["indices"]), "SCALAR", mesh["indices"], ([min(mesh["indices"])], [max(mesh["indices"])]))
        primitives.append({"attributes": {"POSITION": pos_acc, "NORMAL": nor_acc}, "indices": idx_acc, "material": mesh["material"]})
        nodes.append({"name": mesh["name"], "mesh": len(nodes)})

    gltf = {
        "asset": {"version": "2.0", "generator": "Alba Space restaurant AR asset generator"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": [{"name": title, "primitives": [primitive]} for primitive in primitives],
        "materials": materials_json,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(blob)}],
    }
    json_chunk = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_chunk) % 4:
        json_chunk += b" "
    while len(blob) % 4:
        blob.append(0)
    bin_chunk = bytes(blob)
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    glb = bytearray(struct.pack("<III", 0x46546C67, 2, total))
    glb.extend(struct.pack("<I4s", len(json_chunk), b"JSON"))
    glb.extend(json_chunk)
    glb.extend(struct.pack("<I4s", len(bin_chunk), b"BIN\x00"))
    glb.extend(bin_chunk)
    path.write_bytes(glb)


def make_steak():
    meshes = []
    lathe(meshes, "plate", [(0, 0), (1.85, 0), (1.98, 0.09), (1.98, 0.18), (1.82, 0.25), (0, 0.27)], 0, 64)
    torus(meshes, "plate-rim", (0, 0.25, 0), 1.62, 0.055, 1)
    sphere(meshes, "steak", (0, 0.53, 0.1), (1.02, 0.18, 0.54), 2)
    for x, z, rot in [(-0.34, -0.14, 0.2), (0.14, -0.26, -0.3), (0.38, 0.18, 0.5), (-0.58, 0.2, -0.1)]:
        cylinder(meshes, "grill-mark", (x, 0.72, z), 0.035, 0.035, 3, 10)
    for x, z, s in [(-1.05, 0.3, 0.2), (-0.9, -0.15, 0.16), (0.86, 0.55, 0.14), (0.96, 0.1, 0.18)]:
        sphere(meshes, "greens", (x, 0.39, z), (s, s * 0.45, s * 0.75), 4, 18, 10)
    sphere(meshes, "lemon", (0.9, 0.58, -0.62), (0.25, 0.11, 0.25), 5, 20, 10)
    sphere(meshes, "sauce", (-0.82, 0.48, -0.58), (0.22, 0.06, 0.22), 6, 20, 10)
    return meshes


def make_porcelain_plate():
    """Adapt Bullet's dinnerware plate profile into a smooth, mobile GLB.

    Bullet's OBJ is a 30-segment lathed mesh.  Keeping its measured profile but
    increasing the radial resolution removes the visibly faceted edge in AR.
    The model remains in metres and is scaled to the marker inside A-Frame.
    """
    meshes = []
    profile = [
        (0.052, 0.009),
        (0.046, 0.003),
        (0.000, 0.003),
        (0.000, 0.000),
        (0.055, 0.000),
        (0.058, 0.003),
        (0.098, 0.060),
        (0.095, 0.060),
        (0.092, 0.060),
    ]
    lathe(meshes, "porcelain-plate", profile, 13, segments=96)
    return meshes


def make_lamb():
    meshes = []
    lathe(meshes, "plate", [(0, 0), (1.85, 0), (1.98, 0.09), (1.98, 0.18), (1.82, 0.25), (0, 0.27)], 0, 64)
    torus(meshes, "plate-rim", (0, 0.25, 0), 1.62, 0.055, 1)
    for x, z, angle in [(-0.72, -0.02, -0.45), (-0.23, 0.06, -0.16), (0.28, 0.07, 0.18), (0.76, -0.02, 0.45)]:
        sphere(meshes, "lamb-chop", (x, 0.58, z), (0.3, 0.19, 0.7), 2, 22, 12)
        cylinder(meshes, "bone", (x + 0.18 * math.sin(angle), 0.61, z + 0.44 * math.cos(angle)), 0.055, 0.72, 0, 12)
    for x, z in [(-1.02, 0.34), (-0.96, -0.24), (0.96, 0.32), (0.98, -0.28)]:
        sphere(meshes, "greens", (x, 0.38, z), (0.18, 0.08, 0.24), 4, 18, 10)
    sphere(meshes, "sauce", (0, 0.43, -0.74), (0.42, 0.06, 0.18), 6, 20, 10)
    return meshes


def make_dessert():
    meshes = []
    lathe(meshes, "plate", [(0, 0), (1.85, 0), (1.98, 0.09), (1.98, 0.18), (1.82, 0.25), (0, 0.27)], 0, 64)
    torus(meshes, "plate-rim", (0, 0.25, 0), 1.62, 0.055, 1)
    for x, z in [(-0.72, 0), (0, 0.05), (0.7, 0.02)]:
        cylinder(meshes, "cake", (x, 0.62, z), 0.35, 0.62, 10, 28)
        torus(meshes, "cream-ring", (x, 0.94, z), 0.25, 0.065, 9, 18, 8)
        sphere(meshes, "cream", (x, 1.02, z), (0.21, 0.15, 0.21), 9, 20, 10)
    for x, z in [(-0.72, 0.12), (0.0, -0.04), (0.7, 0.12)]:
        sphere(meshes, "berry", (x, 1.17, z), (0.075, 0.075, 0.075), 6, 18, 8)
    return meshes


def make_chocolate_cake():
    meshes = []
    lathe(meshes, "plate", [(0, 0), (1.85, 0), (1.98, 0.09), (1.98, 0.18), (1.82, 0.25), (0, 0.27)], 0, 64)
    torus(meshes, "plate-rim", (0, 0.25, 0), 1.62, 0.055, 1)
    cylinder(meshes, "chocolate-cake", (0, 0.7, 0), 0.75, 0.82, 10, 36)
    cylinder(meshes, "chocolate-top", (0, 1.14, 0), 0.78, 0.08, 6, 36)
    for x, z in [(-0.4, 0.18), (0.22, -0.18), (0.48, 0.3), (-0.18, -0.4)]:
        sphere(meshes, "berry", (x, 1.24, z), (0.09, 0.09, 0.09), 6, 18, 8)
    sphere(meshes, "cream", (0.0, 1.25, 0.02), (0.25, 0.12, 0.25), 9, 20, 10)
    return meshes


def make_drink():
    meshes = []
    lathe(meshes, "saucer", [(0, 0), (1.28, 0), (1.38, 0.08), (1.3, 0.14), (0, 0.17)], 0, 64)
    lathe(meshes, "glass", [(0.72, 0.25), (0.78, 0.32), (0.65, 1.48), (0.57, 1.58), (0.52, 1.58)], 7, 48)
    lathe(meshes, "juice", [(0.60, 0.36), (0.65, 0.42), (0.56, 1.39), (0.5, 1.45), (0, 1.45)], 8, 48)
    cylinder(meshes, "straw", (0.12, 1.86, 0.02), 0.045, 1.2, 1, 16)
    sphere(meshes, "citrus", (-0.25, 1.55, 0.17), (0.18, 0.06, 0.18), 5, 16, 8)
    return meshes


def make_latte():
    meshes = []
    lathe(meshes, "saucer", [(0, 0), (1.28, 0), (1.38, 0.08), (1.3, 0.14), (0, 0.17)], 0, 64)
    lathe(meshes, "cup", [(0.55, 0.24), (0.7, 0.31), (0.62, 1.1), (0.48, 1.18)], 12, 48)
    torus(meshes, "glass-rim", (0, 1.18, 0), 0.48, 0.055, 12, 40, 10)
    lathe(meshes, "coffee", [(0.46, 0.39), (0.55, 0.44), (0.47, 1.12), (0, 1.12)], 11, 48)
    cylinder(meshes, "black-coffee-core", (0, 0.80, 0), 0.47, 0.72, 11, 40)
    cylinder(meshes, "black-coffee-surface", (0, 1.175, 0), 0.45, 0.035, 11, 40)
    torus(meshes, "handle", (0.62, 0.7, 0), 0.23, 0.07, 0, 24, 8)
    return meshes


if __name__ == "__main__":
    create_glb(OUT / "realistic-porcelain-plate.glb", "Porcelain restaurant plate", make_porcelain_plate())
    create_glb(OUT / "steak.glb", "Steak plate", make_steak())
    create_glb(OUT / "lamb-chops.glb", "Lamb chops plate", make_lamb())
    create_glb(OUT / "dessert.glb", "Dessert plate", make_dessert())
    create_glb(OUT / "chocolate-cake.glb", "Chocolate cake", make_chocolate_cake())
    create_glb(OUT / "drink.glb", "Citrus drink", make_drink())
    create_glb(OUT / "latte.glb", "Latte", make_latte())
    print("Generated:", ", ".join(str(p) for p in sorted(OUT.glob("*.glb"))))
