/* ============================================================
   COURSE STATE SYSTEM
   Shared across CS 180, CS 185, CS 210
   ============================================================ */

// ── Storage layer ──────────────────────────────────────────
const CourseState = {
  get(key)          { try { return localStorage.getItem(key); } catch(e) { return null; } },
  set(key, value)   { try { localStorage.setItem(key, value); } catch(e) {} },
  toggle(key)       { this.set(key, this.get(key) === "true" ? "false" : "true"); },
  getJSON(key)      { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch(e) { return {}; } },
  setJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} },
};

// ── Determine which course we're on ───────────────────────
const COURSE_ID = document.documentElement.dataset.course || "cs180";

// ── Track selector ────────────────────────────────────────
function setTrack(level) {
  CourseState.set(`${COURSE_ID}:track`, level);

  // Update button states
  document.querySelectorAll(".track-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.track === level);
    btn.setAttribute("aria-pressed", btn.dataset.track === level);
  });

  // Show/hide track-specific content blocks
  document.querySelectorAll("[data-track-content]").forEach(el => {
    const match = level === "all" || el.dataset.trackContent === level;
    el.style.display = match ? "" : "none";
    el.setAttribute("aria-hidden", match ? "false" : "true");
  });

  // Highlight track columns in calendar rows
  document.querySelectorAll(".cal-row, .algo-row").forEach(row => {
    row.dataset.activeTrack = level;
  });

  // Update summary bar
  const label = { n: "Novice Explorer", b: "Builder", a: "Architect", all: "All Tracks" };
  const indicator = document.getElementById("active-track-label");
  if (indicator) indicator.textContent = label[level] || "All Tracks";

  updateBadges();
}

// ── Completion tracking ───────────────────────────────────
function toggleComplete(id) {
  const key = `${COURSE_ID}:complete:${id}`;
  CourseState.toggle(key);
  updateCompletionUI(id);
  updateProgressBar();
  updateBadges();
}

function updateCompletionUI(id) {
  const key = `${COURSE_ID}:complete:${id}`;
  const done = CourseState.get(key) === "true";
  document.querySelectorAll(`[data-complete="${id}"]`).forEach(el => {
    if (el.tagName === "BUTTON") {
      el.textContent = done ? "✓ Done" : "Mark Complete";
      el.classList.toggle("completed", done);
      el.setAttribute("aria-pressed", done);
    } else {
      el.classList.toggle("item-done", done);
    }
  });
}

// ── Progress bar ──────────────────────────────────────────
function updateProgressBar() {
  const allItems = document.querySelectorAll("[data-complete]");
  const total = new Set([...allItems].map(el => el.dataset.complete)).size;
  const done  = [...new Set([...allItems].map(el => el.dataset.complete))]
                  .filter(id => CourseState.get(`${COURSE_ID}:complete:${id}`) === "true").length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const bar  = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  if (bar)  { bar.style.width = pct + "%"; bar.setAttribute("aria-valuenow", pct); }
  if (text) text.textContent = `${done} of ${total} units completed`;
}

// ── Recall toggle ─────────────────────────────────────────
function toggleRecall(id) {
  const box = document.getElementById(`recall-${id}`);
  const btn = document.querySelector(`[data-recall="${id}"]`);
  if (!box || !btn) return;
  const open = box.style.display !== "none";
  box.style.display = open ? "none" : "block";
  box.setAttribute("aria-hidden", open ? "true" : "false");
  btn.setAttribute("aria-expanded", open ? "false" : "true");
  btn.textContent = open ? "🧠 Quick Recall" : "✕ Hide Recall";
}

// ── DSA card expand/collapse ──────────────────────────────
function toggleCard(id) {
  const body = document.getElementById(`card-body-${id}`);
  const btn  = document.querySelector(`[data-card="${id}"]`);
  if (!body || !btn) return;
  const open = body.style.display !== "none";
  body.style.display   = open ? "none" : "block";
  body.setAttribute("aria-hidden", open ? "true" : "false");
  btn.setAttribute("aria-expanded", open ? "false" : "true");
  btn.classList.toggle("card-open", !open);
}

// ── Badge system ──────────────────────────────────────────
const BADGE_DEFS = {
  cs210: [
    { id:"novice",    label:"🌱 Applied Engineer",    req: n => n >= 4,  desc:"Complete 4+ units" },
    { id:"builder",   label:"🔨 Systems Builder",     req: n => n >= 8,  desc:"Complete 8+ units" },
    { id:"architect", label:"🔬 Algorithm Architect", req: n => n >= 12, desc:"Complete all units" },
  ],
  cs180: [
    { id:"explorer",  label:"🌱 AI Explorer",         req: n => n >= 3,  desc:"Complete 3+ projects" },
    { id:"builder",   label:"🔨 AI Builder",          req: n => n >= 6,  desc:"Complete 6+ projects" },
    { id:"architect", label:"🔬 AI Architect",        req: n => n >= 9,  desc:"Complete all projects" },
  ],
  cs185: [
    { id:"explorer",  label:"🌱 Data Explorer",       req: n => n >= 3,  desc:"Complete 3+ projects" },
    { id:"builder",   label:"🔨 ML Implementer",      req: n => n >= 6,  desc:"Complete 6+ projects" },
    { id:"architect", label:"🔬 ML Theorist",         req: n => n >= 9,  desc:"Complete all projects" },
  ],
};

function updateBadges() {
  const defs = BADGE_DEFS[COURSE_ID];
  if (!defs) return;

  const allIds = [...new Set(
    [...document.querySelectorAll("[data-complete]")].map(el => el.dataset.complete)
  )];
  const doneCount = allIds.filter(id => CourseState.get(`${COURSE_ID}:complete:${id}`) === "true").length;

  defs.forEach(({ id, label, req, desc }) => {
    const el = document.getElementById(`badge-${id}`);
    if (!el) return;
    const earned = req(doneCount);
    el.classList.toggle("badge-earned", earned);
    el.setAttribute("aria-label", earned ? `${label} — earned!` : `${label} — ${desc}`);
    const statusEl = el.querySelector(".badge-status");
    if (statusEl) statusEl.textContent = earned ? "Earned ✓" : desc;
  });
}

// ── Keyboard support for interactive elements ─────────────
document.addEventListener("keydown", e => {
  const el = document.activeElement;
  if (e.key === "Enter" || e.key === " ") {
    if (el.classList.contains("track-btn"))    { e.preventDefault(); el.click(); }
    if (el.classList.contains("recall-btn"))   { e.preventDefault(); el.click(); }
    if (el.classList.contains("complete-btn")) { e.preventDefault(); el.click(); }
    if (el.dataset.card)                       { e.preventDefault(); el.click(); }
  }
});

// ── Init on load ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Restore saved track
  const savedTrack = CourseState.get(`${COURSE_ID}:track`) || "all";
  setTrack(savedTrack);

  // Restore completion states
  document.querySelectorAll("[data-complete]").forEach(el => {
    updateCompletionUI(el.dataset.complete);
  });

  // Initial progress bar render
  updateProgressBar();

  // Initial badge check
  updateBadges();

  // All recall boxes start hidden
  document.querySelectorAll(".recall-box").forEach(box => {
    box.style.display = "none";
    box.setAttribute("aria-hidden", "true");
  });
});
