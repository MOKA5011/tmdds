// intro.js — Preloader → Intro（全透明底圖 + 方塊覆蓋 + 反向消散 + Logo/字幕提前隱藏）
(() => {
  const CFG = {
    preloaderDelay: 1000,   // Preloader 停留時間
    preloaderFade: 850,     // Preloader 淡出時間
    introFadeOutMs: 1000,   // Intro 淡出時間
    soundVolume: 0.5,

    // 雜訊方塊設定
    blockCountMin: 240,
    blockCountRnd: 140,
    blockSizeMin: 10,
    blockSizeRnd: 60,
    blockSpeedMin: 0.010,
    blockSpeedRnd: 0.020,
    blockDelayMax: 1100,
    blockJitter: 0.6,
    flashChance: 0.20,
    flashTrigger: 0.96,
    coverPhaseMs: 4200,
    blackFadeMs: 700,

    // 方塊顏色
    blocksColor: {
      mode: "palette", // 'palette' | 'gradient' | 'grayscale'
      alpha: 0.85,
      palette: ["#2c94b4", "#354db9", "#3a0ca3", "#7209b7"],
      gradient: ["#00e5ff", "#3a86ff", "#8338ec", "#ff006e"],
      gray: { min: 50, max: 210 },
    },

    // 反向消散設定（使用中）
    reverseReveal: true,
    reverseBatch: 18,
    reverseGap: 60,
    reverseDurMin: 280,
    reverseDurMax: 640,
    reverseShrink: 0.85,

    // 🚀 覆蓋進度到此百分比（0~1）就先隱藏 Logo 與字幕
    hideAt: 0.72,
  };

  // === DOM ===
  const html = document.documentElement;
  const body = document.body;
  const pre = document.getElementById("preloader");
  const intro = document.getElementById("intro");
  const logoImg = document.getElementById("introLogoImg");
  const subtitle = document.querySelector(".subtitle"); // ⭐ 同步隱藏的字幕
  const canvas = document.getElementById("fragmentCanvas");
  const sound = document.getElementById("glitchSound");
  if (!intro || !logoImg || !canvas) return;
  const ctx = canvas.getContext("2d");

  // 鎖 / 解滾動
  const lockScroll = () => { html.style.overflow = "hidden"; body.style.overflow = "hidden"; };
  const unlockScroll = () => { html.style.overflow = ""; body.style.overflow = ""; };
  lockScroll();

  // 層級保險
  intro.style.zIndex = "10001";
  if (pre) pre.style.zIndex = "10002";

  // 畫布大小
  const resizeCanvas = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();

  // === Preloader → 淡出 → 顯示 Intro ===
  addEventListener("load", () => {
    const afterPreloader = () => { intro.style.display = "flex"; };
    if (!pre) { afterPreloader(); return; }
    setTimeout(() => {
      pre.classList.add("fade-out");
      setTimeout(() => { pre.remove(); afterPreloader(); }, CFG.preloaderFade);
    }, CFG.preloaderDelay);
  }, { once: true });

  // === 開始邏輯 ===
  let introStarted = false;
  function startIntro() {
    if (introStarted) return;
    introStarted = true;

    try { sound && (sound.volume = CFG.soundVolume, sound.play().catch(() => { })); } catch (e) { }

    // 使用全透明 PNG 當底圖（僅對齊使用，不畫到底）
    const transparentBase = new Image();
    transparentBase.src = "assets/images/logo_transparent.png";
    transparentBase.onload = () => startBlockEat(transparentBase);
  }

  // 點擊圖片開始 + 鍵盤啟動（Enter / Space）
  logoImg.addEventListener("click", startIntro);
  logoImg.style.cursor = "pointer";
  logoImg.setAttribute("tabindex", "0");
  logoImg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startIntro(); }
  });

  // === 色彩工具 ===
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  function hexToRgb(hex) {
    let h = hex.replace("#", "").trim();
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return { r: 255, g: 255, b: 255 };
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const mixRgb = (c1, c2, t) => ({
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  });

  function colorForBlock(b, r) {
    const { mode, alpha, palette, gradient, gray } = CFG.blocksColor;
    if (mode === "palette") {
      const seed = Math.abs(Math.sin(b.x * 0.013 + b.y * 0.021));
      const i = Math.floor(seed * palette.length) % palette.length;
      const j = (i + 1) % palette.length;
      const t = (seed * palette.length) % 1;
      const c = mixRgb(hexToRgb(palette[i]), hexToRgb(palette[j]), t);
      return `rgba(${c.r},${c.g},${c.b},${b.opacity * alpha})`;
    }
    if (mode === "gradient") {
      const nx = (b.x - r.left) / Math.max(1, r.width);
      const pos = nx * (gradient.length - 1);
      const i = Math.floor(pos);
      const t = pos - i;
      const c1 = hexToRgb(gradient[i | 0]);
      const c2 = hexToRgb(gradient[Math.min(i + 1, gradient.length - 1)]);
      const c = mixRgb(c1, c2, t);
      return `rgba(${c.r},${c.g},${c.b},${b.opacity * alpha})`;
    }
    const seed = Math.abs(Math.sin(b.x * 0.017 + b.y * 0.019));
    const v = Math.round(lerp(gray.min, gray.max, seed));
    return `rgba(${v},${v},${v},${b.opacity * alpha})`;
  }

  // === 雜訊方塊主動畫 ===
  function startBlockEat(sourceImg) {
    const w = canvas.width, h = canvas.height;
    canvas.style.opacity = "1";
    const r = logoImg.getBoundingClientRect();

    const blocks = [];
    const total = Math.floor(CFG.blockCountMin + Math.random() * CFG.blockCountRnd);

    // 核心區塊
    for (let i = 0; i < total; i++) {
      const size = CFG.blockSizeMin + Math.random() * CFG.blockSizeRnd;
      blocks.push({
        x: r.left + Math.random() * r.width,
        y: r.top + Math.random() * r.height,
        size,
        opacity: 0,
        delay: Math.random() * CFG.blockDelayMax,
        speed: CFG.blockSpeedMin + Math.random() * CFG.blockSpeedRnd,
        flash: Math.random() < CFG.flashChance,
        jitterX: (Math.random() * 2 - 1) * CFG.blockJitter,
        jitterY: (Math.random() * 2 - 1) * CFG.blockJitter,
      });
    }

    // 外圈干擾
    const haloCount = Math.floor(total * 0.25);
    for (let i = 0; i < haloCount; i++) {
      const size = CFG.blockSizeMin + Math.random() * CFG.blockSizeRnd;
      const pad = Math.max(20, size * 1.5);
      blocks.push({
        x: (r.left - pad) + Math.random() * (r.width + pad * 2),
        y: (r.top - pad) + Math.random() * (r.height + pad * 2),
        size,
        opacity: 0,
        delay: Math.random() * CFG.blockDelayMax,
        speed: CFG.blockSpeedMin + Math.random() * CFG.blockSpeedRnd,
        flash: Math.random() < (CFG.flashChance * 0.6),
        jitterX: (Math.random() * 2 - 1) * CFG.blockJitter,
        jitterY: (Math.random() * 2 - 1) * CFG.blockJitter,
      });
    }

    // === 動畫 ===
    let t0 = null;
    let reverseStarted = false;
    let allGone = false;
    let logoHidden = false; // ⭐ 只隱藏一次

    function hideIntroTextsSoft() {
      if (logoHidden) return;
      logoHidden = true;
      // 同步淡出 Logo 與字幕（若 subtitle 不存在也不會報錯）
      [logoImg, subtitle].forEach(el => {
        if (!el) return;
        el.style.transition = "opacity .4s ease";
        el.style.opacity = "0";
        setTimeout(() => { el.style.visibility = "hidden"; }, 400);
      });
    }

    function frame(ts) {
      if (!t0) t0 = ts;
      const elapsed = ts - t0;

      ctx.clearRect(0, 0, w, h); // 不畫底圖，只畫方塊

      // 覆蓋階段
      if (!reverseStarted && elapsed < CFG.coverPhaseMs) {
        for (const b of blocks) {
          if (elapsed > b.delay) {
            b.opacity = Math.min(1, b.opacity + b.speed);
            const jx = (Math.random() * 2 - 1) * b.jitterX;
            const jy = (Math.random() * 2 - 1) * b.jitterY;
            ctx.fillStyle = colorForBlock(b, r);
            ctx.fillRect(b.x + jx, b.y + jy, b.size, b.size);
          }
        }

        // ★ 進度門檻：更早隱藏 Logo + 字幕
        const progress = elapsed / CFG.coverPhaseMs; // 0~1
        if (!logoHidden && progress >= CFG.hideAt) {
          hideIntroTextsSoft();
        }

        requestAnimationFrame(frame);
        return;
      }

      // 覆蓋階段剛結束：保險再次隱藏（若尚未觸發）
      hideIntroTextsSoft();

      // 反向消散
      if (CFG.reverseReveal) {
        if (!reverseStarted) {
          reverseStarted = true;

          // 建立方塊消散順序
          const idx = [...blocks.keys()];
          for (let i = idx.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [idx[i], idx[j]] = [idx[j], idx[i]];
          }
          let batchStart = 0, k = 0;
          while (k < idx.length) {
            const chunk = idx.slice(k, k + CFG.reverseBatch);
            for (const id of chunk) {
              blocks[id].revStart = performance.now() + batchStart;
              blocks[id].revDur = rand(CFG.reverseDurMin, CFG.reverseDurMax);
            }
            k += CFG.reverseBatch;
            batchStart += CFG.reverseGap;
          }
        }

        let liveCount = 0;
        const now = performance.now();

        for (const b of blocks) {
          if (!b.revStart || now < b.revStart) {
            ctx.fillStyle = colorForBlock({ ...b, opacity: 1 }, r);
            ctx.fillRect(b.x, b.y, b.size, b.size);
            liveCount++;
            continue;
          }
          const t = Math.min(1, (now - b.revStart) / b.revDur);
          const ease = t * t * (3 - 2 * t);
          const curOpacity = 1 - ease;
          if (curOpacity > 0.01) {
            const s = b.size * (1 - ease * CFG.reverseShrink);
            const cx = b.x + b.size / 2;
            const cy = b.y + b.size / 2;
            ctx.fillStyle = colorForBlock({ ...b, opacity: curOpacity }, r);
            ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
            liveCount++;
          }
        }

        if (liveCount === 0) allGone = true;
        if (!allGone) { requestAnimationFrame(frame); }
        else { fadeOutIntro(); }   // 反向結束 → 直接淡出進站
        return;
      }

      // 舊行為：鋪黑收尾（沒有反向時）
      const p = Math.min(1, (elapsed - CFG.coverPhaseMs) / CFG.blackFadeMs);
      ctx.fillStyle = `rgba(0,0,0,${p * 0.85})`;
      ctx.fillRect(0, 0, w, h);
      if (p < 1) requestAnimationFrame(frame);
      else fadeOutIntro();
    }

    requestAnimationFrame(frame);
  }

  // === 結尾淡出 ===
  function fadeOutIntro() {
    intro.style.transition = `opacity ${CFG.introFadeOutMs}ms ease`;
    intro.classList.add("fade-out");
    setTimeout(() => { intro.remove(); unlockScroll(); }, CFG.introFadeOutMs + 50);
  }

  // 保險解鎖
  setTimeout(unlockScroll, 8000);
})();
