// script.js — cleaned, loading integrated (shows on each conversion)
(function () {
    // DOM
    const category = document.getElementById('category');
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const valueInput = document.getElementById('valueInput');
    const convertButton = document.getElementById('convertButton');
    const resultEl = document.getElementById('result');
    const explain = document.getElementById('explain');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');

    const dValue = document.getElementById('dValue');
    const dUnit = document.getElementById('dUnit');
    const tValue = document.getElementById('tValue');
    const tUnit = document.getElementById('tUnit');
    const speedCalc = document.getElementById('speedCalc');
    const speedResult = document.getElementById('speedResult');
    const speedClear = document.getElementById('speedClear');

    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Loading elements
    const loadingRoot = document.getElementById('adan-loading');
    const loadingFill = document.getElementById('adan-loading-fill');
    const loadingGlow = document.getElementById('adan-loading-glow');
    const loadingPercent = document.getElementById('adan-loading-percent');
    let loadingActive = false;
    let loadingRAF = null;

    // Units
    const UNITS = {
        length: [
            { id: 'm', label: 'Meters (m)', toBase: v => v, fromBase: v => v },
            { id: 'km', label: 'Kilometres (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
            { id: 'cm', label: 'Centimeters (cm)', toBase: v => v * 0.01, fromBase: v => v / 0.01 },
            { id: 'mm', label: 'Millimeters (mm)', toBase: v => v * 0.001, fromBase: v => v / 0.001 },
            { id: 'ft', label: 'Feet (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 }
        ],
        temperature: [
            { id: 'c', label: 'Celsius (°C)' },
            { id: 'f', label: 'Fahrenheit (°F)' },
            { id: 'k', label: 'Kelvin (K)' }
        ],
        time: [
            { id: 's', label: 'Seconds (s)', toBase: v => v, fromBase: v => v },
            { id: 'min', label: 'Minutes (min)', toBase: v => v * 60, fromBase: v => v / 60 },
            { id: 'h', label: 'Hours (h)', toBase: v => v * 3600, fromBase: v => v / 3600 }
        ],
        speed: [
            { id: 'm/s', label: 'Meters per second (m/s)', toBase: v => v, fromBase: v => v },
            { id: 'km/h', label: 'Kilometres per hour (km/h)', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
            { id: 'mph', label: 'Miles per hour (mph)', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 }
        ]
    };

    // Helpers
    function fmt(n) {
        if (!isFinite(n)) return '—';
        return Number.parseFloat(n).toFixed(4).replace(/\.?0+$/, '');
    }
    function setExplain(html) { explain.innerHTML = html; }

    // Populate select lists
    function populateUnits(cat) {
        const list = UNITS[cat];
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';
        list.forEach(u => {
            const o1 = document.createElement('option'); o1.value = u.id; o1.textContent = u.label;
            fromUnit.appendChild(o1);
            toUnit.appendChild(o1.cloneNode(true));
        });
        setExplainForCategory(cat);
    }

    function setExplainForCategory(cat) {
        if (cat === 'length') {
            setExplain(`<strong>Length conversions</strong><br>1 km = 1000 m, 1 m = 100 cm, 1 ft = 0.3048 m.<br>Use meters as base. You cannot convert length → time directly.`);
        } else if (cat === 'temperature') {
            setExplain(`<strong>Temperature</strong><br>°F = (°C × 9/5) + 32; K = °C + 273.15.`);
        } else if (cat === 'time') {
            setExplain(`<strong>Time</strong><br>1 hour = 3600 seconds, 1 minute = 60 seconds.`);
        } else if (cat === 'speed') {
            setExplain(`<strong>Speed</strong><br>m/s is base. 1 km/h = 0.27778 m/s (m/s = km/h ÷ 3.6).`);
        } else setExplain('');
    }

    // Temperature
    function tempConvert(value, from, to) {
        if (from === to) return value;
        let c;
        if (from === 'c') c = value;
        if (from === 'f') c = (value - 32) * 5 / 9;
        if (from === 'k') c = value - 273.15;
        if (to === 'c') return c;
        if (to === 'f') return (c * 9 / 5) + 32;
        if (to === 'k') return c + 273.15;
    }

    // Conversion logic
    function convertCore() {
        const cat = category.value;
        const val = parseFloat(valueInput.value);
        const from = fromUnit.value;
        const to = toUnit.value;
        if (Number.isNaN(val)) { resultEl.textContent = 'Enter a numeric value.'; return; }

        if (cat === 'length') {
            const map = {}; UNITS.length.forEach(u => map[u.id] = u);
            const uFrom = map[from], uTo = map[to];
            const meters = uFrom.toBase(val);
            const out = uTo.fromBase(meters);
            resultEl.textContent = `${fmt(val)} ${uFrom.label} = ${fmt(out)} ${uTo.label}`;
            setExplain(`<strong>Formula:</strong> convert to meters then to target. Example: ${fmt(meters)} m → ${fmt(out)} ${uTo.label}`);
            return;
        }
        if (cat === 'time') {
            const map = {}; UNITS.time.forEach(u => map[u.id] = u);
            const tFrom = map[from], tTo = map[to];
            const seconds = tFrom.toBase(val);
            const out = tTo.fromBase(seconds);
            resultEl.textContent = `${fmt(val)} ${tFrom.label} = ${fmt(out)} ${tTo.label}`;
            setExplain(`<strong>Formula:</strong> convert to seconds then to target.`);
            return;
        }
        if (cat === 'speed') {
            const map = {}; UNITS.speed.forEach(u => map[u.id] = u);
            const sFrom = map[from], sTo = map[to];
            const ms = sFrom.toBase(val);
            const out = sTo.fromBase(ms);
            resultEl.textContent = `${fmt(val)} ${sFrom.label} = ${fmt(out)} ${sTo.label}`;
            setExplain(`<strong>Formula:</strong> convert to m/s then to target.`);
            return;
        }
        if (cat === 'temperature') {
            const out = tempConvert(val, from, to);
            resultEl.textContent = `${fmt(val)} ${labelForTemp(from)} = ${fmt(out)} ${labelForTemp(to)}`;
            setExplain(`<strong>Formula used:</strong> see temperature formulas.`);
            return;
        }
        resultEl.textContent = 'Conversion not supported';
    }

    function labelForTemp(code) {
        if (code === 'c') return '°C';
        if (code === 'f') return '°F';
        if (code === 'k') return 'K';
        return code;
    }

    // Speed tool
    function speedToolComputeCore() {
        const dv = parseFloat(dValue.value), tv = parseFloat(tValue.value);
        const du = dUnit.value, tu = tUnit.value;
        if (Number.isNaN(dv) || Number.isNaN(tv) || tv <= 0) {
            speedResult.textContent = 'Enter valid distance and time (time > 0).';
            return;
        }
        const dMeters = (du === 'm') ? dv : (du === 'km') ? dv * 1000 : dv * 1609.344;
        const tSeconds = (tu === 's') ? tv : (tu === 'min') ? tv * 60 : tv * 3600;
        const mps = dMeters / tSeconds;
        const kmh = mps * 3.6;
        const mph = mps / 0.44704;
        speedResult.textContent = `${fmt(mps)} m/s  —  ${fmt(kmh)} km/h  —  ${fmt(mph)} mph`;
        setExplain(`<strong>Speed formula:</strong> v = d ÷ t. d=${fmt(dMeters)} m, t=${fmt(tSeconds)} s → v=${fmt(mps)} m/s`);
    }

    // Invalid conversion guidance
    function handleInvalidConversion() {
        setExplain(`<strong>Note:</strong> You cannot convert units of different dimensions directly (e.g. meters → seconds). Use the Distance→Time tool to compute speed.`);
        resultEl.textContent = 'Incompatible units — see explanation below.';
    }

    // ===== Loading bar helper =====
    // showLoadingBar(duration) returns Promise resolved after animation completes
    function showLoadingBar(duration = 700) {
        if (!loadingRoot || loadingActive) return Promise.resolve(); // prevent overlap
        loadingActive = true;
        loadingRoot.classList.add('show');
        loadingFill.style.width = '0%';
        loadingGlow.style.transform = 'translateX(0)';
        loadingPercent.textContent = '0%';
        convertButton.disabled = true;
        speedCalc.disabled = true;
        copyButton.disabled = true;
        clearButton.disabled = true;

        const start = performance.now();
        return new Promise(resolve => {
            function step(now) {
                const t = Math.min(1, (now - start) / duration);
                const eased = t; // linear for authenticity; keep smooth feel
                const percent = Math.round(eased * 100);
                loadingFill.style.width = percent + '%';
                loadingGlow.style.transform = `translateX(${percent * 0.8}%)`;
                loadingPercent.textContent = percent + '%';
                if (t < 1) {
                    loadingRAF = requestAnimationFrame(step);
                } else {
                    // short delay for completion sheen
                    setTimeout(() => {
                        loadingFill.style.width = '100%';
                        loadingPercent.textContent = '100%';
                        // hide
                        loadingRoot.classList.remove('show');
                        loadingFill.style.width = '0%';
                        loadingGlow.style.transform = 'translateX(0)';
                        loadingPercent.textContent = '0%';
                        loadingActive = false;
                        convertButton.disabled = false;
                        speedCalc.disabled = false;
                        copyButton.disabled = false;
                        clearButton.disabled = false;
                        resolve();
                    }, 180);
                }
            }
            loadingRAF = requestAnimationFrame(step);
        });
    }

    // ===== Wire UI =====
    category.addEventListener('change', () => {
        populateUnits(category.value);
        resultEl.textContent = '—';
    });

    // convert button: show loading first, then run convert
    convertButton.addEventListener('click', (ev) => {
        ev.preventDefault();
        const catUnits = UNITS[category.value].map(u => u.id);
        if (!catUnits.includes(fromUnit.value) || !catUnits.includes(toUnit.value)) {
            handleInvalidConversion();
            return;
        }
        showLoadingBar(700).then(() => convertCore());
    });

    speedCalc.addEventListener('click', (ev) => {
        ev.preventDefault();
        showLoadingBar(900).then(() => speedToolComputeCore());
    });

    copyButton.addEventListener('click', () => {
        const text = resultEl.textContent;
        if (!text || text === '—') {
            resultEl.textContent = 'Nothing to copy';
            setTimeout(() => { if (resultEl.textContent === 'Nothing to copy') resultEl.textContent = '—'; }, 900);
            return;
        }
        navigator.clipboard?.writeText(text).then(() => {
            resultEl.textContent = text + '  (copied)';
            setTimeout(() => resultEl.textContent = text, 900);
        }).catch(() => {
            resultEl.textContent = text + '  (copy failed)';
            setTimeout(() => resultEl.textContent = text, 900);
        });
    });

    clearButton.addEventListener('click', () => {
        valueInput.value = '';
        resultEl.textContent = '—';
        setExplainForCategory(category.value);
    });
    speedClear.addEventListener('click', () => {
        dValue.value = ''; tValue.value = ''; speedResult.textContent = 'm/s —  km/h —  mph —';
    });

    // Theme persistence
    const THEME_KEY = 'adan_unit_converter_theme';
    function setTheme(light) {
        if (light) { body.classList.add('light'); themeToggle.textContent = 'Dark'; themeToggle.setAttribute('aria-pressed', 'true'); }
        else { body.classList.remove('light'); themeToggle.textContent = 'Light'; themeToggle.setAttribute('aria-pressed', 'false'); }
        try { localStorage.setItem(THEME_KEY, light ? 'light' : 'dark'); } catch (e) { }
    }
    themeToggle.addEventListener('click', () => { const isLight = body.classList.toggle('light'); setTheme(isLight); });
    (function loadTheme() { try { const s = localStorage.getItem(THEME_KEY); if (s === 'light') setTheme(true); else setTheme(false); } catch (e) { setTheme(false); } })();

    // keyboard helpers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const active = document.activeElement;
            if (active && (active.id === 'tValue' || active.id === 'dValue')) return;
            convertButton.click();
        }
        if (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey)) copyButton.click();
        if (e.key.toLowerCase() === 'r') clearButton.click();
    });

    // init populate
    populateUnits(category.value);

})();
