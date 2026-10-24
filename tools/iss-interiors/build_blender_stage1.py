"""ISS Stage 1: original editable Blender interiors, approximate educational layouts.
Blender 4.5 LTS: blender -b -t 8 --python build_blender_stage1.py -- --out PATH --modules all
Not photogrammetry, not an as-flown engineering survey. Base detail for later refinement.
"""
import bpy,bmesh,math,json,sys,argparse,random,struct
import numpy as np
from pathlib import Path
from mathutils import Vector
P=argparse.ArgumentParser();P.add_argument('--out',required=True);P.add_argument('--modules',default='all');P.add_argument('--samples',type=int,default=24);P.add_argument('--width',type=int,default=1200)
A=P.parse_args(sys.argv[sys.argv.index('--')+1:]);OUT=Path(A.out)
for d in ['blend','glb','renders']:(OUT/d).mkdir(parents=True,exist_ok=True)
SPECS={
'destiny':('Destiny',8.4,6,'lab'),'harmony':('Harmony',6.7,4,'crew'),'tranquility':('Tranquility',6.7,4,'gym'),
'columbus':('Columbus',6.4,5,'lab'),'kibo':('Kibo',10.8,8,'lab'),'unity':('Unity',5.5,3,'node'),
'zarya':('Zarya',10.7,7,'cargo_ru'),'zvezda':('Zvezda',10.3,6,'service'),'nauka':('Nauka',10.2,6,'rulab'),
'poisk':('Poisk',3.8,3,'airlock_ru'),'rassvet':('Rassvet',5.2,4,'cargo_ru'),'prichal':('Prichal',3.3,2,'sphere'),
'quest':('Quest',5.5,4,'airlock'),'leonardo':('Leonardo',6.7,5,'cargo'),'kibo_elm':('Kibo Logistics',4.2,3,'cargo'),
'beam':('BEAM',4.0,4,'fabric'),'bishop':('Bishop',2.4,2,'bell'),'cupola':('Cupola',1.5,1,'cupola')}
M={};C={};ROOT=None;KEY=''

def mat(name,c,metal=0,rough=.6,fabric=False,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
 if fabric:
  n=256;yy,xx=np.mgrid[:n,:n];noise=np.random.default_rng(42).normal(0,.012,(n,n));weave=.018*np.sin(xx*math.pi/2)*np.sin(yy*math.pi/2)
  data=np.ones((n,n,4));data[:,:,:3]=np.clip(np.array(c)[None,None,:]+(weave+noise)[:,:,None],0,1)
  im=bpy.data.images.new(name+'_woven',width=n,height=n);im.pixels.foreach_set(data.astype('float32').ravel());im.pack()
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
  norm=np.ones((n,n,4));norm[:,:,:3]=(.5,.5,1);norm[:,:,0]=.5+.08*np.cos(xx*math.pi/2);norm[:,:,1]=.5+.08*np.cos(yy*math.pi/2)
  im=bpy.data.images.new(name+'_normal',width=n,height=n);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(norm.astype('float32').ravel());im.pack()
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;b=m.node_tree.nodes.new('ShaderNodeNormalMap');b.inputs['Strength'].default_value=.3;m.node_tree.links.new(t.outputs['Color'],b.inputs['Color']);m.node_tree.links.new(b.outputs['Normal'],p.inputs['Normal'])
 M[name]=m;return m

def materials():
 mat('Ivory',(.69,.7,.67));mat('White',(.82,.83,.81),rough=.52);mat('Nomex',(.75,.72,.62),rough=.9,fabric=True);mat('Cargo',(.65,.63,.53),rough=.9,fabric=True)
 mat('Blue',(.04,.15,.27),rough=.85,fabric=True);mat('Silver',(.46,.51,.53),.8,.32);mat('Dark',(.018,.026,.03),.1,.65);mat('Gasket',(.012,.014,.014),rough=.95)
 mat('Yellow',(.9,.52,.06),.1,.4);mat('Red',(.5,.035,.025));mat('Green',(.17,.28,.23));mat('Gold',(.52,.35,.13),.5,.4);mat('Paper',(.86,.85,.78),rough=.85)
 mat('Light',(.85,.93,1),rough=.35,emission=3);mat('Display',(.012,.064,.11),.2,.3,emission=.4);mat('Pixels',(.33,.75,.8),emission=.6);mat('LED',(.09,.72,.33),emission=2)
 mat('Glass',(.025,.16,.22),.5,.15)

def mesh(name,vs,fs,material):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.parent=ROOT;me.materials.append(M[material]);uv=me.uv_layers.new(name='UVMap')
 for poly in me.polygons:
  axis=max(range(3),key=lambda i:abs(poly.normal[i]));ax=[i for i in range(3) if i!=axis]
  for li in poly.loop_indices:
   v=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(v[ax[0]],v[ax[1]])
 return ob

def box(name,loc,dim,ma='White',bevel=.012,rot=None):
 key=tuple(round(d,4) for d in dim)+(ma,bevel)
 if key not in C:
  bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
  for v in bm.verts:v.co.x*=dim[0];v.co.y*=dim[1];v.co.z*=dim[2]
  if bevel:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=min(bevel,min(dim)*.28),segments=2,affect='EDGES')
  me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free();me.materials.append(M[ma]);uv=me.uv_layers.new(name='UVMap')
  for poly in me.polygons:
   axis=max(range(3),key=lambda i:abs(poly.normal[i]));ax=[i for i in range(3) if i!=axis]
   for li in poly.loop_indices:
    v=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(v[ax[0]],v[ax[1]])
  C[key]=me
 ob=bpy.data.objects.new(name,C[key]);bpy.context.collection.objects.link(ob);ob.parent=ROOT;ob.location=loc
 if rot:ob.rotation_euler=rot
 return ob

def cyl(name,a,b,r,ma='Silver',n=12):
 a,b=Vector(a),Vector(b);d=b-a;h=d.length
 vs=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for z in [-h/2,h/2] for i in range(n)]
 fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 ob=mesh(name,vs,fs,ma);ob.location=(a+b)/2;ob.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 for p in ob.data.polygons:p.use_smooth=len(p.vertices)==4
 return ob

def cable(name,coords,r=.015,ma='Dark'):
 pts=[Vector(p) for p in coords];vs=[];n=8
 for i,p in enumerate(pts):
  t=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized();u=t.cross(Vector((0,0,1)))
  if u.length<.1:u=t.cross(Vector((1,0,0)))
  u.normalize();v=t.cross(u);vs.extend([tuple(p+r*(math.cos(j*2*math.pi/n)*u+math.sin(j*2*math.pi/n)*v)) for j in range(n)])
 ob=mesh(name,vs,[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j) for i in range(len(pts)-1) for j in range(n)],ma)
 for p in ob.data.polygons:p.use_smooth=True
 return ob

def rail(a,b,ma='Blue'):
 cyl('Handrail',a,b,.026,ma)
 for p in (a,b):box('Handrail mount',p,(.08,.08,.08),'Silver',.012)

def text(s,loc,size=.07,ma='Dark',rot=(math.pi/2,0,0)):
 cu=bpy.data.curves.new(s,'FONT');cu.body=s;cu.size=size;cu.align_x='CENTER';cu.align_y='CENTER';cu.resolution_u=2
 ob=bpy.data.objects.new(s,cu);bpy.context.collection.objects.link(ob);ob.parent=ROOT;ob.location=loc;ob.rotation_euler=rot;cu.materials.append(M[ma]);return ob

def lablabel(s,side,y,z=.87):
 box('Equipment ID',(side*1.15,y,z),(.015,.54,.14),'Paper',.001)
 text(s,(side*1.137,y,z),.052,'Dark',(math.pi/2,0,-side*math.pi/2))

def bag(x,y,z,w=.85,side=1):
 box('Nomex stowage bag',(x,y,z),(.42,w,.59),'Cargo',.075)
 for off in [-w*.3,w*.3]:box('Cargo webbing',(x-side*.221,y+off,z),(.018,.034,.58),'Blue',.005)
 box('Cargo ID label',(x-side*.232,y,z+.07),(.009,.20,.11),'Paper',.001)
 box('Zipper',(x-side*.225,y,z+.24),(.016,w*.88,.012),'Dark',.001)
 rail((x-side*.24,y-.08,z-.08),(x-side*.24,y+.08,z-.08),'Ivory')

def screen(side,y,z=.22,w=.48):
 x=side*1.10;box('Laptop housing',(x,y,z),(.085,w,.34),'Dark',.016);box('LCD',(x-side*.049,y,z),(.005,w*.86,.27),'Display',.001)
 for j in range(6):box('Telemetry',(x-side*.054,y-w*.12,z+.087-.031*j),(.004,w*(.55-.06*(j%3)),.005),'Pixels',0)
 box('Keyboard',(x-side*.18,y,z-.20),(.35,w,.027),'Dark',.008)
 for i in range(4):
  for j in range(9):box('Key',(x-side*(.07+i*.06),y-w*.37+j*w*.09,z-.183),(.035,.027,.006),'Silver',0)

def rack(side,y,w,idx):
 box('ISPR rack structure',(side*1.38,y,0),(.34,w,2.2),'Silver',.025);box('ISPR front',(side*1.19,y,0),(.05,w-.06,2.12),'Ivory',.016)
 for yy in [-w*.43,w*.43]:box('Mount rail',(side*1.15,y+yy,0),(.05,.025,2.16),'Silver',.003)
 for z,h in [(-.78,.36),(-.29,.54),(.31,.50),(.82,.26)]:
  box('Experiment face',(side*1.15,y,z),(.03,w-.16,h),'White',.006)
  for off in [-w*.32,w*.32]:
   for zz in [z-h*.35,z+h*.35]:cyl('Captive screw',(side*1.132,y+off,zz),(side*1.119,y+off,zz),.013,'Silver',8)
 for j in range(8):box('Vent',(side*1.127,y,-.9+j*.025),(.008,w*.53,.007),'Dark',0)
 for j in range(4):
  cyl('Connector',(side*1.126,y-w*.24+j*w*.16,-.35),(side*1.10,y-w*.24+j*w*.16,-.35),.024,'Dark',10)
  box('Status LED',(side*1.117,y-w*.24+j*w*.16,-.22),(.01,.018,.012),'LED',.003)
 labels={'destiny':['EXPRESS','MSG','CIR','FIR','MELFI','HRF'],'columbus':['BIOLAB','FSL','EPM','EDR','EXPRESS'],'kibo':['RYUTAI','SAIBO','KOBAIRO','MSPR','EXPRESS','JEM SYS','PAYLOAD','STORAGE']}
 ss=labels.get(KEY,['ECLSS','SCIENCE','POWER','WRS','AVIONICS','DATA']);lablabel(ss[idx%len(ss)],side,y)
 rail((side*1.075,y-w*.3,.65),(side*1.075,y+w*.3,.65))
 if idx%3==1:screen(side,y,.25,min(.54,w*.64))
 elif idx%3==2:
  box('Equipment aperture',(side*1.125,y,.23),(.015,w*.67,.38),'Dark',.015);box('Experiment glass',(side*1.11,y,.23),(.009,w*.57,.28),'Glass',.006)
 if idx%2==0:cable('Data lead',[(side*1.1,y+.13,-.36),(side*.98,y+.17,-.5),(side*1.01,y+.27,-.68),(side*1.13,y+.3,-.83)],.012,'Blue')

def ring(name,y,ro,ri,ma='Silver',n=48):
 vs=[(r*math.sin(i*2*math.pi/n),y,r*math.cos(i*2*math.pi/n)) for r in [ro,ri] for i in range(n)]
 return mesh(name,vs,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],ma)

def hatch(y,sg=1,ru=False):
 if ru:
  ring('Circular pressure hatch',y,.66,.51);ring('Seal',y-sg*.01,.53,.49,'Gasket');cyl('Closed pressure door',(0,y+sg*.03,0),(0,y+sg*.08,0),.5,'Ivory',48)
  for j in range(4):
   a=j*math.pi/2;rail((0,y-sg*.08,0),(.28*math.cos(a),y-sg*.08,.28*math.sin(a)),'Red')
 else:
  for x in [-.6,.6]:box('CBM frame',(x,y,0),(.14,.16,1.34),'Silver',.04)
  for z in [-.6,.6]:box('CBM frame',(0,y,z),(1.3,.16,.14),'Silver',.04)
  box('Pressure seal',(0,y+sg*.03,0),(1.09,.04,1.09),'Gasket',.08);box('Closed CBM door',(0,y+sg*.015,0),(1.035,.035,1.035),'Ivory',.07)
  rail((-.17,y-sg*.14,-.17),(.17,y-sg*.14,-.17),'Yellow')
  for x in [-.44,.44]:
   for z in [-.32,0,.32]:box('Latch',(x,y-sg*.1,z),(.07,.13,.10),'Silver',.014)
 text('TRANSFER',(0,y-sg*.13,.32),.075,'Dark',(math.pi/2 if sg==1 else -math.pi/2,0,0))

def endcap(y,sg=1,ru=False):
 for x in [-1.08,1.08]:box('Bulkhead lining',(x,y,0),(.87,.14,2.92),'Nomex',.045)
 for z in [-1.07,1.07]:box('Bulkhead lining',(0,y,z),(1.35,.14,.83),'Nomex',.045)
 hatch(y-sg*.10,sg,ru);box('Module placard',(0,y-sg*.11,1.05),(1.05,.02,.19),'Dark',.005);text(KEY.upper().replace('_',' '),(0,y-sg*.13,1.05),.095,'Paper',(math.pi/2 if sg==1 else -math.pi/2,0,0))
 for x in [-1.1,1.1]:rail((x,y-sg*.15,-.38),(x,y-sg*.15,.38))

def light(loc,target,power=95,size=1.5):
 d=bpy.data.lights.new('Interior soft luminaire','AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=(.91,.96,1)
 ob=bpy.data.objects.new(d.name,d);bpy.context.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def shell(L,n,ru=False):
 step=(L-.8)/n
 for i in range(n):
  y=-L/2+.4+(i+.5)*step
  for x in [-1.48,1.48]:box('Continuous wall',(x,y,0),(.13,step+.02,2.85),'Nomex' if ru else 'White',.014)
  for z in [-1.43,1.43]:box('Continuous deck lining',(0,y,z),(2.85,step+.02,.14),'Ivory',.014)
  for x in [-1.3,1.3]:
   for z in [-1.27,1.27]:box('Corner duct cover',(x,y,z),(.34,step+.02,.34),'Nomex',.09)
  for x in [-.68,.68]:box('Luminaire diffuser',(x,y,1.35),(.13,min(.95,step*.8),.025),'Light',.006)
  light((0,y,1.24),(0,y,-1.3),110 if ru else 95)
  for x in [-.59,.59]:
   box('Deck access panel',(x,y,-1.351),(1.10,step-.07,.015),'Green' if ru else 'Ivory',.012);rail((x-.11,y,-1.31),(x+.11,y,-1.31),'Silver')
 for side in [-1,1]:
  for j in range(3):cable('Overhead service harness',[(side*(1.12+j*.04),-L/2+.1,1.20),(side*(1.12+j*.04),L/2-.1,1.20)],.014,'Blue' if j==2 else 'Ivory')
  for j in range(n):box('Cable clamp',(side*1.17,-L/2+.4+j*step,1.2),(.19,.045,.07),'Dark',.008)
 endcap(L/2,1,ru);endcap(-L/2,-1,ru)
 return [-L/2+.4+(i+.5)*step for i in range(n)],step

def sideport(side,y):
 box('Radial port door',(side*1.15,y,0),(.15,1.03,1.16),'Ivory',.08)
 for yy in [-.59,.59]:box('Radial port jamb',(side*1.09,y+yy,0),(.14,.13,1.38),'Silver',.024)
 for z in [-.63,.63]:box('Radial port jamb',(side*1.09,y,z),(.14,1.31,.13),'Silver',.024)
 rail((side*.98,y-.17,-.23),(side*.98,y+.17,-.23),'Yellow');lablabel('CBM PORT',side,y,.39)

def quarter(side,y,i):
 box('Crew quarters enclosure',(side*1.38,y,0),(.40,1.0,2.18),'Ivory',.025);box('Privacy fabric',(side*1.16,y,0),(.035,.92,2.06),'Nomex',.018)
 box('Crew alcove',(side*1.13,y,-.08),(.025,.65,1.44),'Dark',.035);box('Sleeping restraint',(side*1.10,y,-.22),(.028,.55,1.08),'Blue',.065);box('Restraint zipper',(side*1.08,y,-.22),(.015,.014,1.0),'Silver',.002)
 lablabel('CREW '+str(i),side,y,.88);rail((side*1.05,y-.4,-.33),(side*1.05,y-.4,.33))

def gym():
 for y in [-.54,.54]:
  cyl('ARED yellow cylinder',(.70,y,-1.2),(.70,y,.16),.115,'Yellow',16);cyl('ARED piston',(.70,y,.16),(.70,y,.57),.06,'Silver',16);cyl('ARED guide rail',(.96,y,-1.18),(.96,y,.85),.04,'Yellow')
 rail((.7,-.64,.56),(.7,.64,.56),'Dark');box('ARED platform',(.70,0,-1.24),(.82,1.42,.14),'Dark',.02)
 box('Treadmill',(-.57,1.45,-1.18),(.8,1.5,.20),'Silver',.035);box('Treadmill belt',(-.57,1.45,-1.07),(.66,1.35,.014),'Gasket',.006)
 cable('Treadmill restraint',[(-.95,1.8,-.9),(-.82,1.5,-.22),(-.45,1.1,-.45)],.019,'Blue')

def meal_table(y):
 box('Meal table',(0,y,-.63),(1.2,.65,.06),'Ivory',.03)
 for x in [-.43,.43]:cyl('Table brace',(x,y,-1.30),(x,y,-.68),.025)
 for x in [-.35,0,.35]:box('Meal pouch',(x,y,-.56),(.23,.20,.065),'Gold',.02);box('Pouch label',(x,y,-.525),(.12,.11,.004),'Paper',0)

def gases(side,y):
 for j in [-1,0,1]:
  yy=y+j*.23;cyl('Pressure cylinder',(side*1.02,yy,-.96),(side*1.02,yy,.51),.084,'Green',16);cyl('Valve',(side*1.02,yy,.51),(side*1.02,yy,.64),.03,'Gold')
  cable('Pressure hose',[(side*1.02,yy,.65),(side*.88,yy,.79),(side*1.15,yy+.12,.85)],.017)
 lablabel('O2 / N2',side,y,.98)

def cupola():
 # Six trapezoidal windows, central round window, continuous opaque webbing.
 window=mat('Clear glazing',(.93,.97,1),rough=.08);p=window.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.45
 for i in range(6):
  a=i*math.pi/3;b=(i+1)*math.pi/3
  vs=[Vector((1.23*math.cos(a),1.23*math.sin(a),.08)),Vector((1.23*math.cos(b),1.23*math.sin(b),.08)),Vector((.62*math.cos(b),.62*math.sin(b),1.05)),Vector((.62*math.cos(a),.62*math.sin(a),1.05))]
  c=sum(vs,Vector())/4;ins=[c+(v-c)*.76 for v in vs];mesh('Window surround',vs+ins,[(j,(j+1)%4,(j+1)%4+4,j+4) for j in range(4)],'Silver');mesh('Cupola glass '+str(i+1),ins,[(0,1,2,3)],'Clear glazing')
  for j in range(4):cable('Window seal',[ins[j],ins[(j+1)%4]],.021,'Gasket');cable('Window rib',[vs[j],vs[(j+1)%4]],.048,'Ivory')
  mesh('Cupola lower lining',[(1.23*math.cos(a),1.23*math.sin(a),-.64),(1.23*math.cos(b),1.23*math.sin(b),-.64),vs[1],vs[0]],[(0,1,2,3)],'Ivory')
 vv=[(r*math.cos(j*2*math.pi/64),r*math.sin(j*2*math.pi/64),1.05) for r in [.63,.40] for j in range(64)];mesh('Zenith window plate',vv,[(j,(j+1)%64,(j+1)%64+64,j+64) for j in range(64)],'Silver')
 cyl('Cupola glass 7',(0,0,1.046),(0,0,1.056),.399,'Clear glazing',64)
 for r in [.414,.603]:cable('Zenith seal',[(r*math.cos(j*math.pi/32),r*math.sin(j*math.pi/32),1.03) for j in range(65)],.018,'Gasket')
 for j in range(12):
  a=j*math.pi/6;cyl('Glazing bolt',(.51*math.cos(a),.51*math.sin(a),1.01),(.51*math.cos(a),.51*math.sin(a),1.05),.018,'Dark',8)
 box('Cupola deck',(0,0,-.68),(2.20,2.20,.12),'Ivory',.08)
 for x in [-.86,.86]:rail((x,-.42,-.22),(x,.42,-.22))
 for x in [-.30,.30]:
  box('Robotics display',(x,.79,-.11),(.52,.075,.35),'Dark',.016);box('Robotics LCD',(x,.748,-.11),(.45,.004,.28),'Display',.001)
  for j in range(4):box('LCD line',(x,.741,-.19+j*.047),(.32-j*.035,.004,.006),'Pixels',0)
 box('Robotics console',(0,.60,-.36),(1.1,.42,.08),'Ivory',.02)
 for x in [-.35,.35]:cyl('Joystick',(x,.52,-.32),(x,.52,-.16),.022,'Dark')
 light((0,-.5,-.1),(0,.5,.6),45,1.2)
 return ((0,-.56,-.46),(0,.18,.64),16)

def build(key):
 global ROOT,KEY,M,C
 KEY=key;M={};C={};bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for data in [bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.images]:
  for x in list(data):
   if x.users==0:data.remove(x)
 materials();ROOT=bpy.data.objects.new(key.upper()+'_STAGE1',None);bpy.context.collection.objects.link(ROOT);ROOT['quality']='Base / Stage 1';ROOT['accuracy']='Approximate educational reconstruction, not an as-flown survey';ROOT['authoring']='Blender 4.5 LTS'
 name,L,n,kind=SPECS[key];camera=((.08,-L/2+.48,.04),(-.04,L/2-.38,.02),18 if L>5 else 16)
 if kind=='cupola':camera=cupola()
 elif kind in ['fabric','bell']:
  r=1.42 if kind=='fabric' else 1.06
  for j in range(32):
   a=j*math.pi/16;b=(j+1)*math.pi/16;vs=[(r*math.cos(a),-L/2,r*math.sin(a)),(r*math.cos(b),-L/2,r*math.sin(b)),(r*math.cos(b),L/2,r*math.sin(b)),(r*math.cos(a),L/2,r*math.sin(a))]
   mesh('Pressure wall',vs,[(0,1,2,3)],'Nomex' if kind=='fabric' else 'Silver')
   if j%2==0:cable('Axial seam',[(r*.98*math.cos(a),-L/2,r*.98*math.sin(a)),(r*.98*math.cos(a),L/2,r*.98*math.sin(a))],.017,'Ivory')
  for yy in [-L*.3,0,L*.3]:
   cable('Pressure restraint',[(r*.98*math.cos(j*math.pi/32),yy,r*.98*math.sin(j*math.pi/32)) for j in range(65)],.024,'Ivory')
  for yy,sg in [(-L/2,-1),(L/2,1)]:cyl('Sealed end',(0,yy,0),(0,yy+sg*.05,0),r,'Nomex' if kind=='fabric' else 'Silver',48);hatch(yy-sg*.08,sg)
  if kind=='fabric':
   for side in [-1,1]:
    for j in range(3):bag(side*.99,-.58+j*.60,-.52,.52,side)
  else:
   box('Payload tray',(0,0,-.68),(1.40,1.75,.10),'Ivory',.016)
   for x in [-.61,.61]:rail((x,-.80,-.53),(x,.8,-.53),'Silver')
   for x in [-.35,.35]:box('Payload carrier',(x,.30,-.43),(.46,.6,.38),'Dark',.025)
  for yy in [-L*.2,L*.2]:light((0,yy,.85),(0,yy,-.6),85,1.2)
 elif kind=='sphere':
  # Six-port nodal layout, faceted study shell; spherical curvature refined next stage.
  ys,step=shell(L,n,True)
  for side in [-1,1]:sideport(side,0)
  for z in [-1.31,1.31]:box('Zenith / nadir hatch',(0,0,z),(1.1,1.1,.09),'Silver',.09)
 else:
  ru=kind in ['cargo_ru','service','rulab','airlock_ru'];ys,step=shell(L,n,ru)
  for side in [-1,1]:
   for i,y in enumerate(ys):
    if kind=='lab':rack(side,y,step-.055,i if side<0 else i+1)
    elif kind=='crew':
     if i<2:quarter(side,y,1+i+(2 if side==1 else 0))
     elif i==2:sideport(side,y)
     else:bag(side*1.19,y,-.48,step-.12,side);bag(side*1.19,y,.40,step-.12,side)
    elif kind=='node':
     if i==1:sideport(side,y)
     else:bag(side*1.18,y,-.5,step-.14,side);bag(side*1.18,y,.4,step-.14,side)
    elif kind in ['cargo','cargo_ru']:
     for z in [-.76,-.04,.68]:bag(side*1.16,y,z,step-.10,side)
    elif kind=='gym':
     if side==-1 or i in [0,n-1]:rack(side,y,step-.06,i)
     else:box('Acoustic padding',(side*1.36,y,0),(.10,step-.04,2.2),'Nomex',.05)
    elif kind in ['service','rulab']:
     if i in [0,1,4] or (kind=='rulab' and i==3):rack(side,y,step-.06,i)
     elif i==2 and kind=='service':quarter(side,y,1 if side<0 else 2)
     else:
      box('Service control panel',(side*1.28,y,0),(.29,step-.06,2.2),'Green',.018);screen(side,y,.44,.60)
      for z in [-.4,-.72]:
       for j in range(4):box('Control switch',(side*1.115,y-.32+j*.20,z),(.03,.09,.11),'Ivory',.01)
    elif kind in ['airlock','airlock_ru']:
     if i==1:gases(side,y)
     elif i==2 and side==1:sideport(side,y)
     else:bag(side*1.2,y,-.48,max(.5,step-.16),side);rail((side*1.1,y-.23,.6),(side*1.1,y+.23,.6),'Red')
  if kind=='lab':
   for side,y in [(-1,ys[-2]),(1,ys[min(2,n-1)])]:
    bag(side*1.01,y,-.95,min(step*.7,.78),side)
    cable('Temporary service line',[(side*.98,y+.2,.4),(side*.85,y+.22,.1),(side*.94,y+.32,-.3)],.018,'Dark')
  if kind=='gym':gym()
  if kind=='service':meal_table(1.75)
  if kind=='rulab':meal_table(2.5)
  if key=='kibo':cyl('JEM experiment airlock',(0,L/2-.3,-.59),(0,L/2-.95,-.59),.56,'Silver',40)
  if key=='quest':
   for x in [-1.1,1.1]:box('Crew lock transition',(x,L*.18,0),(.70,.20,2.78),'Ivory',.06)
   for z in [-1.09,1.09]:box('Crew lock transition',(0,L*.18,z),(1.52,.20,.72),'Ivory',.05)
   ring('Crew lock rim',L*.18-.12,.77,.62)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=A.samples;scene.cycles.use_denoising=True;scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=4
 scene.render.resolution_x=A.width;scene.render.resolution_y=round(A.width*2/3);scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
 scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.25,.32,.41,1);bg.inputs[1].default_value=.22
 scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.85
 d=bpy.data.cameras.new('Review camera');ob=bpy.data.objects.new(d.name,d);bpy.context.collection.objects.link(ob);ob.location=camera[0];ob.rotation_euler=(Vector(camera[1])-ob.location).to_track_quat('-Z','Y').to_euler();d.lens=camera[2];d.clip_start=.018;scene.camera=ob
 light(camera[0],camera[1],18,1.5)
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.objects:
  if o.type=='FONT':o.select_set(True)
 if bpy.context.selected_objects:bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.convert(target='MESH')
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blend'/f'{key}_stage1.blend'),compress=True)
 for o in scene.objects:
  if o.type=='MESH':o.select_set(True)
 bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.join();bpy.context.object.name=key+'_interior'
 bpy.ops.export_scene.gltf(filepath=str(OUT/'glb'/f'{key}_optimized.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_tangents=True,export_cameras=False,export_lights=False,export_extras=True)
 bpy.ops.wm.open_mainfile(filepath=str(OUT/'blend'/f'{key}_stage1.blend'));scene=bpy.context.scene
 if kind=='cupola':
  # Render-only neutral orbital backdrop; omitted from GLB and native module geometry.
  ROOT=None;M={m.name:m for m in bpy.data.materials};mat('Orbital blue',(.024,.15,.28),rough=1,emission=.5);box('Presentation backdrop',(0,0,3),(20,20,.03),'Orbital blue',0);light((0,0,2),(0,0,0),180,4)
 scene.render.filepath=str(OUT/'renders'/f'{key}.png');bpy.ops.render.render(write_still=True)
 data=(OUT/'glb'/f'{key}_optimized.glb').read_bytes();ln=struct.unpack('<I',data[12:16])[0];g=json.loads(data[20:20+ln]);tri=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives'])
 meta={'id':key,'name':name,'stage':1,'bytes':len(data),'triangles':tri,'materials':len(g.get('materials',[])),'camera_blender':camera,'renderer':'Blender 4.5.3 / Cycles','samples':A.samples}
 (OUT/f'{key}.json').write_text(json.dumps(meta,indent=2));print('MODULE_COMPLETE '+json.dumps(meta),flush=True)

for key in (list(SPECS) if A.modules=='all' else A.modules.split(',')):build(key)
(OUT/'manifest.json').write_text(json.dumps([json.loads(p.read_text()) for p in OUT.glob('*.json') if p.name!='manifest.json'],indent=2))
