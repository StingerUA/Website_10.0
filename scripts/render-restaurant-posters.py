#!/usr/bin/env python3
"""Render deterministic menu posters from uncompressed GLB vertex/texture data.

This deliberately avoids a browser/3D application so poster generation stays
available in CI and produces images that match the actual dish assets.
"""
from __future__ import annotations

import argparse
import io
import json
import math
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt


COMPONENTS = {
    5120: (np.int8, 127.0),
    5121: (np.uint8, 255.0),
    5122: (np.int16, 32767.0),
    5123: (np.uint16, 65535.0),
    5125: (np.uint32, 4294967295.0),
    5126: (np.float32, None),
}
WIDTHS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_glb(path: Path):
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"{path} is not GLB")
    offset, document, binary = 12, None, None
    while offset < len(data):
        size, kind = struct.unpack_from("<II", data, offset)
        chunk = data[offset + 8 : offset + 8 + size]
        if kind == 0x4E4F534A:
            document = json.loads(chunk.rstrip(b"\0 ").decode("utf-8"))
        elif kind == 0x004E4942:
            binary = chunk
        offset += 8 + size
    if document is None or binary is None:
        raise ValueError(f"{path} is missing JSON or BIN")
    return document, binary


def accessor(document, binary, index):
    acc = document["accessors"][index]
    view = document["bufferViews"][acc["bufferView"]]
    dtype, divisor = COMPONENTS[acc["componentType"]]
    dtype = np.dtype(dtype).newbyteorder("<")
    width = WIDTHS[acc["type"]]
    offset = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    packed = dtype.itemsize * width
    stride = view.get("byteStride", packed)
    array = np.ndarray((acc["count"], width), dtype=dtype, buffer=binary,
                       offset=offset, strides=(stride, dtype.itemsize)).copy()
    if acc.get("normalized") and divisor:
        array = array.astype(np.float32) / divisor
        if np.issubdtype(dtype, np.signedinteger):
            array = np.maximum(array, -1.0)
    return array


def quaternion_matrix(q):
    x, y, z, w = q
    n = x*x + y*y + z*z + w*w
    if n < 1e-12:
        return np.eye(4, dtype=np.float32)
    s = 2.0 / n
    return np.array([
        [1-s*(y*y+z*z), s*(x*y-z*w), s*(x*z+y*w), 0],
        [s*(x*y+z*w), 1-s*(x*x+z*z), s*(y*z-x*w), 0],
        [s*(x*z-y*w), s*(y*z+x*w), 1-s*(x*x+y*y), 0],
        [0, 0, 0, 1],
    ], dtype=np.float32)


def node_matrix(node):
    if "matrix" in node:
        return np.array(node["matrix"], dtype=np.float32).reshape(4, 4).T
    matrix = quaternion_matrix(node.get("rotation", [0, 0, 0, 1]))
    scale = np.array(node.get("scale", [1, 1, 1]), dtype=np.float32)
    matrix[:3, :3] *= scale[np.newaxis, :]
    matrix[:3, 3] = node.get("translation", [0, 0, 0])
    return matrix


def image_from_gltf(document, binary, image_index, base_path):
    entry = document["images"][image_index]
    if "bufferView" in entry:
        view = document["bufferViews"][entry["bufferView"]]
        start = view.get("byteOffset", 0)
        payload = binary[start : start + view["byteLength"]]
        return Image.open(io.BytesIO(payload)).convert("RGB")
    if entry.get("uri", "").startswith("data:"):
        import base64
        payload = base64.b64decode(entry["uri"].split(",", 1)[1])
        return Image.open(io.BytesIO(payload)).convert("RGB")
    return Image.open(base_path / entry["uri"]).convert("RGB")


def load_vertices(path: Path):
    document, binary = read_glb(path)
    texture_cache = {}
    all_positions, all_normals, all_colors = [], [], []

    def texture(index):
        if index not in texture_cache:
            source = document["textures"][index]["source"]
            texture_cache[index] = np.asarray(image_from_gltf(document, binary, source, path.parent))
        return texture_cache[index]

    def visit(node_index, parent):
        node = document["nodes"][node_index]
        world = parent @ node_matrix(node)
        if "mesh" in node:
            normal_matrix = np.linalg.inv(world[:3, :3]).T
            for primitive in document["meshes"][node["mesh"]]["primitives"]:
                if primitive.get("mode", 4) not in (4,):
                    continue
                attrs = primitive["attributes"]
                positions = accessor(document, binary, attrs["POSITION"]).astype(np.float32)
                normals = accessor(document, binary, attrs.get("NORMAL", attrs["POSITION"])).astype(np.float32)
                p4 = np.column_stack((positions, np.ones(len(positions), dtype=np.float32)))
                positions = (p4 @ world.T)[:, :3]
                normals = normals @ normal_matrix.T
                normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-9)
                material = document.get("materials", [{}])[primitive.get("material", 0)]
                pbr = material.get("pbrMetallicRoughness", {})
                factor = np.array(pbr.get("baseColorFactor", [1, 1, 1, 1])[:3], dtype=np.float32)
                colors = np.broadcast_to(factor, (len(positions), 3)).copy()
                if "COLOR_0" in attrs:
                    vertex_colors = accessor(document, binary, attrs["COLOR_0"]).astype(np.float32)
                    colors *= vertex_colors[:, :3]
                tex_info = pbr.get("baseColorTexture")
                if tex_info and "TEXCOORD_0" in attrs:
                    uv = accessor(document, binary, attrs["TEXCOORD_0"]).astype(np.float32)
                    tex = texture(tex_info["index"])
                    tx = np.clip((uv[:, 0] % 1.0) * (tex.shape[1] - 1), 0, tex.shape[1] - 1).astype(np.int32)
                    ty = np.clip((1.0 - (uv[:, 1] % 1.0)) * (tex.shape[0] - 1), 0, tex.shape[0] - 1).astype(np.int32)
                    colors *= tex[ty, tx].astype(np.float32) / 255.0
                all_positions.append(positions)
                all_normals.append(normals)
                all_colors.append(colors)
                if "indices" in primitive:
                    triangles = accessor(document, binary, primitive["indices"]).reshape(-1, 3).astype(np.int64)
                    # Sparse procedural surfaces need interior samples; dense
                    # photogrammetry already has enough vertices on its own.
                    if len(triangles) <= 500_000:
                        a, b, c = (triangles[:, i] for i in range(3))
                        for weights in ((1/3, 1/3, 1/3), (.5, .5, 0), (.5, 0, .5), (0, .5, .5)):
                            wa, wb, wc = weights
                            sample_positions = positions[a]*wa + positions[b]*wb + positions[c]*wc
                            sample_normals = normals[a]*wa + normals[b]*wb + normals[c]*wc
                            sample_normals /= np.maximum(np.linalg.norm(sample_normals, axis=1, keepdims=True), 1e-9)
                            sample_colors = colors[a]*wa + colors[b]*wb + colors[c]*wc
                            all_positions.append(sample_positions)
                            all_normals.append(sample_normals)
                            all_colors.append(sample_colors)
        for child in node.get("children", []):
            visit(child, world)

    scene = document.get("scenes", [{}])[document.get("scene", 0)]
    for root in scene.get("nodes", range(len(document.get("nodes", [])))):
        visit(root, np.eye(4, dtype=np.float32))
    if not all_positions:
        raise ValueError(f"No renderable meshes in {path}")
    return np.concatenate(all_positions), np.concatenate(all_normals), np.concatenate(all_colors)


def background(size):
    y, x = np.mgrid[:size, :size]
    radial = np.clip(1 - np.hypot(x-size*.5, y-size*.43)/(size*.72), 0, 1)
    top = np.array([34, 61, 83], dtype=np.float32)
    bottom = np.array([5, 12, 25], dtype=np.float32)
    vertical = (y / (size - 1))[..., None]
    image = top * (1-vertical) + bottom * vertical
    image += radial[..., None] * np.array([10, 20, 25], dtype=np.float32)
    return np.clip(image, 0, 255).astype(np.uint8)


def render(input_path: Path, output_path: Path, size=720):
    positions, normals, colors = load_vertices(input_path)
    if len(positions) > 1_250_000:
        step = math.ceil(len(positions) / 1_250_000)
        positions, normals, colors = positions[::step], normals[::step], colors[::step]

    center = (positions.min(axis=0) + positions.max(axis=0)) / 2
    positions = positions - center
    view = np.array([1.0, .78, 1.08], dtype=np.float32)
    view /= np.linalg.norm(view)
    right = np.cross(np.array([0, 1, 0], dtype=np.float32), view)
    right /= np.linalg.norm(right)
    up = np.cross(view, right)
    screen_x, screen_y, depth = positions @ right, positions @ up, positions @ view
    span = max(np.ptp(screen_x), np.ptp(screen_y), 1e-6)
    zoom = size * .70 / span
    px = np.rint(size*.5 + screen_x*zoom).astype(np.int32)
    py = np.rint(size*.49 - screen_y*zoom).astype(np.int32)
    valid = (px >= 2) & (px < size-2) & (py >= 2) & (py < size-2)
    px, py, depth, normals, colors = px[valid], py[valid], depth[valid], normals[valid], colors[valid]

    light = np.array([-.35, .87, .34], dtype=np.float32)
    light /= np.linalg.norm(light)
    diffuse = np.clip(normals @ light, 0, 1)
    facing = np.clip(normals @ view, 0, 1)
    shade = .30 + .60*diffuse + .10*facing**8
    colors = np.clip(colors * shade[:, None], 0, 1)
    colors = np.power(colors, 1/2.2)
    colors = (colors * 255).astype(np.uint8)

    linear = py * size + px
    order = np.argsort(depth)[::-1]
    _, first = np.unique(linear[order], return_index=True)
    chosen = order[first]
    mask = np.zeros((size, size), dtype=bool)
    object_rgb = np.zeros((size, size, 3), dtype=np.uint8)
    mask[py[chosen], px[chosen]] = True
    object_rgb[py[chosen], px[chosen]] = colors[chosen]

    distance, indices = distance_transform_edt(~mask, return_indices=True)
    filled = distance <= 3.8
    nearest = object_rgb[indices[0], indices[1]]
    alpha = np.where(filled, 255, 0).astype(np.uint8)

    base = Image.fromarray(background(size), "RGB")
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((size*.22, size*.67, size*.78, size*.84), fill=(0, 0, 0, 125))
    shadow = shadow.filter(ImageFilter.GaussianBlur(size*.025))
    base = Image.alpha_composite(base.convert("RGBA"), shadow)
    layer = Image.fromarray(np.dstack((nearest, alpha)), "RGBA")
    base = Image.alpha_composite(base, layer)

    # A restrained glass border keeps tiny menu thumbnails legible.
    frame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle((5, 5, size-6, size-6), radius=size*.035,
                           outline=(150, 220, 245, 52), width=max(1, size//240))
    base = Image.alpha_composite(base, frame).convert("RGB")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    base.save(output_path, "WEBP", quality=86, method=6)
    print(f"{output_path.name}: {len(positions):,} sampled vertices, {output_path.stat().st_size:,} bytes")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--size", type=int, default=720)
    args = parser.parse_args()
    render(args.input, args.output, args.size)


if __name__ == "__main__":
    main()
