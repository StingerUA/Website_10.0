"""Tranquility Node 3 + physical nadir Cupola. Educational reconstruction.
A combined, standalone GLB per quality. Generate with numpy, trimesh, Pillow.
The Water Recovery System texture is authored procedurally, not an archival NASA photo.
"""
import math
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image,ImageDraw,ImageFont
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from build_glb_without_blender import Builder, P, R, EXPORT

P.update({
    'rose':((224,166,183,255),0.04,.63),
    'rubber':((39,44,48,255),.05,.9),
    'matte':((163,174,185,255),.2,.67)
})
RADIUS=2.08
CY=1.73

def font(size):
    try:return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',size)
    except OSError:return ImageFont.load_default()

def center_ring(b, inner, outer, z, mat, seg=48):
    b.ring('CBM annulus',inner,outer,z,mat,seg)
    b.pieces[mat][-1].apply_translation([0,CY,0])

def center_tube(b, radius, z0, z1, mat, seg=48):
    b.sidewall('CBM tube',radius,z0,z1,mat,seg)
    b.pieces[mat][-1].apply_translation([0,CY,0])

def point(radius,angle,z):
    return (radius*math.cos(angle),CY+radius*math.sin(angle),z)

def shell_with_aperture(b, high):
    n=80 if high else 44
    rows=62 if high else 36
    pts=[];faces=[]
    for j in range(rows+1):
        y=-3.0+j*6.0/rows
        for i in range(n+1):
            a=i*math.tau/n
            pts.append((RADIUS*math.cos(a),y,RADIUS*math.sin(a)))
    for j in range(rows):
        y=-3.0+(j+.5)*6.0/rows
        for i in range(n):
            a=(i+.5)*math.tau/n
            delta=math.atan2(math.sin(a+math.pi/2),math.cos(a+math.pi/2))
            if ((y-CY)/.86)**2+(RADIUS*delta/.80)**2<1:continue
            u=j*(n+1)+i
            faces.extend([(u,u+1,u+n+2),(u,u+n+2,u+n+1)])
    b.poly('Tranquility_Shell_With_NadirCut',pts,faces,'hull')

def panel_texture(high,variant):
    w,h=(1024,1536) if high else (512,768)
    scale=w/512
    im=Image.new('RGB',(w,h),'#566e7a');d=ImageDraw.Draw(im)
    def box(x,y,xx,yy,fill,edge='#2d4555',stroke=3):
        d.rounded_rectangle((int(x*scale),int(y*scale),int(xx*scale),int(yy*scale)),radius=int(7*scale),fill=fill,outline=edge,width=max(1,int(stroke*scale)))
    box(10,10,502,758,'#a9b8bf')
    box(20,17,492,94,'#f2f3ed')
    d.text((int(35*scale),int(29*scale)),'WATER PROCESSOR',font=font(int(23*scale)),fill='#213b4b')
    d.text((int(35*scale),int(62*scale)),'ASSEMBLY / WRS-'+str(variant+1),font=font(int(13*scale)),fill='#314e62')
    box(28,105,484,739,'#334654')
    for k in range(4):
        x=46+k*108
        box(x,170,x+88,408,'#527a94' if k%2 else '#c3ced2')
        for y in (200,344):
            d.ellipse((int((x+22)*scale),int(y*scale),int((x+64)*scale),int((y+42)*scale)),fill='#687c8b',outline='#1a3847',width=max(1,int(3*scale)))
    for k in range(5):
        y=431+k*51
        box(50,y,462,y+38,'#a1b0b9')
        d.text((int(73*scale),int((y+9)*scale)),'WRS / VALVE %02d'% (k+1),font=font(int(12*scale)),fill='#234254')
    # Dense reinforced hoses and alternating flexible metal/potable-water lines.
    rng=np.random.default_rng(221+variant)
    for k in range(17 if high else 10):
        x=int(rng.integers(58,450));end=int(rng.integers(53,450))
        ya=int(rng.integers(110,240));yb=int(rng.integers(412,680))
        path=[(int(x*scale),int(ya*scale)),(int((x+end)/2*scale),int((ya+95)*scale)),(int((x+end)/2*scale),int((yb-55)*scale)),(int(end*scale),int(yb*scale))]
        d.line(path,fill='#182d39',width=max(2,int(7*scale)),joint='curve')
        d.line(path,fill=('#9ac1cc' if k%3 else '#2b7cae'),width=max(2,int(4*scale)),joint='curve')
    return im

def add_wrs_decal(scene,x,y,image,name):
    # Twin planar triangles with explicit UV map, facing inside the corridor.
    mesh=trimesh.Trimesh(
        vertices=[[x,y-.42,-.81],[x,y+.42,-.81],[x,y+.42,.81],[x,y-.42,.81]],
        faces=[[0,1,2],[0,2,3]],process=False)
    mesh.apply_transform(R)
    mat=PBRMaterial(name=name,baseColorFactor=(255,255,255,255),
                    baseColorTexture=image,metallicFactor=.15,roughnessFactor=.64,doubleSided=True)
    mesh.visual=TextureVisuals(uv=[[0,0],[1,0],[1,1],[0,1]],material=mat)
    scene.add_geometry(mesh,geom_name=name)

def geometry(high):
    b=Builder()
    n=72 if high else 36
    shell_with_aperture(b,high)
    # Axial ends are annular, not solid discs over the corridor.
    for side in (-1,1):
        y=3.03*side
        for i in range(n):
            a=i*math.tau/n;aa=(i+1)*math.tau/n
            b.quad('End pressure bulkhead',[(.78*math.cos(a),y,.78*math.sin(a)),
                (2.04*math.cos(a),y,2.04*math.sin(a)),
                (2.04*math.cos(aa),y,2.04*math.sin(aa)),
                (.78*math.cos(aa),y,.78*math.sin(aa))],'steel')
        b.cylinder('End hatch',(0,y*.985,0),.74,.03,'nomex',axis='y')
    # Four bay layout, central corridor kept clear.
    for bay,y in enumerate((-1.72,-.57,.58,1.73)):
        for side in (-1,1):
            if bay==3:continue
            x=side*1.39
            if side<0 and bay in (0,1):
                b.box('Tranquility_ECLSS_Rack_'+str(bay+1),(x,y,0),(.57,.94,1.75),'white')
                b.box('WRS face gasket',(x+.295,y,0),(.018,.86,1.67),'black')
                if high:
                    for j in range(5):
                        yy=y-.31+j*.15
                        b.rod('WRS external steel hose',(x+.33,yy,-.5),(x+.38,yy+.04,.48),.012,'steel',8)
            elif side>0 and bay==0:
                b.box('WHC soft cubicle',(x,y,0),(.55,.94,1.75),'nomex')
                b.box('WHC panel',(1.10,y,.1),(.05,.67,1.32),'white')
                b.box('WHC monitor',(1.063,y-.2,.35),(.018,.21,.25),'screen')
            elif side>0 and bay==2:
                b.box('T2 treadmill',(1.15,y,0),(.15,.85,1.32),'black')
                for z in (-.51,.51):
                    b.rod('T2 Harness',(1.05,y-.35,z),(1.05,y+.35,z),.017,'yellow',10)
            else:
                b.box('Storage rack',(x,y,0),(.55,.94,1.75),'white')
        for sx in (-.67,.67):
            b.box('Overhead Nomex',(sx,y,1.37),(.68,.98,.3),'nomex')
        b.box('LED lighting',(0,y,1.15),(.63,.36,.02),'light')
        if bay<3:
            b.box('Deck Nomex',(0,y,-1.19),(1.45,.99,.16),'nomex')
        else:
            for sx in (-1,1):
                b.box('Deck framing',(sx*.97,y,-1.19),(.54,.99,.16),'nomex')
            for dy in (-.46,.46):
                b.box('Deck framing',(0,y+dy,-1.19),(1.43,.14,.16),'nomex')
    # Bright yellow ARED exercise frame, metallic cylinders and caution bands.
    y=-.57
    b.box('ARED vibration isolation',(0,y,-.84),(1.26,.92,.15),'black')
    for sx in (-1,1):
        x=sx*.38
        b.cylinder('Tranquility_ARED_VacuumCylinder_L' if sx<0 else 'Tranquility_ARED_VacuumCylinder_R',
                   (x,y-.11,-.37),.112,.78,'steel')
        for j,z in enumerate((-.69,-.55,-.41,-.27,-.13)):
            b.cylinder('ARED striped sleeve',(x,y-.11,z),.119,.046,'yellow' if j%2 else 'black')
        b.rod('Tranquility_ARED_Yellow',(x,y+.22,-.63),(x,y+.42,.23),.056,'yellow',12)
    b.rod('ARED barbell',(-.66,y+.42,.28),(.66,y+.42,.28),.031,'steel',12)
    for sx in (-1,1):
        for z in (-.9,.94):
            b.rod('Blue longitudinal rail',(sx*.98,-2.68,z),(sx*.98,2.7,z),.022,'blue',10)
    # Actual open deck aperture and a connecting annular tunnel.
    for z in (-1.12,-1.32,-1.96,-2.42):
        center_ring(b,.63,.79,z,'steel',n)
    center_tube(b,.67,-2.58,-1.14,'white',n)
    center_tube(b,.77,-2.58,-1.14,'hull',n)
    for j in range(12 if high else 8):
        a=j*math.tau/(12 if high else 8)
        b.cylinder('CBM bolt',(.83*math.cos(a),CY+.83*math.sin(a),-1.10),.018,.025,'steel')
    # Cupola integrated directly below Tranquility; the upper hole is not sealed.
    for z in (-2.59,-3.23):
        center_ring(b,.68,1.47,z,'steel',n)
    center_tube(b,1.46,-3.24,-2.59,'nomex',n)
    for i in range(6):
        a0=i*math.tau/6;a1=(i+1)*math.tau/6
        t=.115
        q=[point(1.43,a0+t,-3.23),point(1.43,a1-t,-3.23),
           point(.61,a1-t,-4.03),point(.61,a0+t,-4.03)]
        b.quad('Cupola side glass '+str(i+1),q,'glass')
        for u,v in ((q[0],q[1]),(q[1],q[2]),(q[2],q[3]),(q[3],q[0])):
            b.rod('Cupola frame',u,v,.039,'steel',12 if high else 7)
        b.rod('Cupola rib',point(1.46,a0,-3.22),point(.66,a0,-4.04),.070,'hull',12)
        b.quad('Cupola bulkhead spacer',[point(1.46,a1-t,-3.22),point(1.46,a1+t,-3.22),
             point(.67,a1+t,-4.04),point(.67,a1-t,-4.04)],'nomex')
        b.rod('Cupola blue grab bar',point(1.2,a0+.17,-3.06),point(1.2,a0+.49,-3.06),.018,'blue',10)
    center_ring(b,.39,.70,-4.06,'steel',n)
    b.cylinder('Cupola nadir 80cm window',(0,CY,-4.078),.39,.015,'glass',sections=n)
    b.box('Cupola RWS console',(.66,CY-.13,-3.60),(.38,.69,.09),'black')
    for dy in (-.30,.20):
        b.box('RWS screen case',(.62,CY+dy,-3.46),(.10,.38,.29),'black')
        b.box('RWS monitor',(.565,CY+dy,-3.46),(.006,.33,.24),'screen')
    return b

def main():
    for quality in ('optimized','detailed'):
        high=quality=='detailed'
        b=geometry(high)
        path=b.export('tranquility_'+quality)
        scene=trimesh.load(path,force='scene')
        # Place detailed photographed-style technical panel art inside ECLSS rack fronts.
        for index,y in enumerate((-1.72,-.57)):
            add_wrs_decal(scene,-1.09,y,panel_texture(high,index),
                          'Tranquility_ECLSS_WRS_Panel_'+str(index+1))
        path.write_bytes(scene.export(file_type='glb'))
        assert path.read_bytes()[:4]==b'glTF'
        print('Final Tranquility+Cupola:',path.name,path.stat().st_size,'bytes')

if __name__=='__main__':
    main()
