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

function showDetail(index, group) {
  currentGroup = group;
  currentIndex = index;

  const item = detailData[group][index];
  document.getElementById("detailImg").src = item.img;
  document.getElementById("detailTitle").textContent = item.title;
  document.getElementById("detailText").textContent = item.text;
  document.getElementById("detailPanel").style.display = "flex";
  // 動態顯示/禁用箭頭（不隱藏，只變淡且不能點擊）
  const leftArrow = document.querySelector('.arrow.left');
  const rightArrow = document.querySelector('.arrow.right');
  const total = detailData[group].length;

  leftArrow.style.opacity = index === 0 ? "0.3" : "1";
  leftArrow.style.pointerEvents = index === 0 ? "none" : "auto";

  rightArrow.style.opacity = index === total - 1 ? "0.3" : "1";
  rightArrow.style.pointerEvents = index === total - 1 ? "none" : "auto";
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

// 鍵盤操作
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDetail();
  } else if (e.key === "ArrowRight") {
    switchDetail(1);
  } else if (e.key === "ArrowLeft") {
    switchDetail(-1);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".navbar-toggle");
  const navMenu = document.getElementById("navMenu");
  const navLinks = navMenu.querySelectorAll("a");

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });

    // 點選任一選單項目後自動收起
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("show");
      });
    });
  }
});
