const API_URL = 'https://vortex-audio-2ea62.containers.snapdeploy.app';

// ========== ДАННЫЕ ==========
let userData = {
    isLoggedIn: false,
    nickname: 'User',
    avatar: 'default-avatar.png',
    notesBalance: 0,
    songsTranslated: 0,
    freeChecks: 1,
    subscription: null
};

function loadUser() {
    const savedUser = localStorage.getItem('vortex_logged_user');
    if (!savedUser) {
        window.location.href = 'auth.html';
        return;
    }
    userData.isLoggedIn = true;
    userData.nickname = savedUser;
    userData.avatar = localStorage.getItem('vortex_avatar') || 'default-avatar.png';
    userData.notesBalance = parseInt(localStorage.getItem('vortex_notes') || '0');
    userData.songsTranslated = parseInt(localStorage.getItem('vortex_songs') || '0');
}

// ========== СПИСОК ДОСТИЖЕНИЙ ==========
const ACHIEVEMENTS = [
    { id: 'first',    icon: '1',  name: 'Первый шаг',   desc: 'Проверить 1 песню',      need: 1,   type: 'checks' },
    { id: 'ten',      icon: '10', name: 'Мелодист',     desc: 'Проверить 10 песен',     need: 10,  type: 'checks' },
    { id: 'fifty',    icon: '50', name: 'Меломан',      desc: 'Проверить 50 песен',     need: 50,  type: 'checks' },
    { id: 'hundred',  icon: '100',name: 'Легенда',      desc: 'Проверить 100 песен',    need: 100, type: 'checks' },
    { id: 'dirty',    icon: '5',  name: 'Детектив',     desc: 'Найти 5 грязных песен',  need: 5,   type: 'dirty'  },
    { id: 'clean',    icon: '10', name: 'Чистюля',      desc: 'Найти 10 чистых песен',  need: 10,  type: 'clean'  },
    // Ачивка Аудиофил
    { id: 'audiophile', icon: '🎧', name: 'Аудиофил', desc: 'Выполнить 13 условий', need: 13, type: 'audiophile' }
];

// ========== ИЗБРАННЫЕ ==========
function getFavorites() {
    const saved = localStorage.getItem('vortex_favorites');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
}

function saveFavorites(favs) {
    localStorage.setItem('vortex_favorites', JSON.stringify(favs));
}

// ========== ОТРИСОВКА ==========
async function renderAchievements() {
    const checks = parseInt(localStorage.getItem('vortex_songs') || '0');
    const dirty = parseInt(localStorage.getItem('vortex_dirty') || '0');
    const clean = parseInt(localStorage.getItem('vortex_clean') || '0');
    const favorites = getFavorites();

    // Получаем ачивки с сервера
    let serverAch = {};
    try {
        const res = await fetch(`${API_URL}/api/achievements?username=${userData.nickname}`);
        const data = await res.json();
        if (data.success) serverAch = data.achievements;
    } catch (e) { console.log('Сервер недоступен'); }

    const allGrid = document.getElementById('achievementsGrid');
    const favGrid = document.getElementById('favoritesGrid');

    // Отображаем избранные
    if (favorites.length === 0) {
        favGrid.innerHTML = '<p style="color: #666; font-size: 14px; grid-column: 1 / -1;">Выбери 3 достижения снизу</p>';
    } else {
        favGrid.innerHTML = favorites.map(id => {
            const a = ACHIEVEMENTS.find(x => x.id === id);
            if (!a) return '';
            return renderAchievement(a, checks, dirty, clean, true, serverAch);
        }).join('');
    }

    // Отображаем все
    allGrid.innerHTML = ACHIEVEMENTS.map(a => renderAchievement(a, checks, dirty, clean, false, serverAch)).join('');

    // Считаем прогресс
    let unlockedCount = 0;
    ACHIEVEMENTS.forEach(a => {
        let progress = 0;
        if (a.type === 'checks') progress = checks;
        if (a.type === 'dirty') progress = dirty;
        if (a.type === 'clean') progress = clean;
        if (a.type === 'audiophile') progress = Object.keys(serverAch).length; // Сколько условий выполнено
        if (progress >= a.need) unlockedCount++;
    });

    document.getElementById('unlockedCount').textContent = unlockedCount;
    document.getElementById('totalCount').textContent = ACHIEVEMENTS.length;
    document.getElementById('progressFill').style.width = (unlockedCount / ACHIEVEMENTS.length * 100) + '%';
}

function renderAchievement(a, checks, dirty, clean, isFavorite, serverAch) {
    let progress = 0;
    if (a.type === 'checks') progress = checks;
    if (a.type === 'dirty') progress = dirty;
    if (a.type === 'clean') progress = clean;
    if (a.type === 'audiophile') progress = Object.keys(serverAch).length;

    const unlocked = progress >= a.need;
    const favorites = getFavorites();
    const isPinned = favorites.includes(a.id);

    return `
        <div class="achievement ${unlocked ? 'unlocked' : 'locked'} ${isPinned ? 'pinned' : ''}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-desc">${a.desc}</div>
            <div class="achievement-progress">${progress}/${a.need}</div>
            ${unlocked && !isFavorite ? `
                <button class="achievement-action ${isPinned ? 'active' : ''}" 
                        onclick="toggleFavorite('${a.id}', event)">
                    ${isPinned ? 'Убрать из избранного' : 'В избранное'}
                </button>
            ` : ''}
        </div>
    `;
}

// ========== ИЗБРАННОЕ ==========
function toggleFavorite(id, event) {
    if (event) event.stopPropagation();
    const favorites = getFavorites();
    const index = favorites.indexOf(id);

    if (index !== -1) {
        favorites.splice(index, 1);
    } else {
        if (favorites.length >= 3) {
            alert('Можно выбрать только 3 достижения');
            return;
        }
        favorites.push(id);
    }
    saveFavorites(favorites);
    renderAchievements();
}

// Запуск
loadUser();
renderAchievements();

// Анимация появления
setTimeout(() => {
    document.getElementById('achievementsHeader')?.classList.add('visible');
    document.getElementById('achievementsSubtitle')?.classList.add('visible');
}, 200);

setTimeout(() => {
    document.querySelector('.progress-box')?.classList.add('visible');
}, 400);