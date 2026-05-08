
const $ = id => document.getElementById(id);
const num = $('num'), res = $('result'), hist = $('history');

const isPrime = n => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++)if (n % i === 0) return false;
  return true;
};

const factorsArr = n => {
  let f = []; for (let i = 2; i * i <= n; i++)while (n % i === 0) { f.push(i); n /= i }
  if (n > 1) f.push(n); return f;
};

const save = t => {
  let h = JSON.parse(localStorage.getItem('hist') || '[]');
  h.unshift(t); h = h.slice(0, 20);
  localStorage.setItem('hist', JSON.stringify(h)); loadHist();
};

const show = (html) => { res.innerHTML = html; };

function check() {
  const n = +num.value; if (!Number.isInteger(n)) return;
  let html = `<strong>${n}</strong><br>`;
  html += isPrime(n) ? `<span class="badge good">Prime</span>` : `<span class="badge bad">Not Prime</span>`;
  html += `<span class="badge">${n % 2 ? 'Odd' : 'Even'}</span>`;
  show(html); save(`Checked ${n}`);
}

function factors() {
  const n = +num.value; if (n < 2) return;
  show(`Factors: ${factorsArr(n).join(' × ')}`); save(`Factors ${n}`);
}

function nextPrime() {
  let n = +num.value + 1; while (!isPrime(n)) n++;
  show(`Next Prime: <strong>${n}</strong>`); save(`Next ${n}`);
}

function prevPrime() {
  let n = +num.value - 1; while (n > 1 && !isPrime(n)) n--;
  show(n > 1 ? `Prev Prime: <strong>${n}</strong>` : `No previous prime`);
  save(`Prev ${n}`);
}

function listPrimes() {
  const N = +num.value; let a = [];
  for (let i = 2; i <= N; i++)if (isPrime(i)) a.push(i);
  show(a.join(', ')); save(`List ≤ ${N}`);
}

function countPrimes() {
  const N = +num.value; let c = 0;
  for (let i = 2; i <= N; i++)if (isPrime(i)) c++;
  show(`Total primes ≤ ${N}: <strong>${c}</strong>`); save(`Count ≤ ${N}`);
}

function pal() {
  const n = num.value;
  show(n === n.split('').reverse().join('') ? 'Palindrome' : 'Not Palindrome');
}

function perfect() {
  const n = +num.value; let s = 0;
  for (let i = 1; i < n; i++)if (n % i === 0) s += i;
  show(s === n ? 'Perfect Number' : 'Not Perfect');
}

function arm() {
  const n = num.value;
  const s = [...n].reduce((a, b) => a + b ** n.length, 0);
  show(s == n ? 'Armstrong' : 'Not Armstrong');
}

function copy() {
  navigator.clipboard.writeText(res.innerText);
}

function loadHist() {
  hist.innerHTML = '';
  (JSON.parse(localStorage.getItem('hist') || '[]'))
    .forEach(h => hist.innerHTML += `<div class="history-item">${h}</div>`);
}

$('theme').onclick = () => {
  const r = document.documentElement;
  r.dataset.theme = r.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', r.dataset.theme);
};

document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark';
loadHist();