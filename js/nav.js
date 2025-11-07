// nav.js — 卡片式導覽：GSAP 高度動畫 + 可用性 + 滾動偵測
document.addEventListener("DOMContentLoaded", () => {
  const navEl = document.getElementById("cardNav") || document.querySelector(".card-nav");
  const hamburger = document.getElementById("hamburgerBtn") || document.querySelector(".hamburger-menu");
  const content = navEl?.querySelector(".card-nav-content");
  const cards = navEl?.querySelectorAll(".nav-card") || [];
  if (!navEl || !hamburger || !content) {
    console.warn("[nav] 缺元素：", {nav:!!navEl, hamburger:!!hamburger, content:!!content});
    return;
  }

  if (!window.gsap) { console.error("[nav] GSAP 未載入"); return; }
  const gs = window.gsap;

  // ARIA
  const controlsId = content.id || "card-nav-content";
  if (!content.id) content.id = controlsId;
  hamburger.setAttribute("role","button");
  hamburger.setAttribute("tabindex","0");
  hamburger.setAttribute("aria-controls",controlsId);
  hamburger.setAttribute("aria-expanded","false");
  hamburger.setAttribute("aria-label","開啟選單");

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 初始
  gs.set(navEl,{ height:60, overflow:"hidden" });

  gs.set(cards,{ y:20, opacity:0 });
  gs.set(content,{ autoAlpha:0, pointerEvents:"none" });

  // Timeline
  let tl = gs.timeline({ paused:true, defaults:{ ease:"power3.out" } });
  tl.to(navEl,{ height:"auto", duration:0.4 })
    .to(content,{ autoAlpha:1, pointerEvents:"auto", duration:0.2 },"<0.05")
    .to(cards,{ y:0, opacity:1, duration:0.35, stagger:0.08 },"-=0.05")
    .eventCallback("onReverseComplete", () => {
      gs.set(navEl, { height: isCompact ? 46 : 60, overflow:"hidden" });

      navEl.classList.remove("open");
    });

  let isOpen = false;
  let isCompact = false;

  function openMenu(){
    if (isOpen) return;
    isOpen = true;
    navEl.classList.add("open");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded","true");
    hamburger.setAttribute("aria-label","關閉選單");
    if (reduceMotion){
      navEl.style.height = "auto";
      content.style.visibility = "visible";
      content.style.pointerEvents = "auto";
      content.style.opacity = "1";
      return;
    }
    tl.play(0);
  }

  function closeMenu(){
    if (!isOpen) return;
    isOpen = false;
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded","false");
    hamburger.setAttribute("aria-label","開啟選單");
    if (reduceMotion){
      navEl.style.height = isCompact ? "46px" : "60px";


  // 滾動偵測：下滑縮小、上滑展開
  let lastY = window.scrollY || 0;
  let ticking = false;
  const SHRINK_AT = 80;   // 超過這高度才開始縮小
  const DOWN_DELTA = 12;  // 向下最少位移
  const UP_DELTA = 8;     // 向上最少位移

  function setCompact(val){
    if (isCompact === val) return;
    isCompact = val;
    navEl.classList.toggle("compact", isCompact);
    if (!isOpen) gs.set(navEl, { height: isCompact ? 46 : 60 });
    if (isCompact && isOpen) closeMenu();
  }

  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const y = window.scrollY || 0;
      const dy = y - lastY;

      if (y > SHRINK_AT && dy > DOWN_DELTA) {
        setCompact(true);
      } else if (dy < -UP_DELTA) {
        setCompact(false);
      }

      lastY = y;
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive:true });

  // 進入段落自動收合（依你的頁面調整）
  const sectionIds = ["intro","characters","dreams","production","team","questionnaire","footer"];
  const targets = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
  if (targets.length){
    const io = new IntersectionObserver(entries=>{
      for (const ent of entries){
        if (ent.isIntersecting && ent.intersectionRatio >= 0.35){
          closeMenu();
          break;
        }
      }
    }, { threshold: [0.35] });
    targets.forEach(t => io.observe(t));
  }
      content.style.visibility = "hidden";
      content.style.pointerEvents = "none";
      content.style.opacity = "0";
      return;
    }
    tl.reverse();
  }
  hamburger.addEventListener("click", () => {
    if (isOpen) {
      closeMenu(); 
    } else {
      openMenu();
    }
  }
  );
  hamburger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " "){
      e.preventDefault();
      if (isOpen) {
        closeMenu();

      } else {
        openMenu();
      }
    }
  }
  );
});
