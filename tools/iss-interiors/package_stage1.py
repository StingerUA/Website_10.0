"""Assemble verified Blender outputs into the existing static website."""
from pathlib import Path
import sys,json,math,shutil,zipfile
from PIL import Image,ImageDraw,ImageFont
S=Path(sys.argv[1]);W=Path.cwd();MODELS=W/'assets/models/interior';IMAGES=W/'assets/images/iss-interiors'
MODELS.mkdir(parents=True,exist_ok=True);IMAGES.mkdir(parents=True,exist_ok=True)
D={
'destiny':['ABD araştırma laboratuvarı','US research laboratory','Американская лаборатория'],
'harmony':['Mürettebat ve bağlantı modülü','Crew quarters and connecting node','Спальные отсеки и узел Node 2'],
 'tranquility':['Yaşam destek ve egzersiz','Life support and exercise','Жизнеобеспечение и тренажёры'],
'columbus':['Avrupa araştırma laboratuvarı','European research laboratory','Европейская лаборатория'],
'kibo':['Japon araştırma laboratuvarı','Japanese research laboratory','Японская лаборатория'],
'unity':['İstasyon bağlantı düğümü','Station connecting node','Соединительный узел Node 1'],
'zarya':['Fonksiyonel kargo bloğu','Functional cargo block','Функционально-грузовой блок'],
'zvezda':['Servis ve yaşam modülü','Service and habitation module','Служебный модуль'],
'nauka':['Çok amaçlı laboratuvar','Multipurpose laboratory','Многофункциональная лаборатория'],
'poisk':['Araştırma ve hava kilidi','Research and airlock module','Исследовательский и шлюзовой модуль'],
'rassvet':['Araştırma ve kargo modülü','Research and cargo module','Исследовательский и грузовой модуль'],
'prichal':['Altı portlu bağlantı düğümü','Six-port docking node','Узел с шестью стыковочными портами'],
'quest':['Uzay yürüyüşü hava kilidi','Spacewalk airlock','Шлюз для выхода в открытый космос'],
'leonardo':['Kalıcı lojistik modülü','Permanent logistics module','Постоянный грузовой модуль'],
'kibo_elm':['Japon lojistik modülü','Japanese logistics module','Грузовой отсек Kibo'],
'beam':['Genişletilebilir modül','Expandable module','Развёртываемый модуль'],
'bishop':['Yük hava kilidi','Payload airlock','Шлюз для полезной нагрузки'],
'cupola':['Yedi pencereli gözlem kubbesi','Seven-window observatory','Купол с семью окнами']}
cat=[]
for key,desc in D.items():
 meta=json.loads((S/f'{key}.json').read_text());eye,target,lens=meta['camera_blender'];d=[target[i]-eye[i] for i in range(3)];length=sum(x*x for x in d)**.5;d=[x/length for x in d]
 ge=[eye[0],eye[2],-eye[1]];gd=[d[0],d[2],-d[1]];r=.03;ct=[ge[i]+gd[i]*r for i in range(3)];off=[-x for x in gd]
 theta=math.degrees(math.atan2(off[0],off[2]));phi=math.degrees(math.acos(off[1]))
 src=S/'glb'/f'{key}_optimized.glb';assert src.read_bytes()[:4]==b'glTF';shutil.copy2(src,MODELS/src.name)
 image=Image.open(S/'renders'/f'{key}.png');assert image.width==1200 and image.height==800;image.convert('RGB').save(IMAGES/f'{key}.jpg',quality=92)
 assert (S/'blend'/f'{key}_stage1.blend').stat().st_size>10000
 cat.append({'id':key,'name':meta['name'],'description':dict(zip(['tr','en','ru'],desc)),
 'glb':f'/assets/models/interior/{key}_optimized.glb?v=20261024-stage1','render':f'/assets/images/iss-interiors/{key}.jpg?v=20261024-stage1',
 'cameraTarget':' '.join(f'{x:.5f}m' for x in ct),'cameraOrbit':f'{theta:.3f}deg {phi:.3f}deg {r}m','stage':1,'triangles':meta['triangles'],'bytes':src.stat().st_size})
(MODELS/'catalog-stage1.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2))
for name,folder,pattern in [('ISS_Stage1_Blender.zip','blend','*.blend'),('ISS_Stage1_GLB.zip','glb','*.glb'),('ISS_Stage1_Renders.zip','renders','*.png')]:
 dest=(IMAGES if folder=='renders' else MODELS)/name
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in sorted((S/folder).glob(pattern)):z.write(p,p.name)
  z.write(W/'tools/iss-interiors/README_STAGE1.md','README_STAGE1.md')
  z.writestr('catalog-stage1.json',json.dumps(cat,ensure_ascii=False,indent=2))
try:
 font=lambda size:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size)
 font(12)
except OSError:font=lambda size:ImageFont.load_default(size=size)
for page in range(3):
 sheet=Image.new('RGB',(1840,2100),(9,20,32));draw=ImageDraw.Draw(sheet)
 draw.text((40,30),'ALBASPACE / ISS INTERIORS',fill=(234,244,248),font=font(36))
 draw.text((40,82),f'STAGE 1  /  BLENDER CYCLES  /  BASE DETAIL                       {page+1} / 3',fill=(108,188,212),font=font(20))
 for i,m in enumerate(cat[page*6:(page+1)*6]):
  x=40+(i%2)*900;y=145+(i//2)*645
  im=Image.open(S/'renders'/f"{m['id']}.png").convert('RGB').resize((860,573),Image.Resampling.LANCZOS);sheet.paste(im,(x,y))
  draw.text((x,y+587),f"{page*6+i+1:02d}   {m['name']}",fill=(234,244,248),font=font(24))
 draw.text((40,2070),'Educational reconstructions • Detailed photorealism pass follows this base series',fill=(139,163,177),font=font(18))
 sheet.save(IMAGES/f'ISS_Stage1_Review_{page+1:02d}.jpg',quality=93)
print('Packaged',len(cat),'modules;',round(sum(c['bytes'] for c in cat)/1e6,2),'MB total GLB')
