// Staged full-detail flagship encounter; never runs the public WIZZ assistant.
(() => {
 const host=document.getElementById('landingBattle'),button=document.getElementById('battlePause'),launch=document.getElementById('battleLaunch');if(!host||!button||!launch)return;
 const status=host.querySelector('.battleStatus'),quiet=matchMedia('(prefers-reduced-motion: reduce)');
 const media='https://media.w-i-z-z-lab-studios.com/space-junkz/runtime-8f845ed2c178/';
 let started=false,visible=false,paused=quiet.matches,frame=0,last=0,time=0,ready=false,renderer;
 button.hidden=true;
 const label=()=>{button.textContent=paused?'Play scene':'Pause scene';button.setAttribute('aria-pressed',String(paused));};label();
 function mount(){
  if(started)return;started=true;launch.disabled=true;launch.textContent='Preparing the fleet…';
  if(!window.THREE?.GLTFLoader){status.textContent='3D preview unavailable';launch.hidden=true;return;}
  const T=window.THREE,scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,240);
  const focus=new T.Vector3(0,0,-1),axis=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1);
  try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});}catch{status.textContent='3D preview unavailable';launch.hidden=true;return;}
  renderer.setClearColor(0x02050c);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  scene.add(new T.HemisphereLight(0xd0eaff,0x0d101c,1.6));
  const panels=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#71869b');g.addColorStop(.5,'#263345');g.addColorStop(1,'#0a101b');x.fillStyle=g;x.fillRect(0,0,128,128);if(i<4){x.fillStyle='#c4d5df';x.fillRect(18,10,70,24);}return c;});const reflections=new T.CubeTexture(panels);reflections.encoding=T.sRGBEncoding;reflections.needsUpdate=true;scene.environment=reflections;
  const key=new T.DirectionalLight(0xffe6cc,3.2);key.position.set(-6,12,10);scene.add(key);
  const rim=new T.DirectionalLight(0x48cfff,1.7);rim.position.set(7,3,-10);scene.add(rim);
  const titan=new T.Group(),boss=new T.Group(),planet=new T.Group(),wings=[new T.Group(),new T.Group()];scene.add(titan,boss,planet,...wings);
  titan.name='Titan Prime';boss.name='Nebula Warship';planet.name='Distant planet';wings.forEach((w,i)=>w.name='X-fighter escort '+(i+1));
  function load(url,root,size,yaw=0){return new Promise((resolve,reject)=>new T.GLTFLoader().load(url,g=>{
   const model=g.scene,box=new T.Box3().setFromObject(model),extent=box.getSize(new T.Vector3());model.position.sub(box.getCenter(new T.Vector3()));
   const wrap=new T.Group();wrap.add(model);wrap.scale.setScalar(size/Math.max(extent.x,extent.y,extent.z));wrap.rotation.y=yaw;root.add(wrap);resolve(wrap);
  },event=>{if(event.total)status.textContent='Loading full-detail fleet · '+Math.round(event.loaded/event.total*100)+'%';},reject));}
  const route=new T.CatmullRomCurve3([[-4,0,4],[-6,.5,1],[-4,1,-2],[-1,.5,-1],[0,0,3],[-2,0,5]].map(p=>new T.Vector3(...p)),true,'catmullrom',.45);
  const enemyRoute=new T.CatmullRomCurve3([[6,1,-4],[7,1,-1],[5,.5,1],[4,.5,-1]].map(p=>new T.Vector3(...p)),true,'catmullrom',.4);
  const pNext=new T.Vector3(),direction=new T.Vector3(),targetDirection=new T.Vector3(),orbitNext=new T.Vector3();
  function pose(){
   const u=(time/35+.35)%1;titan.position.copy(route.getPointAt(u));pNext.copy(route.getPointAt((u+.004)%1));titan.lookAt(pNext);titan.rotateZ(Math.sin(time*.55)*.12);
   boss.position.copy(enemyRoute.getPointAt((time/55+.1)%1));boss.lookAt(titan.position);boss.rotateZ(Math.sin(time*.25)*.045);
   for(let i=0;i<2;i++){const w=wings[i],a=time*.65+i*Math.PI;
    w.position.copy(titan.position).add(new T.Vector3(Math.cos(a)*4.5,.65+Math.sin(a)*.35,Math.sin(a)*3.2));
    orbitNext.copy(pNext).add(new T.Vector3(Math.cos(a+.04)*4.5,.65+Math.sin(a+.04)*.35,Math.sin(a+.04)*3.2));w.lookAt(orbitNext);w.rotateZ(-.25);
   }
   planet.rotation.y=time*.004;planet.rotation.z=.12;
  }
  planet.position.set(-1,-11,-29);
  const atmo=new T.Mesh(new T.SphereGeometry(16.4,40,24),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,blending:T.AdditiveBlending,
   vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
   fragmentShader:'varying vec3 n; varying vec3 v;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),3.5)*.3;gl_FragColor=vec4(.13,.42,.8,a);}'}));atmo.position.copy(planet.position);scene.add(atmo);
  let seed=7;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=new Float32Array(300*3);for(let i=0;i<stars.length;i+=3){stars[i]=(random()-.5)*110;stars[i+1]=(random()-.5)*60;stars[i+2]=-40-random()*45;}
  const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.BufferAttribute(stars,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0xb8ddff,size:.065,transparent:true,opacity:.75,depthWrite:false})));
  const boltGeo=new T.CylinderGeometry(.028,.028,.65,6),haloGeo=new T.CylinderGeometry(.09,.09,.8,6),bolts=[];
  for(let i=0;i<40;i++){const type=i%2,g=new T.Group();g.add(new T.Mesh(boltGeo,new T.MeshBasicMaterial({color:0xfff5d5})),new T.Mesh(haloGeo,new T.MeshBasicMaterial({color:type?0xff4425:0xffc44f,transparent:true,opacity:.26,blending:T.AdditiveBlending,depthWrite:false})));g.visible=false;scene.add(g);bolts.push({group:g,type,age:0,velocity:new T.Vector3(),target:null});}
  const sparkGeo=new T.BufferGeometry(),sparkPositions=new Float32Array(64*3),sparks=Array.from({length:64},()=>({age:0,p:new T.Vector3(),v:new T.Vector3()}));sparkPositions.fill(10000);sparkGeo.setAttribute('position',new T.BufferAttribute(sparkPositions,3));scene.add(new T.Points(sparkGeo,new T.PointsMaterial({color:0xffc767,size:.11,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false})));
  // Four warm plumes behind the flagship, not a separate mock engine model.
  const plumeGeo=new T.ConeGeometry(.1,.9,8),plumeMat=new T.MeshBasicMaterial({color:0xffb14c,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending});
  const flames=[];for(const x of [-.25,.25])for(const y of [-.22,.22]){const flame=new T.Mesh(plumeGeo,plumeMat);flame.rotation.x=-Math.PI/2;flame.position.set(x,y,-1.45);titan.add(flame);flames.push(flame);}
  let nextShot=0,cursor=0;
  function fire(source,target,type,force=false){
   direction.copy(forward).applyQuaternion(source.quaternion);targetDirection.copy(target.position).sub(source.position).normalize();
   if(!force&&direction.dot(targetDirection)<.55)return;
   const b=bolts.find(b=>b.type===type&&b.age<=0);if(!b)return;b.group.position.copy(source.position).addScaledVector(direction,source===titan?1.4:.6);
   b.velocity.copy(target.position).sub(b.group.position).normalize().multiplyScalar(type?9:15);b.group.quaternion.setFromUnitVectors(axis,b.velocity.clone().normalize());b.target=target;b.age=2;b.group.visible=true;
  }
  function burst(position){for(let i=0;i<10;i++){const s=sparks[cursor++%sparks.length];s.age=.4;s.p.copy(position);s.v.set((random()-.5)*3,(random()-.5)*3,(random()-.5)*3);}}
  function draw(now=0){frame=0;if(!ready||!visible||document.hidden)return;
   const dt=Math.min((now-last)/1000||0,.05);if(!paused&&now-last<1000/30){frame=requestAnimationFrame(draw);return;}last=now;
   if(!paused){time+=dt;pose();flames.forEach((f,i)=>f.scale.y=.85+Math.sin(time*24+i)*.18);
    nextShot-=dt;if(nextShot<=0){fire(titan,boss,0);for(const w of wings)fire(w,boss,0);fire(boss,titan,1);nextShot=.15;}
    for(const b of bolts)if(b.age>0){b.age-=dt;b.group.position.addScaledVector(b.velocity,dt);const hit=b.group.position.distanceTo(b.target.position)<(b.target===boss?1.65:1.3);if(hit)burst(b.group.position);if(hit||b.age<=0){b.age=0;b.group.visible=false;}}
    for(let i=0;i<sparks.length;i++){const s=sparks[i];s.age-=dt;if(s.age>0){s.p.addScaledVector(s.v,dt);sparkPositions.set(s.p.toArray(),i*3);}else sparkPositions.set([10000,10000,10000],i*3);}sparkGeo.attributes.position.needsUpdate=true;
   }
   renderer.render(scene,camera);if(!paused)frame=requestAnimationFrame(draw);
  }
  const resume=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=performance.now();draw(last);};
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;const distance=Math.max(1,1.2/camera.aspect);camera.position.set(0,9*distance,24*distance);camera.lookAt(focus);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1:1.25));renderer.setSize(w,h,false);resume();};new ResizeObserver(resize).observe(host);resize();pose();
  Object.defineProperty(host,'battleSnapshot',{value:()=>({time,titan:titan.position.toArray(),escorts:wings.map(w=>w.position.toArray()),boss:boss.position.toArray(),paused})});
  const wingLoad=load('/assets/models/interceptor.glb',wings[0],.85,Math.PI).then(w=>wings[1].add(w.clone(true)));
  Promise.all([load(media+'shop/titan.glb',titan,7.2,Math.PI/2),load(media+'m23/nebula.glb',boss,7.5,Math.PI/2),load(media+'m23/backdrop-planet.glb',planet,32),wingLoad]).then(()=>{
   ready=true;host.dataset.ready='true';host.dataset.actors='Titan Prime,2 X-fighters,Nebula Warship,planet';launch.hidden=true;button.hidden=false;status.textContent='TITAN PRIME / NEBULA WARSHIP';resize();
  }).catch(()=>{status.textContent='Fleet preview unavailable · refresh to retry';renderer.domElement.hidden=true;launch.hidden=true;});
  button.addEventListener('click',()=>{paused=!paused;label();resume();});document.addEventListener('visibilitychange',resume);quiet.addEventListener('change',()=>{paused=quiet.matches;label();resume();});host.addEventListener('battle-visibility',resume);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;delete host.dataset.ready;status.textContent='Graphics preview paused';});window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);},{once:true});
 }
 launch.addEventListener('click',mount);
 new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);host.dispatchEvent(new Event('battle-visibility'));},{rootMargin:'100px'}).observe(host);
})();
