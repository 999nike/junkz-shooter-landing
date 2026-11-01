// One lightweight staged encounter. This is presentation, not a game simulation.
(() => {
 const host=document.getElementById('landingBattle'),button=document.getElementById('battlePause');if(!host||!button)return;
 const status=host.querySelector('.battleStatus'),quiet=matchMedia('(prefers-reduced-motion: reduce)');
 let started=false,visible=false,paused=quiet.matches,frame=0,last=0,time=0,ready=false,renderer;
 const label=()=>{button.textContent=paused?'Play scene':'Pause scene';button.setAttribute('aria-pressed',String(paused));};label();
 function mount(){
  if(started)return;started=true;
  if(!window.THREE?.GLTFLoader){status.textContent='Battle artwork · 3D preview unavailable';button.hidden=true;return;}
  const T=window.THREE,scene=new T.Scene(),camera=new T.PerspectiveCamera(39,1,.1,100);
  camera.position.set(0,7.4,13.4);camera.lookAt(0,0,0);
  try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'low-power'});}catch{status.textContent='Battle artwork · WebGL unavailable';button.hidden=true;return;}
  renderer.setClearColor(0x030710);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  scene.add(new T.HemisphereLight(0xb5eaff,0x141026,1.4));
  const key=new T.DirectionalLight(0xffe1ba,2.5);key.position.set(-4,7,5);scene.add(key);
  const rim=new T.DirectionalLight(0x43d6ff,2);rim.position.set(4,1,-4);scene.add(rim);
  const player=new T.Group(),boss=new T.Group();scene.add(player,boss);player.position.set(-3.1,0,1.2);boss.position.set(2.6,.3,-.8);
  function load(url,root,size){return new Promise((resolve,reject)=>new T.GLTFLoader().load(url,g=>{
   const model=g.scene,box=new T.Box3().setFromObject(model),centre=box.getCenter(new T.Vector3()),extent=box.getSize(new T.Vector3());model.position.sub(centre);
   const wrap=new T.Group();wrap.add(model);wrap.scale.setScalar(size/Math.max(extent.x,extent.y,extent.z));root.add(wrap);resolve();
  },undefined,reject));}
  const starGeo=new T.BufferGeometry(),stars=new Float32Array(180*3);
  let seed=19;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<stars.length;i+=3){stars[i]=(random()-.5)*36;stars[i+1]=-2-random()*5;stars[i+2]=(random()-.5)*23;}
  starGeo.setAttribute('position',new T.BufferAttribute(stars,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0x99c9df,size:.035,transparent:true,opacity:.65,depthWrite:false})));
  const rockGeo=new T.IcosahedronGeometry(.25,1),rocks=new T.InstancedMesh(rockGeo,new T.MeshStandardMaterial({color:0x344958,metalness:.6,roughness:.7}),9),dummy=new T.Object3D();
  for(let i=0;i<9;i++){dummy.position.set((random()-.5)*15,-.8-random(),(random()-.5)*12);dummy.rotation.set(random()*3,random()*3,random()*3);dummy.scale.setScalar(.4+random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}scene.add(rocks);
  const boltGeo=new T.CylinderGeometry(.026,.026,.36,6),haloGeo=new T.CylinderGeometry(.08,.08,.46,6),up=new T.Vector3(0,1,0);
  const colours=[0x5eeaff,0xff7048],bolts=[];
  for(let i=0;i<24;i++){
   const group=new T.Group(),type=i%2;group.add(new T.Mesh(boltGeo,new T.MeshBasicMaterial({color:type?0xffe8bd:0xe0ffff})),new T.Mesh(haloGeo,new T.MeshBasicMaterial({color:colours[type],transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false})));
   group.visible=false;scene.add(group);bolts.push({group,type,age:0,velocity:new T.Vector3(),target:new T.Vector3()});
  }
  const sparkGeo=new T.BufferGeometry(),sparkPositions=new Float32Array(48*3),sparks=Array.from({length:48},()=>({age:0,p:new T.Vector3(),v:new T.Vector3()}));
  sparkPositions.fill(10000);sparkGeo.setAttribute('position',new T.BufferAttribute(sparkPositions,3));
  scene.add(new T.Points(sparkGeo,new T.PointsMaterial({color:0xffd688,size:.065,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false})));
  const flameGeo=new T.ConeGeometry(.08,.7,8),flameMat=new T.MeshBasicMaterial({color:0x66cfff,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false});
  const flame=new T.Mesh(flameGeo,flameMat);flame.rotation.x=Math.PI/2;flame.position.z=.62;player.add(flame);
  let nextShot=0,cursor=0;
  function fire(type){const shot=bolts.find(b=>b.type===type&&b.age<=0);if(!shot)return;
   const source=type?boss:player,target=type?player:boss;
   shot.group.position.copy(source.position);shot.group.position.x+=type?-.9:.45;shot.target.copy(target.position);shot.target.y+=(random()-.5)*.7;
   shot.velocity.copy(shot.target).sub(shot.group.position).normalize().multiplyScalar(type?7:11);
   shot.group.quaternion.setFromUnitVectors(up,shot.velocity.clone().normalize());shot.age=1.5;shot.group.visible=true;
  }
  function burst(position){for(let i=0;i<8;i++){const s=sparks[cursor++%sparks.length];s.age=.45;s.p.copy(position);s.v.set((random()-.5)*2,(random()-.5)*2,(random()-.5)*2);}}
  function pose(){player.position.set(-3.2+Math.sin(time*.85)*.7,Math.sin(time*1.4)*.35,1.2+Math.cos(time*.85)*1.0);player.rotation.set(.08,-Math.PI/2+Math.sin(time*.85)*.17,Math.sin(time*.85)*.2);boss.position.y=.2+Math.sin(time*.6)*.18;boss.rotation.set(.04,-Math.PI/2+Math.sin(time*.4)*.1,.04);flame.scale.y=.8+Math.sin(time*19)*.2;}
  function draw(now=0){frame=0;if(!ready||!visible||document.hidden)return;
   const dt=Math.min((now-last)/1000||0,.05);if(!paused&&now-last<1000/30){frame=requestAnimationFrame(draw);return;}last=now;
   if(!paused){time+=dt;pose();nextShot-=dt;if(nextShot<=0){fire(0);if(Math.floor(time*4)%3===0)fire(1);nextShot=.19;}
    for(const b of bolts)if(b.age>0){b.age-=dt;b.group.position.addScaledVector(b.velocity,dt);if(b.group.position.distanceTo(b.target)<.4||b.age<=0){burst(b.group.position);b.age=0;b.group.visible=false;}}
    for(let i=0;i<sparks.length;i++){const s=sparks[i];s.age-=dt;if(s.age>0){s.p.addScaledVector(s.v,dt);sparkPositions.set(s.p.toArray(),i*3);}else sparkPositions.set([10000,10000,10000],i*3);}sparkGeo.attributes.position.needsUpdate=true;
   }
   renderer.render(scene,camera);if(!paused)frame=requestAnimationFrame(draw);
  }
  const resume=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=performance.now();draw(last);};
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1:1.25));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();resume();};
  new ResizeObserver(resize).observe(host);resize();pose();
  Promise.all([load('/assets/models/interceptor.glb',player,1.55),load('/assets/models/void-sentinel.glb',boss,4.1)]).then(()=>{ready=true;host.dataset.ready='true';host.dataset.triangles=String(renderer.info.render.triangles);status.textContent='X-FIGHTER / VOID SENTINEL';resize();}).catch(()=>{status.textContent='Battle artwork · 3D preview unavailable';renderer.domElement.hidden=true;button.hidden=true;});
  button.addEventListener('click',()=>{paused=!paused;label();resume();});
  document.addEventListener('visibilitychange',resume);
  quiet.addEventListener('change',()=>{paused=quiet.matches;label();resume();});
  host.addEventListener('battle-visibility',resume);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;delete host.dataset.ready;status.textContent='Battle artwork · graphics preview paused';});
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);},{once:true});
 }
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)mount();host.dispatchEvent(new Event('battle-visibility'));},{rootMargin:'100px'});observer.observe(host);
})();
