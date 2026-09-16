import * as THREE from './vendor/three.module.js';
import {createAboutTextures} from './page-textures.js';
import {createProductTextures} from './product-textures.js';
import {createCreativeTextures} from './creative-textures.js';

// Same assembly as the reference's BookBinding: page block, back board,
// spine and a separate front board rotating on a binding-edge hinge.
export class Book3D {
 constructor(host){
  this.host=host;
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.domElement.className='book-webgl';host.append(this.renderer.domElement);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(32,1,.1,50);this.camera.position.z=6.4;
  this.scene.add(new THREE.AmbientLight(0xffffff,2));
  const light=new THREE.DirectionalLight(0xfff6e8,2.3);light.position.set(-3,5,7);this.scene.add(light);
  const fill=new THREE.DirectionalLight(0xc1d5ff,.7);fill.position.set(4,0,-3);this.scene.add(fill);
  this.root=new THREE.Group();this.scene.add(this.root);this.textures=new Map();
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
  this.renderer.setAnimationLoop(()=>{if(!host.hidden){this.resize();this.renderer.render(this.scene,this.camera);this.positionVideoTab();host.dataset.angle=`${this.root.rotation.x.toFixed(2)},${this.root.rotation.y.toFixed(2)}`;}});
 }
 resize(){const w=this.host.clientWidth*((this.host.classList.contains('reading-3d')||this.spec?.id===3)?1:2),h=this.host.clientHeight;if(!w||!h)return;if(this.w===w&&this.h===h)return;this.w=w;this.h=h;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.focusPage(this.focusSide||0);}
 async preload(spec){
  if(spec.id===3)this.creativePages=await createCreativeTextures();
  if(spec.id===4)this.aboutPages=await createAboutTextures();
  if(spec.id===5)this.productPages=await createProductTextures();
  const image=new Image();image.src=spec.cover;await image.decode();
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();
  const back=new THREE.Texture(image);back.colorSpace=THREE.SRGBColorSpace;back.needsUpdate=true;
  // Use the original hand-drawn spine lettering rather than a computer font.
  const spineImage=new Image();spineImage.src=spec.id===4?'assets/spine-about-full.png':spec.id===5?'assets/spine-product-full.jpg':spec.src;await spineImage.decode();
  const sc=document.createElement('canvas');sc.width=[4,5].includes(spec.id)?spineImage.width:256;sc.height=[4,5].includes(spec.id)?spineImage.height:1536;const sx=sc.getContext('2d');
  const stripWidth=Math.min(100,spineImage.width*.66), center=spineImage.width*(spec.id===5?.34:.5);
  if([4,5].includes(spec.id))sx.drawImage(spineImage,0,0);
  else sx.drawImage(spineImage,Math.max(0,center-stripWidth/2),0,stripWidth,spineImage.height,0,0,256,1536);
  const spine=new THREE.CanvasTexture(sc);spine.colorSpace=THREE.SRGBColorSpace;
  let binding=spine;
  if(spec.id===5){
   // Repeat the existing green pastel at the foot of the spine along the binding.
   const tile=document.createElement('canvas');tile.width=128;tile.height=128;
   tile.getContext('2d').drawImage(sc,sc.width*.25,sc.height*.86,sc.width*.5,sc.height*.10,0,0,128,128);
   const edge=document.createElement('canvas');edge.width=256;edge.height=1536;
   const ex=edge.getContext('2d');ex.fillStyle=ex.createPattern(tile,'repeat');ex.fillRect(0,0,256,1536);
   binding=new THREE.CanvasTexture(edge);binding.colorSpace=THREE.SRGBColorSpace;
  }
  this.textures.set(spec.id,{front:texture,back,spine,binding,spineAspect:spec.id===4?spineImage.width/spineImage.height:null});
 }
 load(spec){
  this.albumMode=false;this.album=null;this.focusSide=0;this.camera.zoom=1;this.camera.position.x=0;this.camera.updateProjectionMatrix();
  this.spec=spec;this.host.classList.toggle('creative-wide',spec.id===3);this.pages=spec.id===4?this.aboutPages:spec.id===5?this.productPages:spec.id===3?this.creativePages:null;this.turned=0;this.turning=false;this.sheets=[];
  this.root.position.x=0;
  gsap.killTweensOf(this.root.rotation);if(this.hinge)gsap.killTweensOf(this.hinge.rotation);
  this.root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of [].concat(o.material))m.dispose();}});this.root.clear();
  const maps=this.textures.get(spec.id);
  const board=new THREE.MeshStandardMaterial({map:maps.binding,roughness:1,bumpMap:maps.binding,bumpScale:.008});
  const paper=new THREE.MeshStandardMaterial({color:'#fffdf5',roughness:1});
  const front=new THREE.MeshStandardMaterial({map:maps.front,roughness:1,bumpMap:maps.front,bumpScale:.008});
  const back=new THREE.MeshStandardMaterial({map:maps.back,roughness:1,bumpMap:maps.back,bumpScale:.008});
  const spine=new THREE.MeshStandardMaterial({map:maps.spine,roughness:1,bumpMap:maps.spine,bumpScale:.008});
  const mesh=(name,w,h,d,materials,x=0,y=0,z=0,parent=this.root)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials);m.name=name;m.position.set(x,y,z);parent.add(m);return m;};
  // Grow backwards so the front hinge and all printed reading surfaces stay fixed.
  const depth=maps.spineAspect?3.02*maps.spineAspect:.33;
  const backZ=maps.spineAspect?.18-depth:-.145;
  const paperBottom=maps.spineAspect?backZ+.0175:-.10;
  mesh('page-block',1.94,2.91,.10-paperBottom,paper,0,0,(.10+paperBottom)/2);
  mesh('back-cover',2.02,3.02,.035,[board,board,board,board,paper,back],0,0,backZ);
  mesh('spine',.045,3.02,depth,[board,spine,board,board,board,board],-1,0,maps.spineAspect?.1625-depth/2:0);
  // Distinct paper leaf lines on the top, bottom and fore edge.
  const edges=[];for(let z=paperBottom+.005;z<.10;z+=.009){edges.push(-.97,1.456,z,.97,1.456,z,-.97,-1.456,z,.97,-1.456,z,.971,-1.455,z,.971,1.455,z);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));
  const leaves=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#bfb39b',transparent:true,opacity:.5}));leaves.name='individual-page-edges';this.root.add(leaves);
  this.hinge=new THREE.Group();this.hinge.name='cover-hinge';this.hinge.position.set(-1,0,.145);this.root.add(this.hinge);
  const inside=this.pages?new THREE.MeshBasicMaterial({map:this.pages[0].texture}):paper;
  mesh('front-cover',2.02,3.02,.035,[board,board,board,board,front,inside],1,0,0,this.hinge);
  if(this.pages&&spec.id!==3){
   for(let i=0;i<Math.ceil((this.pages.length-1)/2);i++){
    const leaf=new THREE.Group();leaf.name=`sheet-${i+1}`;leaf.position.set(-.97,0,.135-i*.004);
    const makeSide=(page,backSide)=>{
     const geometry=new THREE.PlaneGeometry(1.94,2.91,32,1);geometry.translate(.97,0,0);
     const uv=geometry.attributes.uv;if(backSide)for(let j=0;j<uv.count;j++)uv.setX(j,1-uv.getX(j));
     const material=new THREE.MeshBasicMaterial({map:page?.texture||null,color:page?0xffffff:0xfaf3e2,side:backSide?THREE.BackSide:THREE.FrontSide});
     const face=new THREE.Mesh(geometry,material);face.position.z=backSide?-.0006:.0006;leaf.add(face);
    };
    makeSide(this.pages[i*2+1],false);makeSide(this.pages[i*2+2],true);
    this.root.add(leaf);this.sheets.push(leaf);
   }
  }
  if(spec.id===3){
   this.creativeBinding=new THREE.Group();
   const parts=[...this.root.children];for(const part of parts)this.creativeBinding.add(part);
   this.creativeBinding.scale.set(4.01/2.02,(3.95/this.pages[0].aspect+.06)/3.02,1);
   this.root.add(this.creativeBinding);
  }
  this.root.rotation.set(.12,-1.35,-.025);this.host.dataset.parts='front-cover,back-cover,spine,page-block,individual-page-edges,cover-hinge';
 }
 reveal(duration){gsap.to(this.root.rotation,{x:.12,y:-.32,z:-.025,duration,ease:'power2.out'});}
 open(duration){gsap.to(this.root.rotation,{x:0,y:0,z:0,duration:duration*.5});gsap.to(this.hinge.rotation,{y:-2.82,duration,ease:'power2.inOut'});}
 openAbout(duration,done){
  gsap.to(this.root.rotation,{x:.015,y:0,z:0,duration});
  gsap.to(this.root.position,{x:.97,duration,ease:'power2.inOut'});
  gsap.to(this.hinge.rotation,{y:-Math.PI,duration,ease:'power2.inOut',onComplete:done});
 }
 openCreative(duration,done){
  this.albumMode=true;
  for(const child of this.root.children)child.visible=false;
  this.album=new THREE.Group();this.root.add(this.album);
  const w=3.95,h=w/this.pages[0].aspect;this.albumWidth=w;this.albumHeight=h;
  const board=new THREE.Mesh(new THREE.BoxGeometry(w+.06,h+.06,.065),new THREE.MeshStandardMaterial({color:'#dd8da5',roughness:1}));board.position.z=-.07;this.album.add(board);
  const block=new THREE.Mesh(new THREE.BoxGeometry(w,h,.07),new THREE.MeshStandardMaterial({color:'#fffdf5',roughness:1}));block.position.z=-.035;this.album.add(block);
  this.albumPage=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:this.pages[0].texture}));this.albumPage.position.z=.008;this.album.add(this.albumPage);
  this.albumLeaf=new THREE.Group();this.albumLeaf.position.set(-w/2,0,.018);this.album.add(this.albumLeaf);
  const geometry=new THREE.PlaneGeometry(w,h,48,1);geometry.translate(w/2,0,0);
  this.albumFace=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:this.pages[0].texture,side:THREE.DoubleSide,transparent:true}));this.albumLeaf.add(this.albumFace);this.albumLeaf.visible=false;
  // Cover and PDF use the same landscape dimensions; only the cover turns.
  this.creativeBinding.visible=true;
  for(const part of this.creativeBinding.children)part.visible=part===this.hinge;
  gsap.to(this.hinge.rotation,{y:-Math.PI,duration,ease:'power2.inOut',onComplete:()=>{this.creativeBinding.visible=false;}});
  gsap.to(this.root.rotation,{x:.015,y:0,z:0,duration});
  gsap.to(this.root.position,{x:0,duration,onComplete:done});this.focusPage(0);
 }
 turnCreative(direction,duration,done,target){
  const next=target??this.turned+direction;if(this.turning||next<0||next>=this.pages.length)return false;
  this.turning=true;const leaf=this.albumLeaf,face=this.albumFace;
  this.albumPage.material.map=this.pages[direction>0?next:this.turned].texture;
  face.material.map=this.pages[direction>0?this.turned:next].texture;leaf.visible=true;
  const progress={t:direction>0?0:1};
  this.turnMotion=gsap.to(progress,{t:direction>0?1:0,duration,ease:'power2.inOut',onUpdate:()=>{
   const t=progress.t;leaf.rotation.y=-Math.PI*t;
   face.material.opacity=1-Math.max(0,(t-.45)/.55);
   const pos=face.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)/this.albumWidth*Math.PI)*Math.sin(t*Math.PI)*.28);pos.needsUpdate=true;
  },onComplete:()=>{this.turned=next;this.albumPage.material.map=this.pages[next].texture;leaf.visible=false;this.turning=false;done?.();}});return true;
 }
 turn(direction,duration,done){
  if(this.albumMode)return this.turnCreative(direction,duration,done);
  if(this.turning||!this.pages||direction>0&&this.turned===Math.floor((this.pages.length-1)/2)||direction<0&&this.turned===0)return false;
  this.turning=true;const index=direction>0?this.turned:this.turned-1,leaf=this.sheets[index];
  const progress={t:direction>0?0:1};
  this.turnMotion=gsap.to(progress,{t:direction>0?1:0,duration,ease:'power2.inOut',onUpdate:()=>{
   leaf.rotation.y=-Math.PI*progress.t;
   leaf.position.z=.21+(direction>0?index:Math.max(0,index))*.004;
   // Bend the sheet during the turn; both printed sides share the same curve.
   for(const face of leaf.children){const pos=face.geometry.attributes.position;for(let v=0;v<pos.count;v++){const x=pos.getX(v);pos.setZ(v,Math.sin(x/1.94*Math.PI)*Math.sin(progress.t*Math.PI)*.19);}pos.needsUpdate=true;face.geometry.computeVertexNormals();}
  },onComplete:()=>{this.turned+=direction;leaf.position.z=direction>0?.21+index*.004:.135-index*.004;this.turning=false;done?.();}});
  return true;
 }
 positionVideoTab(){
  const tab=document.getElementById('video-tab');if(!tab||tab.hidden||!this.albumMode)return;
  const point=this.albumPage.localToWorld(new THREE.Vector3(this.albumWidth/2,this.albumHeight*.26,0)).project(this.camera),r=this.renderer.domElement.getBoundingClientRect();
  tab.style.left=`${Math.min(innerWidth-48,r.left+(point.x+1)*r.width/2-5)}px`;const top=r.top+(1-point.y)*r.height/2;
  const imageTab=document.getElementById('image-tab');imageTab.style.left=tab.style.left;imageTab.style.top=`${top}px`;tab.style.top=`${top+70}px`;
 }
 creativeVideoHit(x,y){
  if(!this.albumMode||![23,24].includes(this.turned)||this.turning)return false;
  const r=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),this.camera);
  const hit=ray.intersectObject(this.albumPage)[0];return !!hit&&hit.uv.x>.1&&hit.uv.x<.9&&hit.uv.y>.17&&hit.uv.y<.84;
 }
 videoHit(clientX,clientY){
  if(this.spec.id!==5||this.turning||![0,8].includes(this.turned))return false;
  const r=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),this.camera);
  this.root.updateMatrixWorld(true);
  const target=this.turned===0?this.hinge.children[0]:this.sheets[this.turned-1].children[1];
  const hit=ray.intersectObject(target)[0];if(!hit)return false;
  return this.turned===8?hit.uv.y<.25:hit.uv.y>.17&&hit.uv.y<.8;
 }
 focusPage(side){this.focusSide=side;if(this.spec?.id===3){const vw=2*Math.tan(16*Math.PI/180)*6.4*this.camera.aspect;this.camera.zoom=Math.min(1.38,vw/4.2)*.86*(side?1.4:1);this.camera.position.x=0;this.camera.updateProjectionMatrix();return;}const reading=this.host.classList.contains('reading-3d');const viewWidth=2*Math.tan(16*Math.PI/180)*6.4*this.camera.aspect;this.camera.zoom=reading?Math.min(side?1.18:1,viewWidth/(side?2.2:4.3)):1;this.camera.position.x=side*.94;this.camera.updateProjectionMatrix();}
 reset(duration){if(this.albumMode){this.albumMode=false;this.album.visible=false;for(const child of this.root.children)if(child!==this.album)child.visible=true;for(const part of this.creativeBinding.children)part.visible=true;}gsap.to(this.root.rotation,{x:.12,y:-.32,z:-.025,duration});gsap.to(this.hinge.rotation,{y:0,duration});}
 rotate(x,y){gsap.killTweensOf(this.root.rotation);this.root.rotation.x=THREE.MathUtils.clamp(x,-.85,.85);this.root.rotation.y=y;}
}
