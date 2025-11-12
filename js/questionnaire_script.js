/* =========================
   questionnaire_script.js
   ========================= */

/* === Cloudflare Worker 端點（改成你的 URL） === */
const CF_ENDPOINT = 'https://square-math-ec9a.leochen0963.workers.dev';

/* === 基本常數 === */
const MAX_SCORE = 300;
const SCORE_STAGES = [
  { max: 60,  label: "第 1 階段：低度風險", description: "目前使用習慣相當穩定，請持續維持良好的作息與自我覺察。" },
  { max: 120, label: "第 2 階段：需要留意", description: "偶爾會感到依賴或分心，建議安排固定的離線時間與替代活動。" },
  { max: 180, label: "第 3 階段：風險浮現", description: "網路使用已出現影響日常生活的跡象，請試著調整使用時間與內容。" },
  { max: 240, label: "第 4 階段：高度風險", description: "網路成癮風險偏高，建議與信任的家人或朋友討論並尋求支援。" },
  { max: MAX_SCORE, label: "第 5 階段：嚴重警戒", description: "已達高度警戒，可能對身心造成明顯影響，建議尋求專業協助。" }
];

/* === 啟動區 === */
document.getElementById("startQuizBtn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("請先輸入姓名！");
  window.participantName = username;
  document.getElementById("namePage").style.display = "none";
  document.getElementById("quizForm").style.display = "block";
});

/* === 問卷狀態 === */
let questions = [];
let options = [];
let themes = {};
let currentPage = 0;
const questionsPerPage = 5;
let answers = {};
let selfReflectionResponse = "";
let questionPageCount = 0;

/* === 載入資料 === */
Promise.all([
  fetch('https://MOKA5011.github.io/tmdds/data/questions.json').then(r => r.json()),
  fetch('https://MOKA5011.github.io/tmdds/data/options.json').then(r => r.json()),
  fetch('https://MOKA5011.github.io/tmdds/data/themes.json').then(r => r.json())
]).then(([qData, oData, tData]) => {
  questions = qData.slice(0, 30);
  options = oData;
  themes = tData;
  questionPageCount = Math.ceil(questions.length / questionsPerPage);
  renderPage();
  updateProgressBar();
}).catch(err => {
  console.error('載入問卷資料失敗：', err);
  alert('載入問卷資料失敗，請稍後再試。');
});

/* === 答案處理 === */
function saveAnswer(questionIndex, score) {
  answers[questionIndex] = score;
  updateProgressBar();
  updateNextButtonState();
}
function handleAnswerSelection(questionIndex, score) {
  saveAnswer(questionIndex, score);
  requestAnimationFrame(() => {
    const nextQuestion = document.querySelector(`.quiz-question[data-question-index="${questionIndex + 1}"]`);
    if (nextQuestion) nextQuestion.scrollIntoView({ behavior: "smooth", block: "center" });
    else document.getElementById("nextBtn")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
function isPageCompleted(pageIndex) {
  const start = pageIndex * questionsPerPage;
  const end = Math.min(start + questionsPerPage, questions.length);
  for (let i = start; i < end; i++) if (answers[i] === undefined) return false;
  return true;
}
function updateNextButtonState() {
  const nextBtn = document.getElementById("nextBtn");
  if (!nextBtn) return;
  if (currentPage >= questionPageCount) { nextBtn.disabled = false; return; }
  nextBtn.disabled = !isPageCompleted(currentPage);
}

/* === 進度條 === */
function updateProgressBar() {
  const total = questions.length;
  const answered = Object.values(answers).filter(v => v !== undefined && v !== "").length;
  const percent = total ? Math.round((answered / total) * 100) : 0;
  const progressBar = document.getElementById("progressBar");
  const progressText = document.querySelector("#progressBar span");
  const progressTip = document.getElementById("progressTip");
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${percent}%`;
  if (progressTip) progressTip.textContent = `✅ 已完成 ${answered} / ${total} 題`;
  if (progressBar) progressBar.style.backgroundColor = answered === total ? "#fbc02d" : "#4caf50";
}

/* === 渲染頁面 === */
function renderPage() {
  const container = document.getElementById("pageContainer");
  if (!container) return;
  container.innerHTML = "";

  if (currentPage < questionPageCount) {
    const start = currentPage * questionsPerPage;
    const end = start + questionsPerPage;

    for (let i = start; i < end && i < questions.length; i++) {
      const qDiv = document.createElement("div");
      qDiv.className = "quiz-question";
      qDiv.dataset.questionIndex = i;

      const prompt = document.createElement("p");
      prompt.innerHTML = `<strong>第 ${i + 1} 題：</strong> ${questions[i]}`;
      qDiv.appendChild(prompt);

      const optDiv = document.createElement("div");
      optDiv.className = "quiz-options";

      options.forEach((opt) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${i}`;
        input.value = opt.score;
        input.checked = answers[i] === opt.score;
        input.addEventListener("change", () => handleAnswerSelection(i, opt.score));
        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${opt.text}`));
        optDiv.appendChild(label);
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

  if (prevBtn) prevBtn.style.display = currentPage === 0 ? "none" : "inline-block";

  if (currentPage < questionPageCount) {
    if (nextBtn) { nextBtn.style.display = "inline-block"; nextBtn.textContent = currentPage === questionPageCount - 1 ? "下一步" : "下一頁"; }
    if (submitBtn) submitBtn.style.display = "none";
  } else {
    if (nextBtn) nextBtn.style.display = "none";
    if (submitBtn) submitBtn.style.display = "inline-block";
  }

  updateNextButtonState();
}

/* === 自述頁 === */
function renderReflectionPage(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-question open-ended";
  wrapper.innerHTML = `<p><strong>自述題：</strong> 請分享你在使用網路或手機時，最想改善或調整的習慣。</p>`;
  const textArea = document.createElement("textarea");
  textArea.id = "selfReflection";
  textArea.name = "selfReflection";
  textArea.placeholder = "寫下你的想法...";
  textArea.rows = 6;
  textArea.value = selfReflectionResponse;
  textArea.addEventListener("input", (e) => { selfReflectionResponse = e.target.value; });
  wrapper.appendChild(textArea);
  container.appendChild(wrapper);
}

/* === 分頁按鈕 === */
document.getElementById("prevBtn")?.addEventListener("click", () => {
  currentPage--;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.getElementById("nextBtn")?.addEventListener("click", () => {
  const start = currentPage * questionsPerPage;
  const end = start + questionsPerPage;
  for (let i = start; i < end && i < questions.length; i++) {
    if (answers[i] === undefined) return alert(`請先完成第 ${i + 1} 題再繼續！`);
  }
  currentPage++;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* === 送出 === */
document.getElementById("quizForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const start = currentPage * questionsPerPage;
  const end = start + questionsPerPage;
  for (let i = start; i < end && i < questions.length; i++) {
    if (answers[i] === undefined) return alert(`請先完成第 ${i + 1} 題再提交！`);
  }
  if (!window.participantName) return alert("請先填寫姓名！");

  // 打包送 Formspree（可保留）
  const payload = {};
  payload["姓名"] = window.participantName || "";
  questions.forEach((qText, idx) => {
    const opt = options.find(o => o.score === answers[idx]);
    payload[`Q${idx + 1} - ${qText}`] = opt ? opt.text : "";
    payload[`Q${idx + 1} 分數`] = answers[idx];
  });
  payload["自述題回覆"] = selfReflectionResponse.trim();

  try {
    await fetch("https://formspree.io/f/mblajzqo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('送出到 Formspree 失敗（忽略，不影響顯示結果）：', err);
  }

  document.getElementById("quizForm").style.display = "none";
  document.getElementById("progressBarContainer").style.display = "none";
  document.getElementById("pageContainer").style.display = "none";
  document.getElementById("result").style.display = "block";

  showResults();
});

/* === 分數動畫 === */
function animateScore(finalScore) {
  const scoreDiv = document.getElementById("finalScore");
  if (!scoreDiv) return;
  let current = 0;
  const step = Math.max(1, Math.round(finalScore / 200));
  scoreDiv.textContent = `總分：0 / ${MAX_SCORE}`;
  const it = setInterval(() => {
    current = Math.min(current + step, finalScore);
    scoreDiv.textContent = `總分：${current} / ${MAX_SCORE}`;
    if (current >= finalScore) clearInterval(it);
  }, 20);
}

/* === 顯示結果 === */
function showResults() {
  const { normalizedScore, themeScores } = calculateScores();
  const resultContainer = document.getElementById("result");
  const username = window.participantName || "";

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

  // ★ 在這裡呼叫 AI 分析（使用 normalizedScore）
  try {
    const answersBrief = questions.map((qText, idx) => {
      const chosen = options.find(o => o.score === answers[idx]);
      return { q: idx + 1, text: qText, optionText: chosen ? chosen.text : '', score: answers[idx] ?? null };
    });
    requestAIAnalysis({
      name: window.participantName || '受測者',
      totalScore: normalizedScore,
      themeScores,
      answers: answersBrief
    });
  } catch (e) {
    console.warn('AI 分析未啟動：', e);
  }

  renderResultButtons(normalizedScore, overallAnalysis, resultContainer);
}

/* === 計算分數 === */
function calculateScores() {
  let rawTotalScore = 0;
  const themeScores = {};
  for (const theme in themes) {
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

/* === 總體分析 === */
function renderOverallResult(normalizedScore, container) {
  const stage = SCORE_STAGES.find(def => normalizedScore <= def.max) || SCORE_STAGES.at(-1);
  const p = document.createElement("p");
  p.style.textAlign = "center";
  p.innerHTML = `<strong>${stage.label}</strong><br>${stage.description}`;
  container.appendChild(p);
  animateScore(normalizedScore);
  return stage;
}

/* === 高分警告效果 === */
function applyHighScoreEffects(container) {
  document.body.classList.add("flash-warning");
  setTimeout(() => document.body.classList.remove("flash-warning"), 3000);
  const resultSection = document.getElementById("result");
  resultSection.classList.add("glitch-effect");
  const timer = setInterval(() => {
    const rx1 = (Math.random() * 6 | 0) - 3;
    const rx2 = (Math.random() * 6 | 0) - 3;
    resultSection.style.setProperty("--glitch-before-x", `${rx1}px`);
    resultSection.style.setProperty("--glitch-after-x", `${rx2}px`);
  }, 80);
  setTimeout(() => { clearInterval(timer); resultSection.classList.remove("glitch-effect"); }, 1500);

  const alertBox = document.createElement("div");
  alertBox.className = "alert-box shake";
  alertBox.textContent = "⚠️ 網癮程度過高！請立即放下手機！";
  container.appendChild(alertBox);
}

/* === 主題卡片（手風琴） === */
function renderThemeCards(themeScores, container) {
  const wrap = document.createElement("div");
  wrap.className = "result-accordion";
  container.appendChild(wrap);

  function closeItem(item) {
    const panel = item.querySelector(".accordion-panel");
    item.classList.remove("open");
    if (panel) { panel.classList.remove("open"); panel.style.maxHeight = 0; }
  }
  function openItem(item) {
    const panel = item.querySelector(".accordion-panel");
    item.classList.add("open");
    if (panel) { panel.classList.add("open"); panel.style.maxHeight = panel.scrollHeight + "px"; }
  }

  Object.keys(themeScores).forEach((theme, idx) => {
    const score = themeScores[theme];
    const comment = score < 20 ? "風險偏低" : score < 35 ? "中度風險" : "高度風險";

    const item = document.createElement("div");
    item.className = "accordion-item";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "accordion-trigger";
    trigger.innerHTML = `<span class="accordion-title">${theme}</span><span class="accordion-meta">${score} 分（${comment}）</span>`;

    const panel = document.createElement("div");
    panel.className = "accordion-panel";

    const barContainer = document.createElement("div");
    barContainer.className = "score-bar-container";
    const bar = document.createElement("div");
    bar.className = "score-bar";
    bar.style.setProperty("--score-width", `${Math.min(score, 100)}%`);
    bar.style.animationDelay = `${idx * 0.2}s`;
    bar.style.backgroundColor = score <= 20 ? '#4caf50' : score <= 35 ? '#ffeb3b' : '#f44336';
    barContainer.appendChild(bar);

    const detail = document.createElement("div");
    detail.className = "accordion-detail";
    themes[theme].forEach(qIdx => {
      const qText = questions[qIdx];
      const ansScore = answers[qIdx];
      const opt = options.find(o => o.score === ansScore);
      const ansText = opt ? opt.text : "未作答";
      const qAnalysis = ansScore >= 8 ? "⚠️ 風險偏高" : ansScore >= 4 ? "中度風險" : "風險低";
      const p = document.createElement("p");
      p.className = "accordion-detail-line";
      p.innerHTML = `<strong>Q${qIdx + 1}：</strong>${qText}<br><strong>你的答案：</strong>${ansText}（分數：${ansScore}）<br><span class="detail-analysis">${qAnalysis}</span>`;
      detail.appendChild(p);
    });

    panel.appendChild(barContainer);
    panel.appendChild(detail);

    trigger.addEventListener("click", () => {
      const opened = wrap.querySelector(".accordion-item.open");
      if (opened && opened !== item) closeItem(opened);
      item.classList.contains("open") ? closeItem(item) : openItem(item);
    });

    item.appendChild(trigger);
    item.appendChild(panel);
    wrap.appendChild(item);
  });
}

/* === 結果頁按鈕 === */
function renderResultButtons(totalScore, overallAnalysis, container) {
  const btns = document.createElement("div");
  btns.className = "result-buttons";

  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.className = "btn";
  shareBtn.textContent = "📤 分享結果";
  shareBtn.addEventListener("click", () => {
    const text = `我剛完成「脫癮而出」網路使用風險測驗，總分 ${totalScore} / ${MAX_SCORE} 分，${overallAnalysis.label}－${overallAnalysis.description} 👉 ${location.href}`;
    if (navigator.share) navigator.share({ title: "脫癮而出｜網路風險測驗", text, url: location.href });
    else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => alert("已複製分享內容，可貼給朋友！"), () => alert("複製失敗，請手動分享這個頁面。"));
    else alert("目前的瀏覽器不支援直接分享，請手動複製網址。");
  });

  const homeBtn = document.createElement("button");
  homeBtn.type = "button";
  homeBtn.className = "btn";
  homeBtn.textContent = "🏠 回到首頁";
  homeBtn.addEventListener("click", () => { window.location.href = "index.html"; });

  btns.appendChild(shareBtn);
  btns.appendChild(homeBtn);
  container.appendChild(btns);
}

/* === Preloader（單一實作） === */
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;
  preloader.style.transition = "opacity 0.5s ease";
  preloader.style.opacity = "0";
  preloader.style.pointerEvents = "none";
  setTimeout(() => { preloader.remove(); document.body.style.overflow = "auto"; }, 500);
});

/* === AI 分析 === */
async function requestAIAnalysis(payload) {
  const endpoint = CF_ENDPOINT;
  const resultContainer = document.getElementById('result');
  if (!resultContainer) return;

  const box = document.createElement('div');
  box.className = 'ai-card';
  box.innerHTML = `<h3>AI 分析</h3><p class="muted">正在生成個人化建議，約 2–5 秒…</p>`;
  resultContainer.appendChild(box);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'AI 服務暫時不可用');

    const a = data.analysis || {};
    box.innerHTML = `
      <h3>AI 分析</h3>
      <p><strong>總結</strong>：${escapeHtml(a.summary || '')}</p>
      <p><strong>風險等級</strong>：<span class="pill ${a.risk_level || 'unknown'}">${a.risk_level || '—'}</span></p>
      ${renderWhy(a.why)}
      ${renderThemes(a.theme_feedback)}
      ${renderSuggestions(a.suggestions)}
      ${renderMicroHabits(a.micro_habits)}
      ${renderResources(a.resources)}
      <p class="note">＊此分析僅供自我檢視，若已影響作息或情緒，建議與家人、導師或輔導老師討論。</p>
    `;
  } catch (err) {
    box.innerHTML = `
      <h3>AI 分析</h3>
      <p class="error">抱歉，分析失敗：${escapeHtml(String(err.message || err))}</p>
      <button class="btn" id="retryAI">重試</button>
    `;
    box.querySelector('#retryAI')?.addEventListener('click', () => {
      box.remove();
      requestAIAnalysis(payload);
    });
  }
}

/* === AI 區塊渲染工具 === */
function renderWhy(list=[]) {
  if (!list.length) return '';
  return `<div class="ai-block"><h4>關鍵觀察</h4><ul>${list.map(li=>`<li>${escapeHtml(li)}</li>`).join('')}</ul></div>`;
}
function renderThemes(obj={}) {
  const items = Object.entries(obj);
  if (!items.length) return '';
  return `<div class="ai-block"><h4>主題回饋</h4>
    <ul>${items.map(([k,v]) => `<li><strong>${escapeHtml(k)}</strong>：${escapeHtml(v?.note||'')} <span class="pill ${v?.level||''}">${v?.level||''}</span></li>`).join('')}</ul>
  </div>`;
}
function renderSuggestions(arr=[]) {
  if (!arr.length) return '';
  return `<div class="ai-block"><h4>具體建議</h4>
    ${arr.map(s => `
      <div class="ai-tip">
        <div class="ai-tip-title">${escapeHtml(s.title || '')}</div>
        ${s.steps?.length ? `<ol>${s.steps.map(st=>`<li>${escapeHtml(st)}</li>`).join('')}</ol>`:''}
        ${s.est_impact ? `<p class="muted">可能效益：${escapeHtml(s.est_impact)}</p>`:''}
      </div>`).join('')}
  </div>`;
}
function renderMicroHabits(arr=[]) {
  if (!arr.length) return '';
  return `<div class="ai-block"><h4>7–14 天可嘗試的小習慣</h4><ul>${arr.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`;
}
function renderResources(arr=[]) {
  if (!arr.length) return '';
  return `<div class="ai-block"><h4>資源</h4><ul>${arr.map(r=>`<li>${escapeHtml(r.name)}（${escapeHtml(r.type||'')}` + (r.note?`｜${escapeHtml(r.note)}`:'') + `）</li>`).join('')}</ul></div>`;
}
function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
