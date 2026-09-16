import * as THREE from './vendor/three.module.js';
import {footerBaseline} from './page-layout.mjs';

export async function createAboutTextures(){
 const source=await (await fetch('about-pages.json')).json();
 const portrait=new Image();portrait.src='assets/portrait.jpg';await portrait.decode();
 const measure=document.createElement('canvas').getContext('2d');
 const wrap=(text,font,width=1170)=>{measure.font=font;const lines=[];let line='';for(const token of text.match(/[A-Za-z0-9]+(?:[+./-][A-Za-z0-9]+)*|\s|./gu)||[]){if(line&&measure.measureText(line+token).width>width){lines.push(line);line='';}line+=token;}if(line)lines.push(line);return lines;};
 const planned=[{title:'熊林洋',identity:true,rows:[]}];
 const diary={title:'关于我的一些话',diary:true,rows:[]};let diaryY=470;
 for(const paragraph of source[0].blocks.slice(3)){
  for(const text of wrap(paragraph.text,'56px KaiTi, STKaiti, serif')){diary.rows.push({text,y:diaryY,size:56,kind:'text'});diaryY+=88;}
  diaryY+=88;
 }
 planned.push(diary);
 const richWrap=(block,size)=>{
  const text=(block.kind==='bullet'?'• ':'')+block.text,mask=Array(text.length).fill(false);
  for(const phrase of block.bold||[]){let at=text.indexOf(phrase);while(at>=0){for(let i=at;i<at+phrase.length;i++)mask[i]=true;at=text.indexOf(phrase,at+phrase.length);}}
  const lines=[];let runs=[],width=0;
  for(let i=0;i<text.length;i++){const bold=mask[i];measure.font=`${bold?'bold ':''}${size}px KaiTi, STKaiti, serif`;const w=measure.measureText(text[i]).width;
   if(width+w>1170&&runs.length){lines.push(runs);runs=[];width=0;}
   if(runs.at(-1)?.bold===bold)runs.at(-1).text+=text[i];else runs.push({text:text[i],bold});width+=w;
  }
  if(runs.length)lines.push(runs);return lines;
 };
 for(const section of source.slice(1)){
  let page={title:section.title,rows:[]},y=320,part=1;
  const flush=()=>{planned.push(page);page={title:'',rows:[]};y=200;part++;};
  for(const block of section.blocks){
   if(block.kind==='heading'&&block.text.startsWith('清华大学')&&page.rows.length){flush();y=320;}
   if(section.title==='与我联系'&&block.text.startsWith('邮箱：'))y+=88;
   const size=block.kind==='heading'?62:56;
   const lines=richWrap(block,size);
   const leading=section.title==='项目经历'?1.42:1.57;
   const height=lines.length*size*leading+34;
   if(y+height>1940&&height<1600&&page.rows.length)flush();
   for(const runs of lines){if(y>1900)flush();page.rows.push({text:runs.map(r=>r.text).join(''),runs,y,size,kind:block.kind});y+=size*leading;}
   y+=34;
  }
  if(page.rows.length)planned.push(page);
 }
 return planned.map((page,index)=>{
  if(page.rows.some(r=>r.y>1940))throw new Error(`第${index+1}页溢出`);
  const c=document.createElement('canvas');c.width=1400;c.height=2100;const ctx=c.getContext('2d');ctx.fillStyle='#fffdf5';ctx.fillRect(0,0,1400,2100);
  let seed=417;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<60000;i++){ctx.fillStyle=`rgba(121,97,57,${rnd()*.035})`;ctx.fillRect(rnd()*1400,rnd()*2100,1+rnd()*3,1+rnd()*2);}
  if(page.identity){
   ctx.save();ctx.translate(700,730);ctx.rotate(-.018);ctx.fillStyle='#fffaf0';ctx.fillRect(-332,-412,664,824);ctx.drawImage(portrait,-310,-390,620,775);ctx.restore();
   ctx.textAlign='center';ctx.fillStyle='#315b99';ctx.font='116px KaiTi, STKaiti, serif';ctx.fillText('熊林洋',700,1300);ctx.font='56px KaiTi, STKaiti, serif';ctx.fillText('Linyang Xiong',700,1410);
   ctx.font='52px KaiTi, STKaiti, serif';ctx.fillText('2027届硕士 · 中央美术学院',700,1550);ctx.fillText('AI产品经理 / 产品助理',700,1660);ctx.textAlign='left';
  }else{
   ctx.fillStyle='#315b99';ctx.font='76px KaiTi, STKaiti, serif';ctx.fillText(page.title,115,200);
   if(page.diary){ctx.strokeStyle='#b7c7cd';ctx.lineWidth=1.5;for(let y=488;y<1940;y+=88){ctx.beginPath();ctx.moveTo(110,y);ctx.lineTo(1290,y);ctx.stroke();}}
   for(const row of page.rows){ctx.fillStyle=row.kind==='heading'?'#234e86':'#334d6c';let x=115;for(const run of row.runs||[{text:row.text,bold:false}]){ctx.font=`${run.bold?'bold ':''}${row.size}px KaiTi, STKaiti, serif`;ctx.fillText(run.text,x,row.y);x+=ctx.measureText(run.text).width;}}
  }
  if(!page.identity){
   ctx.fillStyle='#7186a5';ctx.font='32px KaiTi, STKaiti, serif';
   const footerY=footerBaseline(index);
   ctx.textAlign='left';ctx.fillText('关于我',115,footerY);
   ctx.textAlign='right';ctx.fillText(String(index).padStart(2,'0'),1285,footerY);ctx.textAlign='left';
  }
  // Inner binding shadow: each page carries its own subtle fold shading.
  const innerLeft=index%2===1, edge=innerLeft?0:1400;
  const shade=ctx.createLinearGradient(edge,0,innerLeft?65:1335,0);
  shade.addColorStop(0,'rgba(111,95,72,0.20)');shade.addColorStop(.22,'rgba(111,95,72,0.07)');shade.addColorStop(1,'rgba(111,95,72,0)');
  ctx.fillStyle=shade;ctx.fillRect(innerLeft?0:1335,0,65,2100);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  return {texture,page,fontSize:56};
 });
}
