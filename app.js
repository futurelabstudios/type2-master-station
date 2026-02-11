const STORAGE = {
  identity: "t2_master_identity",
  checklist: "t2_master_checklist",
  shiftChecklist: "t2_master_shift_checklist",
  operatorProfile: "t2_master_operator_profile",
  experiments: "t2_master_experiments",
  apiKey: "t2_master_api_key",
  analytics: "t2_master_analytics",
  weeklyPlan: "t2_master_weekly_plan",
  settings: "t2_master_settings",
};

const DAILY_TASKS = [
  { id: "d1", text: "Review KPI cockpit and yesterday's top post", weight: 1 },
  { id: "d2", text: "Capture 3 strong frontier signals", weight: 1 },
  { id: "d3", text: "Draft 1 flagship post (long, concrete, distinct)", weight: 2 },
  { id: "d4", text: "Score the draft and revise to 80+", weight: 2 },
  { id: "d5", text: "Publish in planned slot with clear CTA", weight: 1 },
  { id: "d6", text: "Leave 8 strategic replies in target network", weight: 1 },
  { id: "d7", text: "Log one experiment insight", weight: 1 },
];

const SHIFT_TASKS = [
  { id: "s1", text: "Read today's objective and constraints before posting" },
  { id: "s2", text: "Produce at least 1 flagship draft and score it 80+" },
  { id: "s3", text: "Publish with a clear follow-conversion close" },
  { id: "s4", text: "Complete strategic reply sprint (quality-first)" },
  { id: "s5", text: "Capture one experiment learning and update report" },
];

const HOOK_BANK = {
  thesis: [
    "The real race is no longer model-vs-model. It's civilization design-vs-stagnation.",
    "Abundance is not a dream state. It's an engineering sequence.",
    "The Kardashev trajectory is becoming a practical roadmap, not a metaphor.",
  ],
  contrarian: [
    "Most people optimize for reach. The real moat is conversion through clarity.",
    "The future won't be won by louder content. It will be won by sharper synthesis.",
    "AI won't just automate jobs. It will redefine what a high-impact human can do daily.",
  ],
  prediction: [
    "Within 24 months, agent-native workflows will be default for high performers.",
    "By 2030, the biggest social divide may be acceleration mindset vs scarcity mindset.",
    "Soon, your competitive edge will be decision speed, not raw information access.",
  ],
  question: [
    "What is the single bottleneck still holding us back from abundance?",
    "If intelligence gets cheap, what becomes the new luxury?",
    "Which institution must be redesigned first for Type 2 progress?",
  ],
};

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const el = (id) => document.getElementById(id);
const qsa = (s) => Array.from(document.querySelectorAll(s));

let analyticsData = [];
let analyticsKPIs = null;

function init() {
  initNavigation();
  initChecklist();
  initShiftChecklist();
  initWeekPlanner();
  bindEvents();
  loadSavedState();
  updateTodayHeader();
  updateGoalProjection();
}

function initNavigation() {
  qsa(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      qsa(".view").forEach((v) => v.classList.remove("active"));
      el(`view-${view}`).classList.add("active");
    });
  });
}

function updateTodayHeader() {
  const now = new Date();
  const dateText = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  el("todayTitle").textContent = `Today · ${dateText}`;
}

function bindEvents() {
  el("saveIdentity").addEventListener("click", saveIdentity);
  el("genHook").addEventListener("click", generateHook);
  el("buildDraft").addEventListener("click", buildDraft);
  el("scoreDraft").addEventListener("click", scoreDraft);
  el("copyDraft").addEventListener("click", copyDraft);
  el("generatePlan").addEventListener("click", generateTodayPlan);
  el("csvFile").addEventListener("change", onCsvUpload);
  el("demoCsv").addEventListener("click", loadDemoAnalytics);
  el("recalcGoal").addEventListener("click", updateGoalProjection);
  el("saveWeekPlan").addEventListener("click", saveWeekPlan);
  el("addExperiment").addEventListener("click", addExperiment);
  el("runAgent").addEventListener("click", runAgent);
  el("beginnerMode").addEventListener("change", onBeginnerModeChange);
  el("saveOperatorProfile").addEventListener("click", saveOperatorProfile);
  el("generateShiftReport").addEventListener("click", generateShiftReport);
  el("copyShiftReport").addEventListener("click", copyShiftReport);
  qsa(".prompt-seed").forEach((btn) => btn.addEventListener("click", applyPromptSeed));
}

function loadSavedState() {
  loadIdentity();
  loadChecklist();
  loadShiftChecklist();
  loadOperatorProfile();
  renderNextActions();
  loadExperiments();
  loadApiKey();
  loadSettings();
  loadWeekPlan();
  loadAnalyticsFromStorage();
}

function saveSettings() {
  const settings = {
    beginnerMode: el("beginnerMode").checked,
    currentFollowers: Number(el("currentFollowers").value || 0),
    targetFollowers: Number(el("targetFollowers").value || 10000),
    targetDate: el("targetDate").value,
  };
  localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
}

function loadSettings() {
  const raw = localStorage.getItem(STORAGE.settings);
  if (!raw) return;
  try {
    const settings = JSON.parse(raw);
    if (typeof settings.beginnerMode === "boolean") el("beginnerMode").checked = settings.beginnerMode;
    if (settings.currentFollowers) el("currentFollowers").value = settings.currentFollowers;
    if (settings.targetFollowers) el("targetFollowers").value = settings.targetFollowers;
    if (settings.targetDate) el("targetDate").value = settings.targetDate;
    onBeginnerModeChange();
  } catch {}
}

function onBeginnerModeChange() {
  const on = el("beginnerMode").checked;
  const hint = on
    ? "Tip: Start in Dashboard and complete the Daily Sprint in order."
    : "Guided tips hidden."
  el("beginnerHint").textContent = hint;
  saveSettings();
}

function initChecklist() {
  const wrap = el("dailyChecklist");
  wrap.innerHTML = "";
  DAILY_TASKS.forEach((task) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type=\"checkbox\" data-id=\"${task.id}\" /> ${escapeHtml(task.text)}`;
    wrap.appendChild(label);
  });

  qsa("#dailyChecklist input[type='checkbox']").forEach((box) => {
    box.addEventListener("change", () => {
      saveChecklist();
      renderChecklistProgress();
      renderNextActions();
    });
  });

  renderChecklistProgress();
}

function saveChecklist() {
  const state = qsa("#dailyChecklist input[type='checkbox']").map((box) => ({
    id: box.dataset.id,
    checked: box.checked,
  }));
  localStorage.setItem(STORAGE.checklist, JSON.stringify(state));
}

function loadChecklist() {
  const raw = localStorage.getItem(STORAGE.checklist);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    state.forEach((row) => {
      const box = document.querySelector(`#dailyChecklist input[data-id='${row.id}']`);
      if (box) box.checked = !!row.checked;
    });
  } catch {}
  renderChecklistProgress();
  renderNextActions();
}

function renderChecklistProgress() {
  const boxes = qsa("#dailyChecklist input[type='checkbox']");
  const done = boxes.filter((b) => b.checked).length;
  const total = boxes.length;
  const pct = total ? (done / total) * 100 : 0;
  el("dailyProgressFill").style.width = `${pct}%`;
  el("dailyProgressText").textContent = `${done}/${total} complete`;
}

function initShiftChecklist() {
  const wrap = el("shiftChecklist");
  if (!wrap) return;
  wrap.innerHTML = "";

  SHIFT_TASKS.forEach((task) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type=\"checkbox\" data-shift-id=\"${task.id}\" /> ${escapeHtml(task.text)}`;
    wrap.appendChild(label);
  });

  qsa("#shiftChecklist input[type='checkbox']").forEach((box) => {
    box.addEventListener("change", () => {
      saveShiftChecklist();
      renderShiftChecklistProgress();
    });
  });

  renderShiftChecklistProgress();
}

function saveShiftChecklist() {
  const state = qsa("#shiftChecklist input[type='checkbox']").map((box) => ({
    id: box.dataset.shiftId,
    checked: box.checked,
  }));
  localStorage.setItem(STORAGE.shiftChecklist, JSON.stringify(state));
}

function loadShiftChecklist() {
  const raw = localStorage.getItem(STORAGE.shiftChecklist);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    state.forEach((row) => {
      const box = document.querySelector(`#shiftChecklist input[data-shift-id='${row.id}']`);
      if (box) box.checked = !!row.checked;
    });
  } catch {}
  renderShiftChecklistProgress();
}

function renderShiftChecklistProgress() {
  const boxes = qsa("#shiftChecklist input[type='checkbox']");
  if (!boxes.length) return;
  const done = boxes.filter((b) => b.checked).length;
  const total = boxes.length;
  const pct = total ? (done / total) * 100 : 0;
  el("shiftProgressFill").style.width = `${pct}%`;
  el("shiftProgressText").textContent = `${done}/${total} complete`;
}

function saveIdentity() {
  const payload = {
    northStar: el("northStar").value,
    audience: el("audience").value,
    positioning: el("positioning").value,
    skillPack: el("skillPack").value,
    pillars: [el("pillar1").value, el("pillar2").value, el("pillar3").value, el("pillar4").value],
    rules: el("rules").value,
  };
  localStorage.setItem(STORAGE.identity, JSON.stringify(payload));
}

function loadIdentity() {
  const raw = localStorage.getItem(STORAGE.identity);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.northStar) el("northStar").value = d.northStar;
    if (d.audience) el("audience").value = d.audience;
    if (d.positioning) el("positioning").value = d.positioning;
    if (d.skillPack) el("skillPack").value = d.skillPack;
    if (Array.isArray(d.pillars)) {
      [el("pillar1"), el("pillar2"), el("pillar3"), el("pillar4")].forEach((x, i) => {
        if (d.pillars[i]) x.value = d.pillars[i];
      });
    }
    if (d.rules) el("rules").value = d.rules;
  } catch {}
}

function saveOperatorProfile() {
  const payload = {
    operatorName: el("operatorName").value.trim(),
    shiftObjective: el("operatorShiftObjective").value.trim(),
    constraints: el("operatorConstraints").value,
    escalationRules: el("escalationRules").value,
  };
  localStorage.setItem(STORAGE.operatorProfile, JSON.stringify(payload));
  el("handoffStatus").textContent = "Handoff profile saved.";
  renderNextActions();
}

function loadOperatorProfile() {
  const raw = localStorage.getItem(STORAGE.operatorProfile);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.operatorName) el("operatorName").value = d.operatorName;
    if (d.shiftObjective) el("operatorShiftObjective").value = d.shiftObjective;
    if (d.constraints) el("operatorConstraints").value = d.constraints;
    if (d.escalationRules) el("escalationRules").value = d.escalationRules;
  } catch {}
}

function generateHook() {
  const style = el("hookStyle").value;
  const objective = el("postObjective").value;
  const bank = HOOK_BANK[style] || HOOK_BANK.thesis;
  const raw = bank[Math.floor(Math.random() * bank.length)];

  const suffix = {
    follow: " Follow if you're building for the long future.",
    discussion: " What's your take?",
    authority: " Here's the practical implication most people miss.",
    share: " If this resonates, repost for your builder network.",
  }[objective] || "";

  el("hookOutput").value = raw + suffix;
}

function buildDraft() {
  const hook = (el("hookOutput").value || "").trim();
  const signal = (el("signalInput").value || "").trim();
  const insight = (el("insightInput").value || "").trim();
  const close = (el("actionInput").value || "").trim();

  const draft = [
    hook || "The acceleration window is open. Most people still don't see it.",
    "",
    signal ? `Signal: ${signal}` : "Signal: [insert concrete event, quote, or data point]",
    insight ? `Implication: ${insight}` : "Implication: [what this changes in the next 12-24 months]",
    "",
    close || "What bottleneck do we remove next to accelerate abundance?",
  ].join("\n");

  el("postDraft").value = draft;
}

function scoreDraft() {
  const text = (el("postDraft").value || "").trim();
  const feedback = [];
  let score = 0;

  if (!text) {
    el("draftScore").textContent = "Score: 0 / 100";
    el("scoreFill").style.width = "0%";
    el("scoreFeedback").innerHTML = `<div class=\"item\">Draft is empty. Build or paste a draft first.</div>`;
    return;
  }

  const len = text.length;
  const lines = text.split(/\n+/).filter(Boolean).length;
  const hasQuestion = /\?$/.test(text.trim()) || /\?/.test(text);
  const hasNumber = /\d/.test(text);
  const hasSignalWord = /(signal|data|quote|study|report|says|according)/i.test(text);
  const hasImplicationWord = /(implication|means|therefore|so|this changes|this suggests)/i.test(text);
  const hypeCount = (text.match(/\b(lfg|insane|crazy|wild|legend|moon)\b/gi) || []).length;
  const pillarWords = [el("pillar1").value, el("pillar2").value, el("pillar3").value, el("pillar4").value]
    .join(" ")
    .toLowerCase();
  const hasPillarMatch = pillarWords.split(/\W+/).filter((w) => w.length > 4).some((w) => text.toLowerCase().includes(w));

  if (len >= 140 && len <= 420) {
    score += 20;
    feedback.push("Length is in high-performing range.");
  } else if (len > 90) {
    score += 12;
    feedback.push("Length is okay, but could be tighter or more complete.");
  } else {
    score += 5;
    feedback.push("Draft is short; add context and implication.");
  }

  if (lines >= 4) {
    score += 14;
    feedback.push("Structure is scannable (multi-line)." );
  } else {
    score += 6;
    feedback.push("Add line breaks to improve readability.");
  }

  if (hasSignalWord || hasNumber) {
    score += 16;
    feedback.push("Includes concrete signal/evidence cues.");
  } else {
    feedback.push("Add concrete source signal or number.");
  }

  if (hasImplicationWord) {
    score += 16;
    feedback.push("States implication clearly.");
  } else {
    feedback.push("Explicitly state why this matters now.");
  }

  if (hasQuestion) {
    score += 12;
    feedback.push("Has discussion-driving close.");
  } else {
    feedback.push("End with a sharp CTA or question.");
  }

  if (hasPillarMatch) {
    score += 12;
    feedback.push("Aligned with your strategic content pillars.");
  } else {
    feedback.push("Tie this draft to one core pillar.");
  }

  if (hypeCount === 0) {
    score += 10;
  } else if (hypeCount === 1) {
    score += 6;
    feedback.push("Slightly hypey tone; keep precision high.");
  } else {
    score -= 6;
    feedback.push("Too much hype language; reduce generic buzzwords.");
  }

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 85 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";
  el("draftScore").textContent = `Score: ${score} / 100 (${grade})`;
  el("scoreFill").style.width = `${score}%`;
  el("scoreFeedback").innerHTML = feedback.map((f) => `<div class=\"item\">${escapeHtml(f)}</div>`).join("");
}

async function copyDraft() {
  const text = el("postDraft").value || "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    el("scoreFeedback").innerHTML = `<div class=\"item\">Draft copied to clipboard.</div>`;
  } catch {
    el("scoreFeedback").innerHTML = `<div class=\"item\">Could not access clipboard. Copy manually.</div>`;
  }
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = splitCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const parts = splitCSVLine(lines[i]);
    if (parts.length !== header.length) continue;
    const row = {};
    header.forEach((h, idx) => {
      row[h] = parts[idx];
    });
    rows.push(row);
  }

  return rows;
}

function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseDateSafe(s) {
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;

  const m = String(s).match(/^\w{3},\s(\w{3})\s(\d{1,2}),\s(\d{4})$/);
  if (!m) return null;
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const month = monthMap[m[1]];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[2]));
}

function normalizeAnalytics(rawRows) {
  return rawRows
    .map((r) => {
      const date = parseDateSafe(r.Date);
      if (!date) return null;
      return {
        date,
        impressions: Number(r.Impressions || 0),
        engagements: Number(r.Engagements || 0),
        likes: Number(r.Likes || 0),
        newFollows: Number(r["New follows"] || 0),
        unfollows: Number(r.Unfollows || 0),
        profileVisits: Number(r["Profile visits"] || 0),
        bookmarks: Number(r.Bookmarks || 0),
        replies: Number(r.Replies || 0),
        reposts: Number(r.Reposts || 0),
        createPost: Number(r["Create Post"] || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}

function sum(arr, key) {
  return arr.reduce((acc, r) => acc + (r[key] || 0), 0);
}

function avg(arr, key) {
  return arr.length ? sum(arr, key) / arr.length : 0;
}

function computeKPIs(data) {
  if (!data.length) return null;

  const last28 = data.slice(-28);
  const prev28 = data.slice(-56, -28);

  const imp = sum(last28, "impressions");
  const eng = sum(last28, "engagements");
  const follows = sum(last28, "newFollows");
  const unfollows = sum(last28, "unfollows");
  const pv = sum(last28, "profileVisits");
  const posts = sum(last28, "createPost");

  const pImp = sum(prev28, "impressions");
  const pEng = sum(prev28, "engagements");
  const pFollows = sum(prev28, "newFollows");

  const kpi = {
    impPerDay: imp / last28.length,
    engRate: imp ? (eng / imp) * 100 : 0,
    followsPerDay: follows / last28.length,
    followPer1k: imp ? (follows / imp) * 1000 : 0,
    netFollowPerDay: (follows - unfollows) / last28.length,
    pvPerDay: pv / last28.length,
    postsPerDay: posts / last28.length,
    deltaImp: pImp ? ((imp - pImp) / pImp) * 100 : 0,
    deltaEngRate: pImp ? ((eng / imp) * 100 - (pEng / pImp) * 100) : 0,
    deltaFollow1k: pImp ? (follows / imp) * 1000 - (pFollows / pImp) * 1000 : 0,
  };

  return kpi;
}

function renderAnalytics(kpi, data) {
  if (!kpi) return;
  analyticsKPIs = kpi;

  el("mImpPerDay").textContent = formatNum(kpi.impPerDay, 0);
  el("mEngRate").textContent = `${kpi.engRate.toFixed(2)}%`;
  el("mFollow1k").textContent = kpi.followPer1k.toFixed(2);

  el("dImpPerDay").textContent = `${signed(kpi.deltaImp)} vs previous 28d`;
  el("dEngRate").textContent = `${signed(kpi.deltaEngRate)} pp vs previous 28d`;
  el("dFollow1k").textContent = `${signed(kpi.deltaFollow1k)} vs previous 28d`;

  const summary = [
    `Window: last 28 days`,
    `Posts/day: ${kpi.postsPerDay.toFixed(2)}`,
    `Follows/day: ${kpi.followsPerDay.toFixed(2)} | Net/day: ${kpi.netFollowPerDay.toFixed(2)}`,
    `Profile visits/day: ${kpi.pvPerDay.toFixed(2)}`,
  ].join("\n");
  el("analyticsSummary").textContent = summary;

  renderDiagnostics(kpi);
  renderTopDays(data);
  renderNextActions();
  updateGoalProjection();
}

function renderTopDays(data) {
  const top = [...data].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const body = el("topDaysBody");
  body.innerHTML = "";
  if (!top.length) {
    body.innerHTML = `<tr><td colspan=\"5\" class=\"empty\">No data</td></tr>`;
    return;
  }

  top.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date.toLocaleDateString()}</td>
      <td>${formatNum(r.impressions, 0)}</td>
      <td>${formatNum(r.engagements, 0)}</td>
      <td>${formatNum(r.newFollows, 0)}</td>
      <td>${formatNum(r.profileVisits, 0)}</td>
    `;
    body.appendChild(tr);
  });
}

function renderDiagnostics(kpi) {
  const out = [];
  let focus = "Focus: Conversion + authority";
  if (kpi.followPer1k < 1) {
    out.push("Conversion is weak relative to reach. Add clearer audience promise + follow CTA in flagship posts.");
    focus = "Focus: Tighten conversion";
  } else if (kpi.followPer1k < 1.8) {
    out.push("Conversion is moderate. Improve closing CTA and profile positioning.");
    focus = "Focus: Sharpen positioning";
  } else {
    out.push("Conversion is strong. Scale distribution while keeping content quality high.");
    focus = "Focus: Scale reach";
  }

  if (kpi.engRate < 2.2) {
    out.push("Engagement rate is soft. Use stronger claims, concrete implications, and less generic phrasing.");
    focus = "Focus: Raise engagement quality";
  }

  if (kpi.postsPerDay < 1) {
    out.push("Posting cadence is low. Target minimum 1 high-context post per day.");
  } else if (kpi.postsPerDay > 3 && kpi.followPer1k < 1.2) {
    out.push("High volume, low conversion. Reduce volume and raise post depth.");
  }

  if (kpi.deltaImp > 20 && kpi.deltaFollow1k < 0) {
    out.push("Impressions are rising but conversion is dropping. Optimize profile + post positioning.");
  }

  const wrap = el("diagnostics");
  wrap.innerHTML = out.map((line) => `<div class=\"item\">${escapeHtml(line)}</div>`).join("");

  const paceText = kpi.followPer1k >= 1.8 ? "Pace: Efficient Growth" : "Pace: Distribution > Conversion";
  el("paceStatus").textContent = paceText;
  el("focusStatus").textContent = focus;
}

function getActionItems() {
  const boxes = qsa("#dailyChecklist input[type='checkbox']");
  const pending = boxes.filter((b) => !b.checked).slice(0, 3).map((b) => {
    const task = DAILY_TASKS.find((t) => t.id === b.dataset.id);
    return task ? task.text : "Complete pending daily task";
  });

  const items = [...pending];
  if (!el("operatorName").value.trim()) items.push("Set operator handoff profile in Operator Console.");
  if (!el("operatorShiftObjective").value.trim()) items.push("Define the current shift objective for the operator.");
  if (analyticsKPIs) {
    if (analyticsKPIs.followPer1k < 1) items.push("Rewrite post closes to include explicit reason-to-follow.");
    if (analyticsKPIs.engRate < 2.2) items.push("Use one stronger claim with a concrete number or source in today’s flagship post.");
    if (analyticsKPIs.postsPerDay < 1) items.push("Publish at least one flagship post today.");
  }
  return items.slice(0, 5);
}

function renderNextActions() {
  const wrap = el("nextActions");
  const items = getActionItems();
  wrap.innerHTML = items.length
    ? items.map((line) => `<div class=\"item\">${escapeHtml(line)}</div>`).join("")
    : `<div class=\"item\">All key actions complete. Run a new experiment.</div>`;
}

function generateTodayPlan() {
  const actions = getActionItems();
  const pillars = [el("pillar1").value, el("pillar2").value, el("pillar3").value, el("pillar4").value].filter(Boolean);
  const objective = analyticsKPIs && analyticsKPIs.followPer1k < 1 ? "improve conversion" : "increase reach with quality";

  const plan = [
    `Primary objective: ${objective}`,
    "",
    "Execution blocks:",
    "1) Research (20 min): Capture 3 fresh signals aligned to one pillar.",
    `2) Draft (30 min): Write flagship post in pillar '${pillars[0] || "core pillar"}'.`,
    "3) Optimize (10 min): Run draft score, revise to 80+.",
    "4) Publish + engage (30 min): Publish, then leave 8 strategic replies.",
    "5) Learn (10 min): Log result and one lesson in experiment tracker.",
    "",
    "Top priorities today:",
    ...actions.map((a, i) => `${i + 1}. ${a}`),
  ].join("\n");

  el("todayPlan").value = plan;
}

function applyPromptSeed(event) {
  const seed = event.currentTarget.dataset.seed || "";
  el("agentInput").value = seed;
  qsa(".nav-btn").forEach((b) => b.classList.remove("active"));
  const aiBtn = qsa(".nav-btn").find((b) => b.dataset.view === "ai");
  if (aiBtn) aiBtn.classList.add("active");
  qsa(".view").forEach((v) => v.classList.remove("active"));
  el("view-ai").classList.add("active");
}

function generateShiftReport() {
  const operatorName = el("operatorName").value.trim() || "Operator";
  const objective = el("operatorShiftObjective").value.trim() || "No objective set";
  const wins = el("shiftWins").value.trim() || "-";
  const blockers = el("shiftBlockers").value.trim() || "-";
  const opportunities = el("shiftOpportunities").value.trim() || "-";
  const nextSteps = el("shiftNextSteps").value.trim() || "-";

  const shiftDone = qsa("#shiftChecklist input[type='checkbox']").filter((b) => b.checked).length;
  const shiftTotal = qsa("#shiftChecklist input[type='checkbox']").length;

  const kpiLine = analyticsKPIs
    ? `KPI pulse (28d): Impressions/day ${formatNum(analyticsKPIs.impPerDay, 0)}, ER ${analyticsKPIs.engRate.toFixed(2)}%, Follows/1k ${analyticsKPIs.followPer1k.toFixed(2)}`
    : "KPI pulse: analytics not uploaded yet.";

  const report = [
    `Type2Future Operator Report`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Operator: ${operatorName}`,
    `Objective: ${objective}`,
    "",
    kpiLine,
    `Shift checklist completion: ${shiftDone}/${shiftTotal}`,
    "",
    `Wins:`,
    wins,
    "",
    `Blockers:`,
    blockers,
    "",
    `Opportunities:`,
    opportunities,
    "",
    `Next Steps:`,
    nextSteps,
  ].join("\n");

  el("shiftReportOutput").value = report;
}

async function copyShiftReport() {
  const txt = el("shiftReportOutput").value || "";
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
  } catch {}
}

function onCsvUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  file.text().then((text) => {
    const raw = parseCSV(text);
    analyticsData = normalizeAnalytics(raw);
    if (!analyticsData.length) {
      el("analyticsSummary").textContent = "Could not parse analytics CSV. Check column headers.";
      return;
    }

    localStorage.setItem(STORAGE.analytics, JSON.stringify(raw));
    renderAnalytics(computeKPIs(analyticsData), analyticsData);
  });
}

function loadDemoAnalytics() {
  const demo = [
    { Date: "Wed, Feb 11, 2026", Impressions: 906, Likes: 3, Engagements: 14, Bookmarks: 0, Shares: 0, "New follows": 0, Unfollows: 0, Replies: 1, Reposts: 0, "Profile visits": 4, "Create Post": 0 },
    { Date: "Tue, Feb 10, 2026", Impressions: 891, Likes: 1, Engagements: 7, Bookmarks: 0, Shares: 0, "New follows": 0, Unfollows: 0, Replies: 0, Reposts: 0, "Profile visits": 2, "Create Post": 0 },
    { Date: "Mon, Feb 9, 2026", Impressions: 965, Likes: 16, Engagements: 37, Bookmarks: 8, Shares: 0, "New follows": 2, Unfollows: 1, Replies: 2, Reposts: 1, "Profile visits": 8, "Create Post": 1 },
    { Date: "Sun, Feb 8, 2026", Impressions: 1787, Likes: 13, Engagements: 51, Bookmarks: 1, Shares: 0, "New follows": 0, Unfollows: 2, Replies: 3, Reposts: 0, "Profile visits": 9, "Create Post": 1 },
    { Date: "Sat, Feb 7, 2026", Impressions: 2450, Likes: 12, Engagements: 32, Bookmarks: 1, Shares: 0, "New follows": 0, Unfollows: 1, Replies: 1, Reposts: 1, "Profile visits": 7, "Create Post": 2 },
  ];
  analyticsData = normalizeAnalytics(demo);
  renderAnalytics(computeKPIs(analyticsData), analyticsData);
}

function loadAnalyticsFromStorage() {
  const raw = localStorage.getItem(STORAGE.analytics);
  if (!raw) {
    renderNextActions();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    analyticsData = normalizeAnalytics(parsed);
    renderAnalytics(computeKPIs(analyticsData), analyticsData);
  } catch {
    renderNextActions();
  }
}

function updateGoalProjection() {
  const current = Number(el("currentFollowers").value || 0);
  const target = Number(el("targetFollowers").value || 0);
  const targetDate = el("targetDate").value;

  const remaining = Math.max(0, target - current);
  const pace = analyticsKPIs ? Math.max(0.05, analyticsKPIs.netFollowPerDay || analyticsKPIs.followsPerDay || 0.05) : 0.8;
  const days = remaining > 0 ? Math.ceil(remaining / pace) : 0;

  el("daysToTarget").textContent = remaining === 0 ? "0" : String(days);

  if (targetDate) {
    const now = new Date();
    const due = new Date(targetDate);
    const diffDays = Math.max(1, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
    const needed = remaining / diffDays;
    el("neededPerDay").textContent = needed.toFixed(2);
  } else {
    el("neededPerDay").textContent = "Set target date";
  }

  saveSettings();
}

function initWeekPlanner() {
  const body = el("weekPlanBody");
  body.innerHTML = "";
  WEEK_DAYS.forEach((day, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${day}</td>
      <td><div class=\"slot\"><select data-plan=\"${i}-0-type\"><option>Flagship</option><option>Question</option><option>Thread</option><option>Reply Block</option><option>Off</option></select><input data-plan=\"${i}-0-note\" placeholder=\"Topic / purpose\" /></div></td>
      <td><div class=\"slot\"><select data-plan=\"${i}-1-type\"><option>Support</option><option>Question</option><option>Clip + insight</option><option>Reply Block</option><option>Off</option></select><input data-plan=\"${i}-1-note\" placeholder=\"Topic / purpose\" /></div></td>
      <td><div class=\"slot\"><select data-plan=\"${i}-2-type\"><option>Reply Sprint</option><option>Recap</option><option>Follow-up post</option><option>No post</option></select><input data-plan=\"${i}-2-note\" placeholder=\"Topic / purpose\" /></div></td>
    `;
    body.appendChild(tr);
  });
}

function saveWeekPlan() {
  const payload = {};
  qsa("[data-plan]").forEach((node) => {
    payload[node.dataset.plan] = node.value;
  });
  localStorage.setItem(STORAGE.weeklyPlan, JSON.stringify(payload));
}

function loadWeekPlan() {
  const raw = localStorage.getItem(STORAGE.weeklyPlan);
  if (!raw) return;
  try {
    const payload = JSON.parse(raw);
    qsa("[data-plan]").forEach((node) => {
      if (Object.prototype.hasOwnProperty.call(payload, node.dataset.plan)) {
        node.value = payload[node.dataset.plan];
      }
    });
  } catch {}
}

function addExperiment() {
  const hypothesis = el("expHypothesis").value.trim();
  const metric = el("expMetric").value.trim();
  const result = el("expResult").value.trim();
  const outcome = el("expOutcome").value;

  if (!hypothesis || !metric) return;

  const items = getExperiments();
  items.push({ hypothesis, metric, result, outcome, at: Date.now() });
  localStorage.setItem(STORAGE.experiments, JSON.stringify(items));

  el("expHypothesis").value = "";
  el("expMetric").value = "";
  el("expResult").value = "";

  renderExperiments();
}

function getExperiments() {
  const raw = localStorage.getItem(STORAGE.experiments);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadExperiments() {
  renderExperiments();
}

function renderExperiments() {
  const wrap = el("experimentList");
  const items = getExperiments().slice().reverse();
  if (!items.length) {
    wrap.innerHTML = `<div class=\"item\">No experiments logged yet.</div>`;
    return;
  }

  wrap.innerHTML = items
    .map((x) => {
      const date = new Date(x.at).toLocaleDateString();
      return `<div class=\"item\"><strong>${escapeHtml(x.hypothesis)}</strong><br/>Metric: ${escapeHtml(x.metric)}<br/>Result: ${escapeHtml(x.result || "-")}<br/>Outcome: ${escapeHtml(x.outcome)} · ${date}</div>`;
    })
    .join("");
}

function loadApiKey() {
  const k = localStorage.getItem(STORAGE.apiKey);
  if (k) el("apiKey").value = k;
}

function identityContext() {
  return [
    `Mission: ${el("northStar").value.trim()}`,
    `Audience: ${el("audience").value.trim()}`,
    `Positioning: ${el("positioning").value.trim()}`,
    `Pillars: ${[el("pillar1").value, el("pillar2").value, el("pillar3").value, el("pillar4").value].join(" | ")}`,
    `Rules: ${el("rules").value.trim()}`,
    `Skill Pack: ${el("skillPack").value.trim()}`,
  ].join("\n");
}

async function runAgent() {
  const key = el("apiKey").value.trim();
  const mode = el("agentMode").value;
  const model = el("modelName").value.trim() || "gpt-4.1-mini";
  const input = el("agentInput").value.trim();

  if (!key) {
    el("agentOutput").value = "Add API key first.";
    return;
  }

  localStorage.setItem(STORAGE.apiKey, key);

  const modeInstruction = {
    operator: "Create a complete operator shift brief: priorities, posting slots, engagement targets, escalation checks, and end-of-day report checklist.",
    planner: "Create a practical day plan with 5 steps, estimated time, and expected KPI impact.",
    ideate: "Generate 12 post ideas. For each: hook, signal, implication, close.",
    draft: "Write one complete high-performing post in this account's voice.",
    critique: "Critique draft brutally and rewrite to improve conversion and clarity.",
    repurpose: "Create 6 variants: short, long, contrarian, question-led, thread-opener, quote-tweet format.",
  }[mode];

  const system = [
    "You are Type2 Master Station AI, a senior social media strategist.",
    "Your job: maximize impact, authority, and follower growth for @type2future.",
    "Be concrete, tactical, and specific.",
    identityContext(),
    `Mode: ${modeInstruction}`,
  ].join("\n\n");

  const payload = {
    model,
    input: [
      { role: "system", content: [{ type: "text", text: system }] },
      { role: "user", content: [{ type: "text", text: input || "Use current context and produce best output." }] },
    ],
  };

  el("agentOutput").value = "Running agent...";

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data = await res.json();
    el("agentOutput").value = data.output_text || "No output text returned.";
  } catch (err) {
    el("agentOutput").value = `Agent error: ${err.message}`;
  }
}

function formatNum(v, digits = 2) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
}

function signed(v) {
  const s = v >= 0 ? "+" : "";
  return `${s}${v.toFixed(2)}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
