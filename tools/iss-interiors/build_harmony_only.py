"""Build the two previously prepared Harmony study GLBs only.
No Destiny, Cupola, Tranquility, or site HTML modification.
Run: python tools/iss-interiors/build_harmony_only.py
"""
import math
import numpy as np
from build_glb_without_blender import Builder, P

P.update({
 'rose':((239,171,196,255),.05,.48),
 'navy':((28,42,68,255),.12,.55),
 'labelwhite':((249,245,247,255),.02,.68),
 'softgray':((182,187,192,255),.18,.54),
})

def padded_panel(b, center, size, orientation, high=False):
 x,y,z = center; sx,sy,sz = size
 b.box('nomex_panel',center,size,'nomex')
 if orientation=='x':
  for i in (-0.27,0,0.27):
   b.box('seam',(x+sx/2+0.002,y+i*sy,z),(0.008,sy*0.95,0.02),'softgray')
  for j in (-0.33,0,0.33):
   b.box('seam',(x+sx/2+0.002,y,z+j*sz),(0.008,0.02,sz*0.9),'softgray')
  b.box('velcro_blue',(x+sx/2+0.005,y-sy*0.25,z-sz*0.22),(0.012,sy*0.16,0.055),'blue')
  b.box('velcro_black',(x+sx/2+0.005,y+sy*0.18,z+sz*0.18),(0.012,sy*0.16,0.055),'black')
 elif orientation=='z':
  for i in (-0.27,0,0.27):
   b.box('seam',(x,y+i*sy,z+sz/2+0.002),(sx*0.95,0.02,0.008),'softgray')
  for j in (-0.33,0,0.33):
   b.box('seam',(x+j*sx,y,z+sz/2+0.002),(0.02,sy*0.9,0.008),'softgray')
  b.box('velcro_blue',(x-sx*0.23,y-sy*0.22,z+sz/2+0.005),(0.055,sy*0.16,0.012),'blue')
  b.box('velcro_black',(x+sx*0.2,y+sy*0.17,z+sz/2+0.005),(0.055,sy*0.16,0.012),'black')
 if high:
  for dx in (-0.24,0.24):
   for dy in (-0.28,0.28):
    if orientation=='x':
     b.box('stitch_lock',(x+sx/2+0.004,y+dy*sy,z+dx*sz),(0.011,0.03,0.03),'softgray')
    else:
     b.box('stitch_lock',(x+dx*sx,y+dy*sy,z+sz/2+0.004),(0.03,0.03,0.011),'softgray')

def add_label_panel(b, center, axis, arrow_dir='right', high=False):
 x,y,z=center
 if axis=='x':
  b.box('label_base',(x,y,z),(0.018,0.40,0.13),'rose')
  b.box('label_white',(x+0.011 if x<0 else x-0.011,y,z),(0.004,0.34,0.075),'labelwhite')
  if arrow_dir=='left':
   b.box('arrow_body',(x+0.012 if x<0 else x-0.012,y+0.07,z),(0.006,0.10,0.016),'navy')
   pts=[(x+0.012,y+0.11,z),(x+0.012,y+0.15,z+0.03),(x+0.012,y+0.15,z-0.03)] if x<0 else [(x-0.012,y+0.11,z),(x-0.012,y+0.15,z+0.03),(x-0.012,y+0.15,z-0.03)]
  else:
   b.box('arrow_body',(x+0.012 if x<0 else x-0.012,y-0.07,z),(0.006,0.10,0.016),'navy')
   pts=[(x+0.012,y-0.11,z),(x+0.012,y-0.15,z+0.03),(x+0.012,y-0.15,z-0.03)] if x<0 else [(x-0.012,y-0.11,z),(x-0.012,y-0.15,z+0.03),(x-0.012,y-0.15,z-0.03)]
  b.poly('arrow_tip',pts+[(pts[1][0],pts[1][1],pts[1][2])],[(0,1,2)],'navy')
 elif axis=='z':
  b.box('label_base',(x,y,z),(0.40,0.13,0.018),'rose')
  b.box('label_white',(x,y,z+0.011 if z<0 else z-0.011),(0.34,0.075,0.004),'labelwhite')
  if arrow_dir=='up':
   b.box('arrow_body',(x,y+0.07,z+0.012 if z<0 else z-0.012),(0.10,0.016,0.006),'navy')
  else:
   b.box('arrow_body',(x,y-0.07,z+0.012 if z<0 else z-0.012),(0.10,0.016,0.006),'navy')

def harmony(high):
 b=Builder();n=56 if high else 32
 b.lathe('shell',[(-3.65,.77),(-3.45,.91),(-2.95,2.03),(-2.80,2.06),(2.80,2.06),(2.95,2.03),(3.45,.91),(3.65,.77)],'hull',n)
 for side in (-1,1):
  b.cylinder('axial_hatch',(0,side*3.58,0),0.74,0.07,'steel',n,axis='y')
  b.ring('axial_hatch_ring',0.60,0.82,side*3.54,'white',n)
  for j in range(10 if high else 6):
   a=j*math.tau/(10 if high else 6)
   b.rod('hatch_lug',(math.cos(a)*0.60,side*3.51,math.sin(a)*0.60),
       (math.cos(a)*0.69,side*3.51,math.sin(a)*0.69),0.012,'steel',6)
 hatch_y=0.15
 radial=[('port',(-1.53,hatch_y,0),'x','left'),
         ('starboard',(1.53,hatch_y,0),'x','right'),
         ('zenith',(0,hatch_y,1.53),'z','up'),
         ('nadir',(0,hatch_y,-1.53),'z','down')]
 for name,(x,y,z),axis,arrow in radial:
  b.cylinder('radial_tunnel',(x,y,z),0.66,0.66,'hull',n//2,axis=axis)
  if axis=='x':
   b.cylinder('radial_hatch',(x+(0.32 if x<0 else -0.32),y,z),0.59,0.05,'steel',n//2,axis=axis)
   b.ring('radial_ring',0.54,0.70,z if False else 0,'white',n//2)
   for a in np.linspace(0,math.tau,10 if high else 6,endpoint=False):
    cx=x+(0.285 if x<0 else -0.285)
    p1=(cx,y+math.cos(a)*0.48,z+math.sin(a)*0.48)
    p2=(cx,y+math.cos(a)*0.58,z+math.sin(a)*0.58)
    b.rod('radial_lug',p1,p2,0.009,'steel',5)
   add_label_panel(b,(x+(0.35 if x<0 else -0.35),y+0.88,z),axis,arrow,high)
  else:
   b.cylinder('radial_hatch',(x,y,z+(0.32 if z<0 else -0.32)),0.59,0.05,'steel',n//2,axis=axis)
   for a in np.linspace(0,math.tau,10 if high else 6,endpoint=False):
    cz=z+(0.285 if z<0 else -0.285)
    p1=(x+math.cos(a)*0.48,y+math.sin(a)*0.48,cz)
    p2=(x+math.cos(a)*0.58,y+math.sin(a)*0.58,cz)
    b.rod('radial_lug',p1,p2,0.009,'steel',5)
   add_label_panel(b,(x+0.88,y,z+(0.35 if z<0 else -0.35)),axis,arrow,high)
 for x in (-0.84,0.84):
  b.rod('handrail',(x,-2.95,0.90),(x,2.95,0.90),0.023,'yellow',10)
  b.rod('handrail2',(x,-2.95,-0.90),(x,2.95,-0.90),0.021,'blue',10)
  b.box('light_strip',(x,0,1.03),(0.07,5.8,0.03),'light')
 quarters=[(-1.18,-1.75,0,'x'),(1.18,-1.75,0,'x'),(0,1.75,1.18,'z'),(0,1.75,-1.18,'z')]
 for qx,qy,qz,orient in quarters:
  if orient=='x':
   padded_panel(b,(qx,qy,qz),(0.42,1.38,1.52),orient,high)
   b.box('white_frame',(qx-(0.215 if qx<0 else -0.215),qy,qz),(0.03,1.18,1.28),'white')
   b.box('navy_panel',(qx-(0.192 if qx<0 else -0.192),qy-0.20,qz+0.26),(0.015,0.42,0.32),'navy')
   b.box('screen_glow',(qx-(0.184 if qx<0 else -0.184),qy-0.20,qz+0.26),(0.006,0.36,0.26),'screen')
  else:
   padded_panel(b,(qx,qy,qz),(1.52,1.38,0.42),orient,high)
   b.box('white_frame',(qx,qy,qz-(0.215 if qz<0 else -0.215)),(1.28,1.18,0.03),'white')
   b.box('navy_panel',(qx+0.26,qy-0.20,qz-(0.192 if qz<0 else -0.192)),(0.32,0.42,0.015),'navy')
   b.box('screen_glow',(qx+0.26,qy-0.20,qz-(0.184 if qz<0 else -0.184)),(0.26,0.36,0.006),'screen2')
 for side in (-1,1):
  b.box('locker',(side*1.18,0.95,0),(0.44,1.00,1.52),'white')
  b.box('locker_panel',(side*0.97,0.95,0),(0.018,0.86,1.34),'nomex')
  b.box('locker_header',(side*0.94,0.58,0),(0.038,0.10,1.20),'steel')
  b.box('locker_screen',(side*0.93,0.82,0.35),(0.025,0.28,0.46),'screen2' if side<0 else 'screen')
  b.box('locker_instr',(side*0.93,1.20,-0.16),(0.025,0.42,0.95),'white')
  for j in range(3 if high else 2):
   b.box('locker_vent',(side*0.92,1.10+j*0.09,-0.36),(0.018,0.02,0.72),'trim')
 padded_panel(b,(0,2.72,0.98),(1.68,0.55,0.18),'z',high)
 padded_panel(b,(0,2.72,-0.98),(1.68,0.55,0.18),'z',high)
 for z in (-0.65,0.65):
  b.box('pma_pad',(0,3.07,z),(1.25,0.26,0.28),'nomex')
  b.box('pma_velcro',(0,3.18,z),(0.80,0.03,0.03),'blue')
 add_label_panel(b,(-0.92,3.02,0.74),'x','left',high)
 add_label_panel(b,(0.92,-3.02,0.74),'x','right',high)
 b.box('work_shelf',(0,-0.78,1.08),(0.72,0.26,0.18),'steel')
 b.box('laptop',(0,-0.78,1.20),(0.46,0.22,0.04),'navy')
 b.box('laptop_screen',(0,-0.66,1.20),(0.36,0.01,0.20),'screen')
 for x in (-0.24,0,0.24):
  b.box('keyboard_key',(x,-0.78,1.245),(0.045,0.04,0.01),'white')
 if high:
  for y in np.linspace(-2.2,2.2,7):
   b.rod('cable',(1.02,y,-0.64),(1.07,y+0.06,-0.10),0.006,'black',7)
   b.rod('cable2',(-1.02,y,0.64),(-1.07,y+0.06,0.10),0.006,'black',7)
  for y in (-2.7,-1.3,0.4,1.8):
   for z in (-0.9,0.9):
    b.box('soft_bag',(0,y,z),(0.40,0.22,0.16),'fabric')
  for axis_x in (-1.15,1.15):
   for yy in (-2.05,-1.55):
    b.box('cabin_patch',(axis_x-(0.20 if axis_x<0 else -0.20),yy,0.48),(0.012,0.15,0.15),'rose')
 return b

if __name__=='__main__':
 for quality in ('optimized','detailed'):
  harmony(quality=='detailed').export('harmony_'+quality)
