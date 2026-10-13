"""Rebuild four lightweight study models for ISS Destiny and Cupola.
Dependencies: numpy and trimesh. GLB coordinates are in meters.
Models are procedurally interpreted and are not official NASA CAD.
"""
from pathlib import Path
import math
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

BASE=Path(__file__).resolve().parent
EXPORT=BASE/'ISS_GLBS'
EXPORT.mkdir(exist_ok=True)
P={
'hull':((194,204,212,255),.4,.42),'nomex':((232,231,221,255),.0,.84),
'white':((208,208,200,255),.1,.6),'steel':((127,142,155,255),.7,.29),
'trim':((43,59,69,255),.35,.56),'black':((17,25,33,255),.1,.7),
'screen':((24,107,173,255),.1,.35),'screen2':((17,103,83,255),.1,.35),
'blue':((24,86,174,255),.3,.38),'yellow':((233,170,39,255),.1,.45),
'green':((27,192,95,255),.05,.32),'light':((235,248,255,255),.0,.24),
'glass':((133,195,237,45),.02,.09),'fabric':((147,156,151,255),.0,.92)
}
R=trimesh.transformations.rotation_matrix(-math.pi/2,[1,0,0])
class Builder:
 def __init__(self):self.pieces={k:[] for k in P}
 def add(self,mesh,material):self.pieces[material].append(mesh)
 def box(self,n,xyz,scale,m):
  t=np.eye(4);t[:3,3]=xyz
  self.add(trimesh.creation.box(extents=scale,transform=t),m)
 def rod(self,n,a,b,r,m,segments=8):
  a,b=np.array(a,float),np.array(b,float);vec=b-a;length=np.linalg.norm(vec)
  if length<1e-8:return
  t=trimesh.geometry.align_vectors([0,0,1],vec/length);t[:3,3]=(a+b)/2
  self.add(trimesh.creation.cylinder(radius=r,height=length,sections=segments,transform=t),m)
 def cylinder(self,n,center,radius,height,m,segments=24,axis='z'):
  t=np.eye(4)
  if axis=='y':t=trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0])
  t[:3,3]=center
  self.add(trimesh.creation.cylinder(radius=radius,height=height,sections=segments,transform=t),m)
 def poly(self,n,v,f,m):self.add(trimesh.Trimesh(vertices=np.array(v),faces=np.array(f),process=False),m)
 def quad(self,n,v,m):self.poly(n,v,[(0,1,2),(0,2,3)],m)
 def lathe(self,n,profile,m,sections):
  v=[]
  for y,r in profile:
   for i in range(sections):
    a=i*math.tau/sections;v.append((r*math.cos(a),y,r*math.sin(a)))
  f=[]
  for j in range(len(profile)-1):
   for i in range(sections):
    a=j*sections+i;b=j*sections+(i+1)%sections;c=(j+1)*sections+(i+1)%sections;d=(j+1)*sections+i
    f.extend([(a,b,c),(a,c,d)])
  self.poly(n,v,f,m)
 def ring(self,n,inner,outer,z,m,segments=48):
  v=[];f=[]
  for i in range(segments):
   a=i*math.tau/segments;v.extend([(inner*math.cos(a),inner*math.sin(a),z),(outer*math.cos(a),outer*math.sin(a),z)])
  for i in range(segments):
   k=i*2;k2=((i+1)%segments)*2;f.extend([(k,k2,k2+1),(k,k2+1,k+1)])
  self.poly(n,v,f,m)
 def sidewall(self,n,r,z0,z1,m,segments):
  v=[];f=[]
  for z in (z0,z1):
   for i in range(segments):
    a=i*math.tau/segments;v.append((r*math.cos(a),r*math.sin(a),z))
  for i in range(segments):
   j=(i+1)%segments;f.extend([(i,j,j+segments),(i,j+segments,i+segments)])
  self.poly(n,v,f,m)
 def export(self,name):
  s=trimesh.Scene()
  for mat,objects in self.pieces.items():
   if not objects:continue
   mesh=trimesh.util.concatenate(objects);mesh.apply_transform(R)
   rgba,metal,rough=P[mat]
   kwargs={'name':mat,'baseColorFactor':[int(c) for c in rgba],
           'metallicFactor':metal,'roughnessFactor':rough,'doubleSided':True}
   if mat=='glass':kwargs['alphaMode']='BLEND'
   if mat=='light':kwargs['emissiveFactor']=[.75,.85,1.]
   mesh.visual=TextureVisuals(material=PBRMaterial(**kwargs))
   s.add_geometry(mesh,geom_name=mat)
  path=EXPORT/(name+'.glb');path.write_bytes(s.export(file_type='glb'))
  print(name,path.stat().st_size,'bytes')
  return path

def destiny(high):
 b=Builder();n=48 if high else 24
 b.lathe('pressure_shell',[(-4.25,.77),(-4.08,.85),(-3.55,2.03),(-3.42,2.05),(3.42,2.05),(3.55,2.03),(4.08,.85),(4.25,.77)],'hull',n)
 for side in (-1,1):
  b.cylinder('endhatch',(0,side*4.24,0),.755,.06,'nomex',n,axis='y')
  for j in range(8):
   a=j*math.tau/8;b.rod('lock',(math.cos(a)*.62,side*4.19,math.sin(a)*.62),(math.cos(a)*.70,side*4.19,math.sin(a)*.70),.013,'steel',6)
 for st in range(6):
  y=-2.78+st*1.11
  for side in ('left','right','floor','ceiling'):
   sg=-1 if side in ('left','floor') else 1
   if side in ('left','right'):
    b.box('ISPR',(sg*1.29,y,0),(.54,1.04,1.78),'white')
    def front(n,u,v,du,dv,mat,d=.03):b.box(n,(sg*(1.02-d),y+u,v),(.022,du,dv),mat)
   else:
    b.box('ISPR',(0,y,sg*1.29),(1.78,1.04,.54),'nomex')
    def front(n,u,v,du,dv,mat,d=.03):b.box(n,(v,y+u,sg*(1.02-d)),(dv,du,.022),mat)
   front('frame',0,0,.97,1.69,'nomex')
   front('head',-.38,0,.12,1.59,'steel')
   front('screen',-.12,.34,.28,.52,'screen' if st%2 else 'screen2',.05)
   front('instrument',.20,-.13,.39,1.18,'white')
   for j in range(4 if high else 2):front('vent',.11+j*.065,-.20,.018,.95,'trim',.055)
   for j in range(6 if high else 2):front('button',-.29+j*.09,-.44,.035,.06,'green' if j==0 else 'black',.065)
   if high:
    for j in range(4):front('port',.35,-.63+j*.25,.070,.09,'black',.063)
    for j in range(3):front('rack_nut',-.02+j*.16,.72,.05,.035,'steel',.06)
 for x in (-.81,.81):b.box('led',(x,0,1.03),(.075,6.7,.035),'light')
 for x in (-1,1):
  for z in (-.83,.83):b.rod('rail',(x*.94,-3.38,z),(x*.94,3.38,z),.021,'blue',10)
 if high:
  for st in range(6):
   y=-2.78+st*1.11
   for x in (-1,1):
    for j in range(3):
     yy=y+j*.18-.16
     b.rod('cable',(x*.97,yy,-.73),(x*.99,yy+.04,-.21),.007,'black',7)
     b.rod('mount',(x*.94,yy+.05,-.37),(x*.99,yy+.05,-.37),.018,'steel',7)
   if st in (1,4):b.box('storage_bag',(0,y,-1.03),(.45,.40,.08),'fabric')
 return b

def cupola(high):
 b=Builder();n=72 if high else 36
 b.sidewall('base_inner',1.466,0,.68,'nomex',n)
 b.cylinder('base_endplate',(0,0,-.052),1.465,.105,'hull',n)
 b.ring('bottom_ring',.70,1.45,.03,'white',n)
 b.cylinder('docking_hatch',(0,0,-.099),.63,.05,'steel',n)
 def pt(r,a,z):return(r*math.cos(a),r*math.sin(a),z)
 for i in range(6):
  a0=i*math.tau/6;a1=(i+1)*math.tau/6;m=.115;q0=a0+m;q1=a1-m
  bl=pt(1.415,q0,.70);br=pt(1.415,q1,.70);tr=pt(.68,q1,1.385);tl=pt(.68,q0,1.385)
  b.quad('window',[bl,br,tr,tl],'glass')
  b.quad('rib_bulkhead',[pt(1.466,q1,.68),pt(1.466,a1+m,.68),pt(.70,a1+m,1.435),pt(.70,q1,1.435)],'hull')
  b.quad('lower_seal',[pt(1.466,q0,.68),pt(1.466,q1,.68),br,bl],'hull')
  b.quad('upper_seal',[tl,tr,pt(.70,q1,1.435),pt(.70,q0,1.435)],'hull')
  for a,v in ((bl,br),(br,tr),(tr,tl),(tl,bl)):b.rod('glass_bezel',a,v,.043,'steel',12 if high else 7)
  b.rod('ribs',pt(1.47,a0,.67),pt(.69,a0,1.445),.071,'steel',12 if high else 7)
  mid=(a0+a1)/2
  b.rod('grabrail',pt(1.28,mid-.17,.38),pt(1.28,mid+.17,.38),.023,'blue',10)
  b.cylinder('shutter_handle',pt(1.4,mid,.52),.06,.03,'black',12)
  if high:
   for j in range(3):b.box('electronic_trim',pt(1.41,mid+(j-1)*.2,.25),(.08,.09,.085),'steel')
 b.ring('top_crown',.40,.72,1.435,'hull',n)
 b.cylinder('nadir_window_80cm',(0,0,1.448),.4,.012,'glass',n)
 for i in range(n):
  a=i*math.tau/n;an=(i+1)*math.tau/n
  b.rod('nadir_window_gasket',pt(.422,a,1.46),pt(.422,an,1.46),.027,'steel',6)
 b.box('RWS_anchor',(.2,-.48,.41),(.1,.13,.79),'steel')
 b.box('RWS_worktop',(.2,-.40,.79),(.73,.39,.065),'black')
 for s in (-1,1):
  b.box('RWS_monitor',(.2+s*.24,-.68,1.02),(.42,.08,.35),'black')
  b.box('RWS_lit_screen',(.2+s*.24,-.733,1.02),(.36,.012,.27),'screen' if s<0 else 'screen2')
  if high:
   for j in range(5):b.box('display_UI_lines',(.2+s*.24,-.742,.95+j*.035),(.22,.004,.009),'light')
 for x in (-.02,.43):
  b.cylinder('control_base',(x,-.27,.83),.065,.03,'steel',16)
  b.rod('control_stick',(x,-.27,.85),(x,-.27,1.0),.025,'black',12)
  b.cylinder('joystick_grip',(x,-.27,1.02),.048,.07,'black',12)
 if high:
  for j in range(7):b.box('keys',(-.05+j*.08,-.32,.83),(.043,.038,.013),'white')
  for j in range(6):
   a=(j+.5)*math.tau/6;b.rod('led_strip',pt(.99,a,.71),pt(.98,a,.78),.022,'light',7)
 return b

if __name__=='__main__':
 for q in ('optimized','detailed'):
  high=q=='detailed'
  destiny(high).export('destiny_'+q)
  cupola(high).export('cupola_'+q)
