"""Limit closed-room AO to contact shading in environment-lit web viewers."""
import json, struct, zipfile
from pathlib import Path

def calibrate(path, strength=.25):
    data=path.read_bytes()
    assert data[:4]==b'glTF' and struct.unpack_from('<I',data,4)[0]==2
    length=struct.unpack_from('<I',data,12)[0]
    gltf=json.loads(data[20:20+length])
    for material in gltf.get('materials',[]):
        if 'occlusionTexture' in material:
            material['occlusionTexture']['strength']=strength
    encoded=json.dumps(gltf,separators=(',',':'),ensure_ascii=False).encode()
    encoded+=b' '*((-len(encoded))%4)
    tail=data[20+length:]
    path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(encoded)+len(tail))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+tail)

if __name__=='__main__':
    root=Path(__file__).resolve().parents[2]
    models=root/'assets/models/interior'
    catalog=json.loads((models/'catalog-stage2.json').read_text())
    for module in catalog:
        path=root/module['detailed'].lstrip('/')
        calibrate(path)
        module['detailBytes']=path.stat().st_size
        module['occlusionStrength']=.25
    (models/'catalog-stage2.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    with zipfile.ZipFile(models/'stage2/ISS_Stage2_GLB.zip','w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
        for module in catalog:
            z.write(root/module['detailed'].lstrip('/'),module['id']+'.glb')
        z.write(models/'catalog-stage2.json','catalog-stage2.json')
        z.write(Path(__file__),'calibrate_stage2.py')
    print('Calibrated',len(catalog),'models; geometry and textures preserved.')
