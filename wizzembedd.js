// === Wizz Embed Core — Floating Mini Assistant (Idle + Talk + Emotions) ===
console.log("✨ Wizz Embed Core Booting...");

let wizzScene, wizzCamera, wizzRenderer, wizzMixer, clock, currentAction;
const baseURL = "https://smokey-space.vercel.app/media/";
const apiURL = "https://cloud-w-i-z-z.vercel.app/api/wizz";

// === Create Container ===
const container = document.createElement("div");
container.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 220px;
  height: 300px;
  z-index: 9998;
  pointer-events: none;
`;
document.body.appendChild(container);

// === 3D Setup ===
clock = new THREE.Clock();
wizzScene = new THREE.Scene();
wizzCamera = new THREE.PerspectiveCamera(55, 220 / 300, 0.1, 1000);
wizzCamera.position.set(0, 1.4, 3);

wizzRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
wizzRenderer.setSize(220, 300);
container.appendChild(wizzRenderer.domElement);

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(3, 3, 5);
wizzScene.add(keyLight, new THREE.AmbientLight(0x404040, 1));

const loader = new THREE.GLTFLoader();
loader.load(
  baseURL + "wizzavatar.glb",
  (gltf) => {
    const wizz = gltf.scene;
    wizz.scale.set(1, 1, 1);
    wizzScene.add(wizz);
    console.log("✅ Embedded Wizz Loaded");

    wizzMixer = new THREE.AnimationMixer(wizz);
    playAnim("Idle.glb");
    animate();
  },
  undefined,
  (err) => console.error("❌ Model Load Error:", err)
);

// === Animation System ===
function playAnim(file) {
  const animLoader = new THREE.GLTFLoader();
  animLoader.load(
    baseURL + file,
    (gltf) => {
      if (!gltf.animations.length) return;
      const clip = gltf.animations[0];
      const action = wizzMixer.clipAction(clip);
      if (currentAction) currentAction.stop();
      action.reset().play();
      currentAction = action;
      console.log("🎞️ Playing:", file);
    },
    undefined,
    (err) => console.error("⚠️ Animation Error:", err)
  );
}

// === Chat UI (bottom bar) ===
const chatBox = document.createElement("div");
chatBox.innerHTML = `
  <div style="position:fixed;
              bottom:20px;
              right:260px;
              background:#000a;
              border:1px solid #47b0ff;
              border-radius:10px;
              padding:10px;
              color:#fff;
              z-index:9999;">
    <input id="wizzMsg" placeholder="Talk to Wizz..."
           style="width:220px;background:#111;color:#47b0ff;border:none;
                  padding:4px;border-radius:6px;">
    <button id="wizzSend"
            style="background:#47b0ff;color:#000;border:none;
                   padding:4px 10px;border-radius:6px;">Send</button>
  </div>`;
document.body.appendChild(chatBox);

// === Reply Bubble ===
const replyBubble = document.createElement("div");
replyBubble.style.cssText = `
  position: fixed;
  bottom: 120px;
  right: 260px;
  background: #000d;
  border: 1px solid #47b0ff;
  border-radius: 12px;
  padding: 10px 14px;
  color: #47b0ff;
  font-family: Arial, sans-serif;
  font-size: 14px;
  max-width: 300px;
  box-shadow: 0 0 20px #47b0ff55;
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 9999;
`;
document.body.appendChild(replyBubble);

function showReply(text) {
  replyBubble.textContent = `💬 ${text}`;
  replyBubble.style.opacity = 1;
  clearTimeout(window._replyTimer);
  window._replyTimer = setTimeout(() => (replyBubble.style.opacity = 0), 15000);
}

// === Talk Function + Emotion Layer ===
async function talkToWizz(msg) {
  try {
    console.log("🗣️ You:", msg);
    playAnim("wizz_talking.glb");

    // 💫 Instant emotion detection (before API reply)
    const lower = msg.toLowerCase();
    if (lower.match(/\b(happy|smile|joy|glad|great|good|sweet|love)\b/)) playAnim("Happy.glb");
    if (lower.match(/\b(excited|woo|yeah|pumped|energy|hype|momentum)\b/)) playAnim("Excited.glb");
    if (lower.match(/\b(kiss|bye|goodnight|hug)\b/)) playAnim("Blow_A_Kiss.glb");
    if (lower.match(/\b(walk|move|run|step)\b/)) playAnim("Walking.glb");
    if (lower.match(/\b(dance|party|celebrate|groove|beat|music|song)\b/)) playAnim("Hip_Hop_Dancing.glb");

    // 🤖 Send to API
    const res = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: msg }),
    });
    const data = await res.json();
    console.log("🤖 Wizz:", data.answer);

    // 💬 Display reply
    showReply(data.answer);

    // 🧠 Emotion trigger based on reply too
    const reply = data.answer.toLowerCase();
    if (reply.match(/\b(happy|smile|joy|glad|love|sweet)\b/)) playAnim("Happy.glb");
    if (reply.match(/\b(excited|woo|yeah|pumped|energy|hype|momentum)\b/)) playAnim("Excited.glb");
    if (reply.match(/\b(kiss|bye|goodnight|hug)\b/)) playAnim("Blow_A_Kiss.glb");
    if (reply.match(/\b(dance|party|celebrate|groove|beat|music|song)\b/)) playAnim("Hip_Hop_Dancing.glb");

    // ⏳ Return to idle
    setTimeout(() => playAnim("Idle.glb"), 2500);
  } catch (err) {
    console.error("⚠️ Wizz API Error:", err);
    showReply("⚠️ Connection failed. Check API.");
    playAnim("Idle.glb");
  }
}

// === Button Event ===
document.getElementById("wizzSend").onclick = () => {
  const msg = document.getElementById("wizzMsg").value.trim();
  if (!msg) return;
  document.getElementById("wizzMsg").value = "";
  talkToWizz(msg);
};

// === Animate Loop ===
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (wizzMixer) wizzMixer.update(delta);
  wizzRenderer.render(wizzScene, wizzCamera);
}