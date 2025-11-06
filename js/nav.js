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
  let isOpen = false;
  let isCompact = false;
  const heightState = { base: 60, compact: 46 };
  const mobileQuery = window.matchMedia ? window.matchMedia("(max-width: 600px)") : null;
  const shouldUseCompact = () => !(mobileQuery?.matches);

  function isFloatingLayout(){
    return mobileQuery?.matches ?? false;
  }

  const layoutState = {
    floating: isFloatingLayout(),
    closedWidth: 0
  };

  function getFabSize(){
    const styles = window.getComputedStyle(navEl);
    const varVal = parseFloat(styles.getPropertyValue("--cn-fab-size"));
    if (!Number.isNaN(varVal)) return varVal;
    const rect = navEl.getBoundingClientRect();
    return rect.width || 56;
  }

  function getFloatingWidth(){
    const target = Math.min(window.innerWidth * 0.92, 360);
    return Math.max(target, layoutState.closedWidth || 0);
  }

  let tl = null;

  function rebuildTimeline(){
    if (tl) tl.kill();

    layoutState.floating = isFloatingLayout();
    layoutState.closedWidth = layoutState.floating ? getFabSize() : 0;

    tl = gs.timeline({ paused:true, defaults:{ ease:"power3.out" } });

    if (layoutState.floating){
      const openWidth = getFloatingWidth();
      const startWidth = layoutState.closedWidth || getFabSize();
      tl.fromTo(navEl,
        { width: startWidth },
        { width: openWidth, duration:0.26, ease:"power2.out" })
        .to(navEl, { height:"auto", duration:0.36, ease:"power3.out" }, ">-0.04")
        .to(content,{ autoAlpha:1, pointerEvents:"auto", duration:0.2 }, "-=0.18")
        .to(cards,{ y:0, opacity:1, duration:0.35, stagger:0.08 }, "-=0.12");
    } else {
      tl.to(navEl,{ height:"auto", duration:0.4 })
        .to(content,{ autoAlpha:1, pointerEvents:"auto", duration:0.2 }, "<0.05")
        .to(cards,{ y:0, opacity:1, duration:0.35, stagger:0.08 }, "-=0.05");
    }

    tl.eventCallback("onReverseComplete", () => {
      const allowCompact = shouldUseCompact();
      const targetHeight = isCompact && allowCompact ? heightState.compact : heightState.base;
      gs.set(navEl, { height: targetHeight, overflow:"hidden" });
      if (layoutState.floating){
        gs.set(navEl, { clearProps:"width" });
      }
      navEl.classList.remove("open");
    });
  }

  function syncOpenDimensions(){
    if (!isOpen) return;
    if (layoutState.floating){
      gs.set(navEl, { width: getFloatingWidth(), height:"auto" });
    } else {
      gs.set(navEl, { height:"auto", clearProps:"width" });
    }
  }

  function computeBaseHeight(){
    const styles = window.getComputedStyle(navEl);
    const cssVar = parseFloat(styles.getPropertyValue("--cn-topbar-h"));
    if (!Number.isNaN(cssVar)) return cssVar;
    const topBar = navEl.querySelector(".card-nav-top");
    if (topBar){
      const rect = topBar.getBoundingClientRect();
      if (rect.height) return rect.height;
    }
    const navRect = navEl.getBoundingClientRect();
    return navRect.height || 60;
  }

  function refreshHeights(){
    const base = computeBaseHeight();
    heightState.base = base;
    heightState.compact = Math.max(Math.round(base * 0.76), base - 14);
    const allowCompact = shouldUseCompact();
    if (!allowCompact && isCompact){
      isCompact = false;
      navEl.classList.remove("compact");
    }
    const targetHeight = isCompact && allowCompact ? heightState.compact : heightState.base;
    if (!isOpen){
      gs.set(navEl, { height: targetHeight, overflow:"hidden" });
    } else {
      gs.set(navEl, { overflow:"hidden" });
    }
  }

  if (mobileQuery){
    const handleQuery = () => {
      refreshHeights();
      rebuildTimeline();
      syncOpenDimensions();
    };
    if (mobileQuery.addEventListener){
      mobileQuery.addEventListener("change", handleQuery);
    } else if (mobileQuery.addListener){
      mobileQuery.addListener(handleQuery);
    }
  }

  if (mobileQuery){
    const handleQuery = () => refreshHeights();
    if (mobileQuery.addEventListener){
      mobileQuery.addEventListener("change", handleQuery);
    } else if (mobileQuery.addListener){
      mobileQuery.addListener(handleQuery);
    }
  }

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
  refreshHeights();
  gs.set(cards,{ y:20, opacity:0 });
  gs.set(content,{ autoAlpha:0, pointerEvents:"none" });

  // Timeline
rebuildTimeline();

  function openMenu(){
    if (isOpen) return;
    isOpen = true;
    navEl.classList.add("open");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded","true");
    hamburger.setAttribute("aria-label","關閉選單");
    rebuildTimeline();
    if (reduceMotion){
      navEl.style.height = "auto";
      if (layoutState.floating){
        navEl.style.width = `${getFloatingWidth()}px`;
      }
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
      const allowCompact = shouldUseCompact();
      const targetHeight = isCompact && allowCompact ? heightState.compact : heightState.base;
      navEl.style.height = `${targetHeight}px`;
      if (layoutState.floating){
        navEl.style.width = "";
      }
      content.style.visibility = "hidden";
      content.style.pointerEvents = "none";
      content.style.opacity = "0";
      navEl.classList.remove("open");
      return;
    }
    tl.reverse();
  }

  function toggleMenu(){ isOpen ? closeMenu() : openMenu(); }

  // 互動
  hamburger.addEventListener("click", toggleMenu);
  hamburger.addEventListener("keydown", e=>{
    if (e.key==="Enter" || e.key===" "){ e.preventDefault(); toggleMenu(); }
  });
  document.addEventListener("mousedown", e=>{ if(isOpen && !navEl.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeMenu(); });
  content.querySelectorAll("a").forEach(a => a.addEventListener("click", () => closeMenu()));

  // 調整高度（展開狀態）
  const ro = new ResizeObserver(()=>{ if (isOpen) syncOpenDimensions(); });
  ro.observe(content);
  window.addEventListener("resize", ()=>{
    refreshHeights();
    rebuildTimeline();
    syncOpenDimensions();
  });

  // 滾動偵測：下滑縮小、上滑展開
  let lastY = window.scrollY || 0;
  let ticking = false;
  const SHRINK_AT = 80;   // 超過這高度才開始縮小
  const DOWN_DELTA = 12;  // 向下最少位移
  const UP_DELTA = 8;     // 向上最少位移

  function setCompact(val){
        const allowCompact = shouldUseCompact();
    if (!allowCompact) val = false;
    if (isCompact === val) return;
    isCompact = val;
    navEl.classList.toggle("compact", isCompact && allowCompact);
    if (!isOpen){
      const targetHeight = isCompact && allowCompact ? heightState.compact : heightState.base;
      gs.set(navEl, { height: targetHeight });
    }
    if (isCompact && isOpen) closeMenu();
  }

  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const y = window.scrollY || 0;
      const dy = y - lastY;

      if (!shouldUseCompact()) {
        setCompact(false);
      } else if (y > SHRINK_AT && dy > DOWN_DELTA) {
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
});
