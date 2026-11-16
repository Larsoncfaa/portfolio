(function(){
'use strict';
var D=document,B=D.body,root=D.documentElement;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(e){}
var fine=false;try{fine=matchMedia('(hover:hover) and (pointer:fine)').matches;}catch(e){}
function $(s,c){return (c||D).querySelector(s);}
function $$(s,c){return Array.prototype.slice.call((c||D).querySelectorAll(s));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function once(el,cb,opts){
  if(!('IntersectionObserver' in window)){cb();return;}
  var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){o.disconnect();cb();}});},opts||{rootMargin:'200px 0px'});
  o.observe(el);
}

/* ---------- langue ---------- */
function setLang(l){
  B.classList.toggle('en',l==='en');
  root.lang=l;
  $$('.lang button').forEach(function(b){var on=b.dataset.l===l;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
  try{localStorage.setItem('ak_lang',l);}catch(e){}
  var t=$('title');if(t&&t.dataset[l])t.textContent=t.dataset[l];
}
var stored=null;try{stored=localStorage.getItem('ak_lang');}catch(e){}
if(!stored){try{stored=(navigator.language||'fr').slice(0,2)==='fr'?'fr':'en';}catch(e){stored='fr';}}
setLang(stored==='en'?'en':'fr');
$$('.lang button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.l);});});

/* ---------- mots masqués ---------- */
function splitWords(el){
  var scopes=$$('.fr,.en',el);if(!scopes.length)scopes=[el];
  scopes.forEach(function(scope){
    var n=0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var frag=D.createDocumentFragment();
          c.nodeValue.replace(/ ([:;!?»])/g,'\u00a0$1').replace(/(«) /g,'$1\u00a0').split(/([ \t\r\n]+)/).forEach(function(p){
            if(!p)return;
            if(/^[ \t\r\n]+$/.test(p)){frag.appendChild(D.createTextNode(' '));return;}
            var w=D.createElement('span'),s=D.createElement('span');
            w.className='w';s.textContent=p;s.style.setProperty('--i',n++);w.appendChild(s);frag.appendChild(w);
          });
          node.replaceChild(frag,c);
        }else if(c.nodeType===1&&!c.classList.contains('w'))walk(c);
      });
    })(scope);
  });
}
$$('.split').forEach(splitWords);

/* ---------- révélations ---------- */
var io=null;
if('IntersectionObserver' in window){
  io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  $$('.rv,.split:not(.hero-title),.hl').forEach(function(el){io.observe(el);});
}else{
  $$('.rv,.split,.hl').forEach(function(el){el.classList.add('in');});
}

/* ---------- tissus (construits seulement quand on s'en approche) ---------- */
function seedNum(){return 1000+Math.floor(Math.random()*8999);}
var heroSvg=$('svg[data-cloth="hero"]'),heroSeed=seedNum(),heroRows=[];
function heroBuild(){
  if(!heroSvg)return;
  Cloth.build(heroSvg,{seed:heroSeed,w:400,h:612,pad:24});
  heroRows=$$('g.row',heroSvg);
  var n=$('[data-seed-no]');if(n){n.textContent=heroSeed;n.dataset.value=heroSeed;}
  D.dispatchEvent(new CustomEvent('cloth:seed',{detail:heroSeed}));
}
heroBuild();

$$('svg[data-cloth="thumb"]').forEach(function(s,i){
  once(s.closest('.row')||s,function(){
    Cloth.build(s,{seed:+s.dataset.seed||(i+3)*131,w:240,h:130,pad:8,frame:false,anim:false});
    s.classList.add('painted');
  });
});
$$('svg[data-cloth="banner"]').forEach(function(s){
  Cloth.build(s,{seed:+s.dataset.seed||77,w:1200,h:210,pad:16});
  s.setAttribute('preserveAspectRatio','xMidYMid slice');
  once(s,function(){Cloth.paint(s,200);},{threshold:.2});
});
$$('svg[data-cloth="band"]').forEach(function(s){
  once(s,function(){
    Cloth.build(s,{seed:9,w:1200,h:96,pad:0,frame:false,bg:false,rough:false,anim:false,palette:{bg:null,ink:'#F1E8D3',rust:'#C9583A',ochre:'#D4A03A',blue:'#8C9CC8'},rowHs:[28,36,32]});
    s.setAttribute('preserveAspectRatio','xMidYMid slice');s.classList.add('painted');
  });
});
if(heroSvg){
  heroSvg.parentNode.addEventListener('click',function(){
    heroSeed=seedNum();heroBuild();
    requestAnimationFrame(function(){requestAnimationFrame(function(){Cloth.paint(heroSvg,10);});});
  });
}

/* ---------- rideau d'entrée ---------- */
function startHero(){
  var h=$('.hero-title');if(h)h.classList.add('go-words');
  $$('.hero .rv').forEach(function(el,i){setTimeout(function(){el.classList.add('in');},reduce?0:250+i*140);});
  if(heroSvg)Cloth.paint(heroSvg,reduce?0:350);
}
var cur=$('.curtain');
if(cur&&root.classList.contains('intro')){
  try{sessionStorage.setItem('ak_intro','1');}catch(e){}
  setTimeout(function(){
    cur.classList.add('lift');
    setTimeout(startHero,350);
    setTimeout(function(){root.classList.remove('intro');},1200);
  },1900);
  setTimeout(function(){root.classList.remove('intro');},4500);
}else{
  startHero();
}

/* ---------- mesures en cache (aucune lecture de mise en page pendant le scroll) ---------- */
var hdr=$('.hdr'),fab=$('.fab'),secs=[],navLinks=$$('.nav a[href^="#"]'),vh=window.innerHeight,docH=0;
function docTop(el){var t=0;while(el){t+=el.offsetTop;el=el.offsetParent;}return t;}
function measure(){
  vh=window.innerHeight;docH=root.scrollHeight;
  secs=$$('main > section, main > .strip').map(function(s){
    var top=docTop(s);return {el:s,id:s.id,top:top,bottom:top+s.offsetHeight,dark:s.classList.contains('ink')||s.classList.contains('indigo')};
  });
  D.dispatchEvent(new CustomEvent('ak:measure'));
  onScroll();
}
var lastY=0,tone='',curId='',hidden=false,fabOn=false,ticking=false,mx=0;
function onScroll(){
  ticking=false;
  var y=window.scrollY||0;
  if(hdr){
    var hide=y>lastY+2&&y>260&&!B.classList.contains('menu-open');
    if(y<lastY-2||y<260)hide=false;else if(!(y>lastY+2))hide=hidden;
    if(hide!==hidden){hidden=hide;hdr.classList.toggle('hide',hide);}
    var t='paper',probe=y+40;
    for(var i=0;i<secs.length;i++){if(probe>=secs[i].top&&probe<secs[i].bottom&&secs[i].dark){t='ink';break;}}
    if(t!==tone){tone=t;hdr.dataset.tone=t;}
  }
  lastY=y;
  var id='',mark=y+vh*.4;
  for(var j=0;j<secs.length;j++){if(secs[j].id&&mark>=secs[j].top&&mark<secs[j].bottom){id=secs[j].id;break;}}
  if(id!==curId){curId=id;navLinks.forEach(function(a){var on=a.getAttribute('href')==='#'+id;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});}
  if(fab){
    var contact=null;for(var k=0;k<secs.length;k++)if(secs[k].id==='contact')contact=secs[k];
    var show=y>vh*.9&&!(contact&&y+vh>contact.top+vh*.35);
    if(show!==fabOn){fabOn=show;fab.classList.toggle('show',show);}
  }
  weave();
}
function weave(){
  if(!heroRows.length||reduce||(window.scrollY||0)>vh*1.2&&Math.abs(mx)<.001)return;
  var sy=clamp((window.scrollY||0)/900,0,1);
  for(var i=0;i<heroRows.length;i++){
    var dir=i%2?1:-1,k=5+(i%4)*3;
    heroRows[i].style.transform='translateX('+((mx*k+sy*k*3)*dir).toFixed(1)+'px)';
  }
}
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
var mt=0;
window.addEventListener('resize',function(){clearTimeout(mt);mt=setTimeout(measure,120);});
window.addEventListener('load',function(){measure();setTimeout(measure,1200);});
if(D.fonts&&D.fonts.ready)D.fonts.ready.then(measure);
if('ResizeObserver' in window){var ro=new ResizeObserver(function(){clearTimeout(mt);mt=setTimeout(measure,120);});ro.observe(B);}
measure();

/* inclinaison douce du tissu (une seule écriture par image) */
var hero=$('.hero'),wrap=$('.cloth-wrap'),pending=false,px=0,py=0;
if(hero&&fine&&!reduce){
  hero.addEventListener('pointermove',function(e){
    px=(e.clientX/window.innerWidth-.5)*2;py=(e.clientY/window.innerHeight-.5)*2;
    if(!pending){pending=true;requestAnimationFrame(function(){
      pending=false;mx=px;
      if(wrap){wrap.style.setProperty('--rot',(1.4+px*1.6).toFixed(2)+'deg');wrap.style.setProperty('--ty',(py*-8).toFixed(1)+'px');}
      weave();
    });}
  },{passive:true});
}

/* ---------- menu mobile ---------- */
var mb=$('.menu-btn'),mnav=$('.mnav');
function menu(open){
  B.classList.toggle('menu-open',open);
  if(mb){mb.setAttribute('aria-expanded',open);var l=$$('span',mb);}
  if(mnav){mnav.setAttribute('aria-hidden',!open);}
  if(open&&mnav){var a=$('a',mnav);if(a)setTimeout(function(){a.focus({preventScroll:true});},60);}
  else if(mb&&D.activeElement&&mnav&&mnav.contains(D.activeElement))mb.focus();
}
if(mb){
  mb.addEventListener('click',function(){menu(!B.classList.contains('menu-open'));});
  $$('.mnav a').forEach(function(a){a.addEventListener('click',function(){menu(false);});});
  D.addEventListener('keydown',function(e){if(e.key==='Escape'&&B.classList.contains('menu-open'))menu(false);});
  window.addEventListener('resize',function(){if(window.innerWidth>860&&B.classList.contains('menu-open'))menu(false);});
  if(mnav)mnav.setAttribute('aria-hidden','true');
}

/* ---------- curseur ---------- */
if(fine&&!reduce){
  var c=D.createElement('div');c.className='cur';c.setAttribute('aria-hidden','true');c.innerHTML='<span></span>';B.appendChild(c);
  var lab=c.firstChild,x=-100,y=-100,tx=-100,ty=-100,run=false;
  window.addEventListener('pointermove',function(e){
    tx=e.clientX;ty=e.clientY;c.classList.add('on');
    if(!run){run=true;requestAnimationFrame(loop);}
  },{passive:true});
  D.addEventListener('pointerleave',function(){c.classList.remove('on');});
  var loop=function(){
    x+=(tx-x)*.22;y+=(ty-y)*.22;
    c.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
    if(Math.abs(tx-x)>.2||Math.abs(ty-y)>.2)requestAnimationFrame(loop);else run=false;
  };
  var big=false;
  D.addEventListener('pointerover',function(e){
    var t=e.target.closest&&e.target.closest('[data-cur]');
    if(t){lab.textContent=B.classList.contains('en')?(t.dataset.curEn||t.dataset.cur):t.dataset.cur;if(!big){big=true;c.classList.add('big');}}
    else if(big){big=false;c.classList.remove('big');}
  },{passive:true});
}

/* ---------- copier ---------- */
$$('.copy').forEach(function(b){
  b.addEventListener('click',function(){
    var v=b.dataset.copy,en=B.classList.contains('en');
    function ok(){b.dataset.done=en?'Copied':'Copié';b.classList.add('ok');setTimeout(function(){b.classList.remove('ok');},1600);}
    try{navigator.clipboard.writeText(v).then(ok,function(){location.href='mailto:'+v;});}catch(e){}
  });
});

/* ---------- voix : titre qui s'allume + forme d'onde peinte ---------- */
var vh2=$('.voice h2');
if(vh2&&io){
  once(vh2,function(){$$('.l',vh2).forEach(function(s,i){setTimeout(function(){s.classList.add('on');},reduce?0:i*900);});},{threshold:.4});
}
var cv=$('.voice canvas');
if(cv&&cv.getContext){
  var ctx=cv.getContext('2d'),dpr=Math.min(window.devicePixelRatio||1,2),W=0,H=0,bars=[],t=reduce?3.2:0,vis=false,raf=0,mpos=-1,R=Cloth.rng(11);
  var size=function(){
    var r=cv.getBoundingClientRect();W=r.width;H=r.height;
    cv.width=Math.max(1,Math.round(W*dpr));cv.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.max(20,Math.floor(W/(W<420?8:10)));bars=[];
    for(var i=0;i<n;i++)bars.push({j:(R()-.5)*3,p:R()*6.28,k:.55+R()*.6,r:R()});
  };
  var draw=function(){
    ctx.clearRect(0,0,W,H);
    var n=bars.length,cyc=(t/7)%1,turn=cyc<.5?0:1;
    ctx.lineCap='round';ctx.lineWidth=Math.max(3,W/n*.42);
    for(var i=0;i<n;i++){
      var b=bars[i],pos=i/(n-1),side=pos<.5?0:1,act=side===turn?1:.07;
      var env=(Math.sin(i*.31+t*3.1+b.p)*.5+.5)*(Math.sin(i*.09-t*1.2)*.4+.6);
      var h=H*(.07+.86*act*env*b.k);
      if(mpos>=0){var d=Math.abs(pos-mpos);h+=H*.3*Math.exp(-d*d*180)*(.5+env*.5);}
      h=Math.min(h,H*.96);
      var xx=(i+.5)*W/n+b.j,mid=H/2;
      ctx.strokeStyle=b.r>.9?'#C9583A':(side?'#D4A03A':'#F1E8D3');
      ctx.globalAlpha=side===turn?.95:.5;
      ctx.beginPath();ctx.moveTo(xx,mid-h/2);ctx.lineTo(xx+b.j*.4,mid+h/2);ctx.stroke();
    }
    ctx.globalAlpha=1;
  };
  var last=0;
  var tick=function(now){
    if(!vis)return;
    raf=requestAnimationFrame(tick);
    if(now-last<33)return;           /* 30 images/s suffisent pour une onde */
    t+=(now-last)/1000;last=now;draw();
  };
  size();draw();
  var rt=0;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){size();draw();},150);});
  if(fine){
    cv.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();mpos=(e.clientX-r.left)/r.width;},{passive:true});
    cv.addEventListener('pointerleave',function(){mpos=-1;});
  }
  if('IntersectionObserver' in window&&!reduce){
    new IntersectionObserver(function(es){
      vis=es[0].isIntersecting;cancelAnimationFrame(raf);
      if(vis){last=performance.now();raf=requestAnimationFrame(tick);}
    }).observe(cv);
  }
}

/* ---------- transitions de page ---------- */
$$('a[href]').forEach(function(a){
  var h=a.getAttribute('href');
  if(!h||h.charAt(0)==='#'||/^(mailto:|tel:|https?:|\/\/)/.test(h)||a.target==='_blank'||a.hasAttribute('download')||/\.pdf$/i.test(h))return;
  a.addEventListener('click',function(e){
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0||reduce)return;
    e.preventDefault();B.classList.add('leaving');
    setTimeout(function(){location.href=h;},300);
  });
});
window.addEventListener('pageshow',function(){B.classList.remove('leaving');});
var yr=$('[data-year]');if(yr)yr.textContent=new Date().getFullYear();
})();
