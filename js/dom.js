window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");

  // 淡出動畫
  preloader.style.transition = "opacity 0.5s ease";
  preloader.style.opacity = "0";
  preloader.style.pointerEvents = "none";

  // 移除 DOM 元素
  setTimeout(() => {
    if (preloader) {
      preloader.remove();
    }
  }, 500); // 與 transition 時間一致
});

window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";
    setTimeout(() => {
      preloader.remove();
      document.body.style.overflow = "auto"; // ✅ 恢復滾動
    }, 500);
  }
});
