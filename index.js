(function () {
    // ---------- window.storage shim ----------
    // Bu ilova asli Claude.ai artifact muhitidagi `window.storage` API'siga mo'ljallangan edi,
    // u faqat Claude.ai ichida mavjud. Ilovani oddiy brauzerda yoki telefonga PWA sifatida
    // o'rnatib ishlatish uchun (masalan, GitHub Pages'da), shu yerda xuddi shu interfeysni
    // localStorage ustida qayta yaratamiz — shunda barcha window.storage.get/set/delete/list
    // chaqiruvlari o'zgarishsiz ishlayveradi va ma'lumotlar haqiqatan ham saqlanadi.
    // MUHIM: bu faqat shu qurilma/brauzerda saqlanadi. "shared"=true bo'lsa ham, haqiqiy
    // ko'p-foydalanuvchili umumiy taxta uchun serverga ulangan backend kerak bo'ladi —
    // buni localStorage almashtira olmaydi, shuning uchun umumiy taxta funksiyasi hozircha
    // faqat shu brauzerning o'zida "umumiy" nomli alohida to'plam sifatida ishlaydi.
    if (!window.storage) {
        const LS_PREFIX = 'bozor_storage__';
        const ns = (shared) => LS_PREFIX + (shared ? 'shared__' : 'personal__');
        window.storage = {
            async get(key, shared) {
                const raw = window.localStorage.getItem(ns(shared) + key);
                if (raw === null) throw new Error(`Kalit topilmadi: ${key}`);
                return { key, value: raw, shared: !!shared };
            },
            async set(key, value, shared) {
                window.localStorage.setItem(ns(shared) + key, value);
                return { key, value, shared: !!shared };
            },
            async delete(key, shared) {
                const fullKey = ns(shared) + key;
                const existed = window.localStorage.getItem(fullKey) !== null;
                window.localStorage.removeItem(fullKey);
                return { key, deleted: existed, shared: !!shared };
            },
            async list(prefix, shared) {
                const p = ns(shared) + (prefix || '');
                const keys = [];
                for (let i = 0; i < window.localStorage.length; i++) {
                    const k = window.localStorage.key(i);
                    if (k && k.indexOf(p) === 0) keys.push(k.slice(ns(shared).length));
                }
                return { keys, prefix, shared: !!shared };
            }
        };
    }

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
    let favorites = new Set(); // sevimli deb belgilangan mahsulotlar nomlari

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
        if (favoritesLoaded === false) {
            await loadFavorites();
            favoritesLoaded = true;
        }
        render();
    }
    let favoritesLoaded = false;

    async function saveEntries() {
        try {
            const key = sharedMode ? SHARED_KEY : PERSONAL_KEY;
            await window.storage.set(key, JSON.stringify(entries), sharedMode);
        } catch (e) {
            showToast("Saqlashda xatolik yuz berdi");
        }
    }

    // ---------- sevimlilar (favorites) ----------
    const FAVORITES_KEY = 'bozor-favorites-v1';

    async function loadFavorites() {
        try {
            const res = await window.storage.get(FAVORITES_KEY, false);
            favorites = new Set(res && res.value ? JSON.parse(res.value) : []);
        } catch (e) {
            favorites = new Set();
        }
    }

    async function saveFavorites() {
        try { await window.storage.set(FAVORITES_KEY, JSON.stringify(Array.from(favorites)), false); }
        catch (e) { /* jim o'tkazamiz */ }
    }

    async function toggleFavorite(product) {
        if (favorites.has(product)) favorites.delete(product);
        else favorites.add(product);
        await saveFavorites();
        render();
    }

    // ---------- xarid ro'yxati (shopping list) ----------
    const SHOPPING_KEY = 'bozor-shopping-v1';
    let shoppingList = []; // {id, product, checked}

    async function loadShopping() {
        try {
            const res = await window.storage.get(SHOPPING_KEY, false);
            shoppingList = res && res.value ? JSON.parse(res.value) : [];
        } catch (e) { shoppingList = []; }
    }
    async function saveShopping() {
        try { await window.storage.set(SHOPPING_KEY, JSON.stringify(shoppingList), false); }
        catch (e) { showToast("Xarid ro'yxatini saqlashda xatolik"); }
    }
    function latestPriceInfo(product) {
        const matches = entries.filter(e => e.product === product);
        if (matches.length === 0) return null;
        const byMarket = {};
        matches.forEach(e => { if (!byMarket[e.market] || e.ts > byMarket[e.market].ts) byMarket[e.market] = e; });
        const vals = Object.values(byMarket);
        const avg = vals.reduce((s, e) => s + e.price, 0) / vals.length;
        return { avg, unit: vals[vals.length - 1].unit };
    }
    function renderShopping() {
        const list = $('#shoppingList');
        const empty = $('#shoppingEmpty');
        const countPill = $('#shoppingCount');
        const openCount = shoppingList.filter(i => !i.checked).length;
        if (openCount > 0) { countPill.hidden = false; countPill.textContent = openCount; }
        else countPill.hidden = true;

        if (shoppingList.length === 0) {
            list.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;
        list.innerHTML = shoppingList.map(item => {
            const info = latestPriceInfo(item.product);
            const icon = PRODUCT_ICONS[item.product] || DEFAULT_ICON;
            const priceHint = info ? `<span class="shopping-price-hint">${fmt(info.avg)} so'm/${info.unit}</span>` : '';
            return `<div class="shopping-row${item.checked ? ' checked' : ''}" data-id="${item.id}">
          <button class="shopping-check" data-id="${item.id}">${item.checked ? '✓' : ''}</button>
          <span class="shopping-name">${icon} ${item.product}</span>
          ${priceHint}
          <button class="shopping-remove" data-id="${item.id}" title="O'chirish">✕</button>
        </div>`;
        }).join('');
        list.querySelectorAll('.shopping-check').forEach(btn => {
            btn.addEventListener('click', async () => {
                const it = shoppingList.find(i => String(i.id) === btn.dataset.id);
                if (it) { it.checked = !it.checked; await saveShopping(); renderShopping(); }
            });
        });
        list.querySelectorAll('.shopping-remove').forEach(btn => {
            btn.addEventListener('click', async () => {
                shoppingList = shoppingList.filter(i => String(i.id) !== btn.dataset.id);
                await saveShopping(); renderShopping();
            });
        });
    }
    $('#shoppingAddBtn').addEventListener('click', async () => {
        const input = $('#shoppingInput');
        const val = input.value.trim();
        if (!val) return;
        const nextId = shoppingList.length ? Math.max(...shoppingList.map(i => i.id)) + 1 : 1;
        shoppingList.push({ id: nextId, product: val, checked: false });
        await saveShopping();
        renderShopping();
        input.value = '';
        showToast(`"${val}" xarid ro'yxatiga qo'shildi`);
    });
    $('#shoppingInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#shoppingAddBtn').click(); });
    $('#shoppingClearDone').addEventListener('click', async () => {
        const before = shoppingList.length;
        shoppingList = shoppingList.filter(i => !i.checked);
        if (shoppingList.length === before) { showToast("Bajarilgan band yo'q"); return; }
        await saveShopping();
        renderShopping();
        showToast("Bajarilgan bandlar tozalandi");
    });
    $('#toggleShopping').addEventListener('click', () => {
        $('#shoppingPanel').classList.toggle('open');
        if ($('#shoppingPanel').classList.contains('open')) renderShopping();
    });

    // ---------- narx bo'yicha ogohlantirish (price alerts) ----------
    const ALERTS_KEY = 'bozor-alerts-v1';
    let alerts = []; // {id, product, threshold, notifiedAt}

    async function loadAlerts() {
        try {
            const res = await window.storage.get(ALERTS_KEY, false);
            alerts = res && res.value ? JSON.parse(res.value) : [];
        } catch (e) { alerts = []; }
    }
    async function saveAlerts() {
        try { await window.storage.set(ALERTS_KEY, JSON.stringify(alerts), false); }
        catch (e) { showToast("Ogohlantirishni saqlashda xatolik"); }
    }
    function renderAlerts() {
        const list = $('#alertsList');
        const countPill = $('#alertsCount');
        const hitCount = alerts.filter(a => a.notifiedAt).length;
        if (hitCount > 0) { countPill.hidden = false; countPill.textContent = hitCount; }
        else countPill.hidden = true;

        if (alerts.length === 0) {
            list.innerHTML = '<div class="shopping-empty">Hali ogohlantirish qo\'shilmagan.</div>';
            return;
        }
        list.innerHTML = alerts.map(a => {
            const info = latestPriceInfo(a.product);
            const isHit = !!a.notifiedAt;
            const curText = info ? `hozirgi narx: <b>${fmt(info.avg)}</b> so'm` : "hozircha narx yo'q";
            return `<div class="alert-row${isHit ? ' triggered' : ''}">
          <span class="alert-info">🔔 <b>${a.product}</b> narxi <b>${fmt(a.threshold)}</b> so'mdan pastga tushsa — ${curText}</span>
          <span class="alert-status${isHit ? ' hit' : ''}">${isHit ? 'Ishga tushdi' : 'Kuzatilmoqda'}</span>
          <button class="alert-remove" data-id="${a.id}" title="O'chirish">✕</button>
        </div>`;
        }).join('');
        list.querySelectorAll('.alert-remove').forEach(btn => {
            btn.addEventListener('click', async () => {
                alerts = alerts.filter(a => String(a.id) !== btn.dataset.id);
                await saveAlerts(); renderAlerts();
            });
        });
    }
    // narxlar yangilanganda barcha ogohlantirishlarni tekshiradi va chegaradan pastga tushganlarini bildiradi
    function checkAlerts() {
        let anyNew = false;
        alerts.forEach(a => {
            const info = latestPriceInfo(a.product);
            if (info && info.avg < a.threshold) {
                if (!a.notifiedAt) {
                    a.notifiedAt = Date.now();
                    anyNew = true;
                    showToast(`🔔 ${a.product} narxi ${fmt(a.threshold)} so'mdan pastga tushdi! Hozir: ${fmt(info.avg)} so'm`);
                    if (window.Notification && Notification.permission === 'granted') {
                        try { new Notification('Bozor narxlari', { body: `${a.product} narxi ${fmt(info.avg)} so'm bo'ldi` }); } catch (e) { }
                    }
                }
            } else {
                a.notifiedAt = null;
            }
        });
        if (anyNew) saveAlerts();
    }
    $('#alertAddBtn').addEventListener('click', async () => {
        const product = $('#alertProduct').value.trim();
        const threshold = parseFloat($('#alertThreshold').value);
        if (!product) { showToast("Mahsulot nomini kiriting"); return; }
        if (!threshold || threshold <= 0) { showToast("To'g'ri chegara narx kiriting"); return; }
        const nextId = alerts.length ? Math.max(...alerts.map(a => a.id)) + 1 : 1;
        alerts.push({ id: nextId, product, threshold, notifiedAt: null });
        await saveAlerts();
        renderAlerts();
        checkAlerts();
        $('#alertProduct').value = ''; $('#alertThreshold').value = '';
        showToast("Ogohlantirish qo'shildi");
        if (window.Notification && Notification.permission === 'default') {
            try { Notification.requestPermission(); } catch (e) { }
        }
    });
    $('#toggleAlerts').addEventListener('click', () => {
        $('#alertsPanel').classList.toggle('open');
        if ($('#alertsPanel').classList.contains('open')) renderAlerts();
    });

    // ---------- mahsulot eslatmalari (notes) ----------
    const NOTES_KEY = 'bozor-notes-v1';
    let productNotes = {}; // product -> note text

    async function loadNotes() {
        try {
            const res = await window.storage.get(NOTES_KEY, false);
            productNotes = res && res.value ? JSON.parse(res.value) : {};
        } catch (e) { productNotes = {}; }
    }
    async function saveNotes() {
        try { await window.storage.set(NOTES_KEY, JSON.stringify(productNotes), false); }
        catch (e) { /* jim o'tkazamiz */ }
    }

    // ---------- umumiy taxta uchun foydalanuvchi ismi va reyting ----------
    const AUTHOR_KEY = 'bozor-author-v1';
    let authorName = '';
    async function loadAuthor() {
        try {
            const res = await window.storage.get(AUTHOR_KEY, false);
            authorName = res && res.value ? res.value : '';
        } catch (e) { authorName = ''; }
        $('#inAuthor').value = authorName;
    }
    $('#inAuthor').addEventListener('change', async () => {
        authorName = $('#inAuthor').value.trim();
        try { await window.storage.set(AUTHOR_KEY, authorName, false); } catch (e) { }
    });
    function renderLeaders() {
        if (!sharedMode) return;
        const counts = {};
        entries.forEach(e => {
            const name = e.author && e.author.trim() ? e.author.trim() : "Noma'lum";
            counts[name] = (counts[name] || 0) + 1;
        });
        const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
        const list = $('#leadersList');
        if (ranked.length === 0) {
            list.innerHTML = '<div class="shopping-empty">Umumiy taxtada hali yozuv yo\'q.</div>';
            return;
        }
        const medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = ranked.map(([name, count], i) => `
      <div class="leader-row">
        <span class="leader-rank">${medals[i] || (i + 1)}</span>
        <span class="leader-name">${name}</span>
        <span class="leader-count">${count} ta narx</span>
      </div>`).join('');
    }
    $('#toggleLeaders').addEventListener('click', () => {
        $('#leadersPanel').classList.toggle('open');
        if ($('#leadersPanel').classList.contains('open')) renderLeaders();
    });

    // ---------- bozorlar narx indeksi ----------
    // har bir bozor uchun, har bir mahsulotning o'sha bozordagi eng so'nggi narxini
    // shu mahsulotning barcha bozorlardagi o'rtacha narxiga nisbatan solishtirib, umumiy indeks chiqaradi
    // (100 = o'rtacha; bu funksiya narx indeksi panelida ham, xarita panelida ham ishlatiladi)
    function computeMarketIndexData() {
        const grouped = groupByProduct(entries);
        const ratiosByMarket = {};
        MARKETS.forEach(m => ratiosByMarket[m] = []);
        Object.values(grouped).forEach(list2 => {
            const byMarket = {};
            list2.slice().sort((a, b) => a.ts - b.ts).forEach(e => { byMarket[e.market] = e; });
            const vals = Object.values(byMarket);
            if (vals.length < 2) return;
            const avg = vals.reduce((s, e) => s + e.price, 0) / vals.length;
            if (!avg) return;
            vals.forEach(e => { if (ratiosByMarket[e.market]) ratiosByMarket[e.market].push(e.price / avg); });
        });
        return MARKETS.map(m => {
            const ratios = ratiosByMarket[m];
            const idx = ratios.length ? (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100 : null;
            return { market: m, idx };
        }).filter(d => d.idx !== null).sort((a, b) => a.idx - b.idx);
    }

    function renderMarketIndex() {
        const list = $('#marketIndexList');
        if (entries.length === 0) { list.innerHTML = '<div class="shopping-empty">Hozircha ma\'lumot yo\'q.</div>'; return; }
        const indexData = computeMarketIndexData();

        if (indexData.length === 0) { list.innerHTML = '<div class="shopping-empty">Solishtirish uchun yetarli ma\'lumot yo\'q (kamida 2 bozorda bir xil mahsulot kerak).</div>'; return; }
        const maxDev = Math.max(...indexData.map(d => Math.abs(d.idx - 100)), 10);
        list.innerHTML = indexData.map(d => {
            const dev = d.idx - 100;
            const widthPct = Math.min(100, 50 + (dev / maxDev) * 50);
            return `<div class="index-row">
          <span class="index-market-name">${d.market}</span>
          <div class="index-bar-track"><div class="index-bar-fill ${dev >= 0 ? 'above' : 'below'}" style="width:${widthPct.toFixed(1)}%"></div></div>
          <span class="index-value">${d.idx.toFixed(0)}</span>
        </div>`;
        }).join('');
    }
    $('#toggleIndex').addEventListener('click', () => {
        $('#indexPanel').classList.toggle('open');
        if ($('#indexPanel').classList.contains('open')) renderMarketIndex();
    });

    // ---------- bozorlarni xaritada solishtirish ----------
    // Toshkentdagi haqiqiy bozorlarning taxminiy geografik koordinatalari (Google xaritalar ma'lumotlari asosida)
    const MARKET_COORDS = {
        "Chorsu bozori": { lat: 41.3267, lng: 69.2350 },
        "Oloy bozori": { lat: 41.3194, lng: 69.2853 },
        "Qo'ylik bozori": { lat: 41.2373, lng: 69.3294 },
        "Farhod bozori": { lat: 41.2859, lng: 69.1905 },
        "Beshqozon bozori": { lat: 41.3476, lng: 69.2855 }
    };
    let userLocation = null; // {lat, lng} — faqat foydalanuvchi ruxsat bersa to'ldiriladi

    // ikkita geografik nuqta orasidagi masofani km da hisoblaydi (Haversine formulasi)
    function haversineKm(a, b) {
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    $('#locateBtn').addEventListener('click', () => {
        if (!navigator.geolocation) { showToast("Bu qurilmada joylashuvni aniqlab bo'lmaydi"); return; }
        $('#locateBtn').textContent = '📍 Aniqlanmoqda...';
        navigator.geolocation.getCurrentPosition((pos) => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            $('#locateBtn').textContent = '📍 Joylashuv aniqlandi ✓';
            renderMarketMap();
        }, () => {
            $('#locateBtn').textContent = '📍 Joylashuvimni aniqlash';
            showToast("Joylashuvni aniqlab bo'lmadi — brauzer ruxsatini tekshiring");
        }, { enableHighAccuracy: false, timeout: 8000 });
    });

    // haqiqiy xarita (OpenStreetMap tayllari, Leaflet kutubxonasi orqali — API kalit shart emas)
    let leafletMap = null;
    let leafletMarketLayer = null;
    let leafletUserMarker = null;
    function pinIconHtml(bgColor, glyph) {
        return `<div class="market-pin" style="background:${bgColor}"><span>${glyph}</span></div>`;
    }
    function ensureLeafletMap() {
        if (leafletMap || typeof L === 'undefined') return;
        leafletMap = L.map('realMap', { scrollWheelZoom: false }).setView([41.30, 69.25], 11);
        leafletMap.on('click', () => leafletMap.scrollWheelZoom.enable());
        $('#realMap').addEventListener('mouseleave', () => leafletMap.scrollWheelZoom.disable());
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> hissa qo\'shuvchilari'
        }).on('tileerror', () => { $('#mapOfflineNote').hidden = false; }).addTo(leafletMap);
        leafletMarketLayer = L.layerGroup().addTo(leafletMap);
    }

    function renderMarketMap() {
        if (typeof L === 'undefined') {
            $('#mapOfflineNote').hidden = false;
            $('#mapOfflineNote').textContent = "🗺️ Xarita kutubxonasini yuklab bo'lmadi — internet aloqasini tekshirib, sahifani qayta yuklang.";
            return;
        }
        ensureLeafletMap();
        if (!leafletMap) return;

        const coordsList = Object.entries(MARKET_COORDS).map(([m, c]) => ({ market: m, ...c }));

        // savatga mahsulot solingan bo'lsa — savat narxiga qarab, aks holda umumiy narx indeksiga qarab rangla
        const useBasket = basket.size > 0;
        const marketTotals = useBasket ? computeMarketTotals() : [];
        const indexData = useBasket ? [] : computeMarketIndexData();
        const totalsByMarket = {};
        if (useBasket) marketTotals.forEach(t => { totalsByMarket[t.market] = t.sum; });
        else indexData.forEach(d => { totalsByMarket[d.market] = d.idx; });
        const values = Object.values(totalsByMarket);
        const minV = values.length ? Math.min(...values) : 0;
        const maxV = values.length ? Math.max(...values) : 1;

        function colorFor(market) {
            if (!(market in totalsByMarket)) return '#8b8378';
            if (values.length < 2 || maxV === minV) return '#3E7C7F';
            const t = (totalsByMarket[market] - minV) / (maxV - minV); // 0 = eng arzon, 1 = eng qimmat
            return t < 0.34 ? '#7A8B4A' : t > 0.66 ? '#B33A3A' : '#E8A33D';
        }

        leafletMarketLayer.clearLayers();
        const bounds = [];
        coordsList.forEach(c => {
            bounds.push([c.lat, c.lng]);
            const color = colorFor(c.market);
            const icon = L.divIcon({
                className: '', html: pinIconHtml(color, '🧺'),
                iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28]
            });
            const marker = L.marker([c.lat, c.lng], { icon, keyboard: true, alt: c.market }).addTo(leafletMarketLayer);
            let valText = '—';
            if (useBasket && totalsByMarket[c.market] !== undefined) valText = `Savat: ${fmt(totalsByMarket[c.market])} so'm`;
            else if (!useBasket && totalsByMarket[c.market] !== undefined) valText = `Narx indeksi: ${totalsByMarket[c.market].toFixed(0)}`;
            const dist = userLocation ? haversineKm(userLocation, c) : null;
            const distLine = dist !== null ? `<div class="map-popup-line">📍 ${dist < 10 ? dist.toFixed(1) : Math.round(dist)} km sizdan</div>` : '';
            const popupEl = document.createElement('div');
            popupEl.innerHTML = `<div class="map-popup-title">${c.market}</div><div class="map-popup-line">${valText}</div>${distLine}<button class="map-popup-btn" type="button">Shu bozor bo'yicha filtrlash</button>`;
            popupEl.querySelector('.map-popup-btn').addEventListener('click', () => {
                marketFilter.value = c.market;
                $('#mapPanel').classList.remove('open');
                render();
                showToast(`${c.market} bo'yicha filtrlandi`);
            });
            marker.bindPopup(popupEl);
        });

        if (leafletUserMarker) { leafletMarketLayer.removeLayer(leafletUserMarker); leafletUserMarker = null; }
        if (userLocation) {
            bounds.push([userLocation.lat, userLocation.lng]);
            const userIcon = L.divIcon({ className: '', html: '<div class="user-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
            leafletUserMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, alt: 'Siz', zIndexOffset: 1000 })
                .bindPopup('📍 Siz shu yerdasiz')
                .addTo(leafletMarketLayer);
        }
        if (bounds.length) leafletMap.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });

        $('#mapNote').textContent = useBasket
            ? "Belgilar savatingizdagi mahsulotlar umumiy narxiga qarab ranglangan — yashil arzonroq, qizil qimmatroq. Belgiga bosib to'liq ma'lumotni ko'ring."
            : "Belgilar bozorlarning umumiy narx indeksiga qarab ranglangan — yashil arzonroq, qizil qimmatroq. Belgiga bosib to'liq ma'lumotni ko'ring.";

        $('#mapList').innerHTML = coordsList.map(c => {
            const dist = userLocation ? haversineKm(userLocation, c) : null;
            const distText = dist !== null ? `${dist < 10 ? dist.toFixed(1) : Math.round(dist)} km` : '—';
            let valText = '—';
            if (useBasket && totalsByMarket[c.market] !== undefined) valText = `${fmt(totalsByMarket[c.market])} so'm`;
            else if (!useBasket && totalsByMarket[c.market] !== undefined) valText = totalsByMarket[c.market].toFixed(0);
            return `<div class="index-row">
          <span class="index-market-name">${c.market}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:12.5px;opacity:.75">📍 ${distText}</span>
          <span class="index-value">${valText}</span>
        </div>`;
        }).join('');
    }
    $('#toggleMap').addEventListener('click', () => {
        $('#mapPanel').classList.toggle('open');
        if ($('#mapPanel').classList.contains('open')) {
            // panel ochilish animatsiyasi tugagach xaritani chizamiz — aks holda konteyner
            // hali 0 balandlikda bo'lganida Leaflet uni noto'g'ri o'lchamda ishga tushiradi
            setTimeout(() => {
                renderMarketMap();
                if (leafletMap) leafletMap.invalidateSize();
            }, 370);
        }
    });

    // ---------- oylik byudjet rejalashtiruvchi ----------
    const BUDGET_KEY = 'bozor-budget-v1';
    let monthlyBudget = 0;
    async function loadBudget() {
        try {
            const res = await window.storage.get(BUDGET_KEY, false);
            monthlyBudget = res && res.value ? Number(res.value) || 0 : 0;
        } catch (e) { monthlyBudget = 0; }
        $('#budgetInput').value = monthlyBudget || '';
    }
    async function saveBudget() {
        try { await window.storage.set(BUDGET_KEY, String(monthlyBudget), false); } catch (e) { }
    }
    function renderBudget() {
        const wrap = $('#budgetSummary');
        if (!monthlyBudget || monthlyBudget <= 0) {
            wrap.innerHTML = `<div class="budget-note">Avval yuqorida oylik byudjetingizni kiritib, "Saqlash" tugmasini bosing.</div>`;
            return;
        }
        if (shoppingList.length === 0) {
            wrap.innerHTML = `<div class="budget-note">Xarid ro'yxatingiz bo'sh — mahsulot qo'shsangiz, ularning taxminiy umumiy narxini byudjetingiz bilan solishtiramiz.</div>`;
            return;
        }
        let total = 0, matched = 0;
        const rows = shoppingList.map(item => {
            const info = latestPriceInfo(item.product);
            if (info) { total += info.avg; matched++; }
            return { product: item.product, price: info ? info.avg : null, checked: item.checked };
        });
        const pct = Math.min(100, (total / monthlyBudget) * 100);
        const state = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
        const remaining = monthlyBudget - total;

        wrap.innerHTML = `
      <div class="budget-progress-track">
        <div class="budget-progress-fill ${state}" style="width:${Math.max(4, pct).toFixed(1)}%"></div>
        <div class="budget-progress-label">${pct.toFixed(0)}%</div>
      </div>
      <div class="budget-line"><span>Xarid ro'yxati taxminiy narxi</span><b>${fmt(total)} so'm</b></div>
      <div class="budget-line"><span>Oylik byudjet</span><b>${fmt(monthlyBudget)} so'm</b></div>
      <div class="budget-line"><span>${remaining >= 0 ? "Qolgan mablag'" : "Byudjetdan oshib ketdi"}</span><b style="color:${remaining >= 0 ? 'var(--up)' : 'var(--down)'}">${fmt(Math.abs(remaining))} so'm</b></div>
      <div class="budget-note">${matched < shoppingList.length ? `${shoppingList.length - matched} ta mahsulot uchun hali narx kiritilmagan, shu sabab hisoblash taxminiy.` : "Barcha mahsulotlar uchun so'nggi narxlar asosida hisoblandi."}</div>`;
    }
    $('#budgetSaveBtn').addEventListener('click', async () => {
        const val = parseFloat($('#budgetInput').value);
        monthlyBudget = (val && val > 0) ? val : 0;
        await saveBudget();
        renderBudget();
        showToast(monthlyBudget ? "Byudjet saqlandi" : "Byudjet tozalandi");
    });
    $('#toggleBudget').addEventListener('click', () => {
        $('#budgetPanel').classList.toggle('open');
        if ($('#budgetPanel').classList.contains('open')) renderBudget();
    });

    // ---------- mavsumiy mahsulotlar taqvimi ----------
    const SEASONAL_CALENDAR = {
        0: ["Anor", "Xurmo", "Non", "Guruch"], 1: ["Non", "Guruch", "Un"],
        2: ["Ismaloq", "Ukrop", "Rediska"], 3: ["Rediska", "Ukrop", "Salat bargi"],
        4: ["Qulupnay", "Gilos", "O'rik"], 5: ["Gilos", "O'rik", "Shaftoli", "Pomidor"],
        6: ["Tarvuz", "Qovun", "Shaftoli", "Bodring", "Pomidor"], 7: ["Tarvuz", "Qovun", "Uzum", "Baqlajon"],
        8: ["Uzum", "Anor", "Olma", "Behi"], 9: ["Olma", "Behi", "Qovoq", "Anor"],
        10: ["Qovoq", "Lavlagi", "Karam"], 11: ["Lavlagi", "Karam", "Anor"]
    };
    function renderSeasonalBanner() {
        const wrap = $('#seasonalWrap');
        const month = new Date().getMonth();
        const items = SEASONAL_CALENDAR[month] || [];
        const present = items.filter(p => PRODUCTS_BY_CATEGORY.sabzavot.includes(p) || PRODUCTS_BY_CATEGORY.meva.includes(p) || PRODUCTS_BY_CATEGORY.don.includes(p) || PRODUCTS_BY_CATEGORY.ziravor.includes(p));
        if (present.length === 0) { wrap.innerHTML = ''; return; }
        const monthNames = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
        wrap.innerHTML = `<div class="seasonal-banner">
        <span class="season-icon">📅</span>
        <span class="season-text">Hozir <b>${monthNames[month]}</b> — bu mahsulotlar mavsumida, odatda arzonroq bo'ladi:</span>
        <span class="season-items">${present.map(p => `<span class="season-chip">${PRODUCT_ICONS[p] || DEFAULT_ICON} ${p}</span>`).join('')}</span>
      </div>`;
    }

    // ---------- "eng ko'p o'zgargan narxlar" ----------
    function renderMovers(list) {
        const wrap = $('#moversWrap');
        if (!list || list.length === 0) { wrap.innerHTML = ''; return; }
        const grouped = groupByProduct(list);
        const changes = [];
        Object.entries(grouped).forEach(([p, arr]) => {
            const sorted = arr.slice().sort((a, b) => a.ts - b.ts);
            if (sorted.length < 2) return;
            const first = sorted[0].price, last = sorted[sorted.length - 1].price;
            if (!first) return;
            const pct = ((last - first) / first) * 100;
            if (Math.abs(pct) < 0.5) return;
            changes.push({ product: p, pct, last });
        });
        changes.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
        const top = changes.slice(0, 5);
        if (top.length === 0) { wrap.innerHTML = ''; return; }
        wrap.innerHTML = `<div class="movers-section">
        <div class="movers-title">📈 Eng ko'p o'zgargan narxlar</div>
        <div class="movers-grid">
          ${top.map(c => `<div class="mover-card">
              <span class="mover-icon">${PRODUCT_ICONS[c.product] || DEFAULT_ICON}</span>
              <div>
                <div class="mover-name">${c.product}</div>
                <div class="mover-change ${c.pct >= 0 ? 'up' : 'down'}">${c.pct >= 0 ? '▲' : '▼'} ${Math.abs(c.pct).toFixed(1)}%</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
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
        if (activeCategory === '__favorites') list = list.filter(e => favorites.has(e.product));
        else if (activeCategory) list = list.filter(e => e.category === activeCategory);
        if (query) list = list.filter(e => e.product.toLowerCase().includes(query));

        renderStats(list);
        renderMovers(list);
        renderSeasonalBanner();
        checkAlerts();
        if ($('#shoppingPanel').classList.contains('open')) renderShopping();
        if ($('#alertsPanel').classList.contains('open')) renderAlerts();
        if ($('#indexPanel').classList.contains('open')) renderMarketIndex();
        if ($('#leadersPanel').classList.contains('open')) renderLeaders();
        if ($('#recipesPanel').classList.contains('open')) renderRecipes();
        if ($('#budgetPanel').classList.contains('open')) renderBudget();
        if ($('#mapPanel').classList.contains('open')) renderMarketMap();

        if (list.length === 0) {
            const isFavView = activeCategory === '__favorites';
            board.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="glyph">${isFavView ? '⭐' : '🍉'}</div>
        <div><b>${isFavView ? "Hali sevimli mahsulot yo'q." : "Hozircha narx yo'q."}</b><br>${isFavView ? "Har bir mahsulot kartasidagi ⭐ belgisini bosib, uni sevimlilarga qo'shing." : 'Yuqoridagi "Narx qo\'shish" tugmasi orqali birinchi narxni kiriting.'}</div>
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

            const sparkSvg = pts ? `<div class="spark-wrap" data-product="${p}" title="To'liq grafikni ko'rish" tabindex="0" role="button" aria-label="${p} narx grafigini ko'rish"><svg class="spark" width="100%" height="44" viewBox="0 0 220 44" preserveAspectRatio="none">
          <polyline points="${pts}" fill="none" stroke="${d.trend === 'up' ? 'var(--down)' : d.trend === 'down' ? 'var(--up)' : 'var(--teal-light)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg></div>` : '';

            const productIcon = PRODUCT_ICONS[p] || DEFAULT_ICON;
            const softColor = hexToRgba(meta.color, 0.16);
            const inBasket = basket.has(p);
            const isFresh = (Date.now() - d.latestTs) < 2 * 60 * 1000;
            const isFav = favorites.has(p);
            const note = productNotes[p];
            const noteHtml = note ? `<div class="tag-note">📝 ${note}</div>` : '';

            return `<div class="tag" data-product="${p}" style="--cat-color:${meta.color}; --cat-color-soft:${softColor}; animation-delay:${Math.min(idx * 0.05, 0.5)}s">
        ${isFresh ? '<span class="fresh-badge">✦ Yangi</span>' : ''}
        <button class="fav-btn${isFav ? ' is-fav' : ''}" data-product="${p}" title="Sevimlilarga qo'shish/olib tashlash" aria-label="Sevimli">${isFav ? '★' : '☆'}</button>
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
        ${noteHtml}
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
        board.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(btn.dataset.product); });
        });
        board.querySelectorAll('.spark-wrap').forEach(el => {
            el.addEventListener('click', (e) => { e.stopPropagation(); openChartModal(el.dataset.product); });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openChartModal(el.dataset.product); }
            });
        });

        board.querySelectorAll('.tag').forEach(attachTilt);
    }

    // ---------- to'liq ekranli narx grafigi (fullscreen chart modal) ----------
    const chartModal = $('#chartModal');
    function formatDateShort(ts) {
        const d = new Date(ts);
        const months = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
        return `${d.getDate()}-${months[d.getMonth()]}`;
    }
    function openChartModal(product) {
        const list = entries.filter(e => e.product === product).slice().sort((a, b) => a.ts - b.ts);
        if (list.length === 0) return;
        $('#chartModalIcon').textContent = PRODUCT_ICONS[product] || DEFAULT_ICON;
        $('#chartModalTitle').textContent = product;
        $('#chartModalSub').textContent = `${list.length} ta yozuv · so'm / ${list[list.length - 1].unit}`;

        // ---------- 7 kunlik narx bashorati (oddiy chiziqli regressiya) ----------
        // Bu murakkab AI modeli emas — mavjud narx nuqtalari orqali eng mos to'g'ri chiziqni
        // topib (kichik kvadratlar usuli), shu tendensiyani 7 kun oldinga davom ettiradi.
        // Kamida 3 ta yozuv bo'lganda ma'noli bo'ladi; natija haqiqiy bozor narxidan farq qilishi mumkin.
        let forecast = null;
        if (list.length >= 3) {
            const x0 = list[0].ts;
            const xs = list.map(e => (e.ts - x0) / 86400000); // kunlarda
            const ys = list.map(e => e.price);
            const n = xs.length;
            const sumX = xs.reduce((a, b) => a + b, 0), sumY = ys.reduce((a, b) => a + b, 0);
            const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
            const sumXX = xs.reduce((s, x) => s + x * x, 0);
            const denom = (n * sumXX - sumX * sumX);
            if (denom !== 0) {
                const slope = (n * sumXY - sumX * sumY) / denom;
                const intercept = (sumY - slope * sumX) / n;
                const lastPrice = ys[ys.length - 1];
                const forecastDay = xs[xs.length - 1] + 7;
                let predicted = slope * forecastDay + intercept;
                // haqiqiy bozorlarda 7 kunda narx kamdan-kam ±35% dan ko'p o'zgaradi —
                // shovqinli ma'lumot regressiyani haddan tashqari cho'zib yubormasligi uchun cheklaymiz
                predicted = Math.max(lastPrice * 0.65, Math.min(lastPrice * 1.35, predicted));
                predicted = Math.max(0, predicted);
                const pct = lastPrice ? ((predicted - lastPrice) / lastPrice) * 100 : 0;
                forecast = { day: forecastDay, price: predicted, pct };
            }
        }

        const w = 700, h = 320, padL = 55, padR = 20, padT = 20, padB = 40;
        const prices = list.map(e => e.price);
        const allValues = forecast ? [...prices, forecast.price] : prices;
        const min = Math.min(...allValues), max = Math.max(...allValues);
        const range = (max - min) || 1;
        const innerW = w - padL - padR, innerH = h - padT - padB;
        // bashorat bo'lsa, oxirgi haqiqiy nuqtadan keyin bashorat uchun o'ng tomondan joy qoldiramiz
        const slotCount = forecast ? list.length : Math.max(1, list.length - 1);

        const points = list.map((e, i) => {
            const x = padL + (list.length === 1 ? innerW / 2 : (i / slotCount) * innerW);
            const y = padT + innerH - ((e.price - min) / range) * innerH;
            return { x, y, e };
        });

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${padT + innerH} L${points[0].x.toFixed(1)},${padT + innerH} Z`;

        let forecastSvg = '';
        if (forecast) {
            const fx = padL + innerW;
            const fy = padT + innerH - ((forecast.price - min) / range) * innerH;
            const lastP = points[points.length - 1];
            forecastSvg = `<line x1="${lastP.x.toFixed(1)}" y1="${lastP.y.toFixed(1)}" x2="${fx.toFixed(1)}" y2="${fy.toFixed(1)}" stroke="var(--saffron)" stroke-width="2.5" stroke-dasharray="5,5" stroke-linecap="round"/>
        <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="5.5" fill="var(--saffron)" stroke="var(--card-bg)" stroke-width="2"/>
        <text x="${(fx - 6).toFixed(1)}" y="${(fy - 12).toFixed(1)}" text-anchor="end" font-size="10.5" fill="var(--saffron)" font-weight="700" font-family="JetBrains Mono, monospace">~${fmt(forecast.price)}</text>`;
        }

        // Y o'qi belgilari
        const ySteps = 4;
        let axisSvg = '';
        for (let i = 0; i <= ySteps; i++) {
            const val = min + (range * i / ySteps);
            const y = padT + innerH - (innerH * i / ySteps);
            axisSvg += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>
        <text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--ink)" opacity="0.65" font-family="JetBrains Mono, monospace">${fmt(val)}</text>`;
        }
        // X o'qi sana belgilari (juda ko'p bo'lsa siyraklashtiramiz)
        const labelEvery = Math.max(1, Math.ceil(points.length / 7));
        let xLabels = '';
        points.forEach((p, i) => {
            if (i % labelEvery === 0 || i === points.length - 1) {
                xLabels += `<text x="${p.x.toFixed(1)}" y="${h - padB + 18}" text-anchor="middle" font-size="10.5" fill="var(--ink)" opacity="0.65" font-family="JetBrains Mono, monospace">${formatDateShort(p.e.ts)}</text>`;
            }
        });
        if (forecast) {
            const fx = padL + innerW;
            xLabels += `<text x="${fx.toFixed(1)}" y="${h - padB + 18}" text-anchor="middle" font-size="10.5" fill="var(--saffron)" font-weight="700" font-family="JetBrains Mono, monospace">+7 kun</text>`;
        }

        let dotsSvg = '';
        points.forEach((p, i) => {
            const prev = points[i - 1];
            const up = prev ? p.e.price > prev.e.price : false;
            const down = prev ? p.e.price < prev.e.price : false;
            const color = up ? 'var(--down)' : down ? 'var(--up)' : 'var(--teal-light)';
            dotsSvg += `<circle class="chart-pt" data-idx="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${color}" stroke="var(--card-bg)" stroke-width="2" style="cursor:pointer"/>`;
        });

        const svgEl = $('#chartModalSvg');
        svgEl.innerHTML = `
      ${axisSvg}
      <path d="${areaPath}" fill="var(--teal)" opacity="0.08"/>
      <path d="${linePath}" fill="none" stroke="var(--teal)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${forecastSvg}
      ${xLabels}
      ${dotsSvg}
    `;

        const forecastBox = $('#chartForecast');
        if (forecast) {
            const dirWord = forecast.pct > 1.5 ? 'oshishi' : forecast.pct < -1.5 ? 'pasayishi' : "deyarli o'zgarmasligi";
            forecastBox.hidden = false;
            forecastBox.innerHTML = `🔮 Mavjud tendensiyaga asoslanib, taxminan <b>7 kundan keyin</b> narx <b>${dirWord}</b> mumkin — taxminiy qiymat: <b>${fmt(forecast.price)}</b> so'm (${forecast.pct >= 0 ? '+' : ''}${forecast.pct.toFixed(1)}%). Bu shunchaki so'nggi narxlar tendensiyasiga asoslangan taxmin, kafolat emas.`;
        } else {
            forecastBox.hidden = false;
            forecastBox.innerHTML = `🔮 Bashorat qilish uchun kamida 3 ta narx yozuvi kerak — yana narx qo'shsangiz, bashorat shu yerda paydo bo'ladi.`;
        }

        const tooltip = $('#chartModalTooltip');
        svgEl.querySelectorAll('.chart-pt').forEach(dot => {
            dot.addEventListener('mouseenter', () => {
                const idx = Number(dot.dataset.idx);
                const p = points[idx];
                tooltip.hidden = false;
                tooltip.innerHTML = `<b>${fmt(p.e.price)}</b> so'm · ${p.e.market}<br>${new Date(p.e.ts).toLocaleDateString('uz-UZ')}`;
                const rect = svgEl.getBoundingClientRect();
                const scaleX = rect.width / w;
                tooltip.style.left = (p.x * scaleX) + 'px';
                tooltip.style.top = (p.y * (rect.height / h)) + 'px';
            });
            dot.addEventListener('mouseleave', () => { tooltip.hidden = true; });
        });

        chartModal.classList.add('show');
    }
    $('#chartClose').addEventListener('click', () => chartModal.classList.remove('show'));
    chartModal.addEventListener('click', (e) => { if (e.target === chartModal) chartModal.classList.remove('show'); });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chartModal.classList.contains('show')) chartModal.classList.remove('show');
    });

    // sichqoncha harakatiga qarab yengil 3D moyillik (tilt) effekti
    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function attachTilt(card) {
        if (!supportsHover) return; // teginish ekranlarida bu effekt kerak emas va "yopishib qolishi" mumkin
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

    // ---------- taomlar narx kalkulyatori ----------
    // taom retseptlaridagi mahsulot nomlarini bozor mahsulotlariga bog'lash uchun qo'lda tuzilgan mos kelish jadvali
    const INGREDIENT_ALIASES = {
        "mol yoki qo'y go'shti": "Go'sht (mol)", "qo'y yoki mol go'shti": "Go'sht (qo'y)",
        "mol go'shti (qiyma)": "Qiyma", "mol yoki qo'y go'shti (qiyma)": "Qiyma",
        "mol go'shti": "Go'sht (mol)", "qo'y go'shti": "Go'sht (qo'y)",
        "bulg'or qalampiri": "Qalampir", "bug'doy (maydalangan)": "Bug'doy",
        "tuxum": "Tuxum (10 dona)", "tuxum oqi": "Tuxum (10 dona)",
        "dumba yog'i (ixtiyoriy)": "Dumba yog'i", "guruch yoki jigar": "Guruch"
    };
    function findProductForIngredient(namePart) {
        const key = namePart.trim().toLowerCase();
        if (INGREDIENT_ALIASES[key]) return INGREDIENT_ALIASES[key];
        const products = Object.keys(PRODUCT_ICONS).sort((a, b) => b.length - a.length);
        for (const p of products) {
            if (key.includes(p.toLowerCase())) return p;
        }
        for (const p of products) {
            if (p.toLowerCase().includes(key)) return p;
        }
        return null;
    }
    function parseIngredientQty(qtyPart) {
        const m = qtyPart.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litr|dona|bosh)/i);
        if (!m) return null;
        return { amount: parseFloat(m[1].replace(',', '.')), unit: m[2].toLowerCase() };
    }
    function estimateDishCost(dish) {
        let total = 0, matched = 0, totalItems = 0;
        dish.ingredients.forEach(ing => {
            const parts = ing.split(' — ');
            if (parts.length < 2) return;
            totalItems++;
            const product = findProductForIngredient(parts[0]);
            const qty = parseIngredientQty(parts[1]);
            if (!product || !qty) return;
            const info = latestPriceInfo(product);
            if (!info) return;
            let amountInProductUnit = null;
            const pu = (info.unit || 'kg').toLowerCase();
            if (qty.unit === 'g' && pu === 'kg') amountInProductUnit = qty.amount / 1000;
            else if (qty.unit === 'kg' && pu === 'kg') amountInProductUnit = qty.amount;
            else if (qty.unit === 'ml' && (pu === 'litr' || pu === 'l')) amountInProductUnit = qty.amount / 1000;
            else if ((qty.unit === 'l' || qty.unit === 'litr') && (pu === 'litr' || pu === 'l')) amountInProductUnit = qty.amount;
            else if (qty.unit === 'dona' && pu === 'dona') amountInProductUnit = qty.amount;
            if (amountInProductUnit === null) return;
            total += info.avg * amountInProductUnit;
            matched++;
        });
        if (matched === 0) return null;
        return { total, matched, totalItems };
    }

    function renderRecipes() {
        const grid = $('#recipeGrid');
        grid.innerHTML = DISHES.map((d, i) => {
            const cost = estimateDishCost(d);
            const costHtml = cost
                ? `<span class="recipe-cost">💰 ~${fmt(cost.total)} so'm${cost.matched < cost.totalItems ? ' (qisman)' : ''}</span>`
                : '';
            return `
      <div class="recipe-card" style="animation-delay:${Math.min(i * 0.04, 0.4)}s">
        <div class="recipe-card-head">
          <span class="recipe-icon">${d.icon}</span>
          <span class="recipe-name">${d.name}</span>
          ${costHtml}
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
      </div>`;
        }).join('');

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
        const note = $('#inNote').value.trim();

        if (!product) { showToast("Mahsulot nomini kiriting"); return; }
        if (!price || price <= 0) { showToast("To'g'ri narx kiriting"); return; }

        const newId = entries.length ? Math.max(...entries.map(e => e.id)) + 1 : 1;
        const wasOffline = !navigator.onLine;
        const newEntry = { id: newId, market, product, category, price, unit, ts: Date.now() };
        if (sharedMode && authorName) newEntry.author = authorName;
        if (wasOffline) newEntry.pending = true;
        entries.push(newEntry);
        await saveEntries();
        if (note) { productNotes[product] = note; await saveNotes(); }
        if (wasOffline) { pendingCount++; updateSyncBadge(); }
        render();
        inProduct.value = '';
        $('#inPrice').value = '';
        $('#inNote').value = '';
        showToast(`${product} narxi qo'shildi — ${fmt(price)} so'm/${unit}${wasOffline ? ' (oflayn — keyin sinxronlanadi)' : ''}`);
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
    function applySharedModeUi() {
        $('#authorField').hidden = !sharedMode;
        $('#toggleLeaders').hidden = !sharedMode;
        $('#formNoteText').textContent = sharedMode
            ? "Diqqat: umumiy taxtaga kiritilgan narxlar boshqa foydalanuvchilarga ham ko'rinadi va o'zgartirilishi mumkin."
            : "Ma'lumotlar faqat sizning hisobingizda saqlanadi va boshqalarga ko'rinmaydi.";
    }
    sharedBtn.addEventListener('click', async () => {
        sharedMode = !sharedMode;
        sharedBtn.classList.toggle('active', sharedMode);
        sharedBtn.textContent = sharedMode ? "🌐 Umumiy" : "👤 Shaxsiy";
        applySharedModeUi();
        if (sharedMode) {
            showToast("Diqqat: umumiy taxtaga kiritilgan narxlarni BOSHQA foydalanuvchilar ham ko'radi va o'zgartira oladi");
        } else {
            showToast("Shaxsiy taxtaga qaytdingiz — endi faqat siz ko'rasiz");
        }
        await loadEntries();
    });
    applySharedModeUi();

    // ---------- shrift o'lchami ----------
    let fontScale = 1;
    const supportsCssZoom = (() => {
        try { return CSS.supports('zoom', '1'); } catch (e) { return false; }
    })();
    function applyFontScale() {
        if (supportsCssZoom) {
            document.body.style.zoom = fontScale;
        } else {
            // zoom qo'llab-quvvatlanmasa (masalan ba'zi Firefox versiyalari), transform bilan orqaga qaytish
            document.body.style.transformOrigin = 'top left';
            document.body.style.transform = fontScale === 1 ? '' : `scale(${fontScale})`;
            document.body.style.width = fontScale === 1 ? '' : `${100 / fontScale}%`;
        }
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

    // ---------- ovozli buyruqlar (masalan: "Kartoshka narxini ko'rsat", "narx qo'sh", "qorong'i rejim") ----------
    // ESLATMA: brauzerlarning nutqni tanish tizimlari hozircha o'zbek tilini to'liq
    // qo'llab-quvvatlamaydi, shu sabab yuqoridagi mikrofon tugmasi kabi 'ru-RU' bilan ishlaymiz —
    // bu 100% aniq emas, lekin lotin harflaridagi so'zlarni ham taxminan tanib oladi.
    const voiceCmdBtn = $('#voiceCmdBtn');
    if (!SpeechRecognitionCtor) {
        voiceCmdBtn.style.display = 'none';
    } else {
        const cmdRecognition = new SpeechRecognitionCtor();
        cmdRecognition.lang = 'ru-RU';
        cmdRecognition.interimResults = false;
        cmdRecognition.maxAlternatives = 1;
        let cmdListening = false;

        function normalizeUz(s) {
            return s.toLowerCase()
                .replace(/[’‘`ʻʼ]/g, "'")
                .replace(/[^a-z0-9а-яё' ]/gi, '')
                .trim();
        }

        function closeAllPanels() {
            document.querySelectorAll('.panel.open').forEach(p => p.classList.remove('open'));
        }

        function runVoiceCommand(rawTranscript) {
            const t = normalizeUz(rawTranscript);
            showToast(`🎙️ Eshitildi: "${rawTranscript}"`);

            if (/qo'?sh|добав/.test(t) && /narx|цен/.test(t)) { $('#toggleAdd').click(); return; }
            if (/xarid|покуп/.test(t)) { $('#toggleShopping').classList.contains('open') || $('#toggleShopping').click(); return; }
            if (/byudjet|бюджет/.test(t)) { $('#toggleBudget').classList.contains('open') || $('#toggleBudget').click(); return; }
            if (/xarita|карта/.test(t)) { $('#toggleMap').classList.contains('open') || $('#toggleMap').click(); return; }
            if (/qorong|tungi|темн|ноч/.test(t)) { if (document.documentElement.dataset.theme !== 'dark') $('#themeToggle').click(); return; }
            if (/yorug|kunduzgi|светл|дневн/.test(t)) { if (document.documentElement.dataset.theme === 'dark') $('#themeToggle').click(); return; }
            if (/arzon|дешев/.test(t)) { $('#sortFilter').value = 'price-asc'; render(); showToast('Arzondan qimmatga saralandi'); return; }
            if (/qimmat|дорог/.test(t)) { $('#sortFilter').value = 'price-desc'; render(); showToast('Qimmatdan arzonga saralandi'); return; }
            if (/yop|bekor|закр|отмен/.test(t)) { closeAllPanels(); return; }

            // aks holda — mahsulot nomini topishga harakat qilamiz ("kartoshka narxini ko'rsat" -> "kartoshka")
            const candidates = Object.keys(PRODUCT_ICONS)
                .map(p => ({ p, np: normalizeUz(p) }))
                .filter(c => c.np.length >= 3)
                .sort((a, b) => b.np.length - a.np.length);
            const found = candidates.find(c => t.includes(c.np) || c.np.includes(t.split(' ')[0] || ''));
            if (found) {
                $('#searchBox').value = found.p;
                render();
                showToast(`"${found.p}" topildi`);
                setTimeout(() => openChartModal(found.p), 300);
            } else {
                showToast("Buyruq tushunilmadi — boshqacha urinib ko'ring");
            }
        }

        cmdRecognition.addEventListener('result', (e) => runVoiceCommand(e.results[0][0].transcript));
        cmdRecognition.addEventListener('end', () => { cmdListening = false; voiceCmdBtn.classList.remove('listening'); });
        cmdRecognition.addEventListener('error', () => {
            cmdListening = false;
            voiceCmdBtn.classList.remove('listening');
            showToast("Ovozli buyruqni aniqlab bo'lmadi");
        });
        voiceCmdBtn.addEventListener('click', () => {
            if (cmdListening) { cmdRecognition.stop(); return; }
            try {
                cmdRecognition.start();
                cmdListening = true;
                voiceCmdBtn.classList.add('listening');
                showToast('🎙️ Tinglanmoqda...');
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
        tabFav: { uz: "Sevimlilar", ru: "Избранное", en: "Favorites" },
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
        const tabMap = ['tabAll', 'tabFav', 'tabVeg', 'tabFruit', 'tabMeat', 'tabGrain', 'tabSpice', 'tabOther'];
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

    // ---------- oflayn holat va sinxronlash ko'rsatkichi ----------
    let pendingCount = 0;
    const syncBadge = $('#syncBadge');
    function updateSyncBadge() {
        if (!navigator.onLine) {
            syncBadge.hidden = false;
            syncBadge.className = 'sync-badge offline';
            syncBadge.textContent = pendingCount > 0 ? `Oflayn · ${pendingCount} ta kutmoqda` : 'Oflayn rejim';
        } else if (pendingCount > 0) {
            syncBadge.hidden = false;
            syncBadge.className = 'sync-badge pending';
            syncBadge.textContent = `Sinxronlanmoqda... ${pendingCount} ta`;
        } else {
            syncBadge.hidden = true;
        }
    }
    async function syncPendingEntries() {
        const stillPending = entries.filter(e => e.pending);
        if (stillPending.length === 0) { pendingCount = 0; updateSyncBadge(); return; }
        stillPending.forEach(e => { delete e.pending; });
        pendingCount = 0;
        await saveEntries();
        updateSyncBadge();
        showToast(`${stillPending.length} ta oflayn narx muvaffaqiyatli sinxronlandi ✓`);
        render();
    }
    window.addEventListener('offline', updateSyncBadge);
    window.addEventListener('online', () => { syncPendingEntries(); });

    const introStart = performance.now();
    Promise.all([loadShopping(), loadAlerts(), loadNotes(), loadAuthor(), loadBudget()]).then(() => loadEntries()).then(() => {
        pendingCount = entries.filter(e => e.pending).length;
        updateSyncBadge();
        if (navigator.onLine && pendingCount > 0) syncPendingEntries();
        moveIndicator(tabsNav.querySelector('.tab.active'));
        checkIncomingShare();
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

    // ---------- chek/rasm orqali narxni aniqlash (OCR) ----------
    // Tesseract.js — bepul, ochiq manbali, brauzerda ishlaydigan OCR kutubxonasi (API kalit shart emas).
    // Birinchi marta ishlatilganda internetdan yuklab olinadi, keyin brauzer keshida qoladi.
    const ocrBtn = $('#ocrBtn');
    const ocrFileInput = $('#ocrFileInput');
    let tesseractLoadPromise = null;
    function loadTesseract() {
        if (window.Tesseract) return Promise.resolve(window.Tesseract);
        if (tesseractLoadPromise) return tesseractLoadPromise;
        tesseractLoadPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            s.onload = () => resolve(window.Tesseract);
            s.onerror = () => reject(new Error('OCR kutubxonasi yuklanmadi'));
            document.head.appendChild(s);
        });
        return tesseractLoadPromise;
    }
    ocrBtn.addEventListener('click', () => ocrFileInput.click());
    ocrFileInput.addEventListener('change', async () => {
        const file = ocrFileInput.files[0];
        if (!file) return;
        ocrBtn.classList.add('busy');
        showToast('📷 Rasm o\'qilmoqda, biroz kuting...');
        try {
            const Tesseract = await loadTesseract();
            const { data } = await Tesseract.recognize(file, 'eng');
            const text = (data && data.text) || '';
            // matndagi barcha raqam ketma-ketliklarini topamiz (bo'sh joy/vergul ajratuvchi bo'lishi mumkin)
            const rawMatches = text.match(/\d[\d ,.]{0,9}\d|\d{2,}/g) || [];
            const nums = rawMatches
                .map(m => Number(m.replace(/[^\d]/g, '')))
                .filter(n => n >= 100 && n <= 100000000); // haqiqatga yaqin narx oralig'i
            if (nums.length) {
                // chekda odatda eng katta raqam — umumiy summa yoki narx bo'ladi
                const guess = Math.max(...nums);
                $('#inPrice').value = guess;
                showToast(`Taxminiy narx: ${fmt(guess)} so'm — to'g'riligini tekshirib, kerak bo'lsa tahrirlang`);
            } else {
                showToast("Rasmdan raqam aniqlanmadi — qo'lda kiriting");
            }
        } catch (e) {
            showToast("Rasmni o'qib bo'lmadi — internetni tekshiring yoki qo'lda kiriting");
        } finally {
            ocrBtn.classList.remove('busy');
            ocrFileInput.value = '';
        }
    });

    // ---------- do'stlar bilan narx taqqoslash (havola orqali ulashish) ----------
    // Bu haqiqiy jonli sinxronizatsiya emas (buning uchun server kerak bo'lardi) — aksincha,
    // joriy narxlaringiz havola ichiga "suratga olinadi", do'stingiz shu havolani ochganda
    // ularni o'z ro'yxatiga qo'shish-qo'shmasligini tanlaydi.
    function utf8ToB64(str) { return btoa(unescape(encodeURIComponent(str))); }
    function b64ToUtf8(str) { return decodeURIComponent(escape(atob(str))); }

    $('#shareLinkBtn').addEventListener('click', async () => {
        if (entries.length === 0) { showToast("Ulashish uchun hali narxingiz yo'q"); return; }
        const grouped = groupByProduct(entries);
        const latest = Object.values(grouped).map(list => list.slice().sort((a, b) => b.ts - a.ts)[0]);
        latest.sort((a, b) => b.ts - a.ts);
        const snapshot = latest.slice(0, 60).map(e => [e.market, e.product, e.category, e.price, e.unit, e.ts]);
        const payload = { v: 1, from: authorName || "Do'stingiz", items: snapshot };
        let url;
        try {
            url = `${location.origin}${location.pathname}#share=${encodeURIComponent(utf8ToB64(JSON.stringify(payload)))}`;
        } catch (e) { showToast("Havola yaratib bo'lmadi"); return; }
        try {
            await navigator.clipboard.writeText(url);
            showToast(`🔗 Havola nusxalandi (${snapshot.length} ta narx) — do'stingizga yuboring`);
        } catch (e) {
            window.prompt("Havolani nusxalab, do'stingizga yuboring:", url);
        }
    });

    let pendingShareImport = null;
    function checkIncomingShare() {
        const m = location.hash.match(/#share=([^&]+)/);
        if (!m) return;
        try {
            const payload = JSON.parse(b64ToUtf8(decodeURIComponent(m[1])));
            if (!payload || !Array.isArray(payload.items) || !payload.items.length) return;
            pendingShareImport = payload;
            $('#shareImportSub').textContent = `${payload.from || "Do'stingiz"} sizga ${payload.items.length} ta narxni ulashdi`;
            $('#shareImportList').innerHTML = payload.items.slice(0, 40).map(it => {
                const [market, product, , price, unit] = it;
                return `<div class="share-import-row"><span>${PRODUCT_ICONS[product] || DEFAULT_ICON} ${product} <span style="opacity:.55">(${market})</span></span><b>${fmt(price)} so'm/${unit}</b></div>`;
            }).join('') + (payload.items.length > 40 ? `<div class="share-import-row">... va yana ${payload.items.length - 40} ta</div>` : '');
            $('#shareImportModal').classList.add('show');
        } catch (e) { /* noto'g'ri yoki buzilgan havola — e'tiborsiz qoldiramiz */ }
    }
    function clearShareHash() {
        history.replaceState(null, '', location.pathname + location.search);
    }
    $('#shareImportClose').addEventListener('click', () => { $('#shareImportModal').classList.remove('show'); clearShareHash(); });
    $('#shareImportIgnoreBtn').addEventListener('click', () => { $('#shareImportModal').classList.remove('show'); clearShareHash(); });
    $('#shareImportAcceptBtn').addEventListener('click', async () => {
        if (!pendingShareImport) return;
        let nextId = entries.length ? Math.max(...entries.map(e => e.id)) + 1 : 1;
        const existingKeys = new Set(entries.map(e => `${e.market}|${e.product}|${e.price}|${e.ts}`));
        let added = 0;
        pendingShareImport.items.forEach(it => {
            const [market, product, category, price, unit, ts] = it;
            const key = `${market}|${product}|${price}|${ts}`;
            if (existingKeys.has(key)) return;
            entries.push({ id: nextId++, market, product, category, price, unit, ts, author: pendingShareImport.from });
            existingKeys.add(key);
            added++;
        });
        await saveEntries();
        render();
        $('#shareImportModal').classList.remove('show');
        clearShareHash();
        showToast(added ? `${added} ta narx ro'yxatingizga qo'shildi ✓` : "Bu narxlar allaqachon ro'yxatingizda bor");
    });

    window.addEventListener('hashchange', checkIncomingShare);

    // ---------- PWA: telefon ekraniga o'rnatish uchun service worker ----------
    // faqat http(s) orqali ochilganda ishga tushadi — file:// orqali ochilganda brauzer buni qo'llab-quvvatlamaydi
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => { /* offline qo'llab-quvvatlash ixtiyoriy, xato jim o'tkaziladi */ });
        });
    }

    // ---------- PWA: ilova sifatida o'rnatish tugmasi ----------
    const installBtn = $('#installBtn');
    let deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        installBtn.hidden = false;
    });
    installBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        installBtn.hidden = true;
        deferredInstallPrompt.prompt();
        try {
            const { outcome } = await deferredInstallPrompt.userChoice;
            showToast(outcome === 'accepted' ? "Ilova o'rnatildi 🎉" : "O'rnatish bekor qilindi");
        } catch (e) { /* jim o'tkazamiz */ }
        deferredInstallPrompt = null;
    });
    window.addEventListener('appinstalled', () => {
        installBtn.hidden = true;
        deferredInstallPrompt = null;
    });
})();