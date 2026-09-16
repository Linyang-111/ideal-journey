import * as THREE from './vendor/three.module.js';
export async function createAestheticTextures(){
 return Promise.all([1,2].map(async i=>{
  const image=new Image();image.src=`assets/aesthetic/poster-${i}.jpg`;await image.decode();
  const c=document.createElement('canvas');c.width=1400;c.height=2100;const x=c.getContext('2d');
  x.fillStyle='#fffdf5';x.fillRect(0,0,1400,2100);x.fillStyle='#807fa7';x.font='76px KaiTi, serif';x.fillText('审美 · 影像 '+String(i).padStart(2,'0'),115,225);
  const scale=Math.min(1160/image.width,900/image.height),w=image.width*scale,h=image.height*scale;
  x.drawImage(image,(1400-w)/2,550+(900-h)/2,w,h);
  x.fillStyle='#fffdf5';x.globalAlpha=.92;x.beginPath();x.arc(700,1000,100,0,Math.PI*2);x.fill();x.globalAlpha=1;x.fillStyle='#807fa7';x.beginPath();x.moveTo(677,955);x.lineTo(747,1000);x.lineTo(677,1045);x.fill();
  x.textAlign='center';x.font='56px KaiTi, serif';x.fillText(i===1?'4月23日':'5月1日',700,1560);x.font='48px KaiTi, serif';x.fillText(i===1?'点击观看视频 · 00:32':'点击观看视频 · 00:08',700,1660);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return {texture};
 }));
}
