const $ = (id) => document.getElementById(id);

const rapunzelBtn = $("rapunzelBtn");
const bubbleText  = $("bubbleText");
const speech      = $("speech");
const pillProg    = $("pillProg");

const intro          = $("intro");
const startBtn       = $("startBtn");
const toggleSoundBtn = $("toggleSoundBtn");

const soundBtn     = $("soundBtn");
const helpBtn      = $("helpBtn");
const helpModal    = $("helpModal");
const closeHelpBtn = $("closeHelpBtn");

const picker         = $("picker");
const closePickerBtn = $("closePickerBtn");

const confirmEl   = $("confirm");
const confirmYes  = $("confirmYes");
const confirmNo   = $("confirmNo");

const loading     = $("loading");
const loadingText = $("loadingText");

const sceneEl = $("scene");

const canvas = $("particles");
const ctx = canvas ? canvas.getContext("2d") : null;

const tapSfx     = $("tapSfx");
const sparkleSfx = $("sparkleSfx");
const snapGood   = $("snapGood");
const snapBad    = $("snapBad");

const cardStack   = $("cardStack");
const cardEnred   = $("cardEnredados");
const cardMati    = $("cardMatilda");
const btnLike     = $("btnLike");
const btnNope     = $("btnNope");

let soundEnabled = false;

// ===== Guion Rapunzel =====
const lines = [
  "Hola, Silvia… ✨ Ya veo que, al final, Ana fue capaz de acabar todo esto. Espero que te esté gustando el regalo.",
  "Estoy aquí para invitarte a pasar una noche de cine perfecta: palomitas, manta… y cero preocupaciones.",
  "Ahora elige tu peli favorita. Prométeme que vas a disfrutarla muchísimo. Te lo mereces.",
  "Easter egg: si hoy llevas calcetines fluorescentes… finjo que no lo he visto 😌"
];

const totalLines = lines.length;
let idx = 0;

// Estado anti-bugs
let isTalking = false;
let hasFinishedAll = false;
let typingTimer = null;
let mouthTimer = null;
let particles = [];

// ===== Picker estado =====
const ENREDADOS_URL = "https://drive.google.com/file/d/1D16xSzTEn2rDZZl8nNTM_jVeRtWA-UFE/view?usp=sharing";
const cards = [cardEnred, cardMati];
let activeIndex = 0; // 0 = Enredados, 1 = Matilda
let dragging = false;
let startX = 0;
let currentX = 0;
let confirmPending = false; // cuando Enredados pide confirmación

/* ================= Helpers UI ================= */
function setProgress(currentIndex){
  if (!pillProg) return;
  pillProg.textContent = `${currentIndex + 1}/${totalLines}`;
}

/** ✅ FIX: esto era el bug del bocadillo.
 *  Antes quitabas "show" y nunca lo volvías a poner. */
function showSpeech(){
  if (!speech) return;
  speech.classList.remove("hidden");
  speech.classList.add("show");
}

function openPicker(){
  if (!picker) return;
  picker.classList.remove("hidden");
  sceneEl?.classList.add("is-choosing");
  setActiveCard(0);
}

function closePicker(){
  if (!picker) return;
  picker.classList.add("hidden");
  sceneEl?.classList.remove("is-choosing");
  hideConfirm();
  confirmPending = false;
  dragging = false;
  currentX = 0;
}

function showLoading(msg="Abriendo…"){
  if (!loading || !loadingText) return;
  loadingText.textContent = msg;
  loading.classList.remove("hidden");
}
function hideLoading(){
  if (!loading) return;
  loading.classList.add("hidden");
}

async function play(audioEl){
  if (!soundEnabled || !audioEl) return;
  try{
    audioEl.currentTime = 0;
    await audioEl.play();
  } catch {}
}

function haptic(type = "light"){
  if (!("vibrate" in navigator)) return;
  const patterns = {
    light: 12,
    medium: 20,
    success: [10, 20, 10],
  };
  navigator.vibrate(patterns[type] ?? 12);
}

/* ================= Mouth swap ================= */
function startMouth(){
  stopMouth();
  const tick = () => {
    rapunzelBtn?.classList.toggle("is-speaking");
    const next = 90 + Math.random() * 80;
    const pauseChance = Math.random();
    mouthTimer = setTimeout(() => {
      if (pauseChance < 0.12) {
        rapunzelBtn?.classList.remove("is-speaking");
        mouthTimer = setTimeout(tick, 220 + Math.random() * 220);
      } else tick();
    }, next);
  };
  tick();
}
function stopMouth(){
  if (mouthTimer){ clearTimeout(mouthTimer); mouthTimer = null; }
  rapunzelBtn?.classList.remove("is-speaking");
}

function typeText(text, speed=16){
  return new Promise((resolve) => {
    if (!bubbleText) return resolve();
    if (typingTimer) clearInterval(typingTimer);
    bubbleText.textContent = "";
    let i = 0;
    typingTimer = setInterval(() => {
      bubbleText.textContent += text.charAt(i);
      i++;
      if (i >= text.length){
        clearInterval(typingTimer);
        typingTimer = null;
        resolve();
      }
    }, speed);
  });
}

/* ================= Particles ================= */
function burstParticles(){
  if (!canvas || !ctx) return;
  for (let i=0;i<18;i++){
    particles.push({
      x: canvas.clientWidth * 0.5 + (Math.random()*80 - 40),
      y: canvas.clientHeight * 0.42 + (Math.random()*60 - 30),
      vx: (Math.random()-0.5)*1.5,
      vy: -Math.random()*1.8 - 0.6,
      life: 60 + Math.random()*26,
      r: 1.2 + Math.random()*1.8,
      a: 0.9
    });
  }
}

/** ✅ Mini confeti suave (12 partículas grandes) */
function confetti12(){
  if (!canvas || !ctx) return;

  const colors = [
    "rgba(255,255,255,.95)",
    "rgba(255,240,200,.95)",
    "rgba(220,245,255,.95)",
    "rgba(255,210,235,.95)"
  ];

  const baseX = canvas.clientWidth * 0.62;
  const baseY = canvas.clientHeight * 0.22;

  for (let i = 0; i < 12; i++){
    particles.push({
      x: baseX + (Math.random() * 120 - 60),
      y: baseY + (Math.random() * 80 - 40),
      vx: (Math.random() - 0.5) * 1.1,
      vy: -Math.random() * 1.4 - 0.8,
      life: 85 + Math.random() * 25,
      r: 6 + Math.random() * 6,
      a: 0.95,
      color: colors[Math.floor(Math.random() * colors.length)],
      drag: 0.985
    });
  }
}

function lanternsBurst(count = 14){
  if (!canvas || !ctx) return;

  const baseX = canvas.clientWidth * 0.62;   // cerca de la card
  const baseY = canvas.clientHeight * 0.30;

  for (let i = 0; i < count; i++){
    const size = 7 + Math.random() * 8; // 7..15
    particles.push({
      type: "lantern",
      x: baseX + (Math.random() * 160 - 80),
      y: baseY + (Math.random() * 120 - 60),
      vx: (Math.random() - 0.5) * 0.25,     // muy suave
      vy: -0.55 - Math.random() * 0.55,     // sube lento
      life: 140 + Math.random() * 60,       // dura más
      r: size,
      a: 0.95,
      drag: 0.992,
      flicker: 0.85 + Math.random() * 0.2,  // brillo irregular
      hue: 38 + Math.random() * 18          // dorado/naranja
    });
  }
}


function resizeCanvas(){
  if (!canvas || !ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width  = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function loopParticles(){
  if (!canvas || !ctx) return;

  ctx.clearRect(0,0,canvas.clientWidth, canvas.clientHeight);
  particles = particles.filter(p => p.life > 0);

for (const p of particles){
  p.x += p.vx;
  p.y += p.vy;

  p.vx *= (p.drag ?? 0.99);
  p.vy *= (p.drag ?? 0.99);

  // gravedad mínima para que no sea “subida recta”
  p.vy += (p.type === "lantern" ? 0.002 : 0.02);

  p.life -= 1;
  p.a *= 0.989;

  // sway suave (linternas)
  if (p.type === "lantern"){
    p.vx += (Math.random() - 0.5) * 0.012;
  }

  if (p.type === "lantern"){
    // Glow cálido
    const alpha = Math.max(0, p.a) * (p.flicker ?? 1) * (0.85 + Math.random() * 0.15);

    // halo
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.8);
    g.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
    g.addColorStop(0.35, `hsla(${p.hue}, 100%, 60%, ${alpha * 0.45})`);
    g.addColorStop(1, `hsla(${p.hue}, 100%, 55%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI*2);
    ctx.fill();

    // núcleo (linterna)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  } else {
    // partículas normales / confeti
    const alpha = Math.max(0, p.a);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = p.color ?? `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
}


  requestAnimationFrame(loopParticles);
}

/* ================= Parallax ================= */
function setParallax(clientX, clientY){
  if (!sceneEl) return;
  const rect = sceneEl.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width - 0.5;
  const y = (clientY - rect.top) / rect.height - 0.5;
  document.documentElement.style.setProperty("--mx", `${x*16}px`);
  document.documentElement.style.setProperty("--my", `${y*16}px`);
}

/* ================= Final “tadaa” ================= */
function tadaThenOpenPicker(){
  burstParticles();
  play(sparkleSfx);
  setTimeout(() => openPicker(), 420);
}

/* ================= Flow Rapunzel ================= */
async function onTap(){
  if (hasFinishedAll) return;
  if (picker && !picker.classList.contains("hidden")) return;
  if (isTalking) return;

  isTalking = true;

  showSpeech();
  burstParticles();
  play(tapSfx);

  const lineIndex = idx % totalLines;
  const text = lines[lineIndex];
  setProgress(lineIndex);

  idx++;
  const isLast = (lineIndex === totalLines - 1);

  startMouth();
  await typeText(text, 16);
  stopMouth();
  play(sparkleSfx);

  if (isLast){
    hasFinishedAll = true;
    tadaThenOpenPicker();
  }

  isTalking = false;
}

/* ================= Confirm ================= */
function showConfirm(){
  if (!confirmEl) return;
  confirmEl.classList.remove("hidden");
  confirmPending = true;
}
function hideConfirm(){
  if (!confirmEl) return;
  confirmEl.classList.add("hidden");
  confirmPending = false;
}

/* ================= Card deck logic ================= */
function activeCard(){
  return cards[activeIndex];
}

function setActiveCard(i){
  activeIndex = i;

  cards.forEach((c, idx) => {
    if (!c) return;
    c.classList.toggle("is-active", idx === activeIndex);
    c.style.transition = "";
    c.style.transform = "translate3d(0,0,0) rotate(0deg)";
    const likeB = c.querySelector(".badgeLike");
    const nopeB = c.querySelector(".badgeNope");
    if (likeB) likeB.style.opacity = 0;
    if (nopeB) nopeB.style.opacity = 0;
  });

  // 👇 al cambiar de carta, quitamos confirm
  hideConfirm();
}

function setCardVisual(dx){
  const c = activeCard();
  if (!c || !cardStack) return;

  const w = Math.max(260, cardStack.clientWidth);
  const p = Math.max(-1, Math.min(1, dx / (w * 0.35)));
  const rot = p * 10;
  const ty  = Math.abs(p) * -6;

  c.style.transform = `translate3d(${dx}px, ${ty}px, 0) rotate(${rot}deg)`;

  const likeB = c.querySelector(".badgeLike");
  const nopeB = c.querySelector(".badgeNope");
  if (!likeB || !nopeB) return;

  if (p > 0){
    likeB.style.opacity = Math.min(1, p * 1.2);
    nopeB.style.opacity = 0;
  } else {
    nopeB.style.opacity = Math.min(1, Math.abs(p) * 1.2);
    likeB.style.opacity = 0;
  }
}

function resetCard(){
  const c = activeCard();
  if (!c) return;

  c.style.transition = "transform .18s ease";
  c.style.transform = "translate3d(0,0,0) rotate(0deg)";
  const likeB = c.querySelector(".badgeLike");
  const nopeB = c.querySelector(".badgeNope");
  if (likeB) likeB.style.opacity = 0;
  if (nopeB) nopeB.style.opacity = 0;

  setTimeout(() => (c.style.transition = ""), 190);
}

/** ✅ Aquí colocamos snaps + haptic según película */
async function throwActive(direction){
  const c = activeCard();
  if (!c || !cardStack) return;

  const movie = c.dataset.movie;

  // === Snap + haptic por película (no por dirección) ===
  if (movie === "tangled"){
    play(snapGood);
    haptic("light");
  } else {
    play(snapBad);
    haptic("light");
  }

  // ✅ Enredados: LIKE = confirmación, no “tirar”
  if (movie === "tangled" && direction === "like"){
    showConfirm();
    resetCard();
    return;
  }

  // El resto: animación de “tirar”
  c.style.transition = "transform .22s ease";
  const endX = direction === "like" ? cardStack.clientWidth * 1.2 : -cardStack.clientWidth * 1.2;
  const endR = direction === "like" ? 16 : -16;
  c.style.transform = `translate3d(${endX}px, -10px, 0) rotate(${endR}deg)`;
  c.classList.add("is-leaving");

  await new Promise(r => setTimeout(r, 230));
  c.classList.remove("is-leaving");

  // ✅ Resultado según película
  if (movie === "tangled"){
    // NO → pasar a Matilda
    setActiveCard(1);
  } else {
    // Matilda
    closePicker();

    if (direction === "like"){
      await rapunzelSays("Uuuy… solo fui capaz de conseguir mi peli. Otra vez será… 😌");
    } else {
      await rapunzelSays("Chica… qué exigente 😭 Venga, va. Otro día te lo curras tú.");
    }
  }
}

async function rapunzelSays(text){
  showSpeech();
  burstParticles();
  play(sparkleSfx);
  startMouth();
  await typeText(text, 16);
  stopMouth();
}

/* ================= Gestos Tinder ================= */
function initTinder(){
  if (!cardStack || !cardEnred || !cardMati) return;

  // Botones fallback
  btnLike?.addEventListener("click", () => {
    if (confirmPending) return;
    throwActive("like");
  });
  btnNope?.addEventListener("click", () => {
    if (confirmPending) return;
    throwActive("nope");
  });

  // Press feedback en móvil/desktop (haptic + class)
  cards.forEach((c) => {
    if (!c) return;

    c.addEventListener("pointerdown", () => {
      if (picker.classList.contains("hidden")) return;
      if (confirmPending) return;
      c.classList.add("is-pressed");
      haptic("light");
    });

    const clearPress = () => c.classList.remove("is-pressed");
    c.addEventListener("pointerup", clearPress);
    c.addEventListener("pointercancel", clearPress);
    c.addEventListener("pointerleave", clearPress);
  });

  // Drag (sobre el stack)
  cardStack.addEventListener("pointerdown", (e) => {
    if (picker.classList.contains("hidden")) return;
    if (confirmPending) return;

    dragging = true;
    startX = e.clientX;
    currentX = 0;

    const c = activeCard();
    if (!c) return;

    c.setPointerCapture(e.pointerId);
    c.style.transition = "";
    e.preventDefault();
  });

  cardStack.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    currentX = e.clientX - startX;
    setCardVisual(currentX);
  });

  const endDrag = async () => {
    if (!dragging) return;
    dragging = false;

    const threshold = cardStack.clientWidth * 0.18;
    if (currentX > threshold) await throwActive("like");
    else if (currentX < -threshold) await throwActive("nope");
    else resetCard();
  };

  cardStack.addEventListener("pointerup", endDrag);
  cardStack.addEventListener("pointercancel", endDrag);

  // Teclado
  cards.forEach((c) => {
    if (!c) return;
    c.addEventListener("keydown", (e) => {
      if (confirmPending) return;
      if (e.key === "ArrowRight") throwActive("like");
      if (e.key === "ArrowLeft") throwActive("nope");
    });
  });
}

/* ================= Confirm actions ================= */
confirmYes?.addEventListener("click", async () => {
  hideConfirm();

  // ✅ Confeti suave + snap + haptic "success"
  lanternsBurst(16);
  play(snapGood);
  play(sparkleSfx);
  haptic("success");

  // abre en pestaña nueva de forma robusta
  let win = null;
  try { win = window.open("about:blank", "_blank", "noreferrer"); } catch {}

  showLoading("Abriendo Enredados…");

  await new Promise(r => setTimeout(r, 600));
  hideLoading();

  if (win) win.location.href = ENREDADOS_URL;
  else window.location.href = ENREDADOS_URL;
});

confirmNo?.addEventListener("click", async () => {
  // NO en confirm = “siguiente” → Matilda
  hideConfirm();
  play(snapGood);
  haptic("light");

  // animación mini “snap” hacia Matilda (sin tirar)
  setActiveCard(1);
});

/* ================= Intro / HUD / Help ================= */
startBtn?.addEventListener("click", () => intro.classList.add("hidden"));

toggleSoundBtn?.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  toggleSoundBtn.textContent = `Sonido: ${soundEnabled ? "ON" : "OFF"}`;
  toggleSoundBtn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  if (soundBtn) soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
});

soundBtn?.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
});

helpBtn?.addEventListener("click", () => helpModal?.classList.remove("hidden"));
closeHelpBtn?.addEventListener("click", () => helpModal?.classList.add("hidden"));
helpModal?.addEventListener("click", (e) => {
  if (e.target === helpModal) helpModal.classList.add("hidden");
});

closePickerBtn?.addEventListener("click", closePicker);
picker?.addEventListener("click", (e) => {
  if (e.target === picker) closePicker();
});

/* ================= Events ================= */
rapunzelBtn?.addEventListener("click", onTap);
rapunzelBtn?.addEventListener("touchend", (e) => {
  e.preventDefault();
  onTap();
}, { passive:false });

sceneEl?.addEventListener("mousemove", (e) => setParallax(e.clientX, e.clientY));
sceneEl?.addEventListener("touchmove", (e) => {
  const t = e.touches?.[0];
  if (t) setParallax(t.clientX, t.clientY);
}, { passive:true });

/* ================= Init ================= */
setProgress(0);
initTinder();

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
loopParticles();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
    } catch (e) {
      // si falla, no rompe la app
      console.warn("SW no registrado:", e);
    }
  });
}
