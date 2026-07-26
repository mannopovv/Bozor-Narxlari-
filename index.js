(function () {
    // hex source of truth per category — used for solid borders and a soft tinted background
    const CATEGORY_META = {
        'sabzavot': { label: "Sabzavotlar", icon: "🥕", color: "#7A8B4A" },
        'meva': { label: "Mevalar", icon: "🍇", color: "#B33A3A" },
        'gosht-sut': { label: "Go'sht & sut", icon: "🥩", color: "#6B4A6E" },
        'don': { label: "Don mahsuloti", icon: "🌾", color: "#E8A33D" },
        'ziravor': { label: "Ziravor & ko'kat", icon: "🌿", color: "#3F6B52" },
        'boshqa': { label: "Boshqa", icon: "📦", color: "#3E7C7F" }
    };

    function hexToRgba(hex, alpha) {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // per-product emoji "photo" shown on each price tag
    const PRODUCT_ICONS = {
        // sabzavot — O'zbekiston bozorlarida keng tarqalgan sabzavotlar
        "Kartoshka": "🥔", "Piyoz": "🧅", "Sabzi": "🥕", "Pomidor": "🍅", "Bodring": "🥒",
        "Karam": "🥬", "Qalampir": "🫑", "Baqlajon": "🍆", "Lavlagi": "🍠", "Rediska": "🫜",
        "Turp": "🫜", "Qovoq": "🎃", "Sholg'om": "🫜", "Brokkoli": "🥦", "Gulkaram": "🥦",
        "Ismaloq": "🍃", "Salat bargi": "🥗", "Selderey": "🌿", "Loviya": "🫘",
        "Ko'k no'xat": "🫛", "Makkajo'xori": "🌽", "Achchiq qalampir": "🌶️",

        // meva — O'zbekiston bog'larida yetishtiriladigan mevalar
        "Olma": "🍎", "Uzum": "🍇", "Gilos": "🍒", "Tarvuz": "🍉", "Qovun": "🍈",
        "Banan": "🍌", "Apelsin": "🍊", "Nok": "🍐", "Shaftoli": "🍑", "Anor": "🔴",
        "Behi": "🍐", "Xurmo": "🟠", "Qulupnay": "🍓", "O'rik": "🟠", "Olcha": "🍒",
        "Mandarin": "🍊", "Limon": "🍋", "Anjir": "🟤",

        "Go'sht (mol)": "🥩", "Go'sht (qo'y)": "🍖", "Go'sht (echki)": "🐐", "Tovuq go'shti": "🍗",
        "O'rdak go'shti": "🦆", "G'oz go'shti": "🦢", "Bedana go'shti": "🐦", "Ot go'shti": "🐴",
        "Baliq": "🐟", "Qiyma": "🥩", "Qazi": "🌭", "Kolbasa": "🌭", "Sosiska": "🌭", "Jigar": "🟤",
        "Dumba yog'i": "🧈", "Bedana tuxumi": "🥚",
        "Tuxum (10 dona)": "🥚", "Sut": "🥛", "Qatiq": "🍶", "Ayron": "🥛", "Suzma": "🥣",
        "Tvorog": "🧀", "Pishloq": "🧀", "Qaymoq": "🥛", "Sariyog'": "🧈",
        "Guruch": "🍚", "Un": "🌾", "Yog'": "🫒", "Makaron": "🍝",
        "Grechka": "🌾", "Suli yormasi": "🌾", "Arpa yormasi": "🌾", "Tariq": "🌾",
        "Vermishel": "🍝", "Manka": "🌾", "Non": "🍞", "Bug'doy": "🌾", "Mosh": "🫘",

        "Sarimsoq": "🧄", "Ukrop": "🌿", "Petrushka": "🌿", "Ko'k piyoz": "🌱",
        "Qora qalampir": "⚫", "Zira": "🟤", "Rayhon": "🌿", "Kashnich": "🌿",
        "Yalpiz": "🍃", "Za'faron": "🟡", "Dolchin": "🟤", "Lavr bargi": "🍃",
        "Tuz": "🧂", "Xantal": "🟡"
    };
    const DEFAULT_ICON = "🛒";

    // eng arzon mahsulotga qarab taom taklif qilish uchun
    const DISH_SUGGESTIONS = {
        "Kartoshka": { dish: "Kartoshka qovurdoq", note: "arzonlashdi — qovurdoq pishirish uchun ayni vaqti!" },
        "Sabzi": { dish: "O'zbek oshi (palov)", note: "arzon — palov qaynatish payti keldi!" },
        "Piyoz": { dish: "Mastava", note: "arzonlashdi — issiq mastava tayyorlang!" },
        "Pomidor": { dish: "Achichuq salat", note: "arzon — yozgi salat vaqti!" },
        "Bodring": { dish: "Achichuq salat", note: "arzon — salat uchun ayni fursat!" },
        "Baqlajon": { dish: "Baqlajon qovurdoq", note: "arzonlashdi — qovurdoq qiling!" },
        "Qovoq": { dish: "Qovoqli somsa", note: "arzon — somsa pishirish uchun zo'r payt!" },
        "Karam": { dish: "Karam qovurdoq", note: "arzonlashdi — issiq taom uchun ayni vaqt!" },
        "Loviya": { dish: "Loviyali sho'rva", note: "arzon — sho'rva pishirish payti!" },
        "Makkajo'xori": { dish: "Qaynatilgan makkajo'xori", note: "arzonlashdi — yozgi gazak uchun mos!" },
        "Tarvuz": { dish: "Yozgi tarvuz desert", note: "arzon — issiq kunlarga mos!" },
        "Qovun": { dish: "Qovun murabbosi", note: "arzonlashdi — shirinlik uchun ayni fursat!" },
        "Uzum": { dish: "Uzumli desert", note: "arzonlashdi — mazali desert tayyorlang!" },
        "Olma": { dish: "Olma murabbosi", note: "arzon — murabbo qaynatish uchun ayni vaqt!" },
        "Anor": { dish: "Anorli salat", note: "arzonlashdi — vitaminli desert vaqti!" },
        "Go'sht (mol)": { dish: "Norin", note: "arzonlashdi — norin tayyorlash payti!" },
        "Go'sht (qo'y)": { dish: "Qo'y go'shtli osh", note: "arzon — to'yona palov uchun ayni fursat!" },
        "Tovuq go'shti": { dish: "Tovuq sho'rva", note: "arzon — issiq sho'rva payti!" },
        "Baliq": { dish: "Qovurilgan baliq", note: "arzonlashdi — baliq taomi uchun ayni vaqt!" },
        "Guruch": { dish: "Osh (palov)", note: "arzon — palov qaynatish uchun ayni fursat!" },
        "Un": { dish: "Uy noni yoki lag'mon", note: "arzon — uy nonini pishiring!" },
        "Sarimsoq": { dish: "Achchiq-chuchuk sous", note: "arzonlashdi — taomlaringizga mazza qo'shing!" },
        "Non": { dish: "Choy-nonushta", note: "arzon — issiq non bilan choy ichish vaqti!" }
    };

    // ba'zi mahsulotlar "kg" o'rniga boshqa birlikda sotiladi
    const UNIT_OVERRIDES = {
        "Makkajo'xori": "dona",
        "Qatiq": "litr",
        "Non": "dona",
        "Ayron": "litr",
        "Bedana tuxumi": "dona"
    };

    const PRODUCTS_BY_CATEGORY = {
        'sabzavot': [
            "Kartoshka", "Piyoz", "Sabzi", "Pomidor", "Bodring", "Karam", "Qalampir", "Baqlajon",
            "Lavlagi", "Rediska", "Turp", "Qovoq", "Sholg'om", "Brokkoli", "Gulkaram", "Ismaloq",
            "Salat bargi", "Selderey", "Loviya", "Ko'k no'xat", "Makkajo'xori", "Achchiq qalampir"
        ],
        'meva': [
            "Olma", "Uzum", "Gilos", "Tarvuz", "Qovun", "Banan", "Apelsin", "Nok", "Shaftoli",
            "Anor", "Behi", "Xurmo", "Qulupnay", "O'rik", "Olcha", "Mandarin", "Limon", "Anjir"
        ],
        'gosht-sut': [
            "Go'sht (mol)", "Go'sht (qo'y)", "Go'sht (echki)", "Tovuq go'shti", "O'rdak go'shti",
            "G'oz go'shti", "Bedana go'shti", "Ot go'shti", "Baliq", "Qiyma", "Qazi", "Kolbasa",
            "Sosiska", "Jigar", "Dumba yog'i", "Bedana tuxumi", "Tuxum (10 dona)", "Sut", "Qatiq",
            "Ayron", "Suzma", "Tvorog", "Pishloq", "Qaymoq", "Sariyog'"
        ],
        'don': [
            "Guruch", "Un", "Yog'", "Makaron", "Grechka", "Suli yormasi", "Arpa yormasi",
            "Tariq", "Vermishel", "Manka", "Non", "Bug'doy", "Mosh"
        ],
        'ziravor': [
            "Sarimsoq", "Ukrop", "Petrushka", "Ko'k piyoz", "Qora qalampir", "Zira",
            "Rayhon", "Kashnich", "Yalpiz", "Za'faron", "Dolchin", "Lavr bargi", "Tuz", "Xantal"
        ],
        'boshqa': []
    };

    const MARKETS = ["Chorsu bozori", "Oloy bozori", "Qo'ylik bozori", "Farhod bozori", "Beshqozon bozori"];

    let entries = []; // {id, market, product, category, price, unit, ts}
    let activeCategory = '';
    const basket = new Map(); // product -> {price, unit}

    const $ = (sel) => document.querySelector(sel);
    const board = $('#board');
    const marketFilter = $('#marketFilter');
    const sortFilter = $('#sortFilter');
    const searchBox = $('#searchBox');
    const toast = $('#toast');
    const statsRow = $('#statsRow');
    const dishTipWrap = $('#dishTipWrap');
    const basketBar = $('#basketBar');
    const tabsNav = $('#categoryTabs');
    const tabIndicator = $('#tabIndicator');
    const inCategory = $('#inCategory');
    const inProduct = $('#inProduct');
    const productList = $('#productList');

    // ---------- ripple micro-interaction ----------
    function attachRipple(el) {
        el.addEventListener('click', (e) => {
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height) * 1.6;
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            el.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }
    document.querySelectorAll('.add-btn, .ghost-btn, .submit-btn, .tab').forEach(attachRipple);

    // ---------- tungi rejim (dark mode) ----------
    const themeToggle = $('#themeToggle');
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    async function loadTheme() {
        let theme = 'light';
        try {
            const res = await window.storage.get('bozor-theme', false);
            if (res && res.value) theme = res.value;
        } catch (e) { /* birinchi marta ishga tushirilganda kalit topilmaydi */ }
        applyTheme(theme);
    }
    themeToggle.addEventListener('click', async () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        themeToggle.classList.remove('spin');
        void themeToggle.offsetWidth; // reflow — animatsiyani qayta ishga tushirish uchun
        themeToggle.classList.add('spin');
        try { await window.storage.set('bozor-theme', next, false); } catch (e) { /* jim o'tkazamiz */ }
    });
    loadTheme();

    // narx muvaffaqiyatli qo'shilganda tugma atrofida yengil zarrachalar sochiladi
    function burstParticles(anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const colors = ['var(--saffron)', 'var(--teal)', 'var(--pomegranate)', 'var(--olive)'];
        for (let i = 0; i < 10; i++) {
            const p = document.createElement('span');
            p.className = 'burst-particle';
            const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
            const dist = 40 + Math.random() * 35;
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            p.style.background = colors[i % colors.length];
            p.style.left = (rect.left + rect.width / 2) + 'px';
            p.style.top = (rect.top + rect.height / 2) + 'px';
            document.body.appendChild(p);
            p.addEventListener('animationend', () => p.remove());
        }
    }

    function showToast(msg, actionLabel, actionFn) {
        toast.innerHTML = '';
        const text = document.createElement('span');
        text.textContent = msg;
        toast.appendChild(text);
        if (actionLabel && actionFn) {
            const btn = document.createElement('button');
            btn.className = 'toast-action';
            btn.textContent = actionLabel;
            btn.addEventListener('click', () => {
                actionFn();
                toast.classList.remove('show');
            });
            toast.appendChild(btn);
        }
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('show'), actionLabel ? 5000 : 2200);
    }

    function fmt(n) {
        return new Intl.NumberFormat('uz-UZ').format(Math.round(n));
    }

    function todayLabel() {
        const d = new Date();
        const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
        const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
        return `${days[d.getDay()]}<br><b>${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}</b>`;
    }
    $('#todayBadge').innerHTML = todayLabel();

    // populate market filter + form select
    MARKETS.forEach(m => {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        marketFilter.appendChild(o);
    });

    function refreshDatalist() {
        const cat = inCategory.value;
        productList.innerHTML = '';
        (PRODUCTS_BY_CATEGORY[cat] || []).forEach(p => {
            const o = document.createElement('option');
            o.value = p;
            productList.appendChild(o);
        });
    }
    inCategory.addEventListener('change', refreshDatalist);
    refreshDatalist();

    function categoryOf(product) {
        for (const cat in PRODUCTS_BY_CATEGORY) {
            if (PRODUCTS_BY_CATEGORY[cat].includes(product)) return cat;
        }
        return 'boshqa';
    }

    // ---------- storage ----------
    const PERSONAL_KEY = 'bozor-entries-v2';
    const SHARED_KEY = 'bozor-entries-shared-v1';
    let sharedMode = false;

    async function loadEntries() {
        try {
            const key = sharedMode ? SHARED_KEY : PERSONAL_KEY;
            const res = await window.storage.get(key, sharedMode);
            entries = res && res.value ? JSON.parse(res.value) : [];
        } catch (e) {
            entries = [];
        }
        if (entries.length === 0 && !sharedMode) {
            entries = seedData();
            await saveEntries();
        }
        render();
    }

    async function saveEntries() {
        try {
            const key = sharedMode ? SHARED_KEY : PERSONAL_KEY;
            await window.storage.set(key, JSON.stringify(entries), sharedMode);
        } catch (e) {
            showToast("Saqlashda xatolik yuz berdi");
        }
    }

    function seedData() {
        const now = Date.now();
        const day = 86400000;
        const seed = [];
        let id = 1;
        const base = {
            // sabzavot
            "Kartoshka": 4500, "Piyoz": 3000, "Sabzi": 4000, "Pomidor": 8000, "Bodring": 6000,
            "Karam": 3500, "Qalampir": 12000, "Baqlajon": 7000, "Lavlagi": 3000, "Rediska": 8000,
            "Turp": 5000, "Qovoq": 3000, "Sholg'om": 4000, "Brokkoli": 15000, "Gulkaram": 10000,
            "Ismaloq": 12000, "Salat bargi": 10000, "Selderey": 8000, "Loviya": 15000,
            "Ko'k no'xat": 12000, "Makkajo'xori": 2000, "Achchiq qalampir": 10000,

            // meva
            "Olma": 12000, "Uzum": 18000, "Gilos": 30000, "Tarvuz": 3500, "Qovun": 4000,
            "Banan": 22000, "Apelsin": 16000, "Nok": 15000, "Shaftoli": 18000, "Anor": 20000,
            "Behi": 12000, "Xurmo": 25000, "Qulupnay": 35000, "O'rik": 15000, "Olcha": 20000,
            "Mandarin": 18000, "Limon": 25000, "Anjir": 20000,

            "Go'sht (mol)": 95000, "Tuxum (10 dona)": 22000, "Sut": 9000,
            "Guruch": 14000, "Un": 8000, "Yog'": 21000,
            "Sarimsoq": 25000, "Ukrop": 4000,

            // go'sht & sut mahsulotlari
            "Go'sht (qo'y)": 100000, "Go'sht (echki)": 90000, "Tovuq go'shti": 35000,
            "O'rdak go'shti": 45000, "G'oz go'shti": 55000, "Bedana go'shti": 60000,
            "Ot go'shti": 85000, "Baliq": 40000, "Qiyma": 90000, "Qazi": 120000, "Kolbasa": 60000,
            "Sosiska": 45000, "Jigar": 50000, "Dumba yog'i": 40000, "Bedana tuxumi": 15000,
            "Qatiq": 10000, "Ayron": 8000, "Suzma": 25000, "Tvorog": 30000,
            "Pishloq": 70000, "Qaymoq": 35000, "Sariyog'": 55000,

            // don mahsulotlari
            "Grechka": 18000, "Suli yormasi": 15000, "Arpa yormasi": 10000, "Tariq": 12000,
            "Vermishel": 9000, "Manka": 8000, "Non": 3000, "Bug'doy": 6000, "Mosh": 20000,

            // ziravor & ko'kat
            "Rayhon": 6000, "Kashnich": 5000, "Yalpiz": 6000, "Za'faron": 800000,
            "Dolchin": 45000, "Lavr bargi": 15000, "Tuz": 3000, "Xantal": 20000
        };
        Object.keys(base).forEach(product => {
            const cat = categoryOf(product);
            const unit = UNIT_OVERRIDES[product] || (product.includes("Tuxum") ? "dona" : (product === "Sut" || product === "Yog'") ? "litr" : "kg");
            MARKETS.slice(0, 3).forEach((market, mi) => {
                const p1 = Math.round(base[product] * (0.92 + Math.random() * 0.1));
                const p2 = Math.round(base[product] * (0.97 + Math.random() * 0.12));
                seed.push({ id: id++, market, product, category: cat, price: p1, unit, ts: now - day * 5 - mi * 3600000 });
                seed.push({ id: id++, market, product, category: cat, price: p2, unit, ts: now - day * 1 - mi * 3600000 });
            });
        });
        return seed;
    }

    // ---------- category tabs ----------
    function moveIndicator(btn) {
        if (!btn) return;
        const navRect = tabsNav.getBoundingClientRect();
        const rect = btn.getBoundingClientRect();
        tabIndicator.style.left = (rect.left - navRect.left) + 'px';
        tabIndicator.style.width = rect.width + 'px';
    }

    tabsNav.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            tabsNav.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.cat;
            moveIndicator(btn);
            render();
        });
    });
    window.addEventListener('resize', () => {
        moveIndicator(tabsNav.querySelector('.tab.active'));
    });

    // ---------- rendering ----------
    function groupByProduct(list) {
        const map = {};
        list.forEach(e => {
            if (!map[e.product]) map[e.product] = [];
            map[e.product].push(e);
        });
        return map;
    }

    function sparkPoints(sorted) {
        if (sorted.length < 2) return null;
        const prices = sorted.map(e => e.price);
        const min = Math.min(...prices), max = Math.max(...prices);
        const w = 220, h = 44, pad = 4;
        const range = (max - min) || 1;
        return sorted.map((e, i) => {
            const x = pad + (i / (sorted.length - 1)) * (w - pad * 2);
            const y = h - pad - ((e.price - min) / range) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
    }

    function animateCount(el, target) {
        const duration = 650;
        const start = performance.now();
        function step(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            el.textContent = fmt(target * eased);
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function renderStats(list) {
        if (list.length === 0) { statsRow.innerHTML = ''; dishTipWrap.innerHTML = ''; return; }
        const grouped = groupByProduct(list);
        const products = Object.keys(grouped);
        const avgByProduct = products.map(p => {
            const prices = grouped[p].map(e => e.price);
            return { product: p, avg: prices.reduce((a, b) => a + b, 0) / prices.length };
        });
        avgByProduct.sort((a, b) => b.avg - a.avg);
        const priciest = avgByProduct[0];
        const cheapest = avgByProduct[avgByProduct.length - 1];

        const cards = [
            { icon: "🧺", label: "Kuzatilgan mahsulot", value: products.length, small: false, count: products.length },
            { icon: "🧾", label: "Jami narx yozuvi", value: list.length, small: false, count: list.length },
            { icon: "💎", label: "Eng qimmat", value: `${priciest.product} · ${fmt(priciest.avg)}`, small: true },
            { icon: "🪙", label: "Eng arzon", value: `${cheapest.product} · ${fmt(cheapest.avg)}`, small: true }
        ];
        statsRow.innerHTML = cards.map((c, i) => `
      <div class="stat-card" style="animation-delay:${i * 0.06}s">
        <div class="label"><span class="icon">${c.icon}</span>${c.label}</div>
        <div class="value${c.small ? ' small' : ''}" data-count="${c.count !== undefined ? c.count : ''}">${c.count !== undefined ? '0' : c.value}</div>
      </div>`).join('');

        // faqat sof sonli qiymatlarni animatsiya bilan hisoblaymiz
        statsRow.querySelectorAll('.value[data-count]').forEach(el => {
            const target = Number(el.dataset.count);
            if (el.dataset.count !== '' && !Number.isNaN(target)) animateCount(el, target);
        });

        renderDishTip(avgByProduct);
    }

    // eng arzon (yoki ro'yxatdagi mos) mahsulotga qarab kunlik taom taklifini ko'rsatadi
    function renderDishTip(avgByProduct) {
        if (!avgByProduct || avgByProduct.length === 0) { dishTipWrap.innerHTML = ''; return; }
        const cheapestSorted = avgByProduct.slice().sort((a, b) => a.avg - b.avg);
        const match = cheapestSorted.find(p => DISH_SUGGESTIONS[p.product]);
        if (!match) { dishTipWrap.innerHTML = ''; return; }
        const tip = DISH_SUGGESTIONS[match.product];
        const icon = PRODUCT_ICONS[match.product] || DEFAULT_ICON;
        dishTipWrap.innerHTML = `
      <div class="dish-tip">
        <span class="dish-tip-icon">${icon}</span>
        <div class="dish-tip-text">
          <div class="dish-tip-eyebrow">💡 Bugungi taklif</div>
          <div class="dish-tip-line"><b>${match.product}</b> ${tip.note} Bugun <b>${tip.dish}</b> pishirsangiz bo'ladi.</div>
        </div>
      </div>`;
    }

    // ---------- savat kalkulyatori ----------
    function toggleBasket(product, price, unit) {
        if (basket.has(product)) {
            basket.delete(product);
        } else {
            basket.set(product, { price, unit });
        }
        renderBasketBar();
        render();
    }

    // savatdagi mahsulotlar bo'yicha har bir bozordagi umumiy narxni hisoblaydi
    function computeMarketTotals() {
        const totals = {};
        MARKETS.forEach(m => { totals[m] = { sum: 0, count: 0 }; });
        basket.forEach((info, product) => {
            const byMarket = {};
            entries.filter(e => e.product === product).forEach(e => {
                if (!byMarket[e.market] || e.ts > byMarket[e.market].ts) byMarket[e.market] = e;
            });
            Object.entries(byMarket).forEach(([m, e]) => {
                if (totals[m]) { totals[m].sum += e.price; totals[m].count++; }
            });
        });
        return Object.entries(totals)
            .filter(([, t]) => t.count === basket.size)
            .map(([market, t]) => ({ market, sum: t.sum }))
            .sort((a, b) => a.sum - b.sum);
    }

    function renderBasketBar() {
        if (basket.size === 0) {
            basketBar.classList.remove('show');
            basketBar.innerHTML = '';
            return;
        }
        const rows = Array.from(basket.entries()).map(([product, info]) => `
      <div class="basket-row">
        <span class="b-name">${PRODUCT_ICONS[product] || DEFAULT_ICON} ${product}</span>
        <span class="b-price">${fmt(info.price)} so'm/${info.unit}</span>
        <button class="b-remove" data-product="${product}" title="Olib tashlash">✕</button>
      </div>`).join('');
        const total = Array.from(basket.values()).reduce((sum, i) => sum + i.price, 0);

        const marketTotals = computeMarketTotals();
        const marketCompareHtml = marketTotals.length >= 2 ? `
      <div class="basket-compare">
        <div class="basket-compare-title">📍 Qaysi bozorda arzonroq</div>
        ${marketTotals.map((mt, i) => `
          <div class="compare-row${i === 0 ? ' cheapest' : ''}">
            <span class="c-name">${i === 0 ? '🏆 ' : ''}${mt.market}</span>
            <span class="c-sum">${fmt(mt.sum)} so'm</span>
          </div>`).join('')}
      </div>` : '';

        basketBar.innerHTML = `
      <div class="basket-summary" id="basketSummary">
        <span class="basket-count">🧺 ${basket.size} ta mahsulot</span>
        <span class="basket-total">${fmt(total)} so'm</span>
        <button class="basket-clear" id="basketClear">Tozalash</button>
        <button class="basket-expand" id="basketExpand">▲</button>
      </div>
      <div class="basket-detail" id="basketDetail"><div class="basket-detail-inner">${rows}${marketCompareHtml}</div></div>`;
        basketBar.classList.add('show');

        $('#basketClear').addEventListener('click', () => {
            basket.clear();
            renderBasketBar();
            render();
        });
        $('#basketExpand').addEventListener('click', () => {
            basketBar.classList.toggle('expanded');
        });
        basketBar.querySelectorAll('.b-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                basket.delete(btn.dataset.product);
                renderBasketBar();
                render();
            });
        });
    }

    function render() {
        const filterMarket = marketFilter.value;
        const sortMode = sortFilter.value;
        const query = searchBox.value.trim().toLowerCase();

        let list = entries.slice();
        if (filterMarket) list = list.filter(e => e.market === filterMarket);
        if (activeCategory) list = list.filter(e => e.category === activeCategory);
        if (query) list = list.filter(e => e.product.toLowerCase().includes(query));

        renderStats(list);

        if (list.length === 0) {
            board.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="glyph">🍉</div>
        <div><b>Hozircha narx yo'q.</b><br>Yuqoridagi "Narx qo'shish" tugmasi orqali birinchi narxni kiriting.</div>
      </div>`;
            return;
        }

        const grouped = groupByProduct(list);
        let products = Object.keys(grouped);

        const info = {};
        products.forEach(p => {
            const sorted = grouped[p].slice().sort((a, b) => a.ts - b.ts);
            const byMarket = {};
            sorted.forEach(e => { byMarket[e.market] = e; });
            const latestEntries = Object.values(byMarket);
            const prices = latestEntries.map(e => e.price);
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            const latestTs = Math.max(...sorted.map(e => e.ts));
            let trend = 'flat', trendPct = 0;
            if (sorted.length >= 2) {
                const firstPrice = sorted[0].price;
                const lastPrice = sorted[sorted.length - 1].price;
                if (lastPrice > firstPrice * 1.01) { trend = 'up'; }
                else if (lastPrice < firstPrice * 0.99) { trend = 'down'; }
                trendPct = firstPrice ? ((lastPrice - firstPrice) / firstPrice * 100) : 0;
            }
            info[p] = {
                sorted, byMarket, prices, avg,
                min: Math.min(...prices), max: Math.max(...prices),
                latestTs, trend, trendPct,
                unit: sorted[sorted.length - 1].unit,
                category: sorted[sorted.length - 1].category
            };
        });

        if (sortMode === 'name') products.sort((a, b) => a.localeCompare(b));
        else if (sortMode === 'recent') products.sort((a, b) => info[b].latestTs - info[a].latestTs);
        else if (sortMode === 'price-desc') products.sort((a, b) => info[b].avg - info[a].avg);
        else if (sortMode === 'price-asc') products.sort((a, b) => info[a].avg - info[b].avg);

        board.innerHTML = products.map((p, idx) => {
            const d = info[p];
            const meta = CATEGORY_META[d.category] || CATEGORY_META['boshqa'];
            const pts = sparkPoints(d.sorted);
            const trendClass = d.trend === 'up' ? 'trend-up' : d.trend === 'down' ? 'trend-down' : 'trend-flat';
            const trendArrow = d.trend === 'up' ? '▲' : d.trend === 'down' ? '▼' : '—';
            const trendText = d.trend === 'flat' ? "o'zgarishsiz" : `${Math.abs(d.trendPct).toFixed(1)}%`;

            const marketsHtml = Object.entries(d.byMarket)
                .sort((a, b) => a[1].price - b[1].price)
                .map(([m, e]) => `<div class="market-row"><span class="m-name">${m}</span><span class="m-price">${fmt(e.price)}</span></div>`)
                .join('');

            const sparkSvg = pts ? `<svg class="spark" width="100%" height="44" viewBox="0 0 220 44" preserveAspectRatio="none">
          <polyline points="${pts}" fill="none" stroke="${d.trend === 'up' ? 'var(--down)' : d.trend === 'down' ? 'var(--up)' : 'var(--teal-light)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>` : '';

            const productIcon = PRODUCT_ICONS[p] || DEFAULT_ICON;
            const softColor = hexToRgba(meta.color, 0.16);
            const inBasket = basket.has(p);
            const isFresh = (Date.now() - d.latestTs) < 2 * 60 * 1000;

            return `<div class="tag" data-product="${p}" style="--cat-color:${meta.color}; --cat-color-soft:${softColor}; animation-delay:${Math.min(idx * 0.05, 0.5)}s">
        ${isFresh ? '<span class="fresh-badge">✦ Yangi</span>' : ''}
        <span class="tag-cat-icon" title="${meta.label}">${meta.icon}</span>
        <div class="tag-header">
          <div class="tag-image">${productIcon}</div>
          <div class="tag-heading">
            <div class="tag-name">${p}</div>
            <div class="tag-unit">so'm / ${d.unit}</div>
          </div>
        </div>
        <div class="tag-price-row">
          <span class="tag-price">${fmt(d.avg)}</span>
          <span class="tag-trend ${trendClass}">${trendArrow} ${trendText}</span>
        </div>
        <div class="tag-range">Diapazon: <b>${fmt(d.min)}</b> — <b>${fmt(d.max)}</b></div>
        ${sparkSvg}
        <div class="tag-markets">${marketsHtml}</div>
        <button class="basket-btn${inBasket ? ' in-basket' : ''}" data-product="${p}" data-price="${d.avg}" data-unit="${d.unit}">
          ${inBasket ? '✓ Savatda' : '🧺 Savatga qo\'sh'}
        </button>
      </div>`;
        }).join('');

        board.querySelectorAll('.basket-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleBasket(btn.dataset.product, Number(btn.dataset.price), btn.dataset.unit));
        });

        board.querySelectorAll('.tag').forEach(attachTilt);
    }

    // sichqoncha harakatiga qarab yengil 3D moyillik (tilt) effekti
    function attachTilt(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(600px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg) translateY(-2px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    }

    // ---------- CSV export ----------
    function exportCsv() {
        if (entries.length === 0) { showToast("Eksport qilish uchun ma'lumot yo'q"); return; }
        const header = ["Sana", "Bozor", "Toifa", "Mahsulot", "Narx", "Birlik"];
        const rows = entries.slice().sort((a, b) => a.ts - b.ts).map(e => {
            const date = new Date(e.ts).toISOString().slice(0, 10);
            const catLabel = (CATEGORY_META[e.category] || {}).label || e.category;
            return [date, e.market, catLabel, e.product, e.price, e.unit];
        });
        const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bozor-narxlari-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("CSV fayl yuklab olindi");
    }

    // oddiy CSV qator ayiruvchisi — qo'shtirnoq ichidagi vergullarni hisobga oladi
    function parseCsvLine(line) {
        const out = [];
        let cur = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') { inQuotes = false; }
                else { cur += ch; }
            } else {
                if (ch === '"') inQuotes = true;
                else if (ch === ',') { out.push(cur); cur = ''; }
                else cur += ch;
            }
        }
        out.push(cur);
        return out;
    }

    async function importCsv(file) {
        const text = await file.text();
        const labelToCategory = {};
        Object.entries(CATEGORY_META).forEach(([key, meta]) => { labelToCategory[meta.label] = key; });

        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) { showToast("Faylda ma'lumot topilmadi"); return; }

        let added = 0;
        let nextId = entries.length ? Math.max(...entries.map(e => e.id)) + 1 : 1;
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length < 6) continue;
            const [dateStr, market, catLabel, product, priceStr, unit] = cols;
            const price = parseFloat(String(priceStr).replace(/[^\d.,-]/g, '').replace(',', '.'));
            if (!product || !market || !price || price <= 0) continue;
            const category = labelToCategory[catLabel] || 'boshqa';
            const ts = Date.parse(dateStr) || Date.now();
            entries.push({ id: nextId++, market, product: product.trim(), category, price, unit: (unit || 'kg').trim(), ts });
            added++;
        }
        if (added === 0) { showToast("Hech qanday to'g'ri qator topilmadi"); return; }
        await saveEntries();
        render();
        showToast(`${added} ta narx import qilindi`);
    }

    // an'anaviy o'zbek taomlari — "Taomlar" bo'limi uchun
    const DISHES = [
        {
            name: "Osh (Palov)", icon: "🍚",
            ingredients: ["Guruch — 1 kg", "Mol yoki qo'y go'shti — 500 g", "Sabzi — 1 kg", "Piyoz — 3 dona", "Yog' — 300 ml", "Sarimsoq — 2 bosh", "Zira, tuz"],
            steps: ["Qozonda yog'ni qizdirib, piyoz va go'shtni qovuring.", "Sabzini qo'shib, 10–15 daqiqa dimlang.", "Ustiga suv quyib, qaynatib, zira va tuz soling.", "Guruchni tekis yoyib, suv qo'shing va yopiq holda pishiring.", "Sarimsoqni ichiga botirib, 20 daqiqa dam olishga qo'ying."]
        },
        {
            name: "Norin", icon: "🍜",
            ingredients: ["Mol go'shti — 700 g", "Un — 400 g", "Piyoz — 2 dona", "Tuxum — 1 dona", "Qora qalampir, tuz"],
            steps: ["Go'shtni suvda pishirib, sovutib mayda to'g'rang.", "Un, tuxum va tuzdan xamir qorib, yupqa yoying va tor-tor tilib qaynatib oling.", "Xamir tolalarini go'sht bilan aralashtiring.", "Ustiga mayda to'g'ralgan xom piyoz va qalampir sepib, sho'rva bilan tortiladi."]
        },
        {
            name: "Mastava", icon: "🍲",
            ingredients: ["Mol go'shti — 400 g", "Guruch — 150 g", "Kartoshka — 3 dona", "Sabzi — 2 dona", "Pomidor — 2 dona", "Piyoz — 1 dona"],
            steps: ["Go'shtni suvda qaynatib sho'rva tayyorlang.", "Piyoz, sabzi va pomidorni qovurib sho'rvaga qo'shing.", "Kartoshkani kublab soling.", "Guruchni qo'shib, yumshaguncha qaynating."]
        },
        {
            name: "Sho'rva", icon: "🍛",
            ingredients: ["Qo'y yoki mol go'shti — 500 g", "Kartoshka — 4 dona", "Sabzi — 2 dona", "Piyoz — 2 dona", "Bulg'or qalampiri — 1 dona"],
            steps: ["Go'shtni suvga solib qaynatib, ko'pigini olib turing.", "Piyoz, sabzi va qalampirni qo'shing.", "Kartoshkani yiriklab to'g'rab soling.", "Tuz va ziravorlar bilan yumshaguncha qaynating."]
        },
        {
            name: "Lag'mon", icon: "🍜",
            ingredients: ["Un — 500 g", "Mol go'shti — 400 g", "Bulg'or qalampiri — 2 dona", "Pomidor — 3 dona", "Sabzi, piyoz, sarimsoq"],
            steps: ["Un va tuzli suvdan qattiq xamir qorib, cho'zib lag'mon tolasi tayyorlang va qaynatib oling.", "Go'shtni qovurib, sabzi, piyoz va qalampirni qo'shing.", "Pomidor va ziravorlar bilan qovurma-sho'rva tayyorlang.", "Tolalarni likobga solib, ustidan qovurma-sho'rvani quying."]
        },
        {
            name: "Manti", icon: "🥟",
            ingredients: ["Un — 500 g", "Mol yoki qo'y go'shti (qiyma) — 500 g", "Piyoz — 3 dona", "Dumba yog'i (ixtiyoriy)", "Tuz, qora qalampir"],
            steps: ["Un, suv va tuzdan yumshoq xamir qorib, dam olishga qo'ying.", "Qiyma, mayda to'g'ralgan piyoz va ziravorlarni aralashtiring.", "Xamirni yupqa yoyib, kvadrat kesing va ichiga qiyma solib turing.", "Manti qozonida bug'da 40–45 daqiqa pishiring."]
        },
        {
            name: "Somsa", icon: "🥐",
            ingredients: ["Un — 500 g", "Mol go'shti (qiyma) — 400 g", "Piyoz — 3 dona", "Dumba yog'i", "Tuz, zira"],
            steps: ["Xamirni un, suv, tuzdan qorib, qatlamli qilib yoying.", "Qiyma, mayda piyoz va ziravorlarni aralashtiring.", "Xamirga ichini solib, uchburchak shaklda buklang.", "Tandir yoki pechda oltin rang olguncha pishiring."]
        },
        {
            name: "Achichuq salat", icon: "🥗",
            ingredients: ["Pomidor — 4 dona", "Piyoz — 1 dona", "Ko'k dosita (ixtiyoriy)", "Tuz, achchiq qalampir"],
            steps: ["Pomidorlarni yupqa doira qilib to'g'rang.", "Piyozni yarim halqa qilib to'g'rab, tuzlab ivitib oling.", "Hammasini aralashtirib, ustidan achchiq qalampir soling."]
        },
        {
            name: "Qovurdoq", icon: "🍳",
            ingredients: ["Mol yoki qo'y go'shti — 500 g", "Kartoshka — 4 dona", "Piyoz — 2 dona", "Bulg'or qalampiri", "Ziravorlar"],
            steps: ["Go'shtni yog'da qizil bo'lguncha qovuring.", "Piyoz va qalampirni qo'shib qovurishda davom eting.", "Kartoshkani kublab qo'shing va yumshaguncha qovuring."]
        },
        {
            name: "Chuchvara", icon: "🥟",
            ingredients: ["Un — 400 g", "Mol go'shti (qiyma) — 300 g", "Piyoz — 2 dona", "Tuz, qora qalampir"],
            steps: ["Xamirni qorib, yupqa yoyib kichik kvadratchalar kesing.", "Qiyma va piyozni aralashtirib, har biriga ozgina solib buklang.", "Qaynagan sho'rvada yoki suvda pishiring."]
        },
        {
            name: "Dimlama", icon: "🍲",
            ingredients: ["Mol go'shti — 500 g", "Kartoshka, karam, baqlajon, qalampir, pomidor — har biridan 2–3 dona", "Piyoz, sarimsoq"],
            steps: ["Qozon tagiga go'shtni, ustiga qatlab sabzavotlarni tering.", "Tuz va ziravor sepib, kam suv bilan yopiq holda dimlang.", "Past olovda 1–1.5 soat pishiring."]
        },
        {
            name: "Shashlik (kabob)", icon: "🍢",
            ingredients: ["Qo'y yoki mol go'shti — 1 kg", "Piyoz — 2 dona", "Sirka yoki limon sharbati", "Tuz, zira, qora qalampir"],
            steps: ["Go'shtni kublab, piyoz va ziravorlar bilan 2–3 soat marinadlang.", "Sixga taxminan bir xil bo'laklarda tizing.", "Cho'g'da ikki tomonini aylantirib, tayyor bo'lguncha qovuring."]
        },
        {
            name: "Xonim", icon: "🌯",
            ingredients: ["Un — 500 g", "Kartoshka yoki qiyma — 400 g", "Piyoz — 2 dona", "Yog', tuz"],
            steps: ["Xamirni qorib, yupqa qilib yoying.", "Ustiga kartoshka pyuresi yoki qiymani tekis surting va rulon qilib o'rang.", "Bug'da taxminan 40 daqiqa pishiring.", "Kesib, ustidan qatiq yoki qaymoq bilan tortiladi."]
        },
        {
            name: "Halim", icon: "🍲",
            ingredients: ["Bug'doy (maydalangan) — 1 kg", "Mol go'shti — 500 g", "Piyoz — 2 dona", "Tuz, qora qalampir"],
            steps: ["Bug'doy va go'shtni birga suvga solib, bir necha soat davomida past olovda qaynating.", "Go'sht suyulib, bug'doy bilan bir tekis pyuresimon holga kelguncha aralashtirib turing.", "Qovurilgan piyoz va yog' bilan sepib tortiladi."]
        },
        {
            name: "Sumalak", icon: "🍮",
            ingredients: ["Ko'karib chiqqan bug'doy ko'chati — 1 kg", "Un — 1 kg", "Yog' — 200 ml"],
            steps: ["Bug'doy ko'chatini ezib, sharbatini ajratib oling.", "Sharbatga un qo'shib, suyuq xamirsimon aralashma tayyorlang.", "Qozonda tosh bilan birga, doim aralashtirib, juda past olovda 20 soatlab qaynatib pishiring."]
        },
        {
            name: "Moshxo'rda", icon: "🍲",
            ingredients: ["Mosh — 200 g", "Guruch — 100 g", "Mol go'shti — 300 g", "Kartoshka, sabzi, piyoz"],
            steps: ["Go'shtni qaynatib sho'rva tayyorlang.", "Mosh, sabzi va piyozni qo'shib qaynatishda davom eting.", "Yarim pishganda guruch va kartoshkani solib, yumshaguncha qaynating."]
        },
        {
            name: "Moshkichiri", icon: "🍚",
            ingredients: ["Mosh — 200 g", "Guruch — 200 g", "Mol go'shti — 300 g", "Piyoz, yog'"],
            steps: ["Go'shtni yog'da qovurib, piyoz qo'shing.", "Moshni solib biroz qovuring va suv qo'shing.", "Guruchni ustiga solib, palovga o'xshab yopiq holda dimlab pishiring."]
        },
        {
            name: "Qozon kabob", icon: "🥘",
            ingredients: ["Qo'y yoki mol go'shti — 1 kg", "Kartoshka — 1 kg", "Piyoz — 3 dona", "Yog', ziravorlar"],
            steps: ["Qozon tagiga yog' surtib, go'sht, piyoz va kartoshkani qatlab tering.", "Tuz va ziravor sepib, qopqog'ini yopib, past olovda o'z sharbatida pishiring."]
        },
        {
            name: "To'qmoch oshi", icon: "🍜",
            ingredients: ["Un — 300 g", "Mol go'shti — 400 g", "Sabzi, piyoz, kartoshka"],
            steps: ["Un va suvdan xamir qorib, yupqa yoying va mayin tolalarga tilib qaynatib oling (to'qmoch).", "Go'sht va sabzavotlardan sho'rva tayyorlang.", "Tolalarni sho'rvaga solib, birga issiq holda tortiladi."]
        },
        {
            name: "Bo'g'irsoq", icon: "🍩",
            ingredients: ["Un — 500 g", "Xamirturush yoki soda", "Sut yoki suv, tuxum", "Qovurish uchun yog'"],
            steps: ["Yumshoq xamir qorib, biroz dam olishga qo'ying.", "Kichik bo'lakchalarga bo'lib, yumaloq yoki romb shaklga keltiring.", "Qaynagan yog'da ikki tomoni oltin rang olguncha qovuring."]
        },
        {
            name: "Hasip", icon: "🌭",
            ingredients: ["Guruch yoki jigar — 300 g", "Tozalangan mol ichagi", "Piyoz, yog', ziravorlar"],
            steps: ["Guruch yoki jigarni mayda piyoz va ziravorlar bilan aralashtiring.", "Aralashmani tozalangan ichakka bo'sh joy qoldirib to'ldiring.", "Suvda qaynatib, so'ng biroz qovurib tortiladi."]
        },
        {
            name: "Chalop", icon: "🥛",
            ingredients: ["Qatiq — 1 l", "Sovuq suv — 500 ml", "Bodring — 1 dona", "Ukrop, tuz"],
            steps: ["Qatiqni sovuq suv bilan suyultiring.", "Mayda to'g'ralgan bodring va ukropni qo'shing.", "Tuzlab, muzlatib yoki muz solib xizmat qiling — yozgi sovuq taom."]
        },
        {
            name: "Nishalda", icon: "🍦",
            ingredients: ["Tuxum oqi — 4 dona", "Shakar — 300 g", "Qizilmiya ildizi qaynatmasi"],
            steps: ["Tuxum oqini shakar bilan ko'pikli, oq holga kelguncha uzoq chirping.", "Qizilmiya qaynatmasini asta-sekin qo'shib, chirpishda davom eting.", "Yumshoq, havodor desert holatiga kelganda tayyor."]
        },
        {
            name: "Tuxum barak", icon: "🥟",
            ingredients: ["Un — 300 g", "Tuxum — 5 dona", "Sut, tuz"],
            steps: ["Un va suvdan yupqa xamir yoyib, kvadrat bo'laklarga kesing.", "Har biriga xom tuxum-sut aralashmasidan quyib, uchburchak qilib buklang.", "Qaynagan suvda pishirib, ustidan yog' bilan tortiladi."]
        }
    ];

    // ---------- events ----------
    $('#toggleAdd').addEventListener('click', () => {
        $('#addPanel').classList.toggle('open');
    });

    $('#toggleRecipes').addEventListener('click', () => {
        $('#recipesPanel').classList.toggle('open');
    });

    function renderRecipes() {
        const grid = $('#recipeGrid');
        grid.innerHTML = DISHES.map((d, i) => `
      <div class="recipe-card" style="animation-delay:${Math.min(i * 0.04, 0.4)}s">
        <div class="recipe-card-head">
          <span class="recipe-icon">${d.icon}</span>
          <span class="recipe-name">${d.name}</span>
          <span class="recipe-chevron">▼</span>
        </div>
        <div class="recipe-body">
          <div class="recipe-body-inner">
            <div class="recipe-section">
              <div class="recipe-section-title">Kerakli mahsulotlar</div>
              <ul class="recipe-ingredients">${d.ingredients.map(x => `<li>${x}</li>`).join('')}</ul>
              <div class="recipe-section-title">Tayyorlash</div>
              <ol class="recipe-steps">${d.steps.map(x => `<li>${x}</li>`).join('')}</ol>
            </div>
          </div>
        </div>
      </div>`).join('');

        grid.querySelectorAll('.recipe-card').forEach(card => {
            attachRipple(card);
            card.addEventListener('click', () => card.classList.toggle('expanded'));
        });
    }
    renderRecipes();

    $('#submitEntry').addEventListener('click', async () => {
        const category = inCategory.value;
        const market = $('#inMarket').value;
        const product = inProduct.value.trim();
        const price = parseFloat($('#inPrice').value);
        const unit = $('#inUnit').value;

        if (!product) { showToast("Mahsulot nomini kiriting"); return; }
        if (!price || price <= 0) { showToast("To'g'ri narx kiriting"); return; }

        const newId = entries.length ? Math.max(...entries.map(e => e.id)) + 1 : 1;
        entries.push({ id: newId, market, product, category, price, unit, ts: Date.now() });
        await saveEntries();
        render();
        inProduct.value = '';
        $('#inPrice').value = '';
        showToast(`${product} narxi qo'shildi — ${fmt(price)} so'm/${unit}`);
        burstParticles($('#submitEntry'));

        const updatedTag = board.querySelector(`.tag[data-product="${CSS.escape(product)}"]`);
        if (updatedTag) {
            updatedTag.scrollIntoView({ behavior: 'smooth', block: 'center' });
            updatedTag.classList.add('just-updated');
            updatedTag.addEventListener('animationend', () => updatedTag.classList.remove('just-updated'), { once: true });
        }
    });

    marketFilter.addEventListener('change', render);
    sortFilter.addEventListener('change', render);
    searchBox.addEventListener('input', render);
    $('#exportBtn').addEventListener('click', exportCsv);

    // ---------- CSV import ----------
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await importCsv(file);
        e.target.value = '';
    });

    // ---------- chop etish ----------
    $('#printBtn').addEventListener('click', () => window.print());

    // ---------- umumiy / shaxsiy taxta ----------
    const sharedBtn = $('#sharedToggle');
    sharedBtn.addEventListener('click', async () => {
        sharedMode = !sharedMode;
        sharedBtn.classList.toggle('active', sharedMode);
        sharedBtn.textContent = sharedMode ? "🌐 Umumiy" : "👤 Shaxsiy";
        if (sharedMode) {
            showToast("Diqqat: umumiy taxtaga kiritilgan narxlarni BOSHQA foydalanuvchilar ham ko'radi va o'zgartira oladi");
        } else {
            showToast("Shaxsiy taxtaga qaytdingiz — endi faqat siz ko'rasiz");
        }
        await loadEntries();
    });

    // ---------- shrift o'lchami ----------
    let fontScale = 1;
    function applyFontScale() {
        document.body.style.zoom = fontScale;
    }
    (async () => {
        try {
            const res = await window.storage.get('bozor-font-scale', false);
            if (res && res.value) fontScale = parseFloat(res.value) || 1;
        } catch (e) { /* birinchi marta ishga tushirilganda kalit topilmaydi */ }
        applyFontScale();
    })();
    $('#fontInc').addEventListener('click', async () => {
        fontScale = Math.min(1.4, +(fontScale + 0.1).toFixed(2));
        applyFontScale();
        try { await window.storage.set('bozor-font-scale', String(fontScale), false); } catch (e) { }
    });
    $('#fontDec').addEventListener('click', async () => {
        fontScale = Math.max(0.85, +(fontScale - 0.1).toFixed(2));
        applyFontScale();
        try { await window.storage.set('bozor-font-scale', String(fontScale), false); } catch (e) { }
    });

    // ---------- ovoz orqali narx kiritish ----------
    const micBtn = $('#micBtn');
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
        micBtn.style.display = 'none';
    } else {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'ru-RU'; // brauzerlarda o'zbek tili qo'llab-quvvatlanishi cheklangan
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        let listening = false;

        recognition.addEventListener('result', (e) => {
            const transcript = e.results[0][0].transcript;
            const digits = transcript.replace(/[^\d]/g, '');
            if (digits) {
                $('#inPrice').value = digits;
                showToast(`Aniqlangan narx: ${fmt(Number(digits))}`);
            } else {
                showToast("Raqam aniqlanmadi, qayta urinib ko'ring");
            }
        });
        recognition.addEventListener('end', () => {
            listening = false;
            micBtn.classList.remove('listening');
        });
        recognition.addEventListener('error', () => {
            listening = false;
            micBtn.classList.remove('listening');
            showToast("Ovozni aniqlab bo'lmadi");
        });

        micBtn.addEventListener('click', () => {
            if (listening) { recognition.stop(); return; }
            try {
                recognition.start();
                listening = true;
                micBtn.classList.add('listening');
            } catch (e) { /* allaqachon ishga tushgan bo'lishi mumkin */ }
        });
    }

    // ---------- til almashtirish ----------
    const TRANSLATIONS = {
        eyebrow: { uz: "Toshkent bozorlari", ru: "Ташкентские базары", en: "Tashkent bazaars" },
        subtitle: {
            uz: "Har kungi narxlarni kiriting, bozorlar bo'yicha solishtiring va o'zgarish tendensiyasini kuzating — sabzavot, meva va boshqa mahsulotlar bo'yicha, rasmlari bilan.",
            ru: "Вводите ежедневные цены, сравнивайте по базарам и следите за динамикой — по овощам, фруктам и другим товарам, с картинками.",
            en: "Log daily prices, compare across markets, and track trends — for vegetables, fruit, and more, with pictures."
        },
        tabAll: { uz: "Barchasi", ru: "Все", en: "All" },
        tabVeg: { uz: "Sabzavotlar", ru: "Овощи", en: "Vegetables" },
        tabFruit: { uz: "Mevalar", ru: "Фрукты", en: "Fruit" },
        tabMeat: { uz: "Go'sht & sut", ru: "Мясо и молоко", en: "Meat & dairy" },
        tabGrain: { uz: "Don mahsulotlari", ru: "Крупы и злаки", en: "Grains" },
        tabSpice: { uz: "Ziravor & ko'kat", ru: "Специи и зелень", en: "Spices & herbs" },
        tabOther: { uz: "Boshqa", ru: "Другое", en: "Other" },
        searchPh: { uz: "Mahsulot qidirish...", ru: "Поиск товара...", en: "Search products..." },
        allMarkets: { uz: "Barcha bozorlar", ru: "Все базары", en: "All markets" },
        sortName: { uz: "Nomi bo'yicha", ru: "По названию", en: "By name" },
        sortRecent: { uz: "So'nggi qo'shilgan", ru: "Недавно добавленные", en: "Recently added" },
        sortDesc: { uz: "Narx: qimmatdan", ru: "Цена: сначала дорогие", en: "Price: high to low" },
        sortAsc: { uz: "Narx: arzondan", ru: "Цена: сначала дешёвые", en: "Price: low to high" },
        exportBtn: { uz: "⭳ Eksport", ru: "⭳ Экспорт", en: "⭳ Export" },
        importBtn: { uz: "⭱ Import", ru: "⭱ Импорт", en: "⭱ Import" },
        printBtn: { uz: "🖨️ Chop etish", ru: "🖨️ Печать", en: "🖨️ Print" },
        recipesBtn: { uz: "🍲 Taomlar", ru: "🍲 Блюда", en: "🍲 Recipes" },
        addBtn: { uz: "+ Narx qo'shish", ru: "+ Добавить цену", en: "+ Add price" },
        recipesTitle: { uz: "An'anaviy o'zbek taomlari", ru: "Традиционные узбекские блюда", en: "Traditional Uzbek dishes" },
        addTitle: { uz: "Yangi narx kiritish", ru: "Ввод новой цены", en: "Enter a new price" },
        labelCategory: { uz: "Toifa", ru: "Категория", en: "Category" },
        labelMarket: { uz: "Bozor", ru: "Базар", en: "Market" },
        labelProduct: { uz: "Mahsulot", ru: "Товар", en: "Product" },
        labelPrice: { uz: "Narx (so'm)", ru: "Цена (сум)", en: "Price (so'm)" },
        labelUnit: { uz: "Birlik", ru: "Единица", en: "Unit" },
        submitBtn: { uz: "Qo'shish", ru: "Добавить", en: "Add" },
        formNote: {
            uz: "Ma'lumotlar faqat sizning hisobingizda saqlanadi va boshqalarga ko'rinmaydi.",
            ru: "Данные сохраняются только в вашем аккаунте и не видны другим.",
            en: "Your data is saved only in your account and isn't visible to others."
        },
        footerText: { uz: "Narx taxtasi · shaxsiy kuzatuv vositasi", ru: "Доска цен · личный инструмент учёта", en: "Price board · a personal tracking tool" },
        resetBtn: { uz: "Barcha ma'lumotlarni tozalash", ru: "Очистить все данные", en: "Clear all data" }
    };

    function applyLanguage(lang) {
        const t = (key) => (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) || TRANSLATIONS[key].uz;
        $('.eyebrow').textContent = t('eyebrow');
        $('.subtitle').textContent = t('subtitle');
        const tabMap = ['tabAll', 'tabVeg', 'tabFruit', 'tabMeat', 'tabGrain', 'tabSpice', 'tabOther'];
        document.querySelectorAll('.tab').forEach((tab, i) => {
            if (tabMap[i]) tab.lastChild.textContent = ' ' + t(tabMap[i]);
        });
        searchBox.placeholder = t('searchPh');
        marketFilter.querySelector('option[value=""]').textContent = t('allMarkets');
        const sortOpts = sortFilter.querySelectorAll('option');
        if (sortOpts[0]) sortOpts[0].textContent = t('sortName');
        if (sortOpts[1]) sortOpts[1].textContent = t('sortRecent');
        if (sortOpts[2]) sortOpts[2].textContent = t('sortDesc');
        if (sortOpts[3]) sortOpts[3].textContent = t('sortAsc');
        $('#exportBtn').textContent = t('exportBtn');
        $('#importBtn').textContent = t('importBtn');
        $('#printBtn').textContent = t('printBtn');
        $('#toggleRecipes').textContent = t('recipesBtn');
        $('#toggleAdd').textContent = t('addBtn');
        $('#recipesPanel .panel-title').textContent = t('recipesTitle');
        $('#addPanel .panel-title').textContent = t('addTitle');
        const fieldLabels = $('#addPanel').querySelectorAll('.field label');
        const labelKeys = ['labelCategory', 'labelMarket', 'labelProduct', 'labelPrice', 'labelUnit'];
        fieldLabels.forEach((el, i) => { if (labelKeys[i]) el.textContent = t(labelKeys[i]); });
        $('#submitEntry').textContent = t('submitBtn');
        $('.form-note').textContent = t('formNote');
        document.querySelector('footer span').textContent = t('footerText');
        $('#resetBtn').textContent = t('resetBtn');
    }

    $('#langSelect').addEventListener('change', async (e) => {
        const lang = e.target.value;
        applyLanguage(lang);
        try { await window.storage.set('bozor-lang', lang, false); } catch (err) { }
    });
    (async () => {
        let lang = 'uz';
        try {
            const res = await window.storage.get('bozor-lang', false);
            if (res && res.value) lang = res.value;
        } catch (e) { /* birinchi marta ishga tushirilganda kalit topilmaydi */ }
        $('#langSelect').value = lang;
        if (lang !== 'uz') applyLanguage(lang);
    })();

    $('#resetBtn').addEventListener('click', async () => {
        if (entries.length === 0) return;
        if (!confirm("Barcha kiritilgan narxlarni o'chirishni tasdiqlaysizmi?")) return;
        const backup = entries.slice();
        entries = [];
        await saveEntries();
        render();
        showToast("Barcha ma'lumotlar tozalandi", "Bekor qilish", async () => {
            entries = backup;
            await saveEntries();
            render();
            showToast("Tiklandi");
        });
    });

    const introStart = performance.now();
    loadEntries().then(() => {
        moveIndicator(tabsNav.querySelector('.tab.active'));
        const elapsed = performance.now() - introStart;
        const remaining = Math.max(0, 550 - elapsed); // "bozor" bir zumda ochilib qolmasligi uchun eng kam ko'rsatish vaqti
        setTimeout(() => {
            const overlay = $('#introOverlay');
            if (overlay) {
                overlay.classList.add('hide');
                overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            }
        }, remaining);
    });

    // ---------- PWA: telefon ekraniga o'rnatish uchun service worker ----------
    // faqat http(s) orqali ochilganda ishga tushadi — file:// orqali ochilganda brauzer buni qo'llab-quvvatlamaydi
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => { /* offline qo'llab-quvvatlash ixtiyoriy, xato jim o'tkaziladi */ });
        });
    }
})();