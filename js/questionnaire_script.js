// 姓名頁 → 問卷切換
document.getElementById("startQuizBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("請先輸入姓名！");
    return;
  }
  window.participantName = username;
  document.getElementById("namePage").style.display = "none";
  document.getElementById("quizForm").style.display = "block";
});

let questions = [];
let options = [];
let themes = {};

let currentPage = 0;
const questionsPerPage = 5;
let answers = {};
let hasShownCompletionMessage = false;

// 載入 JSON 資料
Promise.all([
  fetch('https://MOKA5011.github.io/tmdds/data/questions.json').then(res => res.json()),
  fetch('https://MOKA5011.github.io/tmdds/data/options.json').then(res => res.json()),
  fetch('https://MOKA5011.github.io/tmdds/data/themes.json').then(res => res.json())
]).then(([qData, oData, tData]) => {
  questions = qData.slice(0, 15);
  options = oData;
  themes = tData;
  renderPage();
});

// 儲存答案並更新進度
function saveAnswer(questionIndex, score) {
  answers[questionIndex] = score;
  updateProgressBar();
}

// 更新進度條
function updateProgressBar() {
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter(ans => ans !== undefined && ans !== "").length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const progressBar = document.getElementById("progressBar");
  const progressText = document.querySelector("#progressBar span");
  const progressTip = document.getElementById("progressTip");

  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }
  if (progressText) {
    progressText.textContent = `${progressPercent}%`;
  }
  if (progressTip) {
    progressTip.textContent = `✅ 已完成 ${answeredCount} / ${totalQuestions} 題`;
  }

  if (answeredCount === totalQuestions) {
    if (progressBar) progressBar.style.backgroundColor = "#fbc02d";
    if (!hasShownCompletionMessage) {
      alert("🎉 恭喜你完成所有題目！");
      hasShownCompletionMessage = true;
    }
  }
}

// 渲染問卷頁面
function renderPage() {
  const container = document.getElementById("pageContainer");
  container.innerHTML = "";
  const start = currentPage * questionsPerPage;
  const end = start + questionsPerPage;

  for (let i = start; i < end && i < questions.length; i++) {
    const qDiv = document.createElement("div");
    qDiv.className = "quiz-question";
    qDiv.innerHTML = `<p><strong>第 ${i + 1} 題：</strong> ${questions[i]}</p>`;

    const optDiv = document.createElement("div");
    optDiv.className = "quiz-options";

    options.forEach((opt) => {
      const checked = answers[i] === opt.score ? "checked" : "";
      optDiv.innerHTML += `
        <label>
          <input type="radio" name="q${i}" value="${opt.score}" ${checked}
            onchange="saveAnswer(${i}, ${opt.score})"> ${opt.text}
        </label>`;
    });

    qDiv.appendChild(optDiv);
    container.appendChild(qDiv);
  }

  const totalPages = Math.ceil(questions.length / questionsPerPage) - 1;
  document.getElementById("prevBtn").style.display = currentPage === 0 ? "none" : "inline-block";
  document.getElementById("nextBtn").style.display = currentPage < totalPages ? "inline-block" : "none";
  document.getElementById("submitBtn").style.display = currentPage === totalPages ? "inline-block" : "none";
}

// 上一頁
document.getElementById("prevBtn").addEventListener("click", () => {
  currentPage--;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// 下一頁
document.getElementById("nextBtn").addEventListener("click", () => {
  const start = currentPage * questionsPerPage;
  const end = start + questionsPerPage;

  for (let i = start; i < end && i < questions.length; i++) {
    if (answers[i] === undefined) {
      alert(`請先完成第 ${i + 1} 題再繼續！`);
      return;
    }
  }

  currentPage++;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// 提交問卷
document.getElementById("quizForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const start = currentPage * questionsPerPage;
  const end = start + questionsPerPage;
  for (let i = start; i < end && i < questions.length; i++) {
    if (answers[i] === undefined) {
      alert(`請先完成第 ${i + 1} 題再提交！`);
      return;
    }
  }

  if (!window.participantName) {
    alert("請先填寫姓名！");
    return;
  }

  // 打包答案
  let payload = {};
  payload["姓名"] = window.participantName || "";
  questions.forEach((qText, idx) => {
    const opt = options.find(o => o.score === answers[idx]);
    payload[`Q${idx + 1} - ${qText}`] = opt ? opt.text : "";
    payload[`Q${idx + 1} 分數`] = answers[idx];
  });

  await fetch("https://formspree.io/f/mblajzqo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  document.getElementById("quizForm").style.display = "none";
  document.getElementById("progressBarContainer").style.display = "none";
  document.getElementById("pageContainer").style.display = "none";
  document.getElementById("result").style.display = "block";

  showResults();
});

// ✨ 分數跑數字
function animateScore(finalScore) {
  const scoreDiv = document.getElementById("finalScore");
  let current = 0;
  const interval = setInterval(() => {
    if (current >= finalScore) {
      clearInterval(interval);
    } else {
      current++;
      scoreDiv.textContent = `總分：${current}`;
    }
  }, 25);
}

// 顯示結果分析
function showResults() {
  const { totalScore, themeScores } = calculateScores();
  const resultContainer = document.getElementById("result");
  const username = window.participantName || "";

  // 清空並建立基本框架
  resultContainer.innerHTML = `
    <div class="page-header">
      <h1>結果分析</h1>
      <p>${username} 根據您的作答結果，以下是各項風險評估</p>
    </div>
    <div id="finalScore" class="final-score"></div>
  `;

  renderOverallResult(totalScore, resultContainer);
  if (totalScore >= 90) applyHighScoreEffects(resultContainer);
  renderThemeCards(themeScores, resultContainer);
  initAccordion();
}

// 計算分數
function calculateScores() {
  let totalScore = 0;
  let themeScores = {};
  for (let theme in themes) {
    themeScores[theme] = 0;
    themes[theme].forEach(i => {
      if (answers[i] !== undefined) {
        themeScores[theme] += answers[i];
        totalScore += answers[i];
      }
    });
  }
  return { totalScore, themeScores };
}

// 總體分析
function renderOverallResult(totalScore, container) {
  const overallAnalysis = totalScore < 50 ? "風險偏低，請持續保持良好使用習慣。" :
    totalScore < 90 ? "中度風險，建議檢視網路使用行為。" :
      "⚠️ 高度風險，可能已影響生活，建議尋求協助。";

  const analysisP = document.createElement("p");
  analysisP.style.textAlign = "center";
  analysisP.textContent = overallAnalysis;
  container.appendChild(analysisP);

  animateScore(totalScore);
}

// 高分警告效果
function applyHighScoreEffects(container) {
  document.body.classList.add("flash-warning");
  setTimeout(() => document.body.classList.remove("flash-warning"), 3000);

  const resultSection = document.getElementById("result");
  resultSection.classList.add("glitch-effect");

  let glitchInterval = setInterval(() => {
    const randX1 = Math.floor(Math.random() * 6) - 3;
    const randX2 = Math.floor(Math.random() * 6) - 3;
    resultSection.style.setProperty("--glitch-before-x", `${randX1}px`);
    resultSection.style.setProperty("--glitch-after-x", `${randX2}px`);
  }, 80);

  setTimeout(() => {
    clearInterval(glitchInterval);
    resultSection.classList.remove("glitch-effect");
  }, 1500);

  const alertBox = document.createElement("div");
  alertBox.className = "alert-box shake";
  alertBox.textContent = "⚠️ 網癮程度過高！請立即放下手機！";
  container.appendChild(alertBox);
}

// 主題卡片
function renderThemeCards(themeScores, container) {
  let index = 0;
  for (let theme in themeScores) {
    const score = themeScores[theme];
    const comment = score < 20 ? "風險偏低" :
      score < 35 ? "中度風險" : "高度風險";

    const themeBlock = document.createElement("div");
    themeBlock.className = "theme-score-card";

    const label = document.createElement("div");
    label.innerHTML = `<strong>${theme}</strong>：${score} 分（${comment}）`;

    // 分數條
    const barContainer = document.createElement("div");
    barContainer.className = "score-bar-container";
    const bar = document.createElement("div");
    bar.className = "score-bar";
    bar.style.setProperty("--score-width", `${Math.min(score, 100)}%`);
    bar.style.animationDelay = `${index * 0.3}s`;
    bar.style.backgroundColor = score <= 20 ? '#4caf50' : score <= 35 ? '#ffeb3b' : '#f44336';
    barContainer.appendChild(bar);

    // Accordion 區塊
    const accordion = document.createElement("div");
    accordion.className = "accordion";

    const header = document.createElement("div");
    header.className = "accordion-header";
    header.textContent = "查看本主題題目與分析";

    const content = document.createElement("div");
    content.className = "accordion-content";

    // 題目逐一加入
    themes[theme].forEach(idx => {
      const qText = questions[idx];
      const ansScore = answers[idx];
      const opt = options.find(o => o.score === ansScore);
      const ansText = opt ? opt.text : "未作答";
      let qAnalysis = ansScore >= 8 ? "⚠️ 風險偏高" : ansScore >= 4 ? "中度風險" : "風險低";

      const p = document.createElement("p");
      p.innerHTML = `<strong>Q${idx + 1}：</strong>${qText}<br>
        <strong>你的答案：</strong>${ansText}（分數：${ansScore}）<br>
        <span style="color:#1abc9c">${qAnalysis}</span>`;
      content.appendChild(p);
    });

    accordion.appendChild(header);
    accordion.appendChild(content);

    themeBlock.appendChild(label);
    themeBlock.appendChild(barContainer);
    themeBlock.appendChild(accordion);
    container.appendChild(themeBlock);

    index++;
  }

  initAccordion();
}

// 控制展開動畫
function initAccordion() {
  document.querySelectorAll(".accordion").forEach(acc => {
    const header = acc.querySelector(".accordion-header");
    const content = acc.querySelector(".accordion-content");

    header.addEventListener("click", () => {
      const isOpen = acc.classList.contains("open");

      // 找出目前已經展開的
      const opened = document.querySelector(".accordion.open");
      if (opened && opened !== acc) {
        const openedContent = opened.querySelector(".accordion-content");
        // 收合動畫
        openedContent.style.height = openedContent.scrollHeight + "px";
        requestAnimationFrame(() => {
          openedContent.style.height = 0;
        });
        openedContent.addEventListener("transitionend", function handler() {
          opened.classList.remove("open");
          openedContent.removeEventListener("transitionend", handler);
        });
      }

      if (!isOpen) {
        // 展開動畫
        acc.classList.add("open");
        content.style.height = content.scrollHeight + "px";
        content.addEventListener("transitionend", function handler() {
          if (acc.classList.contains("open")) {
            content.style.height = "auto"; // 展開後自動高度
          }
          content.removeEventListener("transitionend", handler);
        });
      } else {
        // 收合動畫
        content.style.height = content.scrollHeight + "px";
        requestAnimationFrame(() => {
          content.style.height = 0;
        });
        content.addEventListener("transitionend", function handler() {
          acc.classList.remove("open");
          content.removeEventListener("transitionend", handler);
        });
      }
    });
  });

  // 📤 分享結果 ＋ 🏠 回到首頁
  const btnContainer = document.createElement("div");
  btnContainer.className = "result-buttons";

  const shareBtn = document.createElement("button");
  shareBtn.className = "btn";
  shareBtn.textContent = "📤 分享結果";
  shareBtn.onclick = () => {
    const shareText = `我剛完成「脫癮而出」網路使用風險測驗，總分 ${totalScore} 分，${overallAnalysis} 👉 ${location.href}`;
    if (navigator.share) {
      navigator.share({
        title: "脫癮而出｜網路風險測驗",
        text: shareText,
        url: location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("已複製分享內容，可貼給朋友！");
    }
  };

  const homeBtn = document.createElement("button");
  homeBtn.className = "btn";
  homeBtn.textContent = "🏠 回到首頁";
  homeBtn.onclick = () => {
    window.location.href = "index.html";
  };

  btnContainer.appendChild(shareBtn);
  btnContainer.appendChild(homeBtn);
  resultContainer.appendChild(btnContainer);
}

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