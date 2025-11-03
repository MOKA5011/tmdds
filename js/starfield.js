// starfield.js — 滿版落下星 + 閃爍 + 流星（穩定載入版）
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });

  // —— 參數可調 —— 
  const STAR_COUNT = 160;        // 星星數量
  const METEOR_MIN = 3800;       // 流星最短間隔(ms)
  const METEOR_MAX = 9000;       // 流星最長間隔(ms)
  const BG = "#000";             // 背景顏色
  const DPR_CAP = 2;             // 裝置像素比上限（效能）

  let DPR = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  let W = 0, H = 0;
  let stars = [];
  let meteors = [];
  let rafId = null;

  // 尺寸／DPR 自適應
  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width  = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    W = canvas.width; H = canvas.height;
    genStars(); // 重新鋪滿
  }

  // 產生星星
  function genStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: (Math.random() * 1.5 + 0.3) * DPR,       // 半徑
      vy: (Math.random() * 0.6 + 0.25) * DPR,     // 下落速度
      phase: Math.random() * Math.PI * 2,         // 閃爍位相
      twSpeed: Math.random() * 0.002 + 0.0015,    // 閃爍速度
      baseA: Math.random() * 0.5 + 0.3,           // 基礎透明
      amp: Math.random() * 0.35 + 0.15            // 閃爍振幅
    }));
  }

  // 生成一顆流星
  function spawnMeteor() {
    const ang = (-20 * Math.PI) / 180; // 右下角方向
    const len = (120 + Math.random() * 100) * DPR;
    const thick = (1.2 + Math.random() * 0.8) * DPR;
    const speed = (0.9 + Math.random() * 0.7) * DPR;
    const alpha = 0.5 + Math.random() * 0.4;

    // 從左上外側進場
    meteors.push({
      x: -50 * DPR,
      y: Math.random() * (H * 0.4),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      len, thick, alpha
    });

    const nextIn = Math.floor(METEOR_MIN + Math.random() * (METEOR_MAX - METEOR_MIN));
    setTimeout(() => spawnMeteor(), nextIn);
  }

  function drawFrame() {
    // 背景鋪黑
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // 星星（下落 + 閃爍）
    for (const s of stars) {
      s.y += s.vy;
      if (s.y > H) {
        s.y = -s.r * 2;
        s.x = Math.random() * W;
      }
      s.phase += s.twSpeed * 16;
      const a = Math.max(0, Math.min(1, s.baseA + Math.sin(s.phase) * s.amp));

      // 柔光暈
      const glowR = s.r * 2.2;
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
      grad.addColorStop(0, `rgba(230,238,255,${a * 0.9})`);
      grad.addColorStop(1, `rgba(230,238,255,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2); ctx.fill();

      // 核心
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a + 0.15)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    // 流星（尾巴＋核心）
    ctx.lineCap = "round";
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy;

      const ex = m.x, ey = m.y;
      const sx = ex - m.vx * m.len;
      const sy = ey - m.vy * m.len;

      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(255,255,255,${m.alpha})`);

      ctx.strokeStyle = g;
      ctx.lineWidth = m.thick;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${m.alpha + 0.1})`;
      ctx.beginPath(); ctx.arc(ex, ey, m.thick * 0.9, 0, Math.PI * 2); ctx.fill();

      if (ex > W + 200 || ey > H + 200) meteors.splice(i, 1);
    }

    rafId = requestAnimationFrame(drawFrame);
  }

  // 啟動
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  drawFrame();
  setTimeout(spawnMeteor, Math.floor(METEOR_MIN + Math.random() * (METEOR_MAX - METEOR_MIN)));
});
