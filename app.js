const STORAGE = {
  analyticsRaw: "t2_min_analytics_raw",
  checklist: "t2_min_checklist",
  shiftObjective: "t2_min_shift_objective",
  voiceRules: "t2_min_voice_rules",
  intelNotes: "t2_min_intel_notes",
  postLogs: "t2_min_post_logs",
};

const DAILY_TASKS = [
  { id: "t1", text: "Review KPI diagnostics and choose one growth priority" },
  { id: "t2", text: "Study 3 benchmark accounts and extract one tactic" },
  { id: "t3", text: "Draft one flagship post and score it 80+" },
  { id: "t4", text: "Publish with clear reason-to-follow close" },
  { id: "t5", text: "Log post results in Review" },
];

const HOOKS = {
  thesis: [
    "Abundance is no longer a fantasy. It is a sequence of solved bottlenecks.",
    "The Kardashev trajectory is now an execution problem, not a theory problem.",
    "The biggest shift is not better models. It is better civilization design.",
  ],
  contrarian: [
    "Most creators optimize for virality. We should optimize for civilization progress.",
    "Cheap intelligence does not remove ambition. It multiplies it.",
    "The new moat is not code. It is taste, speed, and coherent vision.",
  ],
  prediction: [
    "In 24 months, agent-native workflows will be default for high performers.",
    "By 2030, acceleration mindset will separate builders from spectators.",
    "Soon, bottleneck removal will matter more than content volume.",
  ],
  question: [
    "What bottleneck would you remove first to accelerate abundance?",
    "If intelligence gets cheap, what becomes the new luxury?",
    "Which institution is least prepared for the next 5 years?",
  ],
};

const BENCHMARKS = [
  {
    handle: "lexfridman",
    name: "Lex Fridman",
    why: "High-trust frontier framing and clean narrative structure.",
    learn: "Use source signal + practical implication in one clear arc.",
    tags: ["signal", "authority"],
  },
  {
    handle: "demishassabis",
    name: "Demis Hassabis",
    why: "Science-backed updates that build credibility quickly.",
    learn: "Anchor claims to measurable progress, not abstract hype.",
    tags: ["signal", "technical"],
  },
  {
    handle: "sama",
    name: "Sam Altman",
    why: "Short posts with strategic implication and high shareability.",
    learn: "Compress the message without losing conviction.",
    tags: ["conversion", "brevity"],
  },
  {
    handle: "garrytan",
    name: "Garry Tan",
    why: "Practical techno-optimism with founder relevance.",
    learn: "Turn macro optimism into specific actions for builders.",
    tags: ["founders", "conversion"],
  },
  {
    handle: "beffjezos",
    name: "Beff",
    why: "Narrative overlap with e/acc and Kardashev framing.",
    learn: "Lead with high-energy hooks, then add structured clarity.",
    tags: ["kardashev", "hooks", "reach"],
  },
  {
    handle: "_sholtodouglas",
    name: "Sholto Douglas",
    why: "Technical future framing with useful timeline signals.",
    learn: "Pair technical observation with strategic consequence.",
    tags: ["technical", "signal"],
  },
  {
    handle: "elonmusk",
    name: "Elon Musk",
    why: "Upstream narrative driver for energy, space, and scale.",
    learn: "Open with first-principles framing and direct consequence.",
    tags: ["vision", "first-principles"],
  },
];

const el = (id) => document.getElementById(id);
const qsa = (s) => Array.from(document.querySelectorAll(s));

let analytics = [];
let kpi = null;

function init() {
  bindTabs();
  initChecklist();
  renderBenchmarks();
  populateSourceSelects();
  bindEvents();
  loadSaved();
  setTodayDate();
  renderPostLogs();
  renderActions();
  renderHeroBrief();
}

function bindTabs() {
  qsa(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      qsa(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      qsa(".panel").forEach((p) => p.classList.remove("active"));
      el(tab.dataset.target).classList.add("active");
    });
  });
}

function bindEvents() {
  el("csvFile").addEventListener("change", onCsvUpload);
  el("demoCsv").addEventListener("click", loadDemoCsv);
  el("genHook").addEventListener("click", genHook);
  el("buildDraft").addEventListener("click", buildDraft);
  el("scoreDraft").addEventListener("click", scoreDraft);
  el("copyDraft").addEventListener("click", copyDraft);
  el("assignStudy").addEventListener("click", assignStudy);
  el("saveIntelNotes").addEventListener("click", saveIntelNotes);
  el("addPostLog").addEventListener("click", addPostLog);
  el("shiftObjective").addEventListener("input", saveOperatorSettings);
  el("voiceRules").addEventListener("input", saveOperatorSettings);
}

function loadSaved() {
  const rawAnalytics = localStorage.getItem(STORAGE.analyticsRaw);
  if (rawAnalytics) {
    try {
      const parsed = JSON.parse(rawAnalytics);
      analytics = normalizeAnalytics(parsed);
      kpi = computeKpi(analytics);
      renderKpis();
      renderDiagnostics();
    } catch {
      // ignore malformed local data
    }
  }

  const rawChecklist = localStorage.getItem(STORAGE.checklist);
  if (rawChecklist) {
    try {
      const state = JSON.parse(rawChecklist);
      state.forEach((s) => {
        const box = document.querySelector(`#dailyChecklist input[data-id='${s.id}']`);
        if (box) box.checked = !!s.checked;
      });
    } catch {
      // ignore malformed local data
    }
  }
  updateChecklistProgress();

  el("shiftObjective").value = localStorage.getItem(STORAGE.shiftObjective) || "";
  const savedRules = localStorage.getItem(STORAGE.voiceRules);
  if (savedRules) el("voiceRules").value = savedRules;

  el("intelNotes").value = localStorage.getItem(STORAGE.intelNotes) || "";
}

function setTodayDate() {
  const d = new Date();
  el("logDate").value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initChecklist() {
  const wrap = el("dailyChecklist");
  wrap.innerHTML = "";
  DAILY_TASKS.forEach((task) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type=\"checkbox\" data-id=\"${task.id}\" /> ${escape(task.text)}`;
    wrap.appendChild(label);
  });

  qsa("#dailyChecklist input[type='checkbox']").forEach((box) => {
    box.addEventListener("change", () => {
      saveChecklist();
      updateChecklistProgress();
      renderActions();
    });
  });
}

function saveChecklist() {
  const state = qsa("#dailyChecklist input[type='checkbox']").map((b) => ({
    id: b.dataset.id,
    checked: b.checked,
  }));
  localStorage.setItem(STORAGE.checklist, JSON.stringify(state));
}

function getChecklistProgress() {
  const boxes = qsa("#dailyChecklist input[type='checkbox']");
  const done = boxes.filter((b) => b.checked).length;
  const total = boxes.length;
  const pct = total ? (done / total) * 100 : 0;
  return { done, total, pct };
}

function updateChecklistProgress() {
  const { done, total, pct } = getChecklistProgress();
  el("dailyProgress").style.width = `${pct}%`;
  el("dailyProgressText").textContent = `${done}/${total} complete`;
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

function parseDateSafe(value) {
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;
  const m = String(value).match(/^\w{3},\s(\w{3})\s(\d{1,2}),\s(\d{4})$/);
  if (!m) return null;
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  if (months[m[1]] === undefined) return null;
  return new Date(Number(m[3]), months[m[1]], Number(m[2]));
}

function normalizeAnalytics(rows) {
  return rows
    .map((r) => {
      const date = parseDateSafe(r.Date);
      if (!date) return null;
      return {
        date,
        impressions: Number(r.Impressions || 0),
        engagements: Number(r.Engagements || 0),
        newFollows: Number(r["New follows"] || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}

function sum(arr, key) {
  return arr.reduce((acc, x) => acc + (x[key] || 0), 0);
}

function computeKpi(data) {
  if (!data.length) return null;
  const last = data.slice(-28);
  const prev = data.slice(-56, -28);

  const imp = sum(last, "impressions");
  const eng = sum(last, "engagements");
  const follows = sum(last, "newFollows");

  const pImp = sum(prev, "impressions");
  const pEng = sum(prev, "engagements");
  const pFollows = sum(prev, "newFollows");

  return {
    impPerDay: imp / last.length,
    er: imp ? (eng / imp) * 100 : 0,
    f1k: imp ? (follows / imp) * 1000 : 0,
    dImp: pImp ? ((imp - pImp) / pImp) * 100 : 0,
    dEr: pImp ? (eng / imp) * 100 - (pEng / pImp) * 100 : 0,
    dF1k: pImp ? (follows / imp) * 1000 - (pFollows / pImp) * 1000 : 0,
  };
}

function renderKpis() {
  if (!kpi) return;
  el("mImp").textContent = num(kpi.impPerDay, 0);
  el("mEr").textContent = `${kpi.er.toFixed(2)}%`;
  el("mF1k").textContent = kpi.f1k.toFixed(2);
}

function renderDiagnostics() {
  const wrap = el("diagnostics");
  if (!kpi) {
    wrap.innerHTML = "<div>Upload analytics CSV to unlock diagnostics.</div>";
    return;
  }

  const lines = [
    `Impressions trend: ${signed(kpi.dImp)}% vs previous 28 days.`,
    `Engagement trend: ${signed(kpi.dEr)}pp.`,
    `Follow conversion trend: ${signed(kpi.dF1k)} follows per 1k impressions.`,
  ];

  if (kpi.f1k < 1) {
    lines.push("Priority: conversion is weak. End each flagship post with a specific reason to follow.");
  }
  if (kpi.er < 2.2) {
    lines.push("Priority: engagement is soft. Sharpen hook, signal, and implication.");
  }

  wrap.innerHTML = lines.map((x) => `<div>${escape(x)}</div>`).join("");
}

function renderActions() {
  const wrap = el("nextActions");
  const items = [];

  if (!kpi) items.push("Upload analytics in Today first.");
  if (kpi && kpi.f1k < 1) items.push("Write one explicit reason-to-follow close in today's post.");
  if (kpi && kpi.er < 2.2) items.push("Use one concrete signal and one practical implication.");

  const logs = getPostLogs();
  if (logs.length < 5) items.push("Log at least 5 posts in Review to unlock reliable pattern detection.");
  if (!el("shiftObjective").value.trim()) items.push("Set your weekly growth objective in Create.");

  const boxes = qsa("#dailyChecklist input[type='checkbox']");
  const pending = boxes
    .filter((b) => !b.checked)
    .slice(0, 2)
    .map((b) => {
      const task = DAILY_TASKS.find((t) => t.id === b.dataset.id);
      return task ? task.text : "Finish daily sprint";
    });

  items.push(...pending);

  wrap.innerHTML = items.length
    ? items.slice(0, 6).map((x) => `<div>${escape(x)}</div>`).join("")
    : "<div>Critical actions complete. Publish and move to Review.</div>";

  renderHeroBrief();
}

function renderHeroBrief() {
  const title = el("briefTitle");
  const focus = el("briefFocus");
  const list = el("briefList");
  const score = el("briefScore");
  if (!title || !focus || !list || !score) return;

  const logs = getPostLogs();
  const { done, total, pct } = getChecklistProgress();
  const objectiveSet = Boolean(el("shiftObjective")?.value.trim());

  let readiness = 0;
  let focusText = "Setup baseline and build consistency.";
  const insights = [];

  if (kpi) {
    readiness += 30;
    if (kpi.f1k < 1) {
      insights.push("Conversion gap: raise follows per 1k by strengthening the close.");
      focusText = "Lift conversion on flagship posts.";
    } else {
      insights.push(`Conversion is solid at ${kpi.f1k.toFixed(2)} f/1k. Scale winning structure.`);
      readiness += 8;
      focusText = "Scale your winning post structure.";
    }

    if (kpi.er < 2.2) {
      insights.push("Engagement is soft. Sharpen opening claim and source signal.");
      if (focusText === "Setup baseline and build consistency.") {
        focusText = "Increase engagement signal quality.";
      }
    } else {
      insights.push(`Engagement quality is healthy at ${kpi.er.toFixed(2)}%. Preserve clarity.`);
      readiness += 8;
    }
  } else {
    insights.push("Upload analytics CSV to unlock data-backed strategic priorities.");
  }

  if (objectiveSet) {
    readiness += 20;
  } else {
    insights.push("Set one weekly growth objective in Create to guide every draft.");
  }

  const logReadiness = Math.min(25, (logs.length / 5) * 25);
  readiness += logReadiness;
  if (logs.length < 5) {
    insights.push(`Log ${5 - logs.length} more posts in Review for reliable pattern detection.`);
  } else {
    insights.push("Review data depth is sufficient to trust pattern insights.");
  }

  readiness += Math.min(25, (pct / 100) * 25);
  insights.push(`Daily sprint progress: ${done}/${total} tasks complete.`);

  readiness = Math.max(0, Math.min(100, Math.round(readiness)));

  if (readiness >= 80) {
    title.textContent = "System aligned. Publish your flagship post today.";
  } else if (readiness >= 60) {
    title.textContent = "Momentum is good. Tighten one weak link and ship.";
  } else if (readiness >= 40) {
    title.textContent = "Foundation is partial. Finish setup before scaling.";
  } else {
    title.textContent = "Low readiness. Complete the essentials first.";
  }

  focus.textContent = `Focus: ${focusText}`;
  list.innerHTML = insights.slice(0, 4).map((item) => `<li>${escape(item)}</li>`).join("");
  score.textContent = `Execution Readiness: ${readiness}/100`;
}

function genHook() {
  const style = el("hookStyle").value;
  const objective = el("postObjective").value;
  const bank = HOOKS[style] || HOOKS.thesis;
  const base = bank[Math.floor(Math.random() * bank.length)];
  const suffix = {
    follow: " Follow for high-signal Type2Future frontier synthesis.",
    authority: " Practical implication below.",
    discussion: " What changes first in your view?",
  }[objective] || "";
  el("hookOutput").value = base + suffix;
}

function buildDraft() {
  const hook =
    el("hookOutput").value.trim() ||
    "The acceleration window is open, but most people still miss the implication.";
  const sourceAccount = el("sourceAccount").value;
  const signal = el("signalInput").value.trim();
  const insight = el("insightInput").value.trim();
  const close =
    el("closeInput").value.trim() ||
    "If this helps you think bigger and build faster, follow @type2future.";

  const src = sourceAccount
    ? `Source context: @${sourceAccount}`
    : "Source context: [account, event, or data point]";

  const draft = [
    hook,
    "",
    src,
    signal
      ? `Signal: ${signal}`
      : "Signal: [insert one concrete event, quote, or metric]",
    insight
      ? `Implication: ${insight}`
      : "Implication: [what this changes for builders and society]",
    "",
    close,
  ].join("\n");

  el("postDraft").value = draft;
}

function scoreDraft() {
  const text = el("postDraft").value.trim();
  const wrap = el("scoreFeedback");

  if (!text) {
    el("draftScore").textContent = "Score: 0 / 100";
    el("scoreBar").style.width = "0%";
    wrap.innerHTML = "<div>Draft is empty.</div>";
    return;
  }

  let score = 0;
  const notes = [];

  const len = text.length;
  const lines = text.split(/\n+/).filter(Boolean).length;
  const hasNumber = /\d/.test(text);
  const hasSignal = /(signal|data|study|report|according|source)/i.test(text);
  const hasImplication = /(implication|means|therefore|this changes|so what|result)/i.test(text);
  const hasQuestion = /\?/.test(text);
  const hasFollowCta = /follow/i.test(text);
  const hype = (text.match(/\b(lfg|insane|crazy|legend|wild|moon)\b/gi) || []).length;

  if (len >= 130 && len <= 420) {
    score += 22;
    notes.push("Good length for depth and readability.");
  } else if (len >= 90) {
    score += 12;
    notes.push("Length is acceptable; tighten structure.");
  } else {
    score += 4;
    notes.push("Too short for high-context conversion.");
  }

  if (lines >= 4) {
    score += 14;
    notes.push("Readable multi-line structure.");
  } else {
    score += 5;
    notes.push("Add line breaks for scanability.");
  }

  if (hasNumber || hasSignal) {
    score += 16;
    notes.push("Concrete source signal detected.");
  } else {
    notes.push("Add a concrete source signal or number.");
  }

  if (hasImplication) {
    score += 18;
    notes.push("Strong implication language.");
  } else {
    notes.push("State implication explicitly.");
  }

  if (hasQuestion) {
    score += 10;
    notes.push("Discussion trigger present.");
  }

  if (hasFollowCta) {
    score += 10;
    notes.push("Follow conversion close present.");
  } else {
    notes.push("Add a reason-to-follow close.");
  }

  if (hype === 0) {
    score += 10;
  } else if (hype === 1) {
    score += 5;
  } else {
    score -= 8;
    notes.push("Reduce hype words and keep precision high.");
  }

  score = Math.max(0, Math.min(100, score));
  el("draftScore").textContent = `Score: ${score} / 100`;
  el("scoreBar").style.width = `${score}%`;
  wrap.innerHTML = notes.map((n) => `<div>${escape(n)}</div>`).join("");
}

async function copyDraft() {
  const text = el("postDraft").value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard may fail silently
  }
}

function renderBenchmarks() {
  const wrap = el("benchmarkCards");
  wrap.innerHTML = "";

  BENCHMARKS.forEach((b) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = [
      `<h4><a href=\"https://x.com/${b.handle}\" target=\"_blank\" rel=\"noreferrer\">@${b.handle}</a> <span class=\"tiny\">${escape(b.name)}</span></h4>`,
      `<p><strong>Why:</strong> ${escape(b.why)}</p>`,
      `<p><strong>Learn:</strong> ${escape(b.learn)}</p>`,
    ].join("");
    wrap.appendChild(card);
  });
}

function populateSourceSelects() {
  const selects = [el("sourceAccount"), el("logSourceAccount")];
  selects.forEach((sel) => {
    sel.innerHTML = '<option value="">No reference account</option>';
    BENCHMARKS.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b.handle;
      opt.textContent = `@${b.handle} (${b.name})`;
      sel.appendChild(opt);
    });
  });
}

function candidateBenchmarks() {
  if (!kpi) return BENCHMARKS;
  if (kpi.f1k < 1) {
    return BENCHMARKS.filter((b) => b.tags.includes("conversion") || b.tags.includes("hooks"));
  }
  if (kpi.er < 2.2) {
    return BENCHMARKS.filter((b) => b.tags.includes("signal") || b.tags.includes("authority"));
  }
  return BENCHMARKS.filter((b) => b.tags.includes("technical") || b.tags.includes("vision"));
}

function assignStudy() {
  const pool = candidateBenchmarks();
  const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  const wrap = el("studyOutput");

  wrap.innerHTML = picks
    .map((p, i) => {
      return `<div><strong>Study ${i + 1}: @${p.handle}</strong><br/>Task: ${escape(p.learn)}<br/>Apply one tactic in today's draft.</div>`;
    })
    .join("");
}

function saveIntelNotes() {
  localStorage.setItem(STORAGE.intelNotes, el("intelNotes").value);
}

function saveOperatorSettings() {
  localStorage.setItem(STORAGE.shiftObjective, el("shiftObjective").value);
  localStorage.setItem(STORAGE.voiceRules, el("voiceRules").value);
  renderActions();
}

function getPostLogs() {
  const raw = localStorage.getItem(STORAGE.postLogs);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function addPostLog() {
  const log = {
    date: el("logDate").value,
    format: el("logFormat").value,
    pillar: el("logPillar").value,
    source: el("logSourceAccount").value,
    impressions: Number(el("logImp").value || 0),
    engagements: Number(el("logEng").value || 0),
    follows: Number(el("logFollows").value || 0),
    note: el("logNote").value.trim(),
    createdAt: Date.now(),
  };

  if (!log.impressions || !log.engagements) return;

  const logs = getPostLogs();
  logs.push(log);
  localStorage.setItem(STORAGE.postLogs, JSON.stringify(logs));

  ["logImp", "logEng", "logFollows", "logNote"].forEach((id) => {
    el(id).value = "";
  });

  renderPostLogs();
  renderActions();
}

function renderPostLogs() {
  const logs = getPostLogs();
  const wrap = el("postLogList");
  wrap.innerHTML = "";

  if (!logs.length) {
    wrap.innerHTML = '<article class="card"><p class="tiny">No logs yet.</p></article>';
    el("reviewInsights").innerHTML = "<div>Log at least 5 posts to unlock pattern insights.</div>";
    return;
  }

  const sorted = [...logs].sort((a, b) => b.createdAt - a.createdAt);
  sorted.slice(0, 30).forEach((r) => {
    const f1k = r.impressions ? (r.follows / r.impressions) * 1000 : 0;
    const er = r.impressions ? (r.engagements / r.impressions) * 100 : 0;

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = [
      `<h4>${escape(r.date || "-")} <span class="tiny">${escape(r.format)}</span></h4>`,
      `<p><strong>Pillar:</strong> ${escape(r.pillar)}</p>`,
      `<p><strong>F/1k:</strong> ${f1k.toFixed(2)} | <strong>ER:</strong> ${er.toFixed(2)}%</p>`,
      r.note ? `<p><strong>Note:</strong> ${escape(r.note)}</p>` : "",
    ].join("");
    wrap.appendChild(card);
  });

  renderReviewInsights(logs);
}

function renderReviewInsights(logs) {
  const byFormat = groupBy(logs, "format");
  const byPillar = groupBy(logs, "pillar");
  const bySource = groupBy(logs.filter((l) => l.source), "source");

  const bestFormat = topByMetric(byFormat, "f1k");
  const bestPillar = topByMetric(byPillar, "er");
  const bestSource = topByMetric(bySource, "f1k");

  const lines = [
    `Best format by follow conversion: ${bestFormat ? bestFormat.key : "-"} (${bestFormat ? bestFormat.value.toFixed(2) : "-"} f/1k)`,
    `Best pillar by engagement: ${bestPillar ? bestPillar.key : "-"} (${bestPillar ? bestPillar.value.toFixed(2) : "-"}%)`,
    `Best source-account lift: ${bestSource ? "@" + bestSource.key : "-"} (${bestSource ? bestSource.value.toFixed(2) : "-"} f/1k)`,
    "Action: next 3 posts should copy winning format and pillar combination.",
  ];

  el("reviewInsights").innerHTML = lines.map((x) => `<div>${escape(x)}</div>`).join("");
}

function groupBy(logs, key) {
  const out = {};
  logs.forEach((l) => {
    const k = l[key];
    if (!k) return;
    const f1k = l.impressions ? (l.follows / l.impressions) * 1000 : 0;
    const er = l.impressions ? (l.engagements / l.impressions) * 100 : 0;
    (out[k] ||= []).push({ f1k, er });
  });
  return out;
}

function topByMetric(grouped, metric) {
  const rows = Object.entries(grouped).map(([key, arr]) => ({
    key,
    value: arr.reduce((a, b) => a + b[metric], 0) / arr.length,
  }));

  if (!rows.length) return null;
  rows.sort((a, b) => b.value - a.value);
  return rows[0];
}

function onCsvUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  file.text().then((text) => {
    const raw = parseCSV(text);
    analytics = normalizeAnalytics(raw);
    if (!analytics.length) {
      el("diagnostics").innerHTML = "<div>Could not parse CSV. Check export format.</div>";
      return;
    }

    localStorage.setItem(STORAGE.analyticsRaw, JSON.stringify(raw));
    kpi = computeKpi(analytics);
    renderKpis();
    renderDiagnostics();
    renderActions();
  });
}

function loadDemoCsv() {
  const demo = [
    { Date: "Wed, Feb 11, 2026", Impressions: 906, Engagements: 14, "New follows": 0 },
    { Date: "Tue, Feb 10, 2026", Impressions: 891, Engagements: 7, "New follows": 0 },
    { Date: "Mon, Feb 9, 2026", Impressions: 965, Engagements: 37, "New follows": 2 },
    { Date: "Sun, Feb 8, 2026", Impressions: 1787, Engagements: 51, "New follows": 0 },
    { Date: "Sat, Feb 7, 2026", Impressions: 2450, Engagements: 32, "New follows": 0 },
  ];

  analytics = normalizeAnalytics(demo);
  kpi = computeKpi(analytics);
  renderKpis();
  renderDiagnostics();
  renderActions();
}

function num(v, digits = 2) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
}

function signed(v) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

function escape(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
