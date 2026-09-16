import {Book3D} from './book3d.js';
import {nextState} from './state.mjs';
const $=id=>document.getElementById(id), reduce=matchMedia('(prefers-reduced-motion: reduce)');
let state={phase:'shelf',active:null},motion=null,ghost=null,sourceElement=null;
const specs=[
 {id:1,title:'洞察',p:[[180,327],[346,329],[360,341],[351,1048],[163,1048],[174,524],[119,524],[125,379],[178,382]]},
 {id:2,title:'创造',p:[[394,310],[682,299],[704,1053],[403,1053]]},
 {id:3,title:'AI创意',p:[[726,337],[861,341],[867,1050],[724,1050]],ink:'#714957',color:'#ed95b0',patch:[731,405,36,280]},
 {id:4,title:'关于我',p:[[846,198],[1304,195],[1320,216],[1319,1052],[857,1052],[845,464],[835,456],[837,274],[844,274]],ink:'#fff4d8',color:'#4374bd',patch:[952,482,83,380]},
 {id:5,title:'AI产品',p:[[1320,268],[1544,279],[1552,373],[1585,369],[1585,411],[1624,411],[1635,474],[1555,508],[1560,1053],[1318,1053]],ink:'#4f8b87',color:'#dbe8aa',patch:[1328,492,44,245]},
 {id:6,title:'审美',ink:'#5b6695',color:'#c4c1e4',p:[[1556,334],[1780,336],[1794,427],[1856,430],[1858,545],[1795,542],[1806,1054],[1565,1054]]},
 {id:7,title:'协同',p:[[1848,569],[1952,564],[1966,581],[1968,1054],[1848,1054]]}
];
const canv=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const book3d=new Book3D($('cover'));
const img=new Image();img.src='assets/bookshelf-original.png';
function send(event){state=nextState(state,event);document.body.dataset.phase=state.phase;}
function duration(n){return reduce.matches ? 0.01 : n}
function targetRect(){if(state.active===3)return aboutRect();const h=Math.min(innerHeight*.66,600),w=Math.min(h*.66,innerWidth*.70);return {left:(innerWidth-w)/2,top:(innerHeight-h)/2,width:w,height:h}}
async function prepareAssets(){
 const source=canv(2048,1150);source.getContext('2d').drawImage(img,0,0,2048,1150);
 // Apply only the repaired pencil-stroke area, preserving the original art elsewhere.
 const repair=new Image();repair.src='assets/bookshelf-line-repair.png';await repair.decode();
 source.getContext('2d').drawImage(repair,1324/2048*repair.width,65/1150*repair.height,68/2048*repair.width,325/1150*repair.height,1324,65,68,325);
 const paper=canv(384,240);paper.getContext('2d').drawImage(source,390,35,384,150,0,0,384,240);
 const pattern=paper.toDataURL();document.body.style.backgroundImage=`url(${pattern})`;
 const bg=$('paper');bg.width=2048;bg.height=1150;const bc=bg.getContext('2d');bc.fillStyle=bc.createPattern(paper,'repeat');bc.fillRect(0,0,2048,1150);
 bc.drawImage(source,0,0,2048,180,0,0,2048,180);bc.drawImage(source,0,1048,2048,102,0,1048,2048,102);
 $('reading').style.backgroundImage=`url(${pattern})`;
 for(const spec of specs){
  const xs=spec.p.map(p=>p[0]),ys=spec.p.map(p=>p[1]);spec.box={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  const {x,y,w,h}=spec.box;const c=canv(w,h),ctx=c.getContext('2d');ctx.beginPath();spec.p.forEach(([a,b],i)=>i?ctx.lineTo(a-x,b-y):ctx.moveTo(a-x,b-y));ctx.closePath();ctx.clip();ctx.drawImage(source,-x,-y);spec.src=c.toDataURL();
  const active=[3,4,5].includes(spec.id),el=document.createElement(active?'button':'div');el.className=`volume${active?' actionable':''}`;el.dataset.book=spec.id;
  el.style.cssText=`left:${x/2048*100}%;top:${y/1150*100}%;width:${w/2048*100}%;height:${h/1150*100}%;z-index:${spec.id===4?9:spec.id===5?8:spec.id}`;
  if(active){el.setAttribute('aria-label',`抽出《${spec.title}》`);el.addEventListener('click',()=>select(spec,el))}else{el.setAttribute('role','img');el.setAttribute('aria-label',spec.title)}
  const art=new Image();art.src=spec.src;art.alt='';el.append(art);$('volumes').append(el);
  function hover(on){if(state.phase!=='shelf')return;gsap.to(el,{y:on?-8:0,rotation:on?(spec.id%2?.55:-.55):0,duration:duration(.28),ease:'power2.out',overwrite:true});if(on)$('hint').textContent=active?`${spec.title} · 点击抽出`:'洞察 · 创造 · 审美 · 协同';else $('hint').textContent='轻触书脊 · 你可以从任何一本开始，慢慢认识我'}
  el.addEventListener('pointerenter',()=>hover(true));el.addEventListener('pointerleave',()=>hover(false));el.addEventListener('focus',()=>hover(true));el.addEventListener('blur',()=>hover(false));
  if(active){spec.cover=({3:'assets/cover-creative-landscape.jpg',4:'assets/cover-about-design.png',5:'assets/cover-product-handdrawn.jpg',6:'assets/cover-aesthetic.svg'})[spec.id];if(spec.id===6)spec.cover='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await (await fetch(spec.cover)).text());const preload=new Image();preload.src=spec.cover;}
 }
 await Promise.all(specs.filter(s=>[3,4,5].includes(s.id)).map(s=>book3d.preload(s)));
 document.body.dataset.phase='shelf';$('hint').textContent='轻触书脊 · 你可以从任何一本开始，慢慢认识我';
}
function select(spec,el){
 if(state.phase!=='shelf'||document.body.dataset.phase==='loading')return;send({type:'select',id:spec.id});sourceElement=el;
 gsap.killTweensOf(el);gsap.set(el,{y:0,rotation:0});const box=el.getBoundingClientRect();
 ghost=document.createElement('div');ghost.className='ghost';ghost.innerHTML=`<img src="${spec.src}" alt="">`;document.body.append(ghost);gsap.set(ghost,{left:box.left,top:box.top,width:box.width,height:box.height});el.style.visibility='hidden';
 $('shelf').inert=true;$('viewer').hidden=false;$('scrim').hidden=false;gsap.set($('scrim'),{opacity:0});
 book3d.load(spec);$('cover').classList.add('solid-book');
 $('cover').hidden=true;$('cover-art').src=spec.cover;$('cover-type').style.setProperty('--ink',spec.ink);$('cover-type').querySelector('small').textContent=`0${spec.id}`;$('cover-type').querySelector('h1').textContent=spec.title;
 $('view-hint').textContent='正在抽出…';$('close').focus({preventScroll:true});
 const r=targetRect();gsap.set($('cover'),{...r,opacity:0});gsap.set($('cover-board'),{rotationY:72});
 motion=gsap.timeline({onComplete:()=>{if(state.phase!=='extracting')return;ghost.remove();ghost=null;send({type:'settled'});$('view-hint').textContent='按住拖动旋转 · 轻点翻开首页';$('cover').focus({preventScroll:true})}});
 motion.to($('scrim'),{opacity:1,duration:duration(.45)},0).to(ghost,{y:-24,scale:1.035,duration:duration(.28),ease:'power2.out'},0)
 .to(ghost,{...r,y:0,scale:1,rotationY:-72,duration:duration(.65),ease:'power3.inOut'},duration(.2))
 .add(()=>{$('cover').hidden=false;book3d.reveal(duration(.62))},duration(.62)).to($('cover'),{opacity:1,duration:duration(.16)},duration(.62)).to(ghost,{opacity:0,duration:duration(.18)},duration(.62)).to($('cover-board'),{rotationY:0,duration:duration(.62),ease:'power2.out'},duration(.62));
}
function updatePageControls(){
 $('video-tab').hidden=state.active!==3;$('video-tab').disabled=book3d.turning;$('image-tab').hidden=state.active!==3;$('image-tab').disabled=book3d.turning;
 $('play-creative-video').hidden=state.active!==3||![23,24].includes(book3d.turned);
 const n=book3d.turned,total=book3d.pages.length,left=n*2+1,right=left+1;
 $('page-position').textContent=state.active===3?`第 ${n+1} 页 / 共 ${total} 页`:state.active!==4?`第 ${left} — ${right} 页 / 共 ${total} 页`:n===0?`第 1 页 / 共 ${total-1} 页`:`第 ${left-1}${right<=total?' — '+(right-1):''} 页 / 共 ${total-1} 页`;
 const last=n===(state.active===3?total-1:Math.floor((total-1)/2));
 $('prev-page').disabled=n===0||book3d.turning;$('next-page').disabled=book3d.turning;
 $('next-page').textContent=last?'合上书':'下一页';
 $('view-hint').textContent=last?'轻点右页合上书 · 左页向前翻':'轻点右页向后翻 · 左页向前翻';
 $('watch-demo').hidden=state.active!==5||![0,8].includes(n);
 $('cover').dataset.pages=state.active===3?`${n+1}`:right<=total?`${left},${right}`:`${left}`;
}
function turnPage(dir){if($('demo-dialog').open||state.phase!=='open'||![3,4,5].includes(state.active)||book3d.turning)return;if(dir>0&&book3d.turned===(state.active===3?book3d.pages.length-1:Math.floor((book3d.pages.length-1)/2))){closeBook();return;}if(book3d.turn(dir,duration(.95),updatePageControls)){updatePageControls();}}
$('zoom-left').addEventListener('click',()=>book3d.focusPage(-1));$('zoom-reset').addEventListener('click',()=>book3d.focusPage(0));$('zoom-right').addEventListener('click',()=>book3d.focusPage(1));
$('prev-page').addEventListener('click',()=>turnPage(-1));$('next-page').addEventListener('click',()=>turnPage(1));
function aboutRect(){if(state.active===3){const w=Math.min(innerWidth*.94,1400),h=Math.min(innerHeight*.8,w/1.55);return {left:(innerWidth-w)/2,top:(innerHeight-h)/2,width:w,height:h};}const h=Math.min(innerHeight*.80,800),w=Math.min(h*1.32,innerWidth*.94);return {left:(innerWidth-w)/2,top:(innerHeight-h)/2,width:w,height:h};}
function openBook(){
 if(state.phase==='cover'&&[3,4,5].includes(state.active)){
  send({type:'open'});$('reading').style.visibility='hidden';$('reading').inert=true;
  $('cover').classList.add('reading-3d');gsap.set($('cover'),aboutRect());
  $('view-hint').textContent='轻点右页向后翻 · 左页向前翻';
  $('zoom-left').hidden=state.active===3;$('zoom-right').textContent=state.active===3?'放大页面':'放大右页';$('zoom-reset').textContent=state.active===3?'完整页面':'全书';
  book3d[state.active===3?'openCreative':'openAbout'](duration(1.05),()=>{if(state.phase!=='opening')return;send({type:'settled'});$('page-controls').hidden=false;$('page-zoom').hidden=false;updatePageControls();});
  return;
 }

 if(state.phase!=='cover')return;book3d.open(duration(.85));send({type:'open'});const spec=specs.find(x=>x.id===state.active);setPages(spec);
 $('cover').disabled=true;$('view-hint').textContent='';const reader=$('reading');reader.inert=true;reader.style.visibility='visible';gsap.set(reader,{opacity:0,scale:.94});
 const box=reader.getBoundingClientRect();
 motion=gsap.timeline({onComplete:()=>{if(state.phase!=='opening')return;send({type:'settled'});$('cover').hidden=true;reader.inert=false;$('finish').focus({preventScroll:true})}})
 .to($('cover'),{left:innerWidth<700?box.left:innerWidth/2,top:box.top,width:innerWidth<700?box.width:box.width/2,height:box.height,duration:duration(.45),ease:'power2.inOut'},0)
 .to($('cover-board'),{rotationY:-165,duration:duration(.85),ease:'power2.inOut'},duration(.25))
 .to(reader,{opacity:1,scale:1,duration:duration(.55)},duration(.48)).to($('cover'),{opacity:0,duration:duration(.25)},duration(.85));
}
function closeBook(){
 if(state.phase==='shelf'||state.phase==='returning')return;$('demo-dialog').close();$('demo-video').pause();$('watch-demo').hidden=true;$('video-tab').hidden=true;$('image-tab').hidden=true;$('play-creative-video').hidden=true;const was=state.phase;$('page-controls').hidden=true;$('page-zoom').hidden=true;book3d.focusPage(0);book3d.turnMotion?.kill();book3d.turning=false;$('cover').classList.remove('reading-3d');gsap.to(book3d.root.position,{x:0,duration:duration(.38)});book3d.reset(duration(.38));send({type:'close'});motion?.kill();
 ghost?.remove();ghost=null;$('reading').inert=true;$('cover').hidden=false;$('cover').disabled=false;
 const dest=sourceElement.getBoundingClientRect(),spec=specs.find(x=>x.id===state.active);
 motion=gsap.timeline({onComplete:()=>{sourceElement.style.visibility='';$('cover').hidden=true;$('reading').style.visibility='hidden';$('viewer').hidden=true;$('scrim').hidden=true;$('shelf').inert=false;sourceElement.focus({preventScroll:true});send({type:'settled'});gsap.set(sourceElement,{y:0,rotation:0});$('hint').textContent='轻触书脊 · 你可以从任何一本开始，慢慢认识我'}});
 if(was==='open'||was==='opening')motion.to($('reading'),{opacity:0,duration:duration(.22)},0).to($('cover'),{opacity:1,...targetRect(),duration:duration(.38)},0).to($('cover-board'),{rotationY:0,duration:duration(.38)},0);
 else{gsap.set($('cover'),{...targetRect(),opacity:1});gsap.set($('cover-board'),{rotationY:0})}
 motion.add(()=>{$('cover').classList.remove('solid-book');$('cover-art').src=spec.src;$('cover-type').style.visibility='hidden'})
 .to($('cover'),{left:dest.left,top:dest.top,width:dest.width,height:dest.height,duration:duration(.7),ease:'power3.inOut'})
 .to($('scrim'),{opacity:0,duration:duration(.5)},'<').add(()=>{$('cover-type').style.visibility='';});
}
const about=`<div class="profile"><img class="portrait" src="assets/portrait.jpg" alt="熊林洋的照片"><div><h1>熊林洋</h1><p>Linyang Xiong</p><p>2027届硕士 · 中央美术学院</p><p>AI产品经理 / 产品助理</p></div></div><p>建筑学让我习惯从人的需求出发，在复杂条件中寻找解决方案。我逐渐发现，自己同样享受设计空间之外的体验：一个功能怎样被理解，一段操作怎样更顺畅，一个想法怎样真正被使用。</p><p>AI产品吸引我的地方，是它让想法能够更快地成为可体验、可验证的原型。在作业帮和京东的实践中，我有机会把设计思维用于产品交互、内容生产与效率工具，也逐渐明确了继续探索AI产品的方向。</p><p>我希望把建筑学积累的审美、系统思考与体验设计能力，带入更灵活的数字产品中，做出有用、好用，也有温度的产品。</p>`;
const strengths=`<h2>个人优势</h2><ul><li>建筑学本硕转型 AI 产品，具备强视觉审美与用户体验思维，擅长将抽象业务需求拆解为可落地的产品方案与交互流程；</li><li>两段大厂实习（京东/作业帮），完整经历 AI 产品从 0 到 1 搭建、AIGC 工具链落地、内部效率产品定义与跨部门推进，主导 100+学科实验内容上线；</li><li>具备多项目并行管理与跨团队协作能力，梳理 15+项目全流程节点，搭建进度看板与预警机制，覆盖 10 人设计团队；</li><li>熟练使用 AIGC 全链路工具与 Vibe Coding（Codex/Claude Code），可独立完成产品原型、批量生图工具与 HTML Demo 验证；</li></ul>`;
function setPages(spec){
 let left,right;
 if(spec.id===4){left=about;right=strengths}
 if(spec.id===5){left='<h1>AI产品</h1><p class="label">作业帮 · 2026.03—2026.05</p><h2>AI数理实验室</h2><p>面向初中数理化生的交互式 AI 实验产品。</p><p>趣味视频引入 → AI老师实验指导 → AI实时问答 → 课后知识总结测评。</p><p>参与实验产品从0到1搭建、大模型评测选型、AIGC生产工具搭建与内容规模化生产。</p>';right='<h2>从想法到实验</h2><figure><img src="assets/lab.png" alt="AI数理实验室欢迎界面"><figcaption>AI老师与实验引导界面</figcaption></figure><p>以实验脚本、交互Demo与标准化内容生产流程，支持实验模块建设。</p>'}
 if(spec.id===3){left='<h1>AI创意</h1><p>用 AI 探索视觉表达，让想法变得可见。</p><h2>手绘书架探索</h2><p>从参考图的配色与笔触出发，逐步探索粉彩纸张、手绘书本与数字阅读的结合。</p>';right='<figure><img src="assets/creative.png" alt="手绘书架视觉探索"><figcaption>个人作品集 · 手绘首页视觉探索</figcaption></figure><p>青粉配色、彩铅笔触与书册布局，共同构成这座数字书架。</p>'}
 $('left-page').innerHTML=left;$('right-page').innerHTML=right;$('left-page').scrollTop=0;$('right-page').scrollTop=0;$('reading').querySelector('.spread').scrollTop=0;$('page-label').textContent=`${spec.title} · 01 / 02`;
}
let drag=null,suppressClick=false;
$('cover').addEventListener('pointerdown',e=>{if(!['cover','open'].includes(state.phase)||e.button!==0||state.phase==='open'&&![3,4,5].includes(state.active))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,rx:book3d.root.rotation.x,ry:book3d.root.rotation.y,moved:false};suppressClick=false;$('cover').setPointerCapture(e.pointerId);});
$('cover').addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(drag.moved&&state.phase==='cover'){$('cover').classList.add('dragging');book3d.rotate(drag.rx+dy*.007,drag.ry+dx*.009);}});
function endDrag(e){if(!drag||e.pointerId!==drag.id)return;suppressClick=drag.moved;if(drag.moved&&e.type!=='pointercancel'&&state.phase==='open')turnPage(e.clientX<drag.x?1:-1);drag=null;$('cover').classList.remove('dragging');if($('cover').hasPointerCapture(e.pointerId))$('cover').releasePointerCapture(e.pointerId);}
$('cover').addEventListener('pointerup',endDrag);$('cover').addEventListener('pointercancel',endDrag);
$('cover').addEventListener('keydown',e=>{if(state.phase!=='cover')return;const moves={ArrowLeft:-.15,ArrowRight:.15};if(e.key in moves){e.preventDefault();book3d.rotate(book3d.root.rotation.x,book3d.root.rotation.y+moves[e.key]);}});
$('cover').addEventListener('click',e=>{if(suppressClick&&e.detail!==0){suppressClick=false;return;}suppressClick=false;if(state.phase==='open'&&[3,4,5].includes(state.active)){if(book3d.creativeVideoHit(e.clientX,e.clientY)){showAesthetic(book3d.turned-22);return;}if(book3d.videoHit(e.clientX,e.clientY)){showDemo();return;}turnPage(e.clientX<innerWidth/2?-1:1);return;}openBook();});$('close').addEventListener('click',closeBook);$('finish').addEventListener('click',closeBook);$('scrim').addEventListener('click',closeBook);
document.addEventListener('keydown',e=>{if($('demo-dialog').open)return;if(e.key==='Escape')closeBook();if(state.phase==='open'&&[3,4,5].includes(state.active)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();turnPage(e.key==='ArrowRight'?1:-1);}if(e.key==='Tab'&&state.phase!=='shelf'){const els=[...$('viewer').querySelectorAll('button:not([disabled]),a[href]')].filter(x=>x.offsetParent!==null&&!x.closest('[inert]'));const a=els[0],b=els.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b?.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a?.focus()}}});
addEventListener('resize',()=>{if(state.phase==='cover')gsap.set($('cover'),targetRect());else if(state.phase==='open'&&[3,4,5].includes(state.active))gsap.set($('cover'),aboutRect())});
img.decode().then(prepareAssets).catch(()=>{$('hint').textContent='底图加载失败，请刷新页面重试。'});

function showDemo(){
 if(state.phase!=='open'||state.active!==5||book3d.turning)return;
 $('demo-title').textContent='焰色反应 · 化学实验演示';$('demo-video').poster='assets/product/flame-poster.jpg';$('demo-video').src='assets/product/flame-demo.mp4';$('demo-dialog').showModal();$('demo-video').play().catch(()=>{$('demo-video').focus();});
}
$('watch-demo').addEventListener('click',showDemo);
$('close-demo').addEventListener('click',()=>$('demo-dialog').close());
$('demo-dialog').addEventListener('close',()=>{$('demo-video').pause();$('demo-video').removeAttribute('src');$('demo-video').load();$('cover').focus({preventScroll:true});});
$('demo-dialog').addEventListener('click',e=>{if(e.target===$('demo-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

function showAesthetic(i){
 if(state.phase!=='open'||state.active!==3||book3d.turning||![1,2].includes(i))return;
 $('demo-title').textContent=`影像作品 ${String(i).padStart(2,'0')}`;
 $('demo-video').poster=`assets/aesthetic/poster-${i}.jpg`;
 $('demo-video').src=`assets/aesthetic/video-${i}.mp4`;
 $('demo-dialog').showModal();$('demo-video').play().catch(()=>{});
}
$('play-creative-video').addEventListener('click',()=>showAesthetic(book3d.turned-22));
function jumpCreative(target){if(state.phase!=='open'||state.active!==3||book3d.turning||book3d.turned===target)return;book3d.turnCreative(book3d.turned<target?1:-1,duration(.65),updatePageControls,target);updatePageControls();}
$('video-tab').addEventListener('click',()=>jumpCreative(23));
$('image-tab').addEventListener('click',()=>jumpCreative(0));
