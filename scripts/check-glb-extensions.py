#!/usr/bin/env python3
"""Validate GLB headers and report extension metadata."""
from __future__ import annotations

import json
import struct
import sys
from pathlib import Path


def read_json_chunk(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        raise ValueError(f"{path}: invalid GLB magic/header")
    version, length = struct.unpack_from("<II", data, 4)
    if version != 2 or length != len(data):
        raise ValueError(f"{path}: version={version}, declared={length}, actual={len(data)}")
    offset = 12
    while offset + 8 <= len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        payload = data[offset + 8 : offset + 8 + chunk_length]
        if chunk_type == 0x4E4F534A:
            return json.loads(payload.rstrip(b" \t\r\n\x00"))
        offset += 8 + chunk_length
    raise ValueError(f"{path}: no JSON chunk")


def main() -> int:
    files = [Path(arg) for arg in sys.argv[1:]]
    if not files:
        raise SystemExit("usage: check-glb-extensions.py file.glb [...]")
    failed = False
    for path in files:
        try:
            doc = read_json_chunk(path)
            used = doc.get("extensionsUsed", [])
            required = doc.get("extensionsRequired", [])
            has_meshopt = "EXT_meshopt_compression" in used or "EXT_meshopt_compression" in required
            print(json.dumps({"file": path.name, "bytes": path.stat().st_size, "extensionsUsed": used, "extensionsRequired": required, "meshopt": has_meshopt}, ensure_ascii=False))
            failed |= has_meshopt
        except Exception as exc:
            print(f"ERROR {path}: {exc}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
