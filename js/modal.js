const detailData = {
  characters: [
    { img: "assets/images/171.jpg", title: "網癮少年", text: "孤單、冷漠，沉迷於手機的少年..." },
    { img: "assets/images/dream2.jpg", title: "未來的自己", text: "十年後的模樣，眼神空洞..." },
    { img: "assets/images/char-grandpa.jpg", title: "幻影阿公", text: "夢境中的引路人，象徵長輩的叮嚀..." }
  ],
  dreams: [
    { img: "assets/images/dream1.jpg", title: "夢境一｜遺失時間", text: "無數時鐘與倒數計時..." },
    { img: "assets/images/dream2.jpg", title: "夢境二｜虛擬幻境", text: "華麗的幻影吸引著他..." },
    { img: "assets/images/dream3.jpg", title: "夢境三｜自我對話", text: "與另一個自己相遇..." }
  ],
  team: [
    { img: "assets/images/toocrazycat.jpg", title: "園長", text: "色彩規劃" },
    { img: "assets/images/chiwawa.jpg", title: "雲", text: "角色設計" },
    { img: "assets/images/orengeeeeeeeee.jpg", title: "org", text: "場景設計" },
    { img: "assets/images/BROOOOOOOOOOOOOOOOOO.jpg", title: "ibo", text: "分鏡繪製" },
    { img: "assets/images/mikusigo.gif", title: "miu", text: "網頁設計" }
  ],
  production: [
    { img: "assets/images/dreamsingal.png", title: "分鏡設計", text: "動畫分鏡規劃與腳本設計" },
    { img: "assets/images/chiwawa.jpg", title: "角色設計", text: "角色造型與個性規劃" },
    { img: "assets/images/orengeeeeeeeee.jpg", title: "場景設定", text: "背景場景的氛圍與色彩" }
  ]
};

let currentIndex = 0;
let currentGroup = "";

/* ========= Modal 功能 ========= */
function showDetail(index, group) {
  currentGroup = group;
  currentIndex = index;

  const item = detailData[group][index];
  document.getElementById("detailImg").src = item.img;
  document.getElementById("detailTitle").textContent = item.title;
  document.getElementById("detailText").textContent = item.text;
  document.getElementById("detailPanel").style.display = "flex";

  // 更新箭頭狀態
  updateArrows(index, group);
}

function switchDetail(direction) {
  const items = detailData[currentGroup];
  let newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= items.length) return; // 超出範圍不切換
  currentIndex = newIndex;
  showDetail(currentIndex, currentGroup);
}

function closeDetail() {
  document.getElementById("detailPanel").style.display = "none";
}

function updateArrows(index, group) {
  const leftArrow = document.querySelector('.detail-content .arrow.left');
  const rightArrow = document.querySelector('.detail-content .arrow.right');
  const total = detailData[group].length;

  if (leftArrow && rightArrow) {
    leftArrow.style.opacity = index === 0 ? "0.3" : "1";
    leftArrow.style.pointerEvents = index === 0 ? "none" : "auto";

    rightArrow.style.opacity = index === total - 1 ? "0.3" : "1";
    rightArrow.style.pointerEvents = index === total - 1 ? "none" : "auto";
  }
}

/* ========= 鍵盤操作 ========= */
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDetail();
  } else if (e.key === "ArrowRight") {
    switchDetail(1);
  } else if (e.key === "ArrowLeft") {
    switchDetail(-1);
  }
});

/* ========= DOM Ready ========= */
document.addEventListener("DOMContentLoaded", () => {
  // 點擊背景關閉
  const detailPanel = document.getElementById("detailPanel");
  if (detailPanel) {
    detailPanel.addEventListener("click", (e) => {
      if (e.target.id === "detailPanel") {
        closeDetail();
      }
    });
  }

  // Navbar
  const toggleBtn = document.querySelector(".navbar-toggle");
  const navMenu = document.getElementById("navMenu");
  const navLinks = navMenu ? navMenu.querySelectorAll("a") : [];

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("show");
      });
    });
  }

  // Hero 高度自適應
  setHeroHeight();
  window.addEventListener("resize", setHeroHeight);
});

/* ========= 工具函數 ========= */
function setHeroHeight() {
  const hero = document.querySelector(".hero-section");
  if (hero) {
    hero.style.height = `${window.innerHeight}px`;
  }
}

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = Array.from({length: 150}, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.5,
  d: Math.random() * 0.5
}));

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.beginPath();
  stars.forEach(s => {
    ctx.moveTo(s.x, s.y);
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2, true);
  });
  ctx.fill();
}

function animateStars() {
  stars.forEach(s => {
    s.y += s.d;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });
  drawStars();
  requestAnimationFrame(animateStars);
}

animateStars();

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".scroll-gallery");
  const track = document.querySelector(".scroll-track");

  let scrollSpeed = 1;       // 預設速度
  let normalSpeed = 2;       // 正常速度
  let slowSpeed = 0.6;       // 滑鼠移上去的速度
  let autoScroll;

  function startScroll() {
    autoScroll = setInterval(() => {
      gallery.scrollLeft += scrollSpeed;
      if (gallery.scrollLeft >= track.scrollWidth - gallery.clientWidth) {
        gallery.scrollLeft = 0; // 🔄 無限循環
      }
    }, 20);
  }

  function stopScroll() {
    clearInterval(autoScroll);
  }

  // 啟動
  startScroll();

  // 滑鼠移入 → 減速
  gallery.addEventListener("mouseenter", () => {
    scrollSpeed = slowSpeed;
  });

  // 滑鼠移出 → 恢復
  gallery.addEventListener("mouseleave", () => {
    scrollSpeed = normalSpeed;
  });

  // 拖曳操作（保持不變，拖動時會暫停自動滾動）
  let isDown = false;
  let startX;
  let scrollLeft;

  gallery.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
    stopScroll();
  });

  gallery.addEventListener("mouseup", () => {
    isDown = false;
    startScroll();
  });

  gallery.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - gallery.offsetLeft;
    const walk = (x - startX) * 2;
    gallery.scrollLeft = scrollLeft - walk;
  });

  // 觸控拖曳
  gallery.addEventListener("touchstart", (e) => {
    isDown = true;
    startX = e.touches[0].pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
    stopScroll();
  });

  gallery.addEventListener("touchend", () => {
    isDown = false;
    startScroll();
  });

  gallery.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - gallery.offsetLeft;
    const walk = (x - startX) * 2;
    gallery.scrollLeft = scrollLeft - walk;
  });
});

// 手機版垂直滾動
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".scroll-gallery");

  if (window.innerWidth <= 768 && gallery) {
    let scrollSpeedY = 1;
    let autoScrollY;

    function startVerticalScroll() {
      autoScrollY = setInterval(() => {
        gallery.scrollTop += scrollSpeedY;
        if (gallery.scrollTop >= gallery.scrollHeight - gallery.clientHeight) {
          gallery.scrollTop = 0;
        }
      }, 30);
    }

    startVerticalScroll();
  }
  gallery.addEventListener("touchstart", () => clearInterval(autoScrollY));
});
