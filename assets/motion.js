/* =========================================================
   MOTION — système de mouvement
   Une seule boucle d'animation (ticker) pilote tous les modules.
   01 Progression      06 Bandeau défilant     10 Impulsion d'architecture
   02 Séparateurs      07 Inertie du scroll    11 Compteur du tissu
   03 Pipeline vocal   08 Parallaxe
   04 Frise parcours   09 Cascades
   05 Magnétisme
   Tout est coupé ou figé si prefers-reduced-motion est actif.
   ========================================================= */
(function(){
'use strict';
var D=document,B=D.body;
var reduce=false,fine=false;
try{reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(e){}
try{fine=matchMedia('(hover:hover) and (pointer:fine)').matches;}catch(e){}
function $(s,c){return (c||D).querySelector(s);}
function $$(s,c){return Array.prototype.slice.call((c||D).querySelectorAll(s));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function ease(t){return t*t*(3-2*t);}
function visible(el,cb,opts){
  if(!('IntersectionObserver' in window)){cb(true);return;}
  new IntersectionObserver(function(es){cb(es[0].isIntersecting);},opts||{threshold:.12}).observe(el);
}

/* ---------- boucle centrale ---------- */
var tickers=[],lastT=performance.now(),lastY=window.scrollY||0,vel=0;
function ticker(fn){tickers.push(fn);}
function loop(now){
  var dt=Math.min(.05,(now-lastT)/1000||.016);lastT=now;
  var y=window.scrollY||0,v=(y-lastY)/Math.max(dt,.001);lastY=y;
  vel+=(v-vel)*.12;
  for(var i=0;i<tickers.length;i++)tickers[i](dt,now,vel);
  requestAnimationFrame(loop);
}

/* ---------- 01 · progression de lecture ---------- */
(function(){
  var bar=D.createElement('div');bar.className='prog';bar.setAttribute('aria-hidden','true');B.appendChild(bar);
  function upd(){
    var h=D.documentElement.scrollHeight-window.innerHeight;
    bar.style.width=(h>0?clamp((window.scrollY||0)/h,0,1)*100:0)+'%';
  }
  window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();
})();

/* ---------- 02 · séparateurs tissés ---------- */
$$('svg[data-cloth="strip"]').forEach(function(s,i){
  if(!window.Cloth)return;
  Cloth.build(s,{seed:+s.dataset.seed||(21+i*7),w:1200,h:44,pad:0,frame:false,bg:false,rowHs:[24,20]});
  s.setAttribute('preserveAspectRatio','xMidYMid slice');
  if(reduce){s.classList.add('static','painted');return;}
  var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){Cloth.paint(s,120);o.disconnect();}});},{threshold:.5});
  o.observe(s);
});

/* ---------- 03 · pipeline vocal ---------- */
(function(){
  var pipe=$('.pipe-track');if(!pipe)return;
  var sts=$$('.st',pipe),pulse=$('.pulse',pipe),outs=$$('.outs li',pipe);
  var centers=[],t=0,vis=false,loopN=0,prevU=0;
  function measure(){
    var tr=pipe.getBoundingClientRect(),mobile=false;
    try{mobile=matchMedia('(max-width:760px)').matches;}catch(e){}
    centers=sts.map(function(s){
      var r=s.getBoundingClientRect();
      return mobile?{x:7.5,y:r.top-tr.top+10}:{x:r.left-tr.left+r.width/2,y:7.5};
    });
  }
  function place(p){
    if(!centers.length)return;
    var n=centers.length-1,f=p*n,i=Math.min(n-1,Math.floor(f)),k=f-i;
    var a=centers[i],b=centers[i+1];
    var x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k;
    pulse.style.transform='translate('+(x-7.5).toFixed(1)+'px,'+(y-7.5).toFixed(1)+'px)';
    sts.forEach(function(s,j){s.classList.toggle('lit',f>=j-.001);});
  }
  function pickOut(n){outs.forEach(function(o,j){o.classList.toggle('on',j===n%outs.length);});}
  measure();pickOut(0);
  window.addEventListener('resize',function(){measure();});
  if(D.fonts&&D.fonts.ready)D.fonts.ready.then(function(){measure();});
  if(reduce){place(1);return;}
  place(0);
  visible(pipe,function(v){vis=v;if(v)measure();},{threshold:.25});
  ticker(function(dt){
    if(!vis)return;
    t+=dt;var cyc=8,u=(t%cyc)/cyc;
    if(u<prevU){loopN++;pickOut(loopN);}
    prevU=u;
    var p=u<.08?0:u>.86?1:ease((u-.08)/.78);
    place(p);
  });
})();

/* ---------- 04 · frise du parcours ---------- */
(function(){
  var box=$('.steps');if(!box)return;
  var steps=$$('.step',box);
  function upd(){
    var vh=window.innerHeight,r=box.getBoundingClientRect(),mark=vh*.62;
    box.style.setProperty('--p',clamp((mark-r.top)/r.height,0,1).toFixed(3));
    steps.forEach(function(s){
      var sr=s.getBoundingClientRect();
      s.classList.toggle('act',reduce||sr.top+48<mark);
    });
  }
  window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();
})();

/* ---------- 05 · magnétisme ---------- */
if(fine&&!reduce){
  $$('.btn,.brand').forEach(function(el){
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
      el.style.transform='translate('+clamp(dx*.18,-10,10).toFixed(1)+'px,'+clamp(dy*.3,-8,8).toFixed(1)+'px)';
    });
    el.addEventListener('pointerleave',function(){el.style.transform='';});
  });
}

/* ---------- 06 · bandeau défilant ---------- */
(function(){
  var m=$('.marq');if(!m)return;
  var inn=$('.marq-in',m),set=$('.marq-set',inn);if(!set)return;
  var w=0,x=0,vis=false;
  function fill(){
    $$('.marq-set',inn).slice(1).forEach(function(c){inn.removeChild(c);});
    w=set.getBoundingClientRect().width;if(!w)return;
    var n=Math.ceil(window.innerWidth*2/w)+1;
    for(var i=0;i<n;i++){var c=set.cloneNode(true);c.setAttribute('aria-hidden','true');inn.appendChild(c);}
  }
  fill();window.addEventListener('resize',fill);
  if(D.fonts&&D.fonts.ready)D.fonts.ready.then(fill);
  if(reduce)return;
  visible(m,function(v){vis=v;},{threshold:0});
  ticker(function(dt,now,v){
    if(!vis||!w)return;
    x-=(46+v*.16)*dt;
    if(x<=-w)x+=w;if(x>0)x-=w;
    inn.style.transform='translateX('+x.toFixed(1)+'px)';
  });
})();

/* ---------- 07 · inertie du défilement (les titres s'inclinent) ---------- */
(function(){
  if(reduce)return;
  var els=$$('.sec-head h2,.contact h2,.voice h2,.case-hero h1');if(!els.length)return;
  var sk=0;
  ticker(function(dt,now,v){
    var target=clamp(v/520,-2.4,2.4);
    sk+=(target-sk)*.14;
    var val=Math.abs(sk)<.02?'':'skewY('+sk.toFixed(2)+'deg)';
    els.forEach(function(el){el.style.transform=val;});
  });
})();

/* ---------- 08 · parallaxe ---------- */
(function(){
  if(reduce)return;
  var els=$$('.banner-in');if(!els.length)return;
  ticker(function(){
    var vh=window.innerHeight;
    els.forEach(function(box){
      var r=box.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;
      var d=(r.top+r.height/2-vh/2)/vh;
      var s=$('svg',box);if(s)s.style.setProperty('--py',(d*-22).toFixed(1)+'px');
    });
  });
})();

/* ---------- 09 · cascades ---------- */
(function(){
  var groups=[['.cs ol','> li'],['.items','> span'],['.cs .tags','> span'],['.voice-copy .tags','> span'],['.case-meta','> div'],['.reach','> div']];
  var triggers=[];
  groups.forEach(function(g){
    $$(g[0]).forEach(function(c){
      var tag=g[1].replace('>','').trim().toLowerCase();
      var kids=Array.prototype.filter.call(c.children,function(k){return k.tagName.toLowerCase()===tag;});
      kids.forEach(function(k,i){k.classList.add('stg');k.style.setProperty('--k',i);});
      var t=c.closest('.rv')||c;if(triggers.indexOf(t)<0)triggers.push(t);
    });
  });
  if(!('IntersectionObserver' in window)||reduce){triggers.forEach(function(t){t.classList.add('in','done');});return;}
  var o=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      e.target.classList.add('in');o.unobserve(e.target);
      setTimeout(function(){e.target.classList.add('done');},2600);
    });
  },{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  triggers.forEach(function(t){o.observe(t);});
})();

/* ---------- 10 · impulsion d'architecture ---------- */
$$('.flow').forEach(function(fl){
  var parts=Array.prototype.slice.call(fl.children);
  if(reduce){parts.forEach(function(p){p.classList.add('lit');});return;}
  var vis=false,i=0,timer=0;
  function step(){
    if(!vis)return;
    if(i<parts.length){parts[i].classList.add('lit');i++;timer=setTimeout(step,i%2?260:420);}
    else{timer=setTimeout(function(){parts.forEach(function(p){p.classList.remove('lit');});i=0;timer=setTimeout(step,500);},1700);}
  }
  visible(fl,function(v){
    vis=v;clearTimeout(timer);
    if(v)timer=setTimeout(step,700);
  },{threshold:.5});
});

/* ---------- 11 · compteur du tissu (N° de la graine) ---------- */
(function(){
  var out=$('[data-seed-no]');if(!out)return;
  var raf=0;
  function roll(target){
    var s=String(target),start=performance.now(),dur=1000;
    cancelAnimationFrame(raf);
    if(reduce){out.textContent=s;return;}
    (function f(now){
      var k=clamp((now-start)/dur,0,1),txt='';
      for(var i=0;i<s.length;i++)txt+=k>(i+1)/(s.length+1)?s.charAt(i):Math.floor(Math.random()*10);
      out.textContent=txt;
      if(k<1)raf=requestAnimationFrame(f);else out.textContent=s;
    })(start);
  }
  D.addEventListener('cloth:seed',function(e){roll(e.detail);});
  var wrap=$('.cloth-wrap');
  if(wrap&&out.dataset.value){
    if(wrap.classList.contains('in'))roll(out.dataset.value);
    else new MutationObserver(function(m,ob){if(wrap.classList.contains('in')){ob.disconnect();roll(out.dataset.value);}}).observe(wrap,{attributes:true,attributeFilter:['class']});
  }
})();

if(!reduce)requestAnimationFrame(loop);
})();
