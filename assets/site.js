(function(){
'use strict';
var D=document,B=D.body,root=D.documentElement;
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(e){}
var fine=false;try{fine=matchMedia('(hover:hover) and (pointer:fine)').matches;}catch(e){}
function $(s,c){return (c||D).querySelector(s);}
function $$(s,c){return Array.prototype.slice.call((c||D).querySelectorAll(s));}

/* ---------- langue ---------- */
function setLang(l){
  B.classList.toggle('en',l==='en');
  root.lang=l;
  $$('.lang button').forEach(function(b){b.classList.toggle('on',b.dataset.l===l);});
  try{localStorage.setItem('ak_lang',l);}catch(e){}
  var t=$('title');if(t&&t.dataset[l])t.textContent=t.dataset[l];
}
var stored=null;try{stored=localStorage.getItem('ak_lang');}catch(e){}
setLang(stored==='en'?'en':'fr');
$$('.lang button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.l);});});

/* ---------- mots masqués ---------- */
function splitWords(el){
  var n=0;
  $$('.fr,.en',el).concat(($('.fr,.en',el)?[]:[el])).forEach(function(scope){
    n=0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var parts=c.nodeValue.split(/(\s+)/),frag=D.createDocumentFragment();
          parts.forEach(function(p){
            if(!p)return;
            if(/^\s+$/.test(p)){frag.appendChild(D.createTextNode(' '));return;}
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
  },{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  $$('.rv,.split:not(.hero-title),.hl').forEach(function(el){io.observe(el);});
}else{
  $$('.rv,.split,.hl').forEach(function(el){el.classList.add('in');});
}

/* ---------- tissus ---------- */
function seedNum(){return 1000+Math.floor(Math.random()*8999);}
var heroSvg=$('svg[data-cloth="hero"]');
var heroSeed=seedNum();
function heroBuild(paintNow){
  if(!heroSvg)return;
  Cloth.build(heroSvg,{seed:heroSeed,w:400,h:612,pad:24});
  var n=$('[data-seed-no]');if(n){n.textContent=heroSeed;n.dataset.value=heroSeed;}
  D.dispatchEvent(new CustomEvent('cloth:seed',{detail:heroSeed}));
  if(paintNow)Cloth.paint(heroSvg,40);
}
heroBuild(false);

$$('svg[data-cloth="thumb"]').forEach(function(s,i){
  Cloth.build(s,{seed:+s.dataset.seed||(i+3)*131,w:240,h:130,pad:8,frame:false,anim:false});
  s.classList.add('painted');
});
$$('svg[data-cloth="banner"]').forEach(function(s){
  Cloth.build(s,{seed:+s.dataset.seed||77,w:1200,h:210,pad:16});
  s.setAttribute('preserveAspectRatio','xMidYMid slice');
  var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){Cloth.paint(s,200);o.disconnect();}});},{threshold:.2});
  o.observe(s);
});
$$('svg[data-cloth="band"]').forEach(function(s){
  Cloth.build(s,{seed:9,w:1200,h:96,pad:0,frame:false,bg:false,rough:false,anim:false,palette:{bg:null,ink:'#F1E8D3',rust:'#C9583A',ochre:'#D4A03A',blue:'#8C9CC8'},rowHs:[28,36,32]});
  s.setAttribute('preserveAspectRatio','xMidYMid slice');
  s.classList.add('painted');
});

/* le tissu du hero : cliquer pour en tisser un autre */
if(heroSvg){
  heroSvg.parentNode.addEventListener('click',function(){
    heroSeed=seedNum();heroBuild(false);
    requestAnimationFrame(function(){requestAnimationFrame(function(){Cloth.paint(heroSvg,10);});});
  });
}

/* ---------- rideau d'entrée ---------- */
function startHero(){
  var h=$('.hero-title');if(h)h.classList.add('go-words');
  $$('.hero .rv').forEach(function(el,i){setTimeout(function(){el.classList.add('in');},250+i*140);});
  if(heroSvg)Cloth.paint(heroSvg,reduce?0:350);
}
var cur=$('.curtain');
if(cur&&root.classList.contains('intro')){
  try{sessionStorage.setItem('ak_intro','1');}catch(e){}
  setTimeout(function(){
    cur.classList.add('lift');
    setTimeout(startHero,350);
    setTimeout(function(){root.classList.remove('intro');},1200);
  },2000);
  setTimeout(function(){root.classList.remove('intro');},4500);
}else{
  startHero();
}

/* ---------- en-tête ---------- */
var hdr=$('.hdr'),lastY=0,secs=$$('section[id]');
var navLinks=$$('.nav a[href^="#"]');
function onScroll(){
  var y=window.scrollY||0;
  if(hdr){
    hdr.classList.toggle('hide',y>lastY&&y>260&&!B.classList.contains('menu-open'));
    var tone='paper';
    $$('section').forEach(function(s){
      var r=s.getBoundingClientRect();
      if(r.top<=40&&r.bottom>40&&(s.classList.contains('ink')||s.classList.contains('indigo')))tone='ink';
    });
    hdr.dataset.tone=tone;
  }
  lastY=y;
  var cur2='';
  secs.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=window.innerHeight*.4&&r.bottom>window.innerHeight*.4)cur2=s.id;});
  navLinks.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+cur2);});
  weave();
}
var mx=0,pending=false;
function weave(){
  if(!heroSvg||reduce)return;
  var sy=Math.min(window.scrollY||0,900)/900;
  $$('g.row',heroSvg).forEach(function(g,i){
    var dir=i%2?1:-1,k=5+(i%4)*3;
    g.style.transform='translateX('+((mx*k+sy*k*3)*dir).toFixed(1)+'px)';
  });
}
window.addEventListener('scroll',function(){if(!pending){pending=true;requestAnimationFrame(function(){pending=false;onScroll();});}},{passive:true});
onScroll();

var hero=$('.hero');
if(hero&&fine&&!reduce){
  var wrap=$('.cloth-wrap');
  hero.addEventListener('pointermove',function(e){
    mx=(e.clientX/window.innerWidth-.5)*2;
    var my=(e.clientY/window.innerHeight-.5)*2;
    if(wrap){wrap.style.setProperty('--rot',(1.4+mx*1.6).toFixed(2)+'deg');wrap.style.setProperty('--ty',(my*-8).toFixed(1)+'px');}
    weave();
  });
}

/* ---------- menu mobile ---------- */
var mb=$('.menu-btn');
if(mb){
  mb.addEventListener('click',function(){B.classList.toggle('menu-open');mb.setAttribute('aria-expanded',B.classList.contains('menu-open'));});
  $$('.mnav a').forEach(function(a){a.addEventListener('click',function(){B.classList.remove('menu-open');});});
}

/* ---------- curseur ---------- */
if(fine&&!reduce){
  var c=D.createElement('div');c.className='cur';c.innerHTML='<span></span>';B.appendChild(c);
  var lab=c.firstChild,x=-100,y=-100,tx=-100,ty=-100,run=false;
  window.addEventListener('pointermove',function(e){
    tx=e.clientX;ty=e.clientY;c.classList.add('on');
    if(!run){run=true;requestAnimationFrame(loop);}
  });
  D.addEventListener('pointerleave',function(){c.classList.remove('on');});
  function loop(){
    x+=(tx-x)*.22;y+=(ty-y)*.22;
    c.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
    if(Math.abs(tx-x)>.2||Math.abs(ty-y)>.2)requestAnimationFrame(loop);else run=false;
  }
  D.addEventListener('pointerover',function(e){
    var t=e.target.closest&&e.target.closest('[data-cur]');
    if(t){lab.textContent=B.classList.contains('en')?(t.dataset.curEn||t.dataset.cur):t.dataset.cur;c.classList.add('big');}
    else c.classList.remove('big');
  });
}

/* ---------- copier ---------- */
$$('.copy').forEach(function(b){
  b.addEventListener('click',function(){
    var v=b.dataset.copy,en=B.classList.contains('en');
    function ok(){b.dataset.done=en?'Copied':'Copié';b.classList.add('ok');setTimeout(function(){b.classList.remove('ok');},1600);}
    try{navigator.clipboard.writeText(v).then(ok,function(){});}catch(e){}
  });
});

/* ---------- voix : titre qui s'allume + forme d'onde peinte ---------- */
var vh=$('.voice h2');
if(vh&&io){
  var vo=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      $$('span.l',vh).forEach(function(s,i){setTimeout(function(){s.classList.add('on');},reduce?0:i*900);});
      vo.disconnect();
    });
  },{threshold:.4});
  vo.observe(vh);
}
var cv=$('.voice canvas');
if(cv&&cv.getContext){
  var ctx=cv.getContext('2d'),dpr=Math.min(window.devicePixelRatio||1,2),W=0,H=0,bars=[],t=reduce?3.2:0,vis=false,raf=0,mpos=-1;
  var R=Cloth.rng(11);
  function size(){
    var r=cv.getBoundingClientRect();W=r.width;H=r.height;
    cv.width=Math.max(1,W*dpr);cv.height=Math.max(1,H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.max(20,Math.floor(W/10));bars=[];
    for(var i=0;i<n;i++)bars.push({j:(R()-.5)*3,p:R()*6.28,k:.55+R()*.6,r:R()});
  }
  function sm(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);}
  function draw(){
    ctx.clearRect(0,0,W,H);
    var n=bars.length,cyc=(t/7)%1;
    var s=sm(.42,.58,cyc>.5?1-Math.abs(cyc-.5)*0+0:cyc);
    // 0..0.5 : la voix parle (gauche) ; 0.5..1 : le téléphone répond (droite)
    var turn=cyc<.5?0:1;
    ctx.lineCap='round';ctx.lineWidth=Math.max(3,W/n*.42);
    for(var i=0;i<n;i++){
      var b=bars[i],pos=i/(n-1);
      var side=pos<.5?0:1,act=side===turn?1:.07;
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
  }
  function tick(){t+=.016;draw();if(vis)raf=requestAnimationFrame(tick);}
  size();draw();
  window.addEventListener('resize',function(){size();draw();});
  cv.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();mpos=(e.clientX-r.left)/r.width;});
  cv.addEventListener('pointerleave',function(){mpos=-1;});
  if('IntersectionObserver' in window&&!reduce){
    new IntersectionObserver(function(es){
      vis=es[0].isIntersecting;cancelAnimationFrame(raf);if(vis)raf=requestAnimationFrame(tick);
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
    setTimeout(function(){location.href=h;},330);
  });
});
window.addEventListener('pageshow',function(){B.classList.remove('leaving');});
var yr=$('[data-year]');if(yr)yr.textContent=new Date().getFullYear();
})();
