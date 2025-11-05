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

const MAX_SCORE = 300;
const SCORE_STAGES = [
  { max: 60, label: "第 1 階段：低度風險", description: "目前使用習慣相當穩定，請持續維持良好的作息與自我覺察。" },
  { max: 120, label: "第 2 階段：需要留意", description: "偶爾會感到依賴或分心，建議安排固定的離線時間與替代活動。" },
  { max: 180, label: "第 3 階段：風險浮現", description: "網路使用已出現影響日常生活的跡象，請試著調整使用時間與內容。" },
  { max: 240, label: "第 4 階段：高度風險", description: "網路成癮風險偏高，建議與信任的家人或朋友討論並尋求支援。" },
  { max: MAX_SCORE, label: "第 5 階段：嚴重警戒", description: "已達高度警戒，可能對身心造成明顯影響，建議尋求專業協助。" }
];

let questions = [];
let options = [];
let themes = {};

let currentPage = 0;
const questionsPerPage = 5;
let answers = {};
let selfReflectionResponse = "";
let questionPageCount = 0;

// 載入 JSON 資料
Promise.all([
  fetch('https://MOKA5011.github.io/tmdds/data/questions.json').then(res => res.json()),
  fetch('https://MOKA5011.github.io/tmdds/data/options.json').then(res => res.json()),
  fetch('https://MOKA5011.github.io/tmdds/data/themes.json').then(res => res.json())
]).then(([qData, oData, tData]) => {
  questions = qData.slice(0, 30);
  options = oData;
  themes = tData;
  questionPageCount = Math.ceil(questions.length / questionsPerPage);
  renderPage();
  updateProgressBar();
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

  if (progressBar) {
    progressBar.style.backgroundColor = answeredCount === totalQuestions ? "#fbc02d" : "#4caf50";
  }
}

// 渲染問卷頁面
function renderPage() {
  const container = document.getElementById("pageContainer");
  container.innerHTML = "";
  if (currentPage < questionPageCount) {
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
  } else {
    renderReflectionPage(container);
  }

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  prevBtn.style.display = currentPage === 0 ? "none" : "inline-block";

  if (currentPage < questionPageCount) {
    nextBtn.style.display = "inline-block";
    nextBtn.textContent = currentPage === questionPageCount - 1 ? "下一步" : "下一頁";
    submitBtn.style.display = "none";
  } else {
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
  }
}

function renderReflectionPage(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-question open-ended";
  wrapper.innerHTML = `
    <p><strong>自述題：</strong> 請分享你在使用網路或手機時，最想改善或調整的習慣。</p>
  `;

  const textArea = document.createElement("textarea");
  textArea.id = "selfReflection";
  textArea.name = "selfReflection";
  textArea.placeholder = "寫下你的想法...";
  textArea.rows = 6;
  textArea.value = selfReflectionResponse;
  textArea.addEventListener("input", (event) => {
    selfReflectionResponse = event.target.value;
  });

  wrapper.appendChild(textArea);
  container.appendChild(wrapper);
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
  payload["自述題回覆"] = selfReflectionResponse.trim();

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
  if (!scoreDiv) return;

  let current = 0;
  const step = Math.max(1, Math.round(finalScore / 200));
  scoreDiv.textContent = `總分：0 / ${MAX_SCORE}`;

  const interval = setInterval(() => {
    current = Math.min(current + step, finalScore);
    scoreDiv.textContent = `總分：${current} / ${MAX_SCORE}`;
    if (current >= finalScore) {
      clearInterval(interval);
    }
  }, 20);
}

// 顯示結果分析
function showResults() {
  const { normalizedScore, themeScores } = calculateScores();
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

  const overallAnalysis = renderOverallResult(normalizedScore, resultContainer);
  if (normalizedScore >= 240) applyHighScoreEffects(resultContainer);
  renderThemeCards(themeScores, resultContainer);
  renderResultButtons(normalizedScore, overallAnalysis, resultContainer);
}

// 計算分數
function calculateScores() {
  let rawTotalScore = 0;
  let themeScores = {};
  for (let theme in themes) {
    themeScores[theme] = 0;
    themes[theme].forEach(i => {
      if (answers[i] !== undefined) {
        themeScores[theme] += answers[i];
        rawTotalScore += answers[i];
      }
    });
  }
  const maxOptionScore = options.length ? Math.max(...options.map(opt => opt.score)) : 0;
  const rawMaxScore = questions.length * maxOptionScore;
  const normalizedScore = rawMaxScore > 0 ? Math.round((rawTotalScore / rawMaxScore) * MAX_SCORE) : 0;

  return { normalizedScore, themeScores };
}

// 總體分析
function renderOverallResult(normalizedScore, container) {
  const stage = SCORE_STAGES.find(def => normalizedScore <= def.max) || SCORE_STAGES[SCORE_STAGES.length - 1];

  const analysisP = document.createElement("p");
  analysisP.style.textAlign = "center";
  analysisP.innerHTML = `<strong>${stage.label}</strong><br>${stage.description}`;
  container.appendChild(analysisP);

  animateScore(normalizedScore);
  return stage;
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
  const accordionContainer = document.createElement("div");
  accordionContainer.className = "result-accordion";
  container.appendChild(accordionContainer);

  function closeItem(item) {
    const panel = item.querySelector(".accordion-panel");
    item.classList.remove("open");
    if (panel) {
      panel.classList.remove("open");
      panel.style.maxHeight = 0;
    }
  }

  function openItem(item) {
    const panel = item.querySelector(".accordion-panel");
    item.classList.add("open");
    if (panel) {
      panel.classList.add("open");
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  }

  Object.keys(themeScores).forEach((theme, index) => {
    const score = themeScores[theme];
    const comment = score < 20 ? "風險偏低" :
      score < 35 ? "中度風險" : "高度風險";

    const item = document.createElement("div");
    item.className = "accordion-item";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "accordion-trigger";
    trigger.innerHTML = `
      <span class="accordion-title">${theme}</span>
      <span class="accordion-meta">${score} 分（${comment}）</span>
    `;

    const panel = document.createElement("div");
    panel.className = "accordion-panel";

    const barContainer = document.createElement("div");
    barContainer.className = "score-bar-container";
    const bar = document.createElement("div");
    bar.className = "score-bar";
    bar.style.setProperty("--score-width", `${Math.min(score, 100)}%`);
    bar.style.animationDelay = `${index * 0.2}s`;
    bar.style.backgroundColor = score <= 20 ? '#4caf50' : score <= 35 ? '#ffeb3b' : '#f44336';
    barContainer.appendChild(bar);

    const detail = document.createElement("div");
    detail.className = "accordion-detail";

    themes[theme].forEach(idx => {
      const qText = questions[idx];
      const ansScore = answers[idx];
      const opt = options.find(o => o.score === ansScore);
      const ansText = opt ? opt.text : "未作答";
      const qAnalysis = ansScore >= 8 ? "⚠️ 風險偏高" : ansScore >= 4 ? "中度風險" : "風險低";

      const p = document.createElement("p");
      p.className = "accordion-detail-line";
      p.innerHTML = `
        <strong>Q${idx + 1}：</strong>${qText}<br>
        <strong>你的答案：</strong>${ansText}（分數：${ansScore}）<br>
        <span class="detail-analysis">${qAnalysis}</span>
      `;
      detail.appendChild(p);
    });

    panel.appendChild(barContainer);
    panel.appendChild(detail);

    trigger.addEventListener("click", () => {
      const currentlyOpen = accordionContainer.querySelector(".accordion-item.open");
      if (currentlyOpen && currentlyOpen !== item) {
        closeItem(currentlyOpen);
      }

      if (item.classList.contains("open")) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });

    item.appendChild(trigger);
    item.appendChild(panel);
    accordionContainer.appendChild(item);
  });
}

function renderResultButtons(totalScore, overallAnalysis, container) {
  const btnContainer = document.createElement("div");
  btnContainer.className = "result-buttons";

  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.className = "btn";
  shareBtn.textContent = "📤 分享結果";
  shareBtn.addEventListener("click", () => {
    const shareText = `我剛完成「脫癮而出」網路使用風險測驗，總分 ${totalScore} / ${MAX_SCORE} 分，${overallAnalysis.label}－${overallAnalysis.description} 👉 ${location.href}`;
    if (navigator.share) {
      navigator.share({
        title: "脫癮而出｜網路風險測驗",
        text: shareText,
        url: location.href
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert("已複製分享內容，可貼給朋友！");
      }, () => {
        alert("複製失敗，請手動分享這個頁面。");
      });
    } else {
      alert("目前的瀏覽器不支援直接分享，請手動複製網址。");
    }
  });

  const homeBtn = document.createElement("button");
  homeBtn.type = "button";
  homeBtn.className = "btn";
  homeBtn.textContent = "🏠 回到首頁";
  homeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  btnContainer.appendChild(shareBtn);
  btnContainer.appendChild(homeBtn);
  container.appendChild(btnContainer);
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