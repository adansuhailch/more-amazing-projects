// --- Helpers ---
const el = id => document.getElementById(id);
const dobEl = el('dob'), expectEl = el('expect'), tzEl = el('tz');
const calcBtn = el('calcBtn'), resultEl = el('result'), summaryTiles = el('summaryTiles');
const copyBtn = el('copyBtn'), saveBtn = el('saveBtn'), historyList = el('historyList');
const exportBtn = el('exportBtn'), clearHistory = el('clearHistory'), loadLast = el('loadLast');
const nextBirthdayEl = el('nextBirthday'), countdownEl = el('countdown'), progressBar = el('progressBar'), progressPercent = el('progressPercent');
const themeToggle = el('themeToggle');

// timezone helper (supports 'local' and 'utc')
function nowWithTZ(zone) {
  return zone === 'utc' ? new Date(new Date().toISOString()) : new Date();
}

// compute years, months, days precisely
function calcYMD(birth, now) {
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();

  if (d < 0) {
    // borrow days from previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
    d += prevMonth.getDate();
    m -= 1;
  }
  if (m < 0) {
    m += 12;
    y -= 1;
  }
  return { years: y, months: m, days: d };
}

function daysBetween(a, b) { // whole days
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((b - a) / ms);
}

function totalUnits(birth, now) {
  const ms = now - birth;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const monthsApprox = Math.floor((now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()) + (now.getDate() >= birth.getDate() ? 0 : -1));
  return { seconds, minutes, hours, days, weeks, monthsApprox };
}

function zodiacSign(birth) {
  const d = birth.getDate(), m = birth.getMonth() + 1;
  const z = [
    ["Capricorn", 1, 19], ["Aquarius", 1, 20, 2, 18], ["Pisces", 2, 19, 3, 20],
    ["Aries", 3, 21, 4, 19], ["Taurus", 4, 20, 5, 20], ["Gemini", 5, 21, 6, 20],
    ["Cancer", 6, 21, 7, 22], ["Leo", 7, 23, 8, 22], ["Virgo", 8, 23, 9, 22],
    ["Libra", 9, 23, 10, 22], ["Scorpio", 10, 23, 11, 21], ["Sagittarius", 11, 22, 12, 21], ["Capricorn", 12, 22, 12, 31]
  ];
  // simpler approach with thresholds
  if ((m == 1 && d <= 19) || (m == 12 && d >= 22)) return 'Capricorn';
  if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return 'Aquarius';
  if ((m == 2 && d >= 19) || (m == 3 && d <= 20)) return 'Pisces';
  if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return 'Aries';
  if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return 'Taurus';
  if ((m == 5 && d >= 21) || (m == 6 && d <= 20)) return 'Gemini';
  if ((m == 6 && d >= 21) || (m == 7 && d <= 22)) return 'Cancer';
  if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return 'Leo';
  if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return 'Virgo';
  if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return 'Libra';
  if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return 'Scorpio';
  if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return 'Sagittarius';
  return '';
}

// history storage
const HIST_KEY = 'age_calc_hist_v1';
function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; } catch (e) { return []; } }
function saveHist(h) { localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 60))); renderHist(); }
function pushHist(entry) {
  const h = loadHist(); h.unshift(entry); saveHist(h);
}
function renderHist() {
  const h = loadHist();
  historyList.innerHTML = '';
  if (!h.length) { historyList.innerHTML = '<div class="muted">No history yet</div>'; return; }
  h.forEach((it, idx) => {
    const div = document.createElement('div'); div.className = 'history-item';
    div.innerHTML = `<div style="display:flex;flex-direction:column">
          <strong>${it.dob}</strong>
          <span class="small">${it.summary}</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end">
          <span class="small">${new Date(it.t).toLocaleString()}</span>
          <div class="links" style="margin-top:6px">
            <button class="btn" onclick="useHistory(${idx})">Use</button>
            <button class="btn" onclick="deleteHistory(${idx})">Del</button>
          </div>
        </div>`;
    historyList.appendChild(div);
  });
}
window.useHistory = function (i) {
  const h = loadHist();
  if (!h[i]) return;
  dobEl.value = h[i].dob;
  performCalc();
};
window.deleteHistory = function (i) {
  const h = loadHist(); h.splice(i, 1); saveHist(h);
};

// main calculation
let countdownTimer = null;
function performCalc() {
  const dobVal = dobEl.value;
  if (!dobVal) { resultEl.innerHTML = '<div class="muted">Please select DOB first</div>'; return; }
  // parse date in local/timezone
  const zone = tzEl.value;
  const birth = new Date(dobVal + 'T00:00:00'); // midnight local by default
  const now = nowWithTZ(zone);
  if (birth > now) { resultEl.innerHTML = '<div class="muted">DOB is in the future — check it.</div>'; return; }

  const ymd = calcYMD(birth, now);
  const totals = totalUnits(birth, now);
  const zodiac = zodiacSign(birth);
  const nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBday <= now) nextBday.setFullYear(nextBday.getFullYear() + 1);
  // update UI
  resultEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div>
            <div class="small">Exact age</div>
            <div class="big">${ymd.years} yrs • ${ymd.months} m • ${ymd.days} d</div>
            <div class="small" style="margin-top:6px">Zodiac: <strong>${zodiac}</strong></div>
          </div>
          <div style="text-align:right">
            <div class="small">Total</div>
            <div style="font-weight:800">${totals.monthsApprox} months</div>
            <div class="small" style="margin-top:6px">${totals.days} days • ${totals.hours} hrs</div>
          </div>
        </div>
      `;

  // tiles
  summaryTiles.style.display = 'flex';
  summaryTiles.innerHTML = '';
  const tileData = [
    { label: 'Years', value: ymd.years },
    { label: 'Months', value: (ymd.years * 12 + ymd.months) },
    { label: 'Days', value: totals.days },
    { label: 'Weeks', value: totals.weeks },
    { label: 'Hours', value: totals.hours },
    { label: 'Seconds', value: totals.seconds }
  ];
  tileData.forEach(t => {
    const d = document.createElement('div'); d.className = 'tile';
    d.innerHTML = `<div style="font-weight:800">${t.value}</div><div class="small">${t.label}</div>`;
    summaryTiles.appendChild(d);
  });

  // next birthday
  nextBirthdayEl.textContent = nextBday.toDateString();
  // start countdown
  if (countdownTimer) clearInterval(countdownTimer);
  function updateCountdown() {
    const now2 = nowWithTZ(tzEl.value);
    let diff = nextBday - now2;
    if (diff <= 0) { countdownEl.textContent = 'Today! 🎉'; clearInterval(countdownTimer); return; }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= d * (1000 * 60 * 60 * 24);
    const h = Math.floor(diff / (1000 * 60 * 60));
    diff -= h * (1000 * 60 * 60);
    const min = Math.floor(diff / (1000 * 60));
    const s = Math.floor((diff / 1000) % 60);
    countdownEl.textContent = `${d}d ${h}h ${min}m ${s}s`;
  }
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);

  // progress
  const lifeExpect = Number(expectEl.value) || 80;
  const birthMs = birth.getTime();
  const nowMs = now.getTime();
  const lifeMs = lifeExpect * 365.25 * 24 * 60 * 60 * 1000;
  const pct = Math.min(100, Math.max(0, ((nowMs - birthMs) / lifeMs) * 100));
  progressBar.style.width = pct.toFixed(2) + '%';
  progressPercent.textContent = pct.toFixed(1) + '%';

  // last result text for copy
  lastResultText = `${dobVal} → ${ymd.years}y ${ymd.months}m ${ymd.days}d (${totals.days} days) • Zodiac: ${zodiac}`;

  // auto-save small summary to history (optional, but we will not auto-save; user clicks Save)
  // pushHist({ dob: dobVal, summary: `${ymd.years}y ${ymd.months}m ${ymd.days}d`, t: Date.now() });
}

// copy
let lastResultText = '';
copyBtn.addEventListener('click', () => {
  if (!lastResultText) { alert('No result to copy. Calculate first.'); return; }
  navigator.clipboard?.writeText(lastResultText).then(() => alert('Copied!')).catch(() => alert('Copy failed.'));
});

// save to history
saveBtn.addEventListener('click', () => {
  const dobVal = dobEl.value;
  if (!dobVal) { alert('Select DOB first.'); return; }
  const now = new Date();
  const entry = { dob: dobVal, summary: lastResultText || 'Calculated', t: Date.now() };
  pushHist(entry);
  alert('Saved to history.');
});

// export CSV
exportBtn.addEventListener('click', () => {
  const h = loadHist();
  if (!h.length) { alert('History empty. Save some results first.'); return; }
  const rows = [['DOB', 'Summary', 'SavedAt']];
  h.forEach(r => rows.push([r.dob, r.summary.replace(/,/g, ' '), new Date(r.t).toISOString()]));
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'age_history.csv'; a.click();
  URL.revokeObjectURL(url);
});

// clear history
clearHistory.addEventListener('click', () => {
  if (!confirm('Clear history?')) return;
  localStorage.removeItem(HIST_KEY);
  renderHist();
});

// load last
loadLast.addEventListener('click', () => {
  const h = loadHist();
  if (!h.length) { alert('No history saved.'); return; }
  dobEl.value = h[0].dob;
  performCalc();
});

// theme toggle
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
});

// keyboard: Enter triggers calc
dobEl.addEventListener('keydown', e => { if (e.key === 'Enter') performCalc(); });
// button click
calcBtn.addEventListener('click', performCalc);

// init defaults
(function init() {
  // try to set DOB placeholder to 2000-01-01 for quick testing
  // dobEl.value = '2000-01-01';
  renderHist();
})();