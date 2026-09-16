import * as THREE from './vendor/three.module.js';
// Complete PDF pages: no cropping, re-typesetting, or added decorations.
export async function createCreativeTextures(){
 const pages=await Promise.all(Array.from({length:24},async(_,i)=>{
  const image=new Image();image.src=`assets/creative/pdf/page-${String(i+1).padStart(2,'0')}.jpg`;await image.decode();
  const texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
  return {texture,aspect:image.width/image.height};
 }));
 const ending=pages.pop();
 for(let i=1;i<=2;i++){
  const image=new Image();image.src=`assets/aesthetic/poster-${i}.jpg`;await image.decode();
  const c=document.createElement('canvas');c.width=2178;c.height=1225;const x=c.getContext('2d');
  x.fillStyle='#fffaf3';x.fillRect(0,0,c.width,c.height);x.fillStyle='#9a6179';x.font='60px KaiTi,serif';x.fillText('影像作品',130,125);
  const scale=Math.min(1660/image.width,790/image.height),w=image.width*scale,h=image.height*scale;
  x.drawImage(image,(2178-w)/2,215+(790-h)/2,w,h);
  x.fillStyle='#fffaf3';x.globalAlpha=.94;x.beginPath();x.arc(1089,610,75,0,Math.PI*2);x.fill();x.globalAlpha=1;x.fillStyle='#9a6179';x.beginPath();x.moveTo(1070,576);x.lineTo(1125,610);x.lineTo(1070,644);x.fill();
  x.textAlign='center';x.font='52px KaiTi,serif';x.fillText(String(i).padStart(2,'0'),1089,1120);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;pages.push({texture,aspect:2178/1225});
 }
 pages.push(ending);
 return pages;
}
