(() => {
  const html = document.documentElement;
  const body = document.body;
  const preloader = document.getElementById("preloader");
  const intro = document.getElementById("intro");
  const logoImg = document.getElementById("introLogoImg");
  const startBtn = document.getElementById("startBtn");
  const canvas = document.getElementById("fragmentCanvas");
  const sound = document.getElementById("glitchSound");
  const ctx = canvas ? canvas.getContext("2d") : null;

  if (!intro || !logoImg || !startBtn || !canvas || !ctx) return;

  // 保證層級
  intro.style.zIndex = "10001";
  if (preloader) preloader.style.zIndex = "10002";

  // 鎖滾動
  function lockScroll(){ html.style.overflow = "hidden"; body.style.overflow = "hidden"; }
  function unlockScroll(){ html.style.overflow = ""; body.style.overflow = ""; }
  lockScroll();

  // 畫布尺寸
  function resizeCanvas(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener("resize", resizeCanvas, { passive:true });
  resizeCanvas();

  // 頁面載入→移除 preloader
addEventListener("load", () => {
  if (preloader) {
    // 🕒 延遲 1 秒再開始淡出動畫
    setTimeout(() => {
      preloader.classList.add("fade-out");
      setTimeout(() => preloader.remove(), 850);
    }, 300); // ← 這裡就是延遲 300 毫秒
  }
  if (getComputedStyle(intro).display === "none") intro.style.display = "flex";
}, { once:true });


  // 圖片像素 → 粒子
  function particlesFromImageRect(img, rect){
    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.ceil(rect.width));
    off.height = Math.max(1, Math.ceil(rect.height));
    const octx = off.getContext("2d");
    octx.drawImage(img, 0, 0, off.width, off.height);
    const data = octx.getImageData(0,0,off.width,off.height).data;

    const pts = [];
    const step = 3;
    for (let y=0; y<off.height; y+=step){
      for (let x=0; x<off.width; x+=step){
        const a = data[(y*off.width + x)*4 + 3];
        if (a > 100){
          pts.push({
            x: rect.left + x,
            y: rect.top  + y,
            dx: (Math.random()-0.5)*8,
            dy: (Math.random()-0.5)*8,
            life: 40 + Math.random()*40
          });
        }
      }
    }
    return pts;
  }

  let particles = [];
  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#00e0ff";
    for (const p of particles){
      ctx.fillRect(p.x, p.y, 2, 2);
      p.x += p.dx; p.y += p.dy; p.life--;
    }
    particles = particles.filter(p => p.life > 0);
    if (particles.length) requestAnimationFrame(animate);
  }

  // 點開始 → 故障崩壞 → 淡出 → 解鎖
  startBtn.addEventListener("click", () => {
    try { sound && sound.play().catch(()=>{}); } catch(e){}
    const rect = logoImg.getBoundingClientRect();
    particles = particlesFromImageRect(logoImg, rect);
    canvas.style.opacity = "1";
    logoImg.style.transition = "opacity .15s ease";
    logoImg.style.opacity = "0";
    if (particles.length) requestAnimationFrame(animate);

    setTimeout(() => {
      intro.classList.add("fade-out");
      setTimeout(() => {
        intro.remove();
        unlockScroll();
        scrollTo({ top: 0, behavior: "instant" });
      }, 1600);
    }, 1500);
  });

  // 保險：若 8 秒後仍被鎖，強制解鎖
  setTimeout(() => {
    if (getComputedStyle(html).overflow === "hidden" || getComputedStyle(body).overflow === "hidden"){
      unlockScroll();
    }
  }, 8000);
})();
