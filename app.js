/* === CONFIGURACIÓN Y ESTADOS === */
const docHtml = document.documentElement;
const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
docHtml.setAttribute('data-theme', currentTheme);

document.getElementById('theme-toggle').addEventListener('click', () => {
    const newTheme = docHtml.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    docHtml.setAttribute('data-theme', newTheme); localStorage.setItem('theme', newTheme);
});

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    let icon = type === 'success' ? '✨' : type === 'error' ? '⚠️' : 'ℹ️';
    toast.className = `toast toast-${type}`; toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hiding'); toast.addEventListener('animationend', () => toast.remove()); }, 3000);
}

/* === CARGA DE DATOS ESTÁTICOS === */
window.cardDatabase = []; // Base de datos en memoria

async function loadDatabase() {
    try {
        // Perla: Definimos las partes que generó el script de Python
        const archivosJSON = [
            'cards_part_1.json',
            'cards_part_2.json',
            'cards_part_3.json',
            'cards_part_4.json',
            'cards_part_5.json',
            'cards_part_6.json',
            'cards_part_7.json'
        ];

        // Perla: Descargamos todas las partes en paralelo para mayor velocidad
        const promesas = archivosJSON.map(archivo => fetch(archivo).then(res => res.json()));
        const resultados = await Promise.all(promesas);

        // Perla: Unimos todos los fragmentos en tu variable global original
        window.cardDatabase = resultados.flat();
        
        // Actualizamos el DOM tal como lo tenías
        document.getElementById('stat-global').innerText = window.cardDatabase.length;
        document.getElementById('global-total-display').innerHTML = `<strong class="text-accent">${window.cardDatabase.length} cards</strong>`;
        
        populateFiltersAndStats();

        // Ocultar la pantalla de carga de Perla y mostrar 50 cartas aleatorias
        const globalLoader = document.getElementById('global-loader');
        globalLoader.classList.add('opacity-0');
        
        setTimeout(() => {
            globalLoader.classList.add('hidden');
            performSearch(true, 50); // Muestra 50 cartas random nada más entrar
        }, 500);

    } catch (error) {
        console.error("Error cargando DB:", error);
        showToast("No se pudo cargar la base de datos", "error");
        
        // Ocultar el loader incluso si hay error para que no quede bloqueado
        document.getElementById('global-loader').classList.add('hidden');
    }
}

function populateFiltersAndStats() {
    const providers = {}; const sets = new Set(); const langs = new Set();
    
    window.cardDatabase.forEach(c => {
        if(c.provider) providers[c.provider] = (providers[c.provider] || 0) + 1;
        if(c.set_name) sets.add(c.set_name);
        if(c.language && c.language !== 'N/A') {
            let l = c.language.trim().toUpperCase();
            if(['JA', 'JA_JA', 'JPN', 'JP'].includes(l)) langs.add('JP/JA');
            else langs.add(l);
        }
    });

    // Llenar Stats
    const statsContainer = document.getElementById('dynamic-stats');
    for(const [prov, count] of Object.entries(providers)) {
        statsContainer.innerHTML += `
            <div class="bg-card-alt rounded-2xl p-6 border border-theme shadow-sm">
                <p class="text-xs font-medium text-muted mb-1">${prov}</p>
                <h3 class="text-2xl font-bold text-main">${count} <span class="text-sm text-muted opacity-50">cards</span></h3>
            </div>`;
    }

    // Llenar Dropdowns
    const fProv = document.getElementById('filter-provider');
    Object.keys(providers).sort().forEach(p => fProv.innerHTML += `<option value="${p}">${p}</option>`);
    
    const fSet = document.getElementById('filter-set');
    Array.from(sets).sort().forEach(s => fSet.innerHTML += `<option value="${s}">${s}</option>`);
    
    const fLang = document.getElementById('filter-lang');
    Array.from(langs).sort().forEach(l => fLang.innerHTML += `<option value="${l}">${l}</option>`);
}

/* === BÚSQUEDA Y FILTRADO LOCAL === */
const searchInput = document.getElementById('search-input'); const filterNum = document.getElementById('filter-num');
const filters = ['filter-provider', 'filter-lang', 'filter-set', 'filter-sort'].map(id => document.getElementById(id));
const resultsGrid = document.getElementById('results-grid'); const resultsSection = document.getElementById('results-section');
const emptyState = document.getElementById('empty-state'); const template = document.getElementById('card-template');

function hexToRgb(hex) {
    let h = hex.replace('#', '');
    return { r: parseInt(h.substring(0,2), 16), g: parseInt(h.substring(2,4), 16), b: parseInt(h.substring(4,6), 16) };
}

function colorDistance(rgb1, rgb2) {
    return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
}

// Hashing visual cliente
function getHammingDistance(h1, h2) {
    if(!h1 || !h2) return 999;
    let dist = 0;
    for(let i=0; i<h1.length; i++) {
        let n1 = parseInt(h1[i], 16); let n2 = parseInt(h2[i], 16);
        let xor = n1 ^ n2;
        while(xor > 0) { dist += xor & 1; xor >>= 1; }
    }
    return dist;
}

// Añadí el parámetro limit a la búsqueda aleatoria
function performSearch(isRandom = false, randomLimit = 200) {
    const query = searchInput.value.trim().toLowerCase(); const num = filterNum.value.trim();
    const providerFilter = filters[0].value; const lang = filters[1].value; const set = filters[2].value; const sort = filters[3].value;

    let dataSource = currentView === 'HOME' ? window.cardDatabase : (currentView === 'FAVS' ? favorites : compareStash);

    if (currentView === 'HOME' && !query && !num && !lang && !set && !sort && providerFilter == 'GLOBAL_SEARCH' && !isRandom && !selectedColor && !uploadedImageHash) {
        resultsSection.classList.add('hidden'); emptyState.classList.remove('hidden'); return;
    }

    let results = [];
    let targetRgb = selectedColor ? hexToRgb(selectedColor) : null;

    // Filtrado iterativo en JS
    for(let c of dataSource) {
        if(query && !c.name.toLowerCase().includes(query)) continue;
        if(num && String(c.card_number) !== num) continue;
        if(set && c.set_name !== set) continue;
        if(providerFilter !== 'GLOBAL_SEARCH' && c.source_label !== providerFilter) continue;
        
        if(lang) {
            let cardLang = c.language ? c.language.trim().toUpperCase() : '';
            if(lang === 'JP/JA') { if(!['JA', 'JA_JA', 'JPN', 'JP'].includes(cardLang)) continue; }
            else if(cardLang !== lang) continue;
        }

        if(targetRgb && c.palette) {
            try {
                let colors = JSON.parse(c.palette); let matches = false;
                for(let col of colors) {
                    if(colorDistance(targetRgb, hexToRgb(col)) <= 90) { matches = true; break; }
                }
                if(!matches) continue;
            } catch(e) {}
        }

        if(uploadedImageHash && c.phash) {
            c._dist = getHammingDistance(uploadedImageHash, c.phash);
            if(c._dist > 20) continue;
        }

        results.push(c);
    }

    // Ordenamiento
    if(uploadedImageHash) {
        results.sort((a,b) => a._dist - b._dist);
    } else if (isRandom) {
        results.sort(() => 0.5 - Math.random());
        results = results.slice(0, randomLimit); // Aplicamos el límite que pasamos por parámetro
    } else {
        results.sort((a,b) => a.name.localeCompare(b.name));
    }

    if(sort) {
        results.sort((a,b) => {
            let resA = a.resolution ? parseInt(a.resolution.split('x')[0]) * parseInt(a.resolution.split('x')[1]) : 0;
            let resB = b.resolution ? parseInt(b.resolution.split('x')[0]) * parseInt(b.resolution.split('x')[1]) : 0;
            return sort === 'asc' ? resA - resB : resB - resA;
        });
    }

    // Limitar renderizado a 250 para rendimiento
    if(currentView === 'HOME' && !uploadedImageHash && !isRandom) results = results.slice(0, 250);

    document.getElementById('results-count').innerText = isRandom ? `Muestra Aleatoria: ${results.length}` : results.length;
    renderResults(results);
}

function renderResults(cards) {
    resultsGrid.innerHTML = '';
    document.getElementById('empty-state').classList.add('hidden'); document.getElementById('results-section').classList.remove('hidden');

    if (cards.length === 0) { resultsGrid.innerHTML = `<div class="col-span-full py-10 text-center text-muted">Aún no hay cartas aquí.</div>`; return; }

    cards.forEach(card => {
        const clone = template.content.cloneNode(true); 
        const cardEl = clone.querySelector('.card-element'); 
        
        // Usamos img_url externa
        const imgUrl = card.img_url || card.image_url || card.image_path; 
        cardEl.dataset.path = imgUrl; 
        
        const favBtn = clone.querySelector('.fav-thumb-btn'); 
        const imgEl = clone.querySelector('.card-img');
        
        imgEl.src = imgUrl; 
        
        if(favorites.some(f => (f.img_url || f.image_url || f.image_path) === imgUrl)) favBtn.classList.add('active-heart');
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(card, [favBtn]); });

        clone.querySelector('.card-name').innerText = card.name; 
        clone.querySelector('.card-number').innerText = card.card_number ? `#${card.card_number}` : '';
        clone.querySelector('.card-set').innerText = card.set_name; 
        clone.querySelector('.card-lang').innerText = card.language || 'N/A';
        clone.querySelector('.card-source').innerText = card.source_label; 
        clone.querySelector('.card-res').innerText = card.resolution || 'High-Res';

        cardEl.addEventListener('click', () => {
            if (currentView === 'COMPARE') {
                const isSelected = selectedForComparison.some(c => (c.img_url || c.image_url || c.image_path) === imgUrl);
                if (isSelected) { 
                    selectedForComparison = selectedForComparison.filter(c => (c.img_url || c.image_url || c.image_path) !== imgUrl); 
                    cardEl.classList.remove('card-selected-compare'); 
                } 
                else {
                    if (selectedForComparison.length >= 2) { showToast('Ya seleccionaste 2', 'error'); return; }
                    selectedForComparison.push(card); cardEl.classList.add('card-selected-compare');
                }
                const launchBtn = document.getElementById('btn-launch-compare');
                if (selectedForComparison.length === 2) launchBtn.classList.remove('hidden'); else launchBtn.classList.add('hidden');
            } else { openModal(card, imgUrl); }
        });
        resultsGrid.appendChild(clone);
    });
}

/* === EVENTOS BÁSICOS === */
let debounce; [searchInput, filterNum].forEach(el => { el.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => performSearch(false), 400); }); });
filters.forEach(el => el.addEventListener('change', () => performSearch(false)));
document.getElementById('btn-random').addEventListener('click', () => performSearch(true, 50)); // Botón de dado ahora saca 50

document.getElementById('btn-reset').addEventListener('click', () => { 
    searchInput.value = ''; filterNum.value = ''; filters.forEach(el => el.selectedIndex = 0); 
    selectedColor = ''; document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active')); document.getElementById('btn-clear-color').classList.add('hidden');
    uploadedImageHash = ''; document.getElementById('image-upload').value = ''; 
    const prevCont = document.getElementById('image-preview-container'); prevCont.classList.add('hidden'); prevCont.classList.remove('flex');
    if(currentView === 'HOME') { 
        // En lugar de mostrar empty-state, sacamos 50 nuevas aleatorias
        performSearch(true, 50); 
    } else { performSearch(); }
});

/* === RUEDA DE COLOR === */
const colorPalette = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#FFFFFF', '#000000'];
let selectedColor = '';
colorPalette.forEach(hex => {
    const div = document.createElement('div'); div.className = 'color-swatch'; div.style.backgroundColor = hex; div.title = hex;
    div.onclick = () => {
        document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
        div.classList.add('active'); selectedColor = hex; document.getElementById('btn-clear-color').classList.remove('hidden'); performSearch();
    };
    document.getElementById('color-picker-container').appendChild(div);
});
document.getElementById('btn-clear-color').addEventListener('click', () => {
    selectedColor = ''; document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
    document.getElementById('btn-clear-color').classList.add('hidden'); performSearch();
});

/* === BÚSQUEDA VISUAL (JS CLIENTE) === */
const modalVisual = document.getElementById('image-search-modal'); const fileInput = document.getElementById('image-upload');
let uploadedImageHash = '';

document.getElementById('btn-visual-trigger').addEventListener('click', () => modalVisual.classList.add('active'));
document.getElementById('close-image-search').addEventListener('click', () => modalVisual.classList.remove('active'));
document.getElementById('btn-upload-file').addEventListener('click', () => fileInput.click());

window.addEventListener('paste', async (e) => {
    if (!modalVisual.classList.contains('active')) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) { if (items[i].type.startsWith('image')) { processClientImage(items[i].getAsFile()); break; } }
});
fileInput.addEventListener('change', (e) => { if(e.target.files[0]) processClientImage(e.target.files[0]); });

function processClientImage(file) {
    const url = URL.createObjectURL(file);
    document.getElementById('image-preview').src = url;
    document.getElementById('image-loader').classList.remove('hidden');
    
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = 8; canvas.height = 8;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 8, 8);
        const data = ctx.getImageData(0,0,8,8).data;
        let sum = 0, grays = [];
        for(let i=0; i<data.length; i+=4) { let g = (data[i]+data[i+1]+data[i+2])/3; grays.push(g); sum+=g; }
        let avg = sum / 64; let binary = '';
        for(let i=0; i<64; i++) binary += grays[i] >= avg ? '1' : '0';
        
        let hex = ''; for(let i=0; i<64; i+=4) hex += parseInt(binary.substr(i,4), 2).toString(16);
        
        uploadedImageHash = hex;
        document.getElementById('image-loader').classList.add('hidden');
        document.getElementById('image-preview-container').classList.remove('hidden'); document.getElementById('image-preview-container').classList.add('flex');
        modalVisual.classList.remove('active'); performSearch();
    };
    img.src = url;
}

document.getElementById('btn-clear-image').addEventListener('click', () => {
    uploadedImageHash = ''; fileInput.value = ''; document.getElementById('image-preview-container').classList.remove('flex'); document.getElementById('image-preview-container').classList.add('hidden'); performSearch();
});


/* === VISTAS Y FAVORITOS === */
let currentView = 'HOME'; let favorites = JSON.parse(localStorage.getItem('tcg_favorites') || '[]'); let compareStash = JSON.parse(localStorage.getItem('tcg_compare') || '[]'); let selectedForComparison = [];

function switchView(newView) {
    if(currentView === newView) return; document.getElementById('main-content').classList.add('view-hidden');
    setTimeout(() => {
        currentView = newView; ['stats-section', 'fav-header', 'compare-header', 'btn-random', 'btn-launch-compare'].forEach(id => document.getElementById(id).classList.add('hidden')); selectedForComparison = [];
        if(currentView === 'HOME') { document.getElementById('stats-section').classList.remove('hidden'); document.getElementById('btn-random').classList.remove('hidden'); } 
        else if(currentView === 'FAVS') { document.getElementById('fav-header').classList.remove('hidden'); } 
        else if(currentView === 'COMPARE') { document.getElementById('compare-header').classList.remove('hidden'); }
        document.getElementById('btn-reset').click(); document.getElementById('main-content').classList.remove('view-hidden');
    }, 300);
}

document.getElementById('btn-home').addEventListener('click', () => switchView('HOME'));
document.getElementById('btn-show-favs').addEventListener('click', () => switchView('FAVS'));
document.getElementById('btn-show-compare').addEventListener('click', () => switchView('COMPARE'));

function toggleFavorite(card, heartBtns) {
    const cardId = card.img_url || card.image_url || card.image_path;
    const index = favorites.findIndex(f => (f.img_url || f.image_url || f.image_path) === cardId);
    if (index > -1) { favorites.splice(index, 1); heartBtns.forEach(btn => btn?.classList.remove('active-heart')); showToast('Eliminada de favoritos', 'info'); } 
    else { favorites.push(card); heartBtns.forEach(btn => btn?.classList.add('active-heart')); showToast('¡Añadida a favoritos!', 'success'); }
    localStorage.setItem('tcg_favorites', JSON.stringify(favorites)); if (currentView === 'FAVS') renderResults(favorites);
}

/* === MODALES, UPSCALING Y COMPARACIÓN === */
const modal = document.getElementById('card-modal'); const modalImg = document.getElementById('modal-img'); let originalImg = new Image(); let currentCard = null;
async function openModal(card, imgUrl) {
    currentCard = card; document.getElementById('modal-name').innerText = card.name; document.getElementById('modal-set').innerText = card.set_name;
    document.getElementById('modal-num').innerText = card.card_number ? `#${card.card_number}` : '';
    document.getElementById('modal-lang').innerText = card.language || 'N/A'; document.getElementById('modal-res').innerText = card.resolution || 'High-Res';
    document.getElementById('modal-source').innerText = card.source_label; modalImg.style.transform = 'scale(1)';
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
    
    originalImg.crossOrigin = "anonymous";
    originalImg.onload = () => { document.getElementById('loader').style.display = 'none'; }; 
    originalImg.src = imgUrl; modalImg.src = imgUrl;
}
document.getElementById('close-modal').addEventListener('click', () => { modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); });

function processImage(isUpscale, callback) {
    document.getElementById('loader').style.display = 'flex';
    setTimeout(() => {
        const targetDim = 3840; const ratio = targetDim / Math.max(originalImg.naturalWidth, originalImg.naturalHeight);
        const newW = isUpscale ? Math.round(originalImg.naturalWidth * ratio) : originalImg.naturalWidth; const newH = isUpscale ? Math.round(originalImg.naturalHeight * ratio) : originalImg.naturalHeight;
        const canvas = document.createElement('canvas'); canvas.width = newW; canvas.height = newH;
        const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(originalImg, 0, 0, newW, newH);
        callback(canvas); document.getElementById('loader').style.display = 'none';
    }, 100);
}

document.getElementById('btn-copy-normal').addEventListener('click', () => processImage(false, (canvas) => canvas.toBlob(b => showToast("Imagen copiada", "success"))));

// Iniciar carga
loadDatabase();