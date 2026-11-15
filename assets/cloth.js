/* Cloth — tisse un tissu de motifs inspirés du bògòlanfini, tracé trait par trait.
   Chaque tissu est unique : tout part d'une graine. */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg';

function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mk(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function f(n){return Math.round(n*100)/100;}

function ensureDefs(){
  if(document.getElementById('cloth-defs'))return;
  var s=mk('svg',{id:'cloth-defs','aria-hidden':'true',width:'0',height:'0',style:'position:absolute;width:0;height:0;overflow:hidden'});
  var d=mk('defs',{},s);
  var fl=mk('filter',{id:'rough',x:'-4%',y:'-4%',width:'108%',height:'108%'},d);
  mk('feTurbulence',{type:'fractalNoise',baseFrequency:'.035',numOctaves:'3',seed:'3',result:'n'},fl);
  mk('feDisplacementMap',{'in':'SourceGraphic',in2:'n',scale:'3.2',xChannelSelector:'R',yChannelSelector:'G'},fl);
  var g=mk('radialGradient',{id:'stain'},d);
  mk('stop',{offset:'0','stop-color':'#8a5a2b','stop-opacity':'.2'},g);
  mk('stop',{offset:'1','stop-color':'#8a5a2b','stop-opacity':'0'},g);
  document.body.insertBefore(s,document.body.firstChild);
}

var LIGHT={bg:'#F4ECD8',ink:'#1B1510',rust:'#B4492B',ochre:'#D4A03A',blue:'#1E2A47'};
var DARK={bg:null,ink:'#F1E8D3',rust:'#C9583A',ochre:'#D4A03A',blue:'#8C9CC8'};

function build(svg,o){
  ensureDefs();
  o=o||{};
  var W=o.w||400,H=o.h||612,pad=o.pad==null?24:o.pad,pal=o.palette||LIGHT,R=rng(o.seed||1);
  var anim=o.anim!==false;
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.classList.remove('painted');
  svg.classList.toggle('static',!anim);

  var root=mk('g',{},svg);
  if(o.rough!==false)root.setAttribute('filter','url(#rough)');
  if(pal.bg&&o.bg!==false){
    mk('rect',{x:0,y:0,width:W,height:H,fill:pal.bg},root);
    for(var s=0;s<3;s++){
      mk('circle',{cx:f(R()*W),cy:f(R()*H),r:f(Math.max(W,H)*(.2+R()*.25)),fill:'url(#stain)'},root);
    }
  }
  var idx=0,base=0;
  function dl(){return Math.min(base+(idx++)*15,base+640)+'ms';}
  function P(par,d,col,sw){var e=mk('path',{d:d,pathLength:'1',fill:'none',stroke:col,'stroke-width':sw,'stroke-linecap':'round','stroke-linejoin':'round','class':'p'},par);e.style.setProperty('--d',dl());return e;}
  function F(par,d,col){var e=mk('path',{d:d,fill:col,stroke:'none','class':'f'},par);e.style.setProperty('--d',dl());return e;}
  function D(par,cx,cy,r,col){var e=mk('circle',{cx:f(cx),cy:f(cy),r:f(r),fill:col,'class':'f'},par);e.style.setProperty('--d',dl());return e;}
  function pick(a){return a[Math.floor(R()*a.length)];}
  function colr(){var v=R();return v<.62?pal.ink:v<.88?pal.rust:pal.blue;}

  /* ---- cadre ---- */
  if(o.frame!==false&&pad>0){
    var g0=mk('g',{},root);
    base=0;idx=0;
    var a=pad*.36,b=pad*.62;
    P(g0,'M'+a+' '+a+'H'+(W-a)+'V'+(H-a)+'H'+a+'Z',pal.ink,1.7);
    P(g0,'M'+b+' '+b+'H'+(W-b)+'V'+(H-b)+'H'+b+'Z',pal.ink,.8);
  }

  /* ---- motifs ---- */
  var M={
    zigzag:function(g,x,y,w,h,c,ac){
      var u=h*.62,n=Math.max(2,Math.round(w/u));u=w/n;
      var d='M'+f(x)+' '+f(y+h);
      for(var i=0;i<n;i++)d+='L'+f(x+u*(i+.5))+' '+f(y)+'L'+f(x+u*(i+1))+' '+f(y+h);
      P(g,d,c,2.2);
      var d2='M'+f(x)+' '+f(y+h*.55);
      for(i=0;i<n;i++)d2+='L'+f(x+u*(i+.5))+' '+f(y-h*.2+h*.0)+'L'+f(x+u*(i+1))+' '+f(y+h*.55);
      P(g,d2,ac,1);
    },
    diamonds:function(g,x,y,w,h,c,ac){
      var u=h*.95,n=Math.max(2,Math.round(w/u));u=w/n;
      var solid=R()<.5;
      for(var i=0;i<n;i++){
        var cx=x+u*(i+.5);
        P(g,'M'+f(cx)+' '+f(y)+'L'+f(cx+u*.46)+' '+f(y+h/2)+'L'+f(cx)+' '+f(y+h)+'L'+f(cx-u*.46)+' '+f(y+h/2)+'Z',c,1.9);
        if(solid||i%2){var q=.2;F(g,'M'+f(cx)+' '+f(y+h*(.5-q))+'L'+f(cx+u*q)+' '+f(y+h/2)+'L'+f(cx)+' '+f(y+h*(.5+q))+'L'+f(cx-u*q)+' '+f(y+h/2)+'Z',ac);}
      }
    },
    crosses:function(g,x,y,w,h,c,ac){
      var s=h*.34,step=h*1.1,n=Math.max(2,Math.floor(w/step));step=w/n;
      var d='';
      for(var i=0;i<n;i++){
        var cx=x+step*(i+.5),cy=y+h/2;
        d+='M'+f(cx-s)+' '+f(cy)+'L'+f(cx+s)+' '+f(cy)+'M'+f(cx)+' '+f(cy-s)+'L'+f(cx)+' '+f(cy+s);
        if(i<n-1)D(g,cx+step/2,cy,1.9,ac);
      }
      P(g,d,c,2);
    },
    dots:function(g,x,y,w,h,c,ac){
      var r=Math.max(2,h*.15),step=r*3.4,n=Math.max(3,Math.floor(w/step));step=w/n;
      var rows=h>38?2:1;
      for(var k=0;k<rows;k++)for(var i=0;i<n;i++){
        var off=k%2?step/2:0,cx=x+step*(i+.5)+off*(rows>1?.5:0);
        if(cx>x+w-r)continue;
        D(g,cx,y+(rows===1?h/2:h*(.25+.5*k)),r,(i+k)%3===2?ac:c);
      }
    },
    chevrons:function(g,x,y,w,h,c,ac){
      var u=h*.9,n=Math.max(2,Math.round(w/u));u=w/n;
      var rows=h>34?3:2,rh=h/rows;
      for(var k=0;k<rows;k++){
        var yy=y+k*rh,d='M'+f(x)+' '+f(yy);
        for(var i=0;i<n;i++)d+='L'+f(x+u*(i+.5))+' '+f(yy+rh*.8)+'L'+f(x+u*(i+1))+' '+f(yy);
        P(g,d,k===1?ac:c,k===1?1.4:2);
      }
    },
    bars:function(g,x,y,w,h,c,ac){
      var step=Math.max(5,h*.26),n=Math.floor(w/step);step=w/n;
      var d='',d2='';
      for(var i=0;i<n;i++){
        var cx=x+step*(i+.5),ht=h*(.32+R()*.68);
        var seg='M'+f(cx)+' '+f(y+h)+'L'+f(cx)+' '+f(y+h-ht);
        if(i%5===3)d2+=seg;else d+=seg;
      }
      P(g,d,c,2.6);if(d2)P(g,d2,ac,2.6);
    },
    saw:function(g,x,y,w,h,c,ac){
      var u=h*.9,n=Math.max(2,Math.round(w/u));u=w/n;
      var d='',d2='';
      for(var i=0;i<n;i++){
        var tri='M'+f(x+u*i)+' '+f(y+h)+'L'+f(x+u*(i+.5))+' '+f(y)+'L'+f(x+u*(i+1))+' '+f(y+h)+'Z';
        if(i%4===2)d2+=tri;else d+=tri;
      }
      F(g,d,c);if(d2)F(g,d2,ac);
    },
    waves:function(g,x,y,w,h,c,ac){
      var u=h*.9,n=Math.max(2,Math.round(w/u));u=w/n;
      for(var k=0;k<2;k++){
        var yy=y+h*(k?.62:.32),a=h*.22,d='M'+f(x)+' '+f(yy);
        for(var i=0;i<n;i++){
          var sgn=(i+k)%2?1:-1;
          d+='Q'+f(x+u*(i+.5))+' '+f(yy+sgn*a*2)+' '+f(x+u*(i+1))+' '+f(yy);
        }
        P(g,d,k?ac:c,k?1.4:2.1);
      }
    }
  };
  var names=['zigzag','diamonds','crosses','dots','chevrons','bars','saw','waves'];

  var x0=pad,x1=W-pad,y=pad,end=H-pad,i=0,last='';
  var hs=o.rowHs?o.rowHs.slice():null;
  var sizes=[24,30,38,48,60];
  while(y<end-1){
    var rh=hs?(hs[i]||hs[hs.length-1]):pick(sizes);
    if(end-y-rh<20)rh=end-y;
    var nm;do{nm=pick(names);}while(nm===last);last=nm;
    base=i*95;idx=0;
    var g=mk('g',{'class':'row','data-i':i},root);
    var mh=rh*.66,my=y+(rh-mh)/2;
    var col=colr(),acc=col===pal.rust?pal.ochre:(R()<.55?pal.rust:pal.ochre);
    M[nm](g,x0+4,my,x1-x0-8,mh,col,acc);
    y+=rh;
    if(y<end-1){
      var yy=f(y);
      P(g,'M'+x0+' '+yy+'H'+x1,pal.ink,.9);
      if(i%3===1)P(g,'M'+x0+' '+f(y+3.5)+'H'+x1,pal.ink,.9);
    }
    i++;
  }
  svg.__cloth=o;
  return svg;
}

function paint(svg,delay){
  if(svg.classList.contains('static')){svg.classList.add('painted');return;}
  setTimeout(function(){svg.classList.add('painted');},delay||30);
}

window.Cloth={build:build,paint:paint,rng:rng};
})();
