import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";
import {EffectComposer} from "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/postprocessing/UnrealBloomPass.js";

const $=id=>document.getElementById(id);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x060914); scene.fog=new THREE.Fog(0x060914,35,170);
const camera=new THREE.PerspectiveCamera(100,innerWidth/innerHeight,.05,400);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; $("game").appendChild(renderer.domElement);
const composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.55,.55,.82));

scene.add(new THREE.HemisphereLight(0xaacbff,0x080912,1.4));
const sun=new THREE.DirectionalLight(0xffffff,3); sun.position.set(-30,50,25); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);
const arenaW=82, arenaL=120, wallH=9;

function mat(c,rough=.5,metal=.1,emit=0){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal,emissive:emit?c:0,emissiveIntensity:emit})}
function box(w,h,d,m,x=0,y=0,z=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;scene.add(o);return o}
const turf=mat(0x10261e,.9); box(arenaW,.5,arenaL,turf,0,-.3,0);
const lines=mat(0xffffff,.4,0,1);
for(const x of [-arenaW/2,arenaW/2]) box(.35,1,arenaL,lines,x,.2,0);
for(const z of [-arenaL/2,arenaL/2]) box(arenaW,1,.35,lines,0,.2,z);
box(arenaW,.25,.35,lines,0,.02,0);
for(const z of [-30,30]) box(arenaW,.1,.2,lines,0,.08,z);
for(const x of [-20,20]) box(.1,.12,arenaL,lines,x,.09,0);
const wall=mat(0x111b2d,.35,.45);
box(arenaW,wallH,.7,wall,0,wallH/2,-arenaL/2); box(arenaW,wallH,.7,wall,0,wallH/2,arenaL/2); box(.7,wallH,arenaL,wall,-arenaW/2,wallH/2,0); box(.7,wallH,arenaL,wall,arenaW/2,wallH/2,0);

function goal(z,color){
  const g=mat(color,.25,.25,1); box(24,8,2,g,0,4,z);
  const inner=box(20,6,2.5,mat(0x05070d,.8),0,3.3,z+(z<0?1:-1)); inner.castShadow=false;
  for(let x=-10;x<=10;x+=5) box(.25,6,.25,g,x,3.3,z+(z<0?2:-2));
}
goal(-arenaL/2,0x198dff); goal(arenaL/2,0xff641f);

const pads=[];
for(let z=-50;z<=50;z+=10) for(const x of [-30,0,30]){
  const big=(x===0&&Math.abs(z)%20===0), r=big?2.4:1.2;
  const m=mat(big?0xffb21c:0xff8a19,.25,.7,1);
  const p=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.15,32),m);p.position.set(x,.15,z);p.rotation.x=Math.PI/2;p.userData={amount:big?100:12,respawn:0,big};scene.add(p);pads.push(p);
}

function makeCar(color){
  const g=new THREE.Group(); g.userData={vel:new THREE.Vector3(),boost:100,onGround:true,yaw:0,pitch:0,roll:0};
  const body= new THREE.Mesh(new THREE.BoxGeometry(2.7,.75,4.2),mat(color,.28,.7)); body.position.y=.75; body.castShadow=true; g.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(2.1,.65,1.8),mat(0x0b1220,.15,.55)); cabin.position.set(0,1.25,-.1); cabin.castShadow=true; g.add(cabin);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(1.85,.38,1.3),mat(0x64c8ff,.08,.7)); glass.position.set(0,1.3,-.35);g.add(glass);
  for(const x of [-1.3,1.3]) for(const z of [-1.35,1.35]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.32,18),mat(0x08090d,.8));w.rotation.z=Math.PI/2;w.position.set(x,.48,z);w.castShadow=true;g.add(w)}
  const glow=new THREE.PointLight(color,0,8);glow.position.set(0,.7,2.1);g.add(glow);g.userData.glow=glow;
  scene.add(g);return g;
}
const player=makeCar(0x198dff); player.position.set(0,.2,38);
const mates=[makeCar(0x36a7ff),makeCar(0x50bfff)], enemies=[makeCar(0xff6b28),makeCar(0xff873c),makeCar(0xffa052)];
mates[0].position.set(-25,.2,25);mates[1].position.set(25,.2,25);
enemies[0].position.set(0,.2,-35);enemies[1].position.set(-24,.2,-25);enemies[2].position.set(24,.2,-25);

const ball=new THREE.Mesh(new THREE.SphereGeometry(1.55,32,20),mat(0xf4f6ff,.18,.35));
ball.position.set(0,2,0);ball.castShadow=true;scene.add(ball);ball.userData={vel:new THREE.Vector3()};

const keys={}; addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Escape"&&playing)pauseGame();if(e.code==="KeyE")ballCam=!ballCam});addEventListener("keyup",e=>keys[e.code]=false);
let touchX=0,touchY=0,touchActive=false;
const stick=$("stick"),knob=$("knob");
stick?.addEventListener("pointerdown",e=>{touchActive=true;stick.setPointerCapture(e.pointerId);moveStick(e)});
stick?.addEventListener("pointermove",e=>{if(touchActive)moveStick(e)});stick?.addEventListener("pointerup",()=>{touchActive=false;touchX=touchY=0;knob.style.transform="translate(0,0)"});
function moveStick(e){const r=stick.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),len=Math.min(50,Math.hypot(x,y)),a=Math.atan2(y,x);touchX=Math.cos(a)*len/50;touchY=Math.sin(a)*len/50;knob.style.transform=`translate(${touchX*42}px,${touchY*42}px)`}
const touch={boost:false,jump:false,air:false};document.querySelectorAll(".touchBtn").forEach(b=>{b.addEventListener("pointerdown",()=>{touch[b.dataset.action]=true;if(b.dataset.action==="cam")ballCam=!ballCam});b.addEventListener("pointerup",()=>touch[b.dataset.action]=false);b.addEventListener("pointercancel",()=>touch[b.dataset.action]=false)});

let playing=false,paused=false,ballCam=false,matchTime=300,blueScore=0,orangeScore=0,selectedColor=0x198dff,carStyle="sport",last=performance.now(),respawnTimer=0;

function input(){
  let x=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
  let y=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
  if(Math.abs(touchX)+Math.abs(touchY)>.05){x=touchX;y=touchY}
  const gp=navigator.getGamepads?.()[0]; let jump=keys.Space||touch.jump, boost=keys.ShiftLeft||keys.ShiftRight||touch.boost;
  if(gp){x=Math.abs(gp.axes[0])>.12?gp.axes[0]:x;y=Math.abs(gp.axes[1])>.12?gp.axes[1]:y;boost=boost||gp.buttons[7]?.value>.2;jump=jump||gp.buttons[0]?.pressed}
  return {x,y,jump,boost};
}
function resetPositions(){player.position.set(0,.2,38);player.rotation.set(0,0,0);player.userData.vel.set(0,0,0);ball.position.set((Math.random()-.5)*4,2,0);ball.userData.vel.set(0,0,0)}
function score(team){if(team==="blue")blueScore++;else orangeScore++;$("blueScore").textContent=blueScore;$("orangeScore").textContent=orangeScore;resetPositions();$("status").textContent=team==="blue"?"GOAL! BLUE":"GOAL! ORANGE";setTimeout(()=>{$("status").textContent=ballCam?"BALL CAM":"LIVE"},1300)}
function updatePlayer(dt){
 const i=input(),u=player.userData,forward=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
 const steer=i.x, throttle=-i.y;
 player.rotation.y-=steer*2.5*dt;
 const accel=38*(throttle||0);u.vel.addScaledVector(forward,accel*dt);
 u.vel.multiplyScalar(Math.pow(.985,dt*60));u.vel.y-=25*dt;
 if(i.jump&&u.onGround){u.vel.y=10;u.onGround=false}
 if(i.boost&&u.boost>0&&Math.abs(throttle)>.05){u.vel.addScaledVector(forward,55*dt);u.boost=Math.max(0,u.boost-30*dt);u.glow.intensity=8}else u.glow.intensity=0;
 const sp=u.vel.length();if(sp>48)u.vel.multiplyScalar(48/sp);
 player.position.addScaledVector(u.vel,dt);
 if(player.position.y<.2){player.position.y=.2;u.vel.y=0;u.onGround=true}
 clampCar(player);
 $("boostValue").textContent=Math.round(u.boost);document.querySelector(".boostRing").style.background=`conic-gradient(#ffb52e ${u.boost*3.6}deg,#222 ${u.boost*3.6}deg)`;
}
function clampCar(c){c.position.x=THREE.MathUtils.clamp(c.position.x,-39,39);c.position.z=THREE.MathUtils.clamp(c.position.z,-58,58)}
function updateAI(c,dt,team){
 const u=c.userData,dir=new THREE.Vector3().subVectors(ball.position,c.position);dir.y=0;let dist=dir.length();dir.normalize();
 const target=team==="blue"?new THREE.Vector3(ball.position.x,0,ball.position.z):new THREE.Vector3(ball.position.x,0,ball.position.z);
 const desired=Math.atan2(dir.x,dir.z);let da=Math.atan2(Math.sin(desired-c.rotation.y),Math.cos(desired-c.rotation.y));c.rotation.y+=THREE.MathUtils.clamp(da,-2.5*dt,2.5*dt);
 const f=new THREE.Vector3(Math.sin(c.rotation.y),0,Math.cos(c.rotation.y));u.vel.addScaledVector(f,(dist<5?42:25)*dt);u.vel.multiplyScalar(.985);if(u.vel.length()>34)u.vel.setLength(34);c.position.addScaledVector(u.vel,dt);c.position.y=.2;clampCar(c);
}
function updateBall(dt){
 const v=ball.userData.vel;v.y-=18*dt;ball.position.addScaledVector(v,dt);v.multiplyScalar(Math.pow(.996,dt*60));
 if(ball.position.y<1.55){ball.position.y=1.55;if(v.y<0)v.y*=-.68;v.x*=.99;v.z*=.99}
 if(Math.abs(ball.position.x)>39){ball.position.x=Math.sign(ball.position.x)*39;v.x*=-.82}
 if(ball.position.z<-61){score("orange");return} if(ball.position.z>61){score("blue");return}
 if(Math.abs(ball.position.z)>58){ball.position.z=Math.sign(ball.position.z)*58;v.z*=-.8}
 const cars=[player,...mates,...enemies];for(const c of cars){const d=ball.position.clone().sub(c.position);const dist=d.length();if(dist<3.3){d.normalize();const power=c===player?18:12;v.addScaledVector(d,power);v.y=Math.max(v.y,4);ball.position.addScaledVector(d,.35)}}
 for(const p of pads){if(p.userData.respawn>0){p.userData.respawn-=dt;continue}const d=ball.position.clone().sub(p.position); // visual pad interaction for player below
   const dp=player.position.distanceTo(p.position);if(dp<2.6&&player.userData.boost<100){player.userData.boost=Math.min(100,player.userData.boost+p.userData.amount);p.userData.respawn=p.userData.big?10:4;p.visible=false;setTimeout(()=>p.visible=true,p.userData.big?10000:4000)}
 }
}
function updateCamera(dt){
 const fov=+$("fov").value;camera.fov=fov;camera.updateProjectionMatrix();
 const speed=player.userData.vel.length(), back=6.8, height=2.9;
 if(ballCam){
   const target=ball.position.clone();let desired=target.clone().sub(player.position).normalize();if(desired.length()<.1)desired.set(0,0,-1);
   const pos=player.position.clone().addScaledVector(desired,-back);pos.y+=height;camera.position.lerp(pos,1-Math.pow(.001,dt));
   camera.lookAt(target);
 }else{
   const f=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
   const pos=player.position.clone().addScaledVector(f,-back);pos.y+=height;camera.position.lerp(pos,1-Math.pow(.0008,dt));camera.lookAt(player.position.clone().addScaledVector(f,8).setY(1.5));
 }
}
function tick(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(playing&&!paused){matchTime=Math.max(0,matchTime-dt);updatePlayer(dt);mates.forEach(c=>updateAI(c,dt,"blue"));enemies.forEach(c=>updateAI(c,dt,"orange"));updateBall(dt);updateCamera(dt);$("clock").textContent=`${Math.floor(matchTime/60)}:${String(Math.floor(matchTime%60)).padStart(2,"0")}`;if(matchTime<=0){if(blueScore!==orangeScore){playing=false;$("status").textContent="MATCH COMPLETE";setTimeout(()=>show($("menu")),1500)}else $("status").textContent="OVERTIME"}}
composer.render();requestAnimationFrame(tick)}
function show(el){[$("menu"),$("garage"),$("settings"),$("pause")].forEach(x=>x.classList.add("hidden"));el.classList.remove("hidden")}
function start(){playing=true;paused=false;matchTime=300;blueScore=orangeScore=0;$("blueScore").textContent=0;$("orangeScore").textContent=0;resetPositions();$("status").textContent="LIVE";show(document.createElement("div"))}
function pauseGame(){paused=true;show($("pause"))}
$("playBtn").onclick=()=>start();$("resumeBtn").onclick=()=>{paused=false;show(document.createElement("div"))};$("quitBtn").onclick=()=>{playing=false;paused=false;show($("menu"))};
$("garageBtn").onclick=()=>show($("garage"));$("settingsBtn").onclick=()=>show($("settings"));$("garageBack").onclick=()=>show($("menu"));$("settingsBack").onclick=()=>show($("menu"));
$("ballCamMode").onchange=e=>{};$("fov").oninput=()=>{};$("sens").oninput=()=>{};
document.querySelectorAll("[data-car]").forEach(b=>b.onclick=()=>{carStyle=b.dataset.car});
const swatches=[0x198dff,0xff642b,0x9d55ff,0x20d47a,0xffd12e,0xf4f4f4];swatches.forEach(c=>{const s=document.createElement("div");s.className="swatch";s.style.background="#"+c.toString(16).padStart(6,"0");s.onclick=()=>{selectedColor=c;player.children[0].material.color.set(c)};$("swatches").appendChild(s)});
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
setTimeout(()=>{$("loading").style.display="none"},900);
resetPositions();requestAnimationFrame(tick);
