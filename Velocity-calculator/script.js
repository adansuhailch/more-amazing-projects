// Modern Velocity Calculator (index.html + style.css)
// Save as script.js and include after the HTML body.

(() => {
    // Elements
    const form = document.getElementById('velocity-form');
    const distanceEl = document.getElementById('distance');
    const distanceUnit = document.getElementById('distance-unit');
    const timeEl = document.getElementById('time');
    const timeUnit = document.getElementById('time-unit');

    const calcBtn = document.getElementById('calc-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-btn');
    const message = document.getElementById('message');

    const vMsEl = document.getElementById('v-ms');
    const vKmhEl = document.getElementById('v-kmh');
    const vMphEl = document.getElementById('v-mph');
    const progressBar = document.getElementById('progress-bar');

    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Constants for conversions
    const M_PER_KM = 1000;
    const M_PER_MILE = 1609.344;
    const SEC_PER_MIN = 60;
    const SEC_PER_HOUR = 3600;
    const MPS_TO_KMPH = 3.6;
    const MPS_TO_MPH = 2.2369362920544;

    // Utility: convert input distance -> meters
    function distanceToMeters(value, unit) {
        if (unit === 'm') return value;
        if (unit === 'km') return value * M_PER_KM;
        if (unit === 'mi') return value * M_PER_MILE;
        return value;
    }

    // Utility: convert time -> seconds
    function timeToSeconds(value, unit) {
        if (unit === 's') return value;
        if (unit === 'min') return value * SEC_PER_MIN;
        if (unit === 'h') return value * SEC_PER_HOUR;
        return value;
    }

    // Format number with upto 3 decimals, remove trailing zeros
    function fmt(num) {
        if (!isFinite(num)) return '—';
        const s = Number.parseFloat(num).toFixed(3);
        return s.replace(/\.?0+$/, '');
    }

    // Animate number value using requestAnimationFrame
    function animateValue(el, from, to, duration = 700) {
        const start = performance.now();
        const diff = to - from;
        function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // smooth ease
            const cur = from + diff * eased;
            el.textContent = fmt(cur);
            if (t < 1) requestAnimationFrame(frame);
            else el.textContent = fmt(to);
        }
        requestAnimationFrame(frame);
    }

    // Mini progress animation
    function setProgress(perc) {
        progressBar.style.width = `${Math.max(0, Math.min(100, perc))}%`;
    }

    // History handling (localStorage)
    const HISTORY_KEY = 'velocity_history_v1';
    function loadHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }
    function saveHistory(arr) {
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch { }
    }
    function addHistoryItem(item) {
        const arr = loadHistory();
        arr.unshift(item);
        saveHistory(arr);
        renderHistory();
    }
    function clearHistory() {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
    }
    function renderHistory() {
        const arr = loadHistory();
        historyList.innerHTML = '';
        if (!arr.length) {
            const li = document.createElement('li');
            li.textContent = 'No history yet.';
            li.style.opacity = '0.7';
            historyList.appendChild(li);
            return;
        }
        arr.forEach((h, idx) => {
            const li = document.createElement('li');
            const left = document.createElement('div');
            left.innerHTML = `<strong>${h.inputStr}</strong><div class="meta">${h.timeStr}</div>`;
            const right = document.createElement('div');
            right.style.display = 'flex';
            right.style.gap = '8px';
            right.style.alignItems = 'center';
            right.innerHTML = `<div style="text-align:right;font-weight:700">${h.vms} m/s</div>`;
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn small ghost';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard?.writeText(`${h.vms} m/s | ${h.kmh} km/h | ${h.mph} mph`).then(() => {
                    message.textContent = 'Result copied to clipboard';
                    setTimeout(() => message.textContent = '', 1500);
                }).catch(() => {
                    message.textContent = 'Copy failed (clipboard blocked)';
                });
            });
            right.appendChild(copyBtn);
            li.appendChild(left);
            li.appendChild(right);
            historyList.appendChild(li);
        });
    }

    // Calculation core
    function calculateVelocity(distanceVal, distanceUnitVal, timeVal, timeUnitVal) {
        const dMeters = distanceToMeters(distanceVal, distanceUnitVal);
        const tSeconds = timeToSeconds(timeVal, timeUnitVal);
        if (tSeconds <= 0) return { error: 'Time must be greater than 0' };
        const vMs = dMeters / tSeconds;
        const vKmh = vMs * MPS_TO_KMPH;
        const vMph = vMs * MPS_TO_MPH;
        return { vMs, vKmh, vMph };
    }

    // Form submit handler
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        message.textContent = '';

        const distanceVal = parseFloat(distanceEl.value);
        const timeVal = parseFloat(timeEl.value);
        const dUnit = distanceUnit.value;
        const tUnit = timeUnit.value;

        if (Number.isNaN(distanceVal) || Number.isNaN(timeVal)) {
            message.textContent = 'Please enter valid numeric values for distance and time.';
            return;
        }
        if (!isFinite(distanceVal) || !isFinite(timeVal)) {
            message.textContent = 'Values must be finite numbers.';
            return;
        }
        if (timeVal <= 0) {
            message.textContent = 'Time must be greater than 0.';
            return;
        }

        // small UI: disable button briefly and show progress
        calcBtn.disabled = true;
        setProgress(15);

        // compute
        const result = calculateVelocity(distanceVal, dUnit, timeVal, tUnit);
        if (result.error) {
            message.textContent = result.error;
            calcBtn.disabled = false;
            setProgress(0);
            return;
        }

        // animate progress and numbers
        setTimeout(() => setProgress(60), 150);
        const vms = result.vMs;
        const vkmh = result.vKmh;
        const vmph = result.vMph;

        animateValue(vMsEl, parseFloat(vMsEl.textContent) || 0, vms, 700);
        animateValue(vKmhEl, parseFloat(vKmhEl.textContent) || 0, vkmh, 700);
        animateValue(vMphEl, parseFloat(vMphEl.textContent) || 0, vmph, 700);

        // save to history (formatted)
        const now = new Date();
        const timeStr = now.toLocaleString();
        const inputStr = `${distanceVal} ${dUnit} / ${timeVal} ${tUnit}`;
        const h = {
            inputStr,
            timeStr,
            vms: fmt(vms),
            kmh: fmt(vkmh),
            mph: fmt(vmph)
        };
        // update progress to full after animation completes
        setTimeout(() => {
            setProgress(100);
            addHistoryItem(h);
            message.textContent = 'Calculated successfully';
            setTimeout(() => { message.textContent = ''; setProgress(0); calcBtn.disabled = false; }, 900);
        }, 800);
    });

    // Copy last result
    copyBtn.addEventListener('click', () => {
        const last = loadHistory()[0];
        if (!last) {
            message.textContent = 'No result to copy';
            setTimeout(() => message.textContent = '', 1400);
            return;
        }
        const text = `${last.vms} m/s  •  ${last.kmh} km/h  •  ${last.mph} mph`;
        navigator.clipboard?.writeText(text).then(() => {
            message.textContent = 'Last result copied';
            setTimeout(() => message.textContent = '', 1400);
        }).catch(() => {
            message.textContent = 'Copy failed (clipboard blocked)';
            setTimeout(() => message.textContent = '', 1400);
        });
    });

    // Reset button (and keyboard R)
    resetBtn.addEventListener('click', () => {
        distanceEl.value = '';
        timeEl.value = '';
        distanceUnit.value = 'm';
        timeUnit.value = 's';
        vMsEl.textContent = '—';
        vKmhEl.textContent = '—';
        vMphEl.textContent = '—';
        setProgress(0);
        message.textContent = 'Reset';
        setTimeout(() => message.textContent = '', 900);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r') resetBtn.click();
    });

    // History clear
    clearHistoryBtn.addEventListener('click', () => {
        if (!confirm('Clear calculation history?')) return;
        clearHistory();
    });

    // Small helpers
    function fmt(num) {
        if (!isFinite(num)) return '—';
        return Number.parseFloat(num).toFixed(3).replace(/\.?0+$/, '');
    }

    // Initialize page
    function init() {
        renderHistory();
        vMsEl.textContent = '—';
        vKmhEl.textContent = '—';
        vMphEl.textContent = '—';
        setProgress(0);
    }

    init();

})();
