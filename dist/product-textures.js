import * as THREE from './vendor/three.module.js';
import {footerBaseline} from './page-layout.mjs';
export async function createProductTextures(){
 const data=await(await fetch('product-pages.json')).json(),assets=new Map();
 await Promise.all([...new Set(data.flatMap(s=>s.images||[]))].map(async name=>{const im=new Image();im.src='assets/product/'+name;await im.decode();assets.set(name,im);}));
 const pages=[];
 for(const [spread,s] of data.entries())for(let side=0;side<2;side++){
  const journey=Number.isInteger(s.active);
  const pipeline=s.title==='AIGC 内容生产体系';
  const c=document.createElement('canvas');c.width=1400;c.height=2100;const x=c.getContext('2d');
  x.fillStyle='#fffdf5';x.fillRect(0,0,1400,2100);
  let seed=739;for(let n=0;n<50000;n++){seed=(seed*1664525+1013904223)>>>0;const a=seed/4294967296;seed=(seed*1664525+1013904223)>>>0;x.fillStyle='rgba(110,105,70,.025)';x.fillRect(a*1400,seed/4294967296*2100,2,2);}
  function text(t,px,y,size=56,bold=false,width=1170,color='#334d6c'){
   x.font=`${bold?'bold ':''}${size}px KaiTi, STKaiti, serif`;x.fillStyle=color;
   let line='';for(const token of t.match(/[A-Za-z0-9]+(?:[+./-][A-Za-z0-9]+)*|\s|./gu)||[]){if(line&&x.measureText(line+token).width>width){x.fillText(line,px,y);y+=size*1.32;line='';}line+=token;}if(line){x.fillText(line,px,y);y+=size*1.32;}return y;
  }
  const stroke=(a,b,w,h)=>{x.strokeStyle='#98ac8b';x.lineWidth=3;x.beginPath();x.moveTo(a-3,b+4);x.lineTo(a+w,b);x.lineTo(a+w+3,b+h-2);x.lineTo(a,b+h+3);x.closePath();x.stroke();};
  let bottom=0;
  if(s.title==='产品设计 · 交互细节'){
   if(side===0)text(s.title,115,200,76,false,1170,'#597d6c');
   const im=assets.get(s.images[side]),w=1170,h=im.height*w/im.width,top=330;
   x.fillStyle='#f0f1df';x.fillRect(103,top-12,w+24,h+24);
   x.drawImage(im,115,top,w,h);stroke(103,top-12,w+24,h+24);
   x.fillStyle='rgba(234,181,197,.55)';x.save();x.translate(150,top-15);x.rotate(-.08);x.fillRect(0,0,140,42);x.restore();
   const afterCaption=text(s.captions[side],115,top+h+80,44,false,1170);
   let y=Math.max(afterCaption,top+h+80+44*1.32*2)+88;
   for(const block of s.blocks.slice(side*2,side*2+2)){
    y=text(block[0],115,y,60,true,1170,'#597d6c')+8;
    for(const p of block.slice(1))y=text(p,115,y,56)+8;
    y+=44;
   }
   bottom=y;
  }else if(s.diagram){
   text(side===0?'项目背景':'项目目标与我的角色',115,200,76,false,1170,'#597d6c');
   if(side===0){
    const block=s.blocks[0];let y=text(block[0],115,320,60,true,1170,'#597d6c')+20;
    for(const p of block.slice(1))y=text(p,115,y,56)+35;
    bottom=y;
   }else{
    const goal=s.blocks[1];let y=text(goal[0],115,320,60,true,1170,'#597d6c')+8;
    text(goal[1],115,y,56);
    const diagramTop=500,diagramHeight=(s.diagram.length-1)*240+180;
    const outerGap=diagramTop-(y+x.measureText(goal[1]).actualBoundingBoxDescent);
    for(let i=0;i<s.diagram.length;i++){
     const top=diagramTop+i*240;
     x.fillStyle=i%2?'#f4e2e8':'#e7edcf';x.fillRect(140,top,1120,180);stroke(140,top,1120,180);
     const heading='0'+(i+1)+'  '+s.diagram[i],detail=goal[i+2].split(' — ')[1];
     x.font='bold 60px KaiTi, STKaiti, serif';const ascent=x.measureText(heading).actualBoundingBoxAscent;
     x.font='48px KaiTi, STKaiti, serif';const descent=x.measureText(detail).actualBoundingBoxDescent;
     const baseline=top+90+(ascent-70-descent)/2;
     text(heading,180,baseline,60,true,1040,'#597d6c');
     text(detail,300,baseline+70,48,false,900,'#597d6c');
     if(i<3)text('↓',665,top+225,56,false);
    }
    const role=s.blocks[2];x.font='bold 60px KaiTi, STKaiti, serif';
    const roleY=diagramTop+diagramHeight+outerGap+x.measureText(role[0]).actualBoundingBoxAscent;
    y=text(role[0],115,roleY,60,true,1170,'#597d6c')+8;
    for(const p of role.slice(1))y=text(p,115,y,56)+8;
    bottom=y;
   }
  }else if(side===1){
   let y;
   if(s.stats){
    x.font='bold 60px KaiTi, STKaiti, serif';
    y=390+x.measureText(s.blocks[0][0]).actualBoundingBoxAscent;
   }else if(pipeline){
    x.font='bold 60px KaiTi, STKaiti, serif';
    y=418+x.measureText(s.blocks[0][0]).actualBoundingBoxAscent;
   }else if(journey){
    const im=assets.get(s.images[0]),h=im.height*Math.min(1170/im.width,1050/im.height);
    x.font='bold 60px KaiTi, STKaiti, serif';
    y=430+(1050-h)/2-12+x.measureText(s.blocks[0][0]).actualBoundingBoxAscent;
   }else y=text(s.title,115,200,76,false,1170,'#597d6c')+20;
   for(const [i,block] of s.blocks.entries()){
    if(s.video&&i===1)y=650;
    const role=s.video&&i===0;
    if(role){
     x.font='76px KaiTi, STKaiti, serif';const upper=200+x.measureText(s.title).actualBoundingBoxDescent;
     x.font='bold 60px KaiTi, STKaiti, serif';const lower=650-x.measureText(s.blocks[1][0]).actualBoundingBoxAscent;
     const ascent=x.measureText(block[0]).actualBoundingBoxAscent;
     x.font='60px KaiTi, STKaiti, serif';const descent=x.measureText(block[1]).actualBoundingBoxDescent;
     y=(upper+lower+ascent-(60*1.32+8)-descent)/2;
    }
    if(i===s.active){x.fillStyle='#e7edcf';x.fillRect(96,y-58,1208,84);}
    if(block[0])y=text(block[0],115,y,60,true,1170,'#597d6c')+8;
    for(const p of block.slice(1))y=text(p,115,y,role?60:56)+8;
    y+=22;
   }
   bottom=y;
  }else{
   // The first left page is printed inside the slightly taller front cover.
   text(s.video?'实验演示':journey||pipeline?s.title:s.label,115,s.video?231:200,76,false,1170,'#597d6c');
   if(s.images){
    const count=s.images.length,cols=count===4?2:1,rows=Math.ceil(count/cols),gap=45;
    const columnWidth=1170/cols-(cols===2?gap/2:0),slot=count===1?1250:count===2?735:740;
    for(let i=0;i<count;i++){
     const width=pipeline&&i>=2?(i===2?750:375):columnWidth;
     const im=assets.get(s.images[i]),px=pipeline&&i===3?115+750+gap:115+(i%cols)*(columnWidth+gap),top=430+Math.floor(i/cols)*slot;
     const maxH=count===1?1050:count===2?510:500,scale=Math.min(width/im.width,maxH/im.height),w=im.width*scale,h=im.height*scale,y=top+(maxH-h)/2;
     if(pipeline){
      x.fillStyle='#f0f1df';x.fillRect(px-12,top-12,width+24,maxH+24);
      x.fillStyle='#fffdf5';x.fillRect(px,top,width,maxH);
      x.drawImage(im,px+(width-w)/2,y,w,h);stroke(px-12,top-12,width+24,maxH+24);
     }else{
      x.fillStyle='#f0f1df';x.fillRect(px-12,y-12,w+24,h+24);x.drawImage(im,px,y,w,h);stroke(px-12,y-12,w+24,h+24);
     }
     x.fillStyle='rgba(234,181,197,.55)';x.save();x.translate(px+35,(pipeline?top:y)-15);x.rotate(-.08);x.fillRect(0,0,140,42);x.restore();
     if(journey){
      x.textAlign='center';
      const afterCaption=text(s.caption||'',px+w/2,y+h+80,44,false,width);
      text(String(s.active+1).padStart(2,'0'),px+w/2,afterCaption+88,56,false,width,'#597d6c');
      x.textAlign='left';
     }else if(pipeline){
      x.textAlign='center';
      text(s.captions?.[i]||'',px+width/2,top+maxH+80,38,false,width);
      x.textAlign='left';
     }else text(s.captions?.[i]||s.caption||'',px,y+h+80,count===4?38:44,false,width);
     if(s.video){
      x.fillStyle='rgba(255,253,245,.94)';x.beginPath();x.arc(700,y+h/2,93,0,Math.PI*2);x.fill();x.strokeStyle='#597d6c';x.lineWidth=5;x.stroke();x.fillStyle='#597d6c';x.beginPath();x.moveTo(676,y+h/2-39);x.lineTo(739,y+h/2);x.lineTo(676,y+h/2+39);x.closePath();x.fill();
      x.textAlign='center';
      text('点击观看完整演示',700,1600,56,false,1170,'#597d6c');
      text('03:40',700,1690,48,false,1170,'#597d6c');
      x.textAlign='left';
     }
    }
   }
   if(s.diagram){for(let i=0;i<s.diagram.length;i++){const y=500+i*320;x.fillStyle=i%2?'#f4e2e8':'#e7edcf';x.fillRect(140,y-65,1120,180);stroke(140,y-65,1120,180);text('0'+(i+1)+'  '+s.diagram[i],190,y+45,62,true,1030,'#597d6c');if(i<3)text('↓',660,y+230,76,false);}}
   if(s.stats){for(let i=0;i<s.stats.length;i++){const y=550+i*580;x.fillStyle=i?'#f4e2e8':'#e7edcf';x.fillRect(140,y-160,1120,420);text(s.stats[i][0],230,y+65,210,true,1000,'#597d6c');text(s.stats[i][1],230,y+185,56);}text('再看一次 · 焰色反应演示',210,1810,56,false,1100,'#597d6c');}
  }
  if(bottom>1940)throw new Error(`产品第 ${spread*2+side+1} 页内容溢出: ${bottom}`);
  const footerY=footerBaseline(spread*2+side);
  text('AI产品',115,footerY,32,false,1000,'#718b7b');x.textAlign='right';text(String(spread*2+side+1).padStart(2,'0'),1285,footerY,32,false);x.textAlign='left';
  const edge=side===1?0:1400,gradient=x.createLinearGradient(edge,0,side===1?65:1335,0);gradient.addColorStop(0,'rgba(111,95,72,.2)');gradient.addColorStop(.22,'rgba(111,95,72,.07)');gradient.addColorStop(1,'rgba(111,95,72,0)');x.fillStyle=gradient;x.fillRect(side===1?0:1335,0,65,2100);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  pages.push({texture,page:{title:s.title,side,bottom,video:side===0&&(s.video||!!s.stats)},fontSize:56});
 }
 return pages;
}

