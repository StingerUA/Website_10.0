"""ISS Stage 2: detailed PBR interiors with embedded AO, fabric and equipment detail.
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
 window=mat('Clear glazing',(.98,.99,1),rough=.018);p=window.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.45
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

def spherical_node():
 r=1.73;vs=[];fs=[];nu=40;nv=24
 for j in range(nv+1):
  t=.001+(math.pi-.002)*j/nv
  for i in range(nu):
   a=i*2*math.pi/nu;vs.append((r*math.sin(t)*math.cos(a),r*math.sin(t)*math.sin(a),r*math.cos(t)))
 for j in range(nv):
  for i in range(nu):fs.append((j*nu+i,j*nu+(i+1)%nu,(j+1)*nu+(i+1)%nu,(j+1)*nu+i))
 ob=mesh('Spherical pressure cabin',vs,fs,'Nomex')
 for p in ob.data.polygons:p.use_smooth=True
 for axis in [(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)]:
  n=Vector(axis);u=n.cross(Vector((0,0,1)))
  if u.length<.1:u=n.cross(Vector((0,1,0)))
  u.normalize();v=n.cross(u);center=n*1.44
  cyl('Circular docking door',center,center+n*.06,.53,'Ivory',48)
  for rad,thick,ma in [(.60,.075,'Silver'),(.54,.022,'Gasket')]:
   cable('Docking ring',[center-n*.025+rad*(math.cos(i*math.pi/32)*u+math.sin(i*math.pi/32)*v) for i in range(65)],thick,ma)
  for j in range(8):
   a=j*math.pi/4;p=center+.70*(math.cos(a)*u+math.sin(a)*v);cyl('Port latch',p-n*.06,p,.025,'Dark',8)
  rail(center-n*.12-u*.19-v*.18,center-n*.12+u*.19-v*.18,'Red')
 for j in range(8):
  a=j*math.pi/4;pts=[(r*.98*math.sin(t)*math.cos(a),r*.98*math.sin(t)*math.sin(a),r*.98*math.cos(t)) for t in [.20+i*(math.pi-.40)/24 for i in range(25)]];cable('Pressure shell seam',pts,.018,'Ivory')
 for x in [-.65,.65]:light((x,-.30,.92),(0,0,-.3),45,1)
 text('PRICHAL',(0,1.12,.86),.11,'Dark')
 return ((.06,-1.13,.04),(0,.9,.04),15)

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
 elif kind=='sphere':camera=spherical_node()
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
 refine_module(key,L,n,kind)
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
 return finalize_detail(key,name,kind,camera)

# Stage 2 modelling library. The editable PBR scene is retained before web baking.
_base_mat=mat
_base_box=box
_base_shell=shell
_base_screen=screen
_base_cable=cable
_base_materials=materials
from mathutils import Matrix
import os,time

def image_data(name,data,noncolor=False):
 h,w=data.shape[:2];im=bpy.data.images.new(name,width=w,height=h,alpha=False)
 if noncolor:im.colorspace_settings.name='Non-Color'
 im.pixels.foreach_set(np.dstack((data,np.ones((h,w),dtype=np.float32))).astype(np.float32).ravel());im.pack();return im

def texture_node(m,im,uv='UVMap'):
 ns=m.node_tree.nodes;ls=m.node_tree.links;t=ns.new('ShaderNodeTexImage');t.image=im;t.interpolation='Linear'
 u=ns.new('ShaderNodeUVMap');u.uv_map=uv;ls.new(u.outputs['UV'],t.inputs['Vector']);return t

def mat(name,c,metal=0,rough=.6,fabric=False,emission=0):
 m=_base_mat(name,c,metal,rough,False,emission);p=m.node_tree.nodes.get('Principled BSDF')
 if emission or name in ['Glass','Clear glazing']:return m
 n=512 if fabric else 256;yy,xx=np.mgrid[:n,:n];rng=np.random.default_rng(sum(map(ord,name))+29)
 grain=rng.normal(0,1,(n,n));cloud=np.zeros((n,n))
 for j in range(1,7):cloud+=np.sin(xx*(j+.13)*2*math.pi/n+rng.random()*6)*np.cos(yy*(j+.7)*2*math.pi/n+rng.random()*6)/j
 if fabric:
  height=.28*np.sin(xx*math.pi/2)*np.cos(yy*math.pi/2)+.12*grain+.12*cloud
  tint=.015*grain+.016*cloud+.009*np.sin(xx*math.pi/2)*np.cos(yy*math.pi/2)
 else:
  height=.04*grain+.008*cloud
  tint=.004*grain+.007*cloud
  if metal>.5:height+=.09*np.sin(yy*math.pi*.6);tint+=.009*np.sin(yy*math.pi*.6)
 color=np.clip(np.array(c)[None,None,:]*(1+tint[:,:,None]),.001,.98)
 t=texture_node(m,image_data(name+' BaseColor',color));m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 rr=np.clip(rough+.026*cloud+.025*grain,.08,.98);t=texture_node(m,image_data(name+' Roughness',np.repeat(rr[:,:,None],3,axis=2),True));m.node_tree.links.new(t.outputs['Color'],p.inputs['Roughness'])
 dy,dx=np.gradient(height);normal=np.dstack((-dx,-dy,np.ones_like(dx)));normal/=np.linalg.norm(normal,axis=2)[:,:,None]
 t=texture_node(m,image_data(name+' Normal',normal*.5+.5,True));nm=m.node_tree.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.38 if fabric else .16;nm.uv_map='UVMap';m.node_tree.links.new(t.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
 return m

def materials():
 _base_materials()
 mat('Velcro',(.08,.075,.064),rough=.97,fabric=True);mat('Cream webbing',(.63,.61,.52),rough=.94,fabric=True)
 mat('Off white',(.62,.65,.63),rough=.67);mat('Pale panel',(.74,.755,.72),rough=.55)
 mat('Anodized blue',(.027,.075,.15),.68,.34);mat('Aluminium foil',(.56,.58,.55),.94,.32)
 mat('Hose grey',(.36,.37,.34),rough=.85,fabric=True);mat('Orange cable',(.57,.19,.025),rough=.68)
 mat('Circuit board',(.025,.105,.074),.1,.71);mat('Amber indicator',(.92,.33,.025),emission=.6)
 mat('Clear glazing',(.92,.96,.98),rough=.035)
 p=M['Clear glazing'].node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1.0;p.inputs['IOR'].default_value=1.46

# Tighter edge radii distinguish fabricated panels from upholstered items.
def box(name,loc,dim,ma='White',bevel=.012,rot=None):
 return _base_box(name,loc,dim,ma,min(bevel,.006) if ma not in ['Nomex','Cargo','Blue'] else bevel,rot)

def cable(name,coords,r=.015,ma='Dark'):
 if len(coords)>2:
  pts=[Vector(p) for p in coords];smooth=[]
  for i in range(len(pts)-1):
   p0=pts[max(0,i-1)];p1=pts[i];p2=pts[i+1];p3=pts[min(len(pts)-1,i+2)]
   for j in range(5):
    t=j/5;smooth.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
  coords=smooth+[pts[-1]]
 return _base_cable(name,coords,r,ma)

def rail(a,b,ma='Blue'):
 cyl('Anodized handrail',a,b,.017,ma,16)
 for p in (a,b):box('Handrail mounting shoe',p,(.043,.048,.046),'Silver',.006)

def fastener(side,y,z,x=1.12):
 cyl('Recessed screw washer',(side*x,y,z),(side*(x-.003),y,z),.012,'Silver',12)
 cyl('Captive screw head',(side*(x-.004),y,z),(side*(x-.009),y,z),.007,'Dark',12)
 box('Screw drive slot',(side*(x-.0095),y,z),(.001,.009,.0018),'Silver',0)

def face_label(side,y,z,s,w=.31,h=.085,x=1.09):
 box('Equipment identification',(side*x,y,z),(.004,w,h),'Paper',.001)
 text(s,(side*(x-.003),y,z),min(.025,h*.24),'Dark',(math.pi/2,0,-side*math.pi/2))

def latch(side,y,z,x=1.09):
 box('Latch bracket',(side*x,y,z),(.025,.054,.095),'Silver',.003)
 cyl('Latch spindle',(side*(x-.018),y,z-.032),(side*(x-.018),y,z+.032),.008,'Dark',12)
 box('Quarter turn handle',(side*(x-.036),y,z),(.018,.045,.021),'Silver',.004)

def bag(x,y,z,w=.85,side=1):
 depth=.42;height=.59;nu=32;nv=18;vs=[];fs=[]
 sg=lambda x:math.copysign(abs(x)**.35,x)
 for j in range(nv+1):
  t=.001+(math.pi-.002)*j/nv
  for i in range(nu):
   a=i*2*math.pi/nu;u=sg(math.sin(t)*math.cos(a));v=sg(math.sin(t)*math.sin(a));q=sg(math.cos(t))
   crease=.015*math.sin(a*7+t*6)*math.sin(t)**2+.006*math.sin(a*15-t*9)
   vs.append((x+(depth/2+crease)*u,y+(w/2+crease)*v,z+(height/2+crease)*q))
 for j in range(nv):
  for i in range(nu):fs.append((j*nu+i,j*nu+(i+1)%nu,(j+1)*nu+(i+1)%nu,(j+1)*nu+i))
 ob=mesh('CTB fabric body',vs,fs,'Cargo')
 for p in ob.data.polygons:p.use_smooth=True
 front=x-side*.224
 for off in [-w*.28,w*.28]:
  box('CTB woven restraint',(front,y+off,z),(.014,.034,.59),'Cream webbing',.003)
  box('CTB buckle',(front-side*.009,y+off,z-.14),(.016,.052,.052),'Silver',.003)
  box('Buckle slot',(front-side*.019,y+off,z-.14),(.003,.028,.025),'Dark',.001)
 coords=[(front,y-w*.41,z-.23),(front-side*.006,y-w*.44,z+.18),(front,y-w*.35,z+.25),(front,y+w*.35,z+.25),(front,y+w*.44,z+.18),(front,y+w*.41,z-.23),(front,y-w*.41,z-.23)]
 cable('CTB stitched seam',coords,.0035,'Ivory');cable('CTB zipper',[(front,y-w*.38,z+.23),(front,y+w*.38,z+.23)],.005,'Dark')
 for j in range(18):box('Zipper tooth',(front-side*.004,y-w*.35+j*w*.70/17,z+.23),(.006,.006,.008),'Silver',0)
 box('Zipper pull',(front-side*.015,y+w*.24,z+.20),(.009,.026,.048),'Silver',.002)
 box('CTB label',(front-side*.009,y,z+.055),(.006,w*.34,.12),'Paper',.001)
 text('CTB  '+KEY[:3].upper()+'\nSTOWAGE',(front-side*.014,y,z+.06),.028,'Dark',(math.pi/2,0,-side*math.pi/2))
 cable('Soft carry handle',[(front,y-.085,z-.07),(front-side*.055,y-.065,z-.03),(front-side*.055,y+.065,z-.03),(front,y+.085,z-.07)],.011,'Cream webbing')
 return ob

def screen(side,y,z=.22,w=.48):
 _base_screen(side,y,z,w)
 face_label(side,y,z+.182,'PORTABLE COMPUTER',w*.72,.035,x=1.046)
 for k in range(2):
  cable('Laptop data cable',[(side*1.08,y+w*.45,z-.12),(side*.86,y+w*.53,z-.23),(side*.93,y+w*.62,z-.53),(side*1.13,y+w*.65,z-.61)],.006,'Dark' if k else 'Ivory')
 # Plot and status blocks on the LCD, rather than a featureless blue rectangle.
 for i in range(20):
  zz=z-.065+math.sin(i*.71)*.019
  box('Display signal plot',(side*1.044,y-w*.34+i*w*.033,zz),(.002,.013,.004),'LED',0)
 for j in range(3):box('Display header',(side*1.044,y-w*.25+j*w*.23,z+.102),(.002,w*.18,.018),'Pixels',0)

def rack(side,y,w,idx):
 labels={'destiny':['EXPRESS','MSG','CIR','MELFI','HRF','FIR'],'columbus':['BIOLAB','FSL','EPM','EDR','EXPRESS'],'kibo':['RYUTAI','SAIBO','MSPR','KOBAIRO','JEM SYS','EXPRESS','PAYLOAD','STOWAGE']}
 label=labels.get(KEY,['LIFE SUPPORT','SCIENCE','POWER','WATER RECOVERY','AVIONICS','DATA'])[idx%len(labels.get(KEY,['a']*6))]
 variant=idx%6
 box('ISPR rack frame',(side*1.39,y,0),(.40,w,2.22),'Silver',.012)
 box('Dark service recess',(side*1.177,y,0),(.04,w-.05,2.14),'Dark',.004)
 for oy in [-w*.46,w*.46]:
  box('Structural mounting rail',(side*1.12,y+oy,0),(.07,.035,2.18),'Off white',.006)
  for zz in [-.98,-.55,0,.55,.98]:fastener(side,y+oy,zz,1.075)
 for j,(zz,hh) in enumerate([(-.88,.28),(-.54,.34),(.88,.31)]):
  box('Rack utility panel',(side*1.14,y,zz),(.035,w-.14,hh),'White' if j%2 else 'Pale panel',.004)
  for oy in [-w*.37,w*.37]:fastener(side,y+oy,zz,1.117)
  if j==0:
   for k in range(13):box('Ventilation slot',(side*1.119,y,zz-.103+k*.016),(.004,w*.57,.004),'Dark',0)
  elif j==1:
   for k in range(5):
    yy=y-w*.27+k*w*.135;cyl('Data connector shell',(side*1.119,yy,zz),(side*1.098,yy,zz),.021,'Silver',16);cyl('Data connector inset',(side*1.097,yy,zz),(side*1.093,yy,zz),.014,'Dark',12)
    face_label(side,yy,zz+.105,'J'+str(k+1),.07,.032,1.116)
   for k in range(3):box('Indicator',(side*1.111,y-.18+k*.10,zz-.095),(.009,.018,.011),'LED' if k%2 else 'Amber indicator',.002)
 if variant==1:
  # MSG-inspired faceted viewing panel and two restrained access sleeves.
  box('Glovebox back',(side*1.30,y,.13),(.04,w-.18,.99),'Off white',.005)
  for oy in [-w*.42,w*.42]:box('Glovebox side wall',(side*1.105,y+oy,.13),(.40,.025,.99),'Silver',.005)
  for zz in [-.28,.60]:box('Glovebox horizontal wall',(side*1.105,y,zz),(.40,w-.18,.025),'Silver',.005)
  box('Glovebox instrument backboard',(side*1.27,y,.13),(.012,w-.26,.86),'Ivory',.003)
  for jj in range(3):
   yy=y-w*.25+jj*w*.23;box('Glovebox test electronics',(side*1.23,yy,.22),(.09,w*.18,.23),'Dark' if jj%2 else 'Gold',.004)
   cable('Glovebox internal tube',[(side*1.22,yy,.34),(side*1.13,yy+.04,.17),(side*1.17,yy+.07,-.14)],.008,'Ivory')
  box('Glovebox tray',(side*.87,y,-.19),(.30,w-.28,.018),'Silver',.002)
  yz=[(-w*.38,-.24),(w*.38,-.24),(w*.38,.41),(w*.27,.59),(-w*.27,.59),(-w*.38,.41)]
  vs=[(side*.91,y+yy,z) for yy,z in yz];gl=mesh('Glovebox glazing',vs,[tuple(range(6))],'Clear glazing')
  if gl:
   md=gl.modifiers.new('Physical glass thickness','SOLIDIFY');md.thickness=.003
  cable('Glovebox gasket',vs+[vs[0]],.014,'Gasket')
  for yy in [-w*.22,w*.22]:
   p=(side*.88,y+yy,-.015)
   cable('Glove port flange',[(p[0],p[1]+.13*math.cos(a*math.pi/16),p[2]+.13*math.sin(a*math.pi/16)) for a in range(33)],.018,'Anodized blue')
   cable('Restrained glove sleeve',[(side*.91,y+yy,0),(side*1.045,y+yy,-.055),(side*1.15,y+yy+.04,-.14)],.075,'Nomex')
   for z1 in [-.16,.35]:latch(side,y+yy,z1,.88)
  face_label(side,y,.65,label+' / SCIENCE',w*.65,.09,1.11)
 elif variant==3:
  box('Freezer front',(side*1.12,y,.13),(.055,w-.16,1.05),'Pale panel',.005)
  for yy in [-w*.23,w*.23]:
   for zz in [-.12,.39]:
    cyl('MELFI access drum',(side*1.08,y+yy,zz),(side*1.055,y+yy,zz),min(.19,w*.19),'Dark',32)
    cyl('Insulated freezer lid',(side*1.05,y+yy,zz),(side*1.028,y+yy,zz),min(.175,w*.175),'Ivory',32)
    rail((side*1.001,y+yy-.085,zz),(side*1.001,y+yy+.085,zz),'Silver')
  face_label(side,y,.72,label+' / COLD STOWAGE',w*.7,.07,1.11)
 elif variant==2:
  box('Optics enclosure',(side*1.10,y,.14),(.10,w-.17,1.03),'Pale panel',.008)
  cyl('Circular optical surround',(side*1.038,y,.23),(side*1.015,y,.23),.25,'Silver',40)
  cyl('Optical gasket',(side*1.014,y,.23),(side*1.003,y,.23),.217,'Gasket',40)
  cyl('Optical aperture',(side*1.002,y,.23),(side*.997,y,.23),.195,'Glass',40)
  for oy in [-w*.34,w*.34]:latch(side,y+oy,.14,1.02)
  face_label(side,y,-.18,'OPTICAL EXPERIMENT',w*.53,.075,1.033)
 elif variant==4:
  box('HRF equipment face',(side*1.13,y,.14),(.035,w-.16,1.03),'White',.004);screen(side,y,.35,min(.61,w*.71))
  for yy in [-w*.28,w*.28]:box('Instrument drawer',(side*1.10,y+yy,-.22),(.04,w*.40,.24),'Pale panel',.004);latch(side,y+yy,-.22,1.07)
 else:
  for j in range(4):
   zz=-.25+j*.245;box('EXPRESS payload locker',(side*1.13,y,zz),(.04,w-.16,.223),'White' if j%2 else 'Pale panel',.004)
   rail((side*1.085,y-w*.17,zz),(side*1.085,y+w*.17,zz),'Silver')
   for yy in [-w*.37,w*.37]:latch(side,y+yy,zz,1.08)
   face_label(side,y+w*.23,zz+.065,'LOCKER '+str(j+1),.19,.032,1.10)
 face_label(side,y,.98,label+'\n'+KEY.upper(),w*.65,.12,1.11)
 for z1 in [-.70,.72]:rail((side*1.055,y-w*.32,z1),(side*1.055,y+w*.32,z1),'Blue' if idx%3 else 'Ivory')
 # Routed temporary leads with actual strain reliefs and tied bundles.
 for j in range(2+(idx%3)):
  yy=y-w*.27+j*.09
  cable('Payload service cable',[(side*1.086,yy,-.54),(side*.96,yy+.05,-.65),(side*.91,yy+.12,-.86),(side*.99,yy+.17,-1.05),(side*1.14,yy+.15,-1.09)],.006+j*.001,'Ivory' if j%2 else 'Dark')
  cyl('Strain relief',(side*1.095,yy,-.54),(side*1.055,yy,-.54),.018,'Dark',12)
 if idx%3==0:
  box('Velcro procedure card',(side*1.047,y-w*.24,.13),(.008,.18,.25),'Paper',.001)
  text('PROCEDURE\nCHECK STATUS\nPAYLOAD OPS',(side*1.041,y-w*.24,.13),.017,'Dark',(math.pi/2,0,-side*math.pi/2))

def shell(L,n,ru=False):
 ys,step=_base_shell(L,n,ru)
 # Individual panel seams, attachment points, and asymmetric cable routing.
 for side in [-1,1]:
  for j,y in enumerate(ys):
   for k in range(5):
    x=side*(1.10+k*.026);z=1.10-(k%2)*.03
    cable('Bundled service harness',[(x,y-step*.52,z),(x-side*.035,y-step*.14,z-.02),(x,y+step*.52,z)],.009 if k<3 else .006,'Ivory' if k<4 else 'Orange cable')
   for oy in [-step*.32,step*.32]:
    box('Harness textile tie',(side*1.15,y+oy,1.09),(.15,.020,.11),'Velcro',.002)
   for zz in [-1.12,1.12]:
    box('Corner access flap',(side*1.25,y,zz),(.025,step*.83,.14),'Nomex',.012)
 for j,y in enumerate(ys):
  for zz in [-1.26,1.26]:
   box('Horizontal rack face',(0,y,zz),(2.08,step-.065,.055),'Off white' if j%3==0 else 'Pale panel',.006)
   for x in [-.96,.96]:
    for oy in [-step*.38,step*.38]:cyl('Horizontal panel screw',(x,y+oy,zz-math.copysign(.033,zz)),(x,y+oy,zz-math.copysign(.040,zz)),.009,'Silver',12)
   for x in [-.68,.68]:
    rail((x-.12,y,zz-math.copysign(.055,zz)),(x+.12,y,zz-math.copysign(.055,zz)),'Ivory')
   if j%2==0:
    box('Horizontal panel label',(.30,y+.16,zz-math.copysign(.032,zz)),(.35,.11,.003),'Paper',0)
  for side in [-1,1]:
   box('Protected LED strip',(side*.94,y,1.125),(.095,step*.72,.025),'Light',.005)
 # Lower the source luminaires below the overhead rack faces.
 for o in bpy.context.scene.objects:
  if o.type=='LIGHT' and o.location.z>1:o.location.z=1.08;o.data.energy*=.67
 return ys,step

def refine_module(key,L,n,kind):
 ROOT.name=key.upper()+'_DETAIL_STAGE2';ROOT['quality']='Detailed / Stage 2';ROOT['revision']='2026-10-29';ROOT['accuracy']='Reference-informed visual reconstruction; not an as-flown engineering replica'
 if kind not in ['cupola','sphere','fabric','bell']:
  step=(L-.8)/n;ys=[-L/2+.4+(i+.5)*step for i in range(n)]
  # Side bundles, tethered document folders and uneven stowage break repetition.
  for side in [-1,1]:
   for i in range(max(2,n//2)):
    y=ys[min(n-1,i*2)];off=.055*(i%2)
    cable('Secured long cable',[(side*1.03,y-.3,.92),(side*.96,y-.03,.84),(side*(.95-off),y+.18,.50),(side*1.08,y+.30,.32)],.010,'Ivory')
    box('Hook and loop fastener',(side*1.05,y+.04,.80),(.07,.035,.13),'Velcro',.002)
    if i%2==0:
     bag(side*.99,y+.26,-.98,min(step*.47,.62),side)
  for y,sg in [(-L/2,-1),(L/2,1)]:
   for j in range(12):
    a=j*math.pi/6
    cyl('Hatch frame bolt',(.68*math.cos(a),y-sg*.18,.68*math.sin(a)),(.68*math.cos(a),y-sg*.194,.68*math.sin(a)),.014,'Silver',12)
   for side in [-1,1]:
    cable('Hatch service umbilical',[(side*.73,y-sg*.18,-.45),(side*.89,y-sg*.27,0),(side*.88,y-sg*.26,.73),(side*.45,y-sg*.18,.88)],.026,'Hose grey')
   text('OPEN / CLOSE',(0,y-sg*.16,-.35),.033,'Dark',(math.pi/2 if sg==1 else -math.pi/2,0,0))
   box('Safety placard',(0,y-sg*.15,.81),(.55,.006,.07),'Yellow',.001)
   text('KEEP HATCH AREA CLEAR',(0,y-sg*.155,.81),.028,'Dark',(math.pi/2 if sg==1 else -math.pi/2,0,0))
 if kind in ['cargo','cargo_ru','fabric']:
  for side in [-1,1]:
   for z in [-.67,.25]:cable('Stowage restraint net',[(side*.89,-L*.31,z),(side*.87,0,z+.08),(side*.89,L*.31,z)],.009,'Cream webbing')
 if kind=='gym':
  for yy in [-.54,.54]:
   for j in range(9):cyl('ARED graduation',(.70,yy,.16+j*.04),(.70,yy,.163+j*.04),.061,'Dark',16)
  box('Treadmill control head',(-.62,2.03,-.85),(.24,.10,.18),'Dark',.008)
 if kind=='crew':
  for side in [-1,1]:
   for y in [-L*.29,-L*.09]:
    for k in range(5):box('Crew acoustic seam',(side*1.075,y-.28+k*.14,-.18),(.004,.008,.95),'Blue',.002)
 if kind=='cupola':
  for i in range(6):
   a=(i+.5)*math.pi/3
   for j in range(4):
    p=Vector((1.05*math.cos(a),1.05*math.sin(a),.10+j*.18));cyl('Window shutter hinge',p,p+Vector((0,0,.08)),.025,'Silver',16)
   text('WINDOW '+str(i+1),(1.12*math.cos(a),1.12*math.sin(a),-.18),.04,'Dark',(math.pi/2,0,a+math.pi/2))
 if kind=='sphere':
  for j in range(6):
   a=j*math.pi/3;cable('Node service duct',[(1.45*math.cos(a),1.45*math.sin(a),-.65),(1.52*math.cos(a+.05),1.52*math.sin(a+.05),0),(1.45*math.cos(a),1.45*math.sin(a),.65)],.028,'Ivory')

# Ambient occlusion is stored in a second UV set and the standard glTF channel.
# This retains PBR response and close-up fabric normals in the web viewer.
def finalize_detail(key,name,kind,camera):
 scene=bpy.context.scene;scene.cycles.samples=A.samples;scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=5
 scene.view_settings.exposure=-.55;scene.render.resolution_x=A.width;scene.render.resolution_y=round(A.width*2/3)
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.objects:
  if o.type=='FONT':o.select_set(True)
 if bpy.context.selected_objects:bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.convert(target='MESH')
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blend'/f'{key}_stage2.blend'),compress=True)
 # Geometry and material review is internal; not automatically published as new renders.
 scene.render.filepath=str(OUT/'renders'/f'{key}_stage2.png');bpy.ops.render.render(write_still=True)
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.objects:
  if o.type=='MESH' and not o.get('presentation_background'):o.select_set(True)
 bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();obj=bpy.context.object;obj.name=key+'_detailed'
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 original=obj.data.uv_layers.get('UVMap');ao_uv=obj.data.uv_layers.new(name='AOMap');obj.data.uv_layers.active=ao_uv;ao_uv.active_render=True
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.003);bpy.ops.object.mode_set(mode='OBJECT')
 size=int(os.environ.get('ISS_AO_SIZE','2048'));ao=bpy.data.images.new(key+'_AO',width=size,height=size,alpha=False);ao.colorspace_settings.name='Non-Color'
 for m in obj.data.materials:
  if not m:continue
  tex=texture_node(m,ao,'AOMap');m.node_tree.nodes.active=tex;tex.select=True
 scene.cycles.samples=16;scene.render.bake.margin=5;scene.render.bake.use_clear=True
 print('AO_BAKE_START',key,len(obj.data.polygons),flush=True);bpy.ops.object.bake(type='AO');ao.pack()
 group=bpy.data.node_groups.get('glTF Material Output')
 if not group:
  group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree');group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
 for m in obj.data.materials:
  if not m:continue
  t=texture_node(m,ao,'AOMap');node=m.node_tree.nodes.new('ShaderNodeGroup');node.node_tree=group;m.node_tree.links.new(t.outputs['Color'],node.inputs['Occlusion'])
 obj.data.uv_layers.active=original;original.active_render=True
 mod=obj.modifiers.new('Web triangulation','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=mod.name)
 for ob in scene.objects:
  if ob.get('presentation_background'):ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/'glb'/f'{key}_stage2.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_tangents=False,export_cameras=False,export_lights=False,export_extras=True)
 # Preserve the exact baked web mesh alongside editable native objects in a separate scene file.
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blend'/f'{key}_stage2_web.blend'),compress=True)
 data=(OUT/'glb'/f'{key}_stage2.glb').read_bytes();ln=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+ln]);tri=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives'])
 assert any(m.get('occlusionTexture') for m in g.get('materials',[])),'AO missing from GLB'
 meta={'id':key,'name':name,'stage':2,'bytes':len(data),'triangles':tri,'materials':len(g.get('materials',[])),'textures':len(g.get('images',[])),'aoResolution':size,'camera_blender':camera,'renderer':'Blender 4.5.3 / Cycles','samples':A.samples}
 (OUT/f'{key}.json').write_text(json.dumps(meta,indent=2));print('MODULE_COMPLETE '+json.dumps(meta),flush=True)

# Module-specific second-pass fittings.
_generic_rack=rack
_generic_refine=refine_module

def rack(side,y,w,idx):
 if KEY not in ['zvezda','nauka']:
  return _generic_rack(side,y,w,idx)
 names=['ELEKTRON','THERMAL CONTROL','POWER','LIFE SUPPORT','SCIENCE','DATA']
 box('Russian system cabinet',(side*1.36,y,0),(.38,w-.03,2.18),'Nomex',.022)
 for j in range(4):
  z=-.78+j*.52;box('Removable service panel',(side*1.15,y,z),(.038,w-.12,.48),'Off white' if (j+idx)%3 else 'Green',.008)
  for oy in [-w*.37,w*.37]:
   for oz in [-.17,.17]:fastener(side,y+oy,z+oz,1.125)
  if j==2:
   box('Control fascia',(side*1.12,y,z),(.017,w*.74,.33),'Dark',.005)
   for k in range(5):
    yy=y-w*.27+k*w*.135
    cyl('Panel toggle',(side*1.105,yy,z),(side*1.073,yy,z+.023),.007,'Silver',12)
    box('Annunciator',(side*1.101,yy,z+.10),(.008,.040,.025),'LED' if k in [0,3] else 'Ivory',.002)
   face_label(side,y,z-.11,'SYSTEM STATUS / 28 V',w*.6,.045,1.10)
  elif j==3:
   for k in range(2):
    yy=y+(-.20 if k==0 else .20);cyl('Analog gauge bezel',(side*1.121,yy,z),(side*1.097,yy,z),.085,'Silver',24);cyl('Gauge dial',(side*1.095,yy,z),(side*1.091,yy,z),.071,'Ivory',24)
    cable('Gauge needle',[(side*1.088,yy,z),(side*1.088,yy+.034,z+.033)],.002,'Dark')
  elif j==0:
   for k in range(12):box('Fan grille',(side*1.126,y,z-.13+k*.023),(.005,w*.58,.005),'Dark',0)
  else:
   for k in [-1,1]:latch(side,y+k*w*.28,z,1.11)
 face_label(side,y,1.05,names[idx%6],w*.75,.10,1.10)
 rail((side*1.03,y-w*.41,-.77),(side*1.03,y-w*.41,.77),'Ivory')
 for j in range(3):cable('Braided service lead',[(side*1.12,y+w*.33,.18),(side*.97,y+w*.32,-.1),(side*.94,y+w*.36,-.63),(side*1.17,y+w*.30,-.91)],.009+j*.004,'Hose grey' if j==1 else 'Ivory')

def earth_background():
 path=os.environ.get('ISS_EARTH_TEXTURE','')
 if not path or not Path(path).exists():return
 im=bpy.data.images.load(path,check_existing=True);im.name='NASA Blue Marble 2002';im.pack()
 m=bpy.data.materials.new('Earth presentation / NASA Blue Marble');m.use_nodes=True;ns=m.node_tree.nodes;ns.clear();out=ns.new('ShaderNodeOutputMaterial');em=ns.new('ShaderNodeEmission');em.inputs['Strength'].default_value=.7;tex=ns.new('ShaderNodeTexImage');tex.image=im;m.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);m.node_tree.links.new(em.outputs[0],out.inputs[0])
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=6.5,location=(0,0,8))
 ob=bpy.context.object;ob.name='Earth presentation background';ob['presentation_background']=True;ob['credit']='NASA / Reto Stoeckli / Robert Simmon, Blue Marble 2002';ob.rotation_euler=(math.radians(112),.2,math.radians(40));ob.data.materials.append(m)
 for p in ob.data.polygons:p.use_smooth=True

def refine_module(key,L,n,kind):
 _generic_refine(key,L,n,kind)
 if key=='cupola':
  earth_background()
  for ob in bpy.context.scene.objects:
   if ob.name.startswith('Cupola glass ') and ob.type=='MESH' and len(ob.data.polygons)==1:
    md=ob.modifiers.new('Window pane thickness','SOLIDIFY');md.thickness=.004
   if ob.type=='LIGHT':
    if hasattr(ob.data,'specular_factor'):ob.data.specular_factor=.1
    if hasattr(ob,'visible_glossy'):ob.visible_glossy=False
 if kind in ['airlock','airlock_ru']:
  for side in [-1,1]:
   y=L*.28;box('Airlock service console',(side*1.10,y,.40),(.22,.60,.60),'Off white',.012)
   for j in range(3):
    yy=y-.19+j*.19;cyl('Pressure gauge',(side*.978,yy,.50),(side*.955,yy,.50),.07,'Silver',24);cyl('Pressure dial',(side*.951,yy,.50),(side*.947,yy,.50),.056,'Ivory',24)
    cable('Pressure needle',[(side*.943,yy,.50),(side*.943,yy+.022,.529)],.002,'Dark')
   for j in [-1,1]:
    cyl('Pressure valve',(side*.96,y+j*.15,.27),(side*.91,y+j*.15,.27),.041,'Red' if j==1 else 'Blue',16)
    cable('Airlock supply hose',[(side*1.01,y+j*.2,.15),(side*.91,y+j*.27,-.13),(side*1.02,y+j*.33,-.55)],.023,'Ivory')
   face_label(side,y,.77,'AIRLOCK / PRESSURE',.50,.085,.97)
 if key=='zvezda':
  # Galley fittings and restrained drink/food pouches beside the meal table.
  for side in [-1,1]:
   box('Galley storage',(side*1.0,1.85,-.40),(.25,.70,.50),'Nomex',.035)
   for j in range(3):cyl('Drink pouch coupling',(side*.85,1.64+j*.17,-.21),(side*.85,1.64+j*.17,-.14),.018,'Blue',12)
 if key=='bishop':
  for x in [-.61,.61]:
   for y in [-.6,-.3,0,.3,.6]:box('Payload rail clamp',(x,y,-.49),(.075,.08,.045),'Silver',.005)
 if key=='prichal':
  for j in range(6):
   a=j*math.pi/3;box('Node utility junction',(1.25*math.cos(a),1.25*math.sin(a),.67),(.18,.12,.14),'White',.006)

for key in (list(SPECS) if A.modules=='all' else A.modules.split(',')):build(key)
