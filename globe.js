(function(){
var host=document.getElementById('globalGlobe');if(!host||!window.THREE)return;
var T=THREE,renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.appendChild(renderer.domElement);
var scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,100);camera.position.z=4.05;
function dotTexture(){var c=document.createElement('canvas');c.width=c.height=64;var ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
var dots=dotTexture(),world=new T.Group();world.rotation.set(.18,-.48,-.1);scene.add(world);
// A shaded inner globe stays below the raised geographic point shell.
var globeBodyMaterial=new T.ShaderMaterial({transparent:true,depthWrite:true,vertexShader:'varying vec3 globeNormal;varying vec3 globeView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);globeNormal=normalize(normalMatrix*normal);globeView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 globeNormal;varying vec3 globeView;void main(){vec3 n=normalize(globeNormal);float facing=max(0.,dot(n,normalize(globeView)));float rim=pow(1.-facing,1.55);vec3 navy=vec3(.025,.11,.31);vec3 gold=mix(vec3(.97255,.76863,.32549),vec3(.78824,.5451,.16471),smoothstep(-.7,.7,n.x));vec3 tint=mix(navy,gold,smoothstep(.12,.8,n.y));float strength=mix(1.8,1.1,smoothstep(.1,.8,n.y));vec3 shade=vec3(.035294,.141176,.282353)+tint*rim*strength;float silhouette=smoothstep(0.,.18,facing);gl_FragColor=vec4(shade,silhouette);}'});
world.add(new T.Mesh(new T.SphereGeometry(.99,128,96),globeBodyMaterial));
function point(lon,lat,r){var p=lat*Math.PI/180,l=lon*Math.PI/180;return new T.Vector3(Math.cos(p)*Math.sin(l)*r,Math.sin(p)*r,Math.cos(p)*Math.cos(l)*r);}
function geographicDots(geometry,opacity,pixelSize){
  return new T.Points(geometry,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:opacity},pixelSize:{value:pixelSize*Math.min(devicePixelRatio,2)}},vertexShader:'uniform float pixelSize; varying float facing; void main(){vec4 p=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normalize(position)); facing=max(0.,dot(n,normalize(-p.xyz)));gl_Position=projectionMatrix*p;gl_PointSize=pixelSize*mix(.7,1.,smoothstep(0.,.3,facing));}',fragmentShader:'uniform float opacity;varying float facing;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5||facing<.015)discard;float a=(1.-smoothstep(.25,.5,d))*opacity;gl_FragColor=vec4(vec3(1.),a);}'}));
}
fetch('globe-land-detail.json').then(function(r){return r.json();}).then(function(data){
  var mask=document.createElement('canvas');mask.width=4096;mask.height=2048;
  var ctx=mask.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';
  data.features.forEach(function(feature){
    var polys=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[feature.geometry.coordinates];
    polys.forEach(function(poly){ctx.beginPath();poly.forEach(function(ring){ring.forEach(function(p,i){var x=(p[0]+180)/360*4096,y=(90-p[1])/180*2048;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();});ctx.fill('evenodd');});
  });
  var pixels=ctx.getImageData(0,0,4096,2048).data,positions=[];
  // Equal-area sampling removes the old latitude bands and preserves fine coastlines.
  var count=135000,golden=Math.PI*(3-Math.sqrt(5));
  for(var i=0;i<count;i++){
    var y=1-2*(i+.5)/count,lat=Math.asin(y)*180/Math.PI,lon=((i*golden*180/Math.PI)%360)-180;
    var px=Math.min(4095,Math.floor((lon+180)/360*4096)),py=Math.min(2047,Math.floor((90-lat)/180*2048));
    if(pixels[(py*4096+px)*4+3]>120){var v=point(lon,lat,1.014);positions.push(v.x,v.y,v.z);}
  }
  var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  world.add(geographicDots(geo,.78,1.3));
  // Separate bright coastline layer, matching the reference's edge/fill treatment.
  var edges=[];
  data.features.forEach(function(feature){
    var polys=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[feature.geometry.coordinates];
    polys.forEach(function(poly){poly.forEach(function(ring){
      var lastEdge=null;for(var j=1;j<ring.length;j++){
        var a=point(ring[j-1][0],ring[j-1][1],1.015),b=point(ring[j][0],ring[j][1],1.015);
        var steps=Math.max(1,Math.ceil(a.angleTo(b)/.008));
        for(var k=0;k<steps;k++){var v=a.clone().lerp(b,k/steps).normalize().multiplyScalar(1.015);if(!lastEdge||lastEdge.distanceTo(v)>.014){edges.push(v.x,v.y,v.z);lastEdge=v;}}
      }
    });});
  });
  var edgeGeo=new T.BufferGeometry();edgeGeo.setAttribute('position',new T.Float32BufferAttribute(edges,3));
  world.add(geographicDots(edgeGeo,.95,1.4));
  host.dataset.ready='true';host.dataset.landDots=String(positions.length/3);host.dataset.coastDots=String(edges.length/3);
});
// Composite the atmosphere separately from WebGL so transparent-canvas alpha
// cannot turn its faint outer falloff into a visible circular shell.
var halo=document.createElement('div');
halo.setAttribute('aria-hidden','true');halo.className='globe-atmosphere';
halo.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0;background:linear-gradient(180deg,#C99635 3%,#c9a356 25%,#0B2C5B 68%,#0B2C5B 100%);filter:blur(12px);opacity:.6;';
var haloMask='radial-gradient(circle closest-side,transparent 62%,rgba(0,0,0,.12) 70%,rgba(0,0,0,.75) 78%,rgba(0,0,0,.35) 84%,rgba(0,0,0,.08) 92%,transparent 100%)';
halo.style.maskImage=haloMask;halo.style.webkitMaskImage=haloMask;
host.insertBefore(halo,renderer.domElement);
renderer.domElement.style.position='relative';renderer.domElement.style.zIndex='1';
var stars=[];for(var i=0;i<1800;i++)stars.push((Math.random()-.5)*15,(Math.random()-.5)*12,-3-Math.random()*4);var starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0xc6b59b,size:.018,map:dots,transparent:true,opacity:.42,depthWrite:false})));
// Direct drag with pointer capture and inertial rotation, matching the reference interaction.
var dragState={active:false,id:null,x:0,y:0,vx:0,vy:0,lastInput:0};
var surface=renderer.domElement;surface.style.touchAction='none';surface.style.cursor='grab';
surface.setAttribute('aria-label','Interactive globe. Drag to rotate.');surface.tabIndex=0;
surface.addEventListener('pointerdown',function(e){if(e.button!==0&&e.pointerType==='mouse')return;dragState.active=true;dragState.id=e.pointerId;dragState.x=e.clientX;dragState.y=e.clientY;dragState.vx=dragState.vy=0;dragState.lastInput=performance.now();surface.setPointerCapture(e.pointerId);surface.style.cursor='grabbing';e.preventDefault();});
surface.addEventListener('pointermove',function(e){if(!dragState.active||e.pointerId!==dragState.id)return;var dx=e.clientX-dragState.x,dy=e.clientY-dragState.y;dragState.vx=dx*.005;dragState.vy=dy*.004;world.rotation.y+=dragState.vx;world.rotation.x=Math.max(-1.1,Math.min(1.1,world.rotation.x+dragState.vy));dragState.x=e.clientX;dragState.y=e.clientY;dragState.lastInput=performance.now();e.preventDefault();});
function endDrag(e){if(!dragState.active)return;dragState.active=false;dragState.lastInput=performance.now();surface.style.cursor='grab';if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);}
surface.addEventListener('pointerup',endDrag);surface.addEventListener('pointercancel',endDrag);surface.addEventListener('lostpointercapture',function(){dragState.active=false;surface.style.cursor='grab';});
surface.addEventListener('keydown',function(e){var moves={ArrowLeft:-.12,ArrowRight:.12};if(e.key in moves){world.rotation.y+=moves[e.key];e.preventDefault();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){world.rotation.x+=e.key==='ArrowUp'?-.08:.08;e.preventDefault();}dragState.lastInput=performance.now();});
window.enecoGlobeDiagnostics=function(){return {rotationX:world.rotation.x,rotationY:world.rotation.y,dragging:dragState.active};};
var regionGlobe=host.hasAttribute('data-region-globe');
var regions={
  'Middle East':{center:[46,27],labels:['UAE · BASE','QATAR','SAUDI ARABIA','TURKEY']},
  Asia:{center:[112,34],labels:['JAPAN']},
  Africa:{center:[27,3],labels:['EGYPT','KENYA','SOUTH AFRICA']},
  Europe:{center:[9,48],labels:['UK','GERMANY','SPAIN','ITALY']},
  'Other regions':{center:[-82,16],labels:[]}
};
var selectedRegion=null, focus=null, markers=[];
function selectRegion(name){
  selectedRegion=regions[name];
  if(!selectedRegion)return;
  var radians=Math.PI/180;
  var target=-selectedRegion.center[0]*radians;
  var delta=target-world.rotation.y;
  focus={x:selectedRegion.center[1]*radians,y:world.rotation.y+Math.atan2(Math.sin(delta),Math.cos(delta))};
  dragState.vx=dragState.vy=0;
  markers.forEach(function(marker){
    var shown=selectedRegion.labels.includes(marker.label);
    marker.mesh.visible=marker.glow.visible=shown;
  });
}
var routes=[],pins=[],base=point(54.37,24.45,1.03);
function pin(position,label){var mesh=new T.Mesh(new T.SphereGeometry(.0065,10,8),new T.MeshBasicMaterial({color:0xc99635}));mesh.position.copy(position);world.add(mesh);var glow=new T.Sprite(new T.SpriteMaterial({map:dots,color:0xc99635,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.set(.037,.037,1);glow.position.copy(position);world.add(glow);markers.push({mesh:mesh,glow:glow,label:label});if(label&&!host.hasAttribute('data-hide-globe-labels')){var element=document.createElement('span');element.className='globe-location-label';element.hidden=true;element.style.position='absolute';element.style.zIndex='2';element.textContent=label;host.appendChild(element);pins.push({position:position,element:element,label:label});}}
pin(base,'UAE · BASE');
[[-2,54,'UK'],[10,51,'GERMANY'],[-4,40,'SPAIN'],[12.5,42,'ITALY'],[35,39,'TURKEY'],[30,27,'EGYPT'],[51,25,'QATAR'],[45,24,'SAUDI ARABIA'],[38,0,'KENYA'],[25,-29,'SOUTH AFRICA'],[138,37,'JAPAN']].forEach(function(location){pin(point(location[0],location[1],1.03),location[2]);});
// Each connection draws, briefly connects, and clears before its next journey.
// Route endpoints and travelling heads deliberately have no additional pin meshes.
var endpoints=[[-2,54,'UK'],[138,37,'JAPAN'],[25,-29,'SOUTH AFRICA'],[38,0,'KENYA'],[-4,40,'SPAIN']];
if(regionGlobe)endpoints.push([51,25,'QATAR'],[45,24,'SAUDI ARABIA'],[35,39,'TURKEY']);
endpoints.forEach(function(end,index){
  var target=point(end[0],end[1],1.03),angle=base.angleTo(target),curve=new T.Curve();
  curve.getPoint=function(t,out){var v=base.clone().multiplyScalar(Math.sin((1-t)*angle)).addScaledVector(target,Math.sin(t*angle)).normalize().multiplyScalar(1.03+Math.sin(t*Math.PI)*.13);return(out||new T.Vector3()).copy(v);};
  var geometry=new T.TubeGeometry(curve,160,.0011,4,false);
  geometry.setDrawRange(0,0);
  var arc=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xc99635,transparent:true,opacity:.9,depthWrite:false}));
  world.add(arc);
  routes.push({arc:arc,label:end[2],phase:index*1.13,segments:160,indicesPerSegment:24});
});
if(regionGlobe){
  document.querySelectorAll('.markets-region-tabs [data-region]').forEach(function(tab){
    tab.addEventListener('click',function(){selectRegion(tab.dataset.region)});
  });
  var activeRegion=document.querySelector('.markets-region-tabs .is-active');
  if(activeRegion)selectRegion(activeRegion.dataset.region);
  surface.addEventListener('pointerdown',function(){focus=null});
  surface.addEventListener('keydown',function(event){if(event.key.startsWith('Arrow'))focus=null});
}
function updateRoutes(elapsed,reducedMotion){
  routes.forEach(function(r){
    var phase=(elapsed+r.phase)%6.8;
    var head=Math.min(1,phase/2.3);
    var tail=Math.max(0,Math.min(1,(phase-2.6)/2));
    var start=Math.floor(tail*r.segments),end=Math.ceil(head*r.segments);
    r.arc.visible=!reducedMotion&&end>start&&(!selectedRegion||selectedRegion.labels.includes(r.label));
    r.arc.geometry.setDrawRange(start*r.indicesPerSegment,Math.max(0,end-start)*r.indicesPerSegment);
    r.arc.material.opacity=.9*(1-Math.max(0,Math.min(1,(phase-4.2)/.4)));
  });
}
function resize(){// Use layout dimensions: the host CSS transform already scales both canvas and halo.
var r={width:host.clientWidth,height:host.clientHeight};if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;var fitAspect=Math.min(1,camera.aspect);
var fitTangent=Math.tan(camera.fov*Math.PI/360);
camera.position.z=Math.sqrt(1+Math.pow(1.12/(fitTangent*fitAspect*.94),2));camera.updateProjectionMatrix();var projectedRadius=.99/(fitTangent*Math.sqrt(camera.position.z*camera.position.z-.9801));var haloDiameter=r.height*projectedRadius*1.25;halo.style.width=halo.style.height=haloDiameter+'px';}new ResizeObserver(resize).observe(host);resize();
var visible=false;new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;}).observe(host);var reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,last=0,time=0;
function frame(now){requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000);last=now;if(!visible)return;if(!reduced){time+=dt;if(!dragState.active){world.rotation.y+=dragState.vx;world.rotation.x=Math.max(-1.1,Math.min(1.1,world.rotation.x+dragState.vy));var damping=Math.pow(.9,dt*60);dragState.vx*=damping;dragState.vy*=damping;if(!selectedRegion&&now-dragState.lastInput>3500)world.rotation.y+=dt*.04;}}if(focus){var blend=reduced?1:1-Math.exp(-dt*7);world.rotation.x+=(focus.x-world.rotation.x)*blend;world.rotation.y+=(focus.y-world.rotation.y)*blend;world.rotation.z*=1-blend;}updateRoutes(time,reduced);world.updateMatrixWorld();var occupied=[];
pins.forEach(function(pin){
  if(selectedRegion&&!selectedRegion.labels.includes(pin.label)){pin.element.hidden=true;return;}
  var worldPoint=world.localToWorld(pin.position.clone()),front=worldPoint.z>.25;
  var v=worldPoint.clone().project(camera);
  if(!front||Math.abs(v.x)>.91||Math.abs(v.y)>.91){pin.element.hidden=true;return;}
  pin.element.hidden=false;
  var width=pin.element.offsetWidth||70,height=pin.element.offsetHeight||24;
  var x=(v.x+1)*host.clientWidth/2,y=(1-v.y)*host.clientHeight/2-16;
  x=Math.max(width/2+6,Math.min(host.clientWidth-width/2-6,x));
  var tries=0;
  // Keep every configured location visible. The previous two-attempt limit
  // hid valid labels (notably Germany, Saudi Arabia and Japan) whenever a
  // nearby label occupied their first two slots.
  while(occupied.some(function(r){return Math.abs(x-r.x)<(width+r.w)/2+5&&Math.abs(y-r.y)<height+5;})&&tries<8){
    y-=height+7;tries++;
  }
  // Clamp labels into the host instead of dropping them when the globe edge
  // or another label pushes them slightly outside the preferred position.
  y=Math.max(height+4,Math.min(host.clientHeight-4,y));
  occupied.push({x:x,y:y,w:width});
  pin.element.style.left=x+'px';pin.element.style.top=y+'px';
});renderer.render(scene,camera);}requestAnimationFrame(frame);
})();
