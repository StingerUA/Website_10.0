"""Package all validated Blender outputs; preserve the Stage 1 light models."""
import json, math, shutil, sys, zipfile
from pathlib import Path
from PIL import Image

source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[2]
models = root / 'assets/models/interior'
web = models / 'stage2'
images = root / 'assets/images/iss-interiors/stage2'
web.mkdir(parents=True, exist_ok=True)
images.mkdir(parents=True, exist_ok=True)
catalog = json.loads((models / 'catalog-stage1.json').read_text())
assert len(catalog) == 18
for m in catalog:
    key = m['id']
    meta = json.loads((source / f'{key}.json').read_text())
    glb = source / 'web' / f'{key}.glb'
    native = source / 'blend' / f'{key}_stage2.blend'
    assert glb.stat().st_size > 100000 and native.stat().st_size > 100000
    shutil.copy2(glb, web / glb.name)
    image = Image.open(source / 'renders' / f'{key}_stage2.png').convert('RGB')
    image.save(images / f'{key}.jpg', quality=90, optimize=True)
    m['baseRender'] = m['render']
    m['render'] = f'/assets/images/iss-interiors/stage2/{key}.jpg'
    m['detailed'] = f'/assets/models/interior/stage2/{key}.glb'
    m['stage'] = 2
    m['detailBytes'] = glb.stat().st_size
    m['detailTriangles'] = meta['triangles']
    m['detailMaterials'] = meta['materials']
    m['detailTextures'] = meta['textures']
    m['aoResolution'] = meta['aoResolution']
    m['detailNote'] = 'First detailing pass; representative reconstruction, not a surveyed replica.'
    m['detailSourcePack'] = 1 + catalog.index(m) // 3
(models / 'catalog-stage2.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')

# Smaller native packs keep every Git object below GitHub's 100 MB limit.
for index in range(0, len(catalog), 3):
    pack = web / f'ISS_Stage2_Blender_{index // 3 + 1:02d}.zip'
    with zipfile.ZipFile(pack, 'w', zipfile.ZIP_DEFLATED, compresslevel=5) as z:
        for m in catalog[index:index+3]:
            key = m['id']
            z.write(source / 'blend' / f'{key}_stage2.blend', f'{key}_stage2.blend')
        for name in ['build_blender_stage2.py', 'README_STAGE2.md']:
            z.write(root / 'tools/iss-interiors' / name, name)
    assert pack.stat().st_size < 95_000_000, f'Native pack too large: {pack}'

with zipfile.ZipFile(web / 'ISS_Stage2_GLB.zip', 'w', zipfile.ZIP_DEFLATED, compresslevel=5) as z:
    for m in catalog:
        z.write(web / f"{m['id']}.glb", f"{m['id']}.glb")
    z.write(models / 'catalog-stage2.json', 'catalog-stage2.json')
print(json.dumps({'modules': len(catalog), 'webBytes': sum(m['detailBytes'] for m in catalog), 'triangles': sum(m['detailTriangles'] for m in catalog)}, indent=2))
