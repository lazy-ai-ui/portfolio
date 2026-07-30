(function(){
  var cv=document.getElementById('soonfig');
  if(!cv) return;
  var ctx=cv.getContext('2d');

  function draw(){
    var r=cv.getBoundingClientRect();
    var W=Math.max(1,r.width), H=Math.max(1,r.height);
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.floor(W*dpr); cv.height=Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);

    var unit=Math.max(5,Math.round(W/68));
    var n=Math.round((W*H)/2600);
    for(var i=0;i<n;i++){
      var a=Math.random()*Math.PI*2;
      var rr=Math.pow(Math.random(),0.6);
      var x=W/2+Math.cos(a)*rr*W*0.44;
      var y=H/2+Math.sin(a)*rr*H*0.44;
      var sz=unit*(0.55+Math.random()*0.8);
      var op=0.07+Math.random()*0.13;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(Math.random()*Math.PI);
      ctx.fillStyle='rgba(11,11,12,'+op.toFixed(3)+')';
      ctx.fillRect(-sz/2,-sz/2,sz,sz);
      ctx.restore();
    }
  }

  var t;
  window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(draw,180);});
  draw();
})();
