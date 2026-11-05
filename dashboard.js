// ========== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ==========
let userData = {
    isLoggedIn: false,
    nickname: 'User',
    email: '',
    avatar: 'default-avatar.png',
    phone: null,
    notesBalance: 0,
    songsTranslated: 0,
    freeChecks: 1,
    lang: 'ru',
    subscription: null
};


// Загружаем из localStorage
function loadUser() {
    const savedUser = localStorage.getItem('vortex_logged_user');
    const savedEmail = localStorage.getItem('vortex_logged_email');
    const savedAvatar = localStorage.getItem('vortex_avatar');
    

    if (!savedUser) {
        window.location.href = 'auth.html';
        return;
    }

    userData.isLoggedIn = true;
    userData.nickname = savedUser;
    userData.email = savedEmail || '';
    userData.avatar = savedAvatar || 'default-avatar.png';
    userData.notesBalance = parseInt(localStorage.getItem('vortex_notes') || '0');
    userData.freeChecks = parseInt(localStorage.getItem('vortex_free_checks') || '1');
    userData.subscription = localStorage.getItem('vortex_subscription') || null;

    document.getElementById('headerNickname').textContent = savedUser;
    document.getElementById('headerAvatar').src = userData.avatar;
    document.getElementById('topIcons').style.display = 'flex';
}

// ========== ТЕМА ==========
function toggleTheme() {
    const isLight = document.getElementById('themeToggle').checked;
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('vortex_theme', isLight ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('vortex_theme');
if (savedTheme === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeToggle').checked = true;
}

// ========== ЯЗЫК ==========
function setLang(lang) {
    userData.lang = lang;
    localStorage.setItem('vortex_lang', lang);
    
    // Отмечаем активный язык
    document.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('active'));
    
    // Подсвечиваем выбранный
    const options = document.querySelectorAll('.lang-option');
    if (lang === 'ru' && options[0]) options[0].classList.add('active');
    if (lang === 'en' && options[1]) options[1].classList.add('active');
    
    document.getElementById('langPopup').classList.remove('show');
    showToast(lang === 'ru' ? 'Язык: Русский' : 'Language: English', 'success');
}

document.addEventListener('click', (e) => {
    const popup = document.getElementById('langPopup');
    if (popup && !e.target.closest('.lang-btn') && !e.target.closest('.lang-popup')) {
        popup.classList.remove('show');
    }
});

// ========== ПРОФИЛЬ ==========
function openProfile() {
    document.getElementById('profileAvatar').src = userData.avatar;
    document.getElementById('profileNickname').textContent = userData.nickname;
    document.getElementById('profileEmail').textContent = userData.email;
    document.getElementById('notesBalance').textContent = userData.notesBalance;
    document.getElementById('songsTranslated').textContent = userData.songsTranslated;
    document.getElementById('freeChecks').textContent = userData.freeChecks;

    const ring = document.getElementById('avatarRing');
    ring.classList.remove('bronze', 'gold', 'diamond');
    if (userData.subscription) ring.classList.add(userData.subscription);

    if (userData.phone) {
        document.getElementById('phoneText').textContent = 'Заканчивается на ' + userData.phone.slice(-2);
        document.getElementById('connectPhoneBtn').style.display = 'none';
    } else {
        document.getElementById('phoneText').textContent = 'Номер не подключён';
        document.getElementById('connectPhoneBtn').style.display = 'inline-block';
    }
    renderAchievementsPreview();
    document.getElementById('profileOverlay').classList.add('show');
}

function closeProfile() {
    document.getElementById('profileOverlay').classList.remove('show');
    document.getElementById('avatarEditMenu').classList.remove('show');
}

document.getElementById('profileOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeProfile();
});

// ===== ТУТОРИАЛ =====
function checkTutorial() {
    const done = localStorage.getItem('vortex_tutorial_done');
        if (done) {
                document.getElementById('welcomeOverlay').style.display = 'none';
                    }
                    }

                    function skipTutorial() {
                        localStorage.setItem('vortex_tutorial_done', 'true');
                            const overlay = document.getElementById('welcomeOverlay');
                                overlay.style.opacity = '0';
                                    setTimeout(() => overlay.style.display = 'none', 500);
                                    }

                                    function startTutorial() {
                                        const overlay = document.getElementById('welcomeOverlay');
                                            overlay.style.opacity = '0';
                                                setTimeout(() => {
                                                        overlay.style.display = 'none';
                                                                window.location.href = 'tutorial.html';
                                                                    }, 500);
                                                                    }

                                                                    // Вызвать при загрузке
                                                                    checkTutorial();

// ========== АВАТАР ==========
function toggleAvatarMenu() {
    document.getElementById('avatarEditMenu').classList.toggle('show');
}

function uploadAvatar() {
    document.getElementById('avatarEditMenu').classList.remove('show');
    document.getElementById('avatarFileInput').click();
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userData.avatar = e.target.result;
            document.getElementById('profileAvatar').src = userData.avatar;
            document.getElementById('headerAvatar').src = userData.avatar;
            localStorage.setItem('vortex_avatar', userData.avatar);
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}

function deleteAvatar() {
    document.getElementById('avatarEditMenu').classList.remove('show');
    userData.avatar = 'default-avatar.png';
    document.getElementById('profileAvatar').src = userData.avatar;
    document.getElementById('headerAvatar').src = userData.avatar;
    localStorage.removeItem('vortex_avatar');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.avatar-edit-btn') && !e.target.closest('.avatar-edit-menu')) {
        document.getElementById('avatarEditMenu').classList.remove('show');
    }
});

// ========== ТЕЛЕФОН ==========
function connectPhone() {
    let phone = prompt('Введите номер телефона (только цифры):');
    if (phone) {
        phone = phone.replace(/\D/g, '');
        if (phone.length >= 2) {
            userData.phone = phone;
            document.getElementById('phoneText').textContent = 'Заканчивается на ' + phone.slice(-2);
            document.getElementById('connectPhoneBtn').style.display = 'none';
        } else {
            showToast('Номер должен содержать минимум 2 цифры', 'warning');
        }
    }
}

// ========== ВЫХОД ==========
function logout() {
    localStorage.removeItem('vortex_logged_user');
    localStorage.removeItem('vortex_logged_email');
    localStorage.removeItem('vortex_notes');
    localStorage.removeItem('vortex_free_checks');
    localStorage.removeItem('vortex_subscription');
    window.location.href = 'auth.html';
}

// ========== КНОПКА ПРОВЕРКИ ==========
function updateCheckButton() {
    const btn = document.getElementById('checkTrackBtn');
    if (!btn) return;

    btn.classList.remove('disabled');
    btn.style.background = '#6C5CE7';
    btn.style.color = '#fff';

    // 1. Если есть ноты
    if (userData.notesBalance > 0) {
        btn.textContent = 'Проверить (1 нота)'; 
        btn.onclick = tryCheckTrack;
    } 
    // 2. Если есть бесплатные проверки
    else if (userData.freeChecks > 0) {
        btn.textContent = '🎁 Бесплатно (' + userData.freeChecks + ')';
        btn.style.background = '#4CAF50';
        btn.onclick = tryCheckTrack;
    } 
    // 3. Если ничего нет
    else {
        btn.classList.add('disabled');
        btn.textContent = '❌ Не хватает нот';
        btn.style.background = '#444';
        btn.style.color = '#999';
        btn.onclick = null;
    }
}

// ========== СЧЁТЧИК ==========
let totalChecked = 25000;
setInterval(() => {
    totalChecked += Math.floor(Math.random() * 5) + 1;
    document.getElementById('totalChecked').textContent = totalChecked.toLocaleString('ru-RU');
    const progress = Math.min((totalChecked / 1000000) * 100, 100);
    document.getElementById('progressFill').style.width = progress + '%';
}, 2000);

// ========== ПРОВЕРКА ПЕСНИ ==========
async function tryCheckTrack() {
    const trackName = document.getElementById('trackInputName').value.trim();
    const artistName = document.getElementById('artistInputName').value.trim();

    if (!trackName) {
        showToast('Введите название трека!', 'warning');
        return;
    }

    // ===== ПАСХАЛКИ =====
const secretArtist = artistName.toLowerCase().trim();
const secretTrack = trackName.toLowerCase().trim();

// 1. Даша
if (secretArtist === 'dasha gavrilenko' && !secretTrack) {
    window.location.href = 'dasha.html';
    return;
}
// 2. Савелий
if (secretArtist === 'savelii petrov' && !secretTrack) {
    window.location.href = 'https://steamcommunity.com/id/SecretKotGames/';
    return;
}
// 3. Секрет Кот
if (secretArtist === 'secret kot') {
    window.location.href = 'https://secretkot256.github.io/Secret.Kot.ru/Glavnaia.html';
    return;
}
// 4. День Vortex
const today = new Date();
const isVortexDay = (today.getMonth() === 7 && today.getDate() === 22); // 22 августа
const currentYear = today.getFullYear();
const notesGift = currentYear - 2020; // Если 2026 -> 6 нот

if (secretTrack === 'vortex audio' && secretArtist === 'savelii petrov' && isVortexDay) {
    alert(`🎉 С Днем Vortex! Ты получаешь скидку 50% на всё и +${notesGift} нот в подарок!`);
    userData.notesBalance += notesGift;
    localStorage.setItem('vortex_notes', userData.notesBalance);
    updateCheckButton();
    return;
}
// 5. Дипик
if (secretArtist === 'дипик') {
    window.location.href = 'https://platform.deepseek.com';
    return;
}
// ==============================

    const btn = document.getElementById('checkTrackBtn');
    btn.innerHTML = '⏳ Анализируем...';
    btn.classList.add('disabled');
    btn.onclick = null;

    if (userData.notesBalance > 0) userData.notesBalance--;
    else if (userData.freeChecks > 0) userData.freeChecks--;
    else { updateCheckButton(); return; }

    localStorage.setItem('vortex_notes', userData.notesBalance);
    localStorage.setItem('vortex_free_checks', userData.freeChecks);

    try {
        // Проверяем, жив ли сервер
        const checkHealth = await fetch(API_URL + '/health', { method: 'GET', cache: 'no-store' });
        
        if (!checkHealth.ok) {
            showToast('Сервер просыпается, подожди 10-20 секунд...', 'warning');
            // Возвращаем ноты, так как проверка не удалась
            if (userData.notesBalance > 0) userData.notesBalance++;
            else if (userData.freeChecks > 0) userData.freeChecks++;
            localStorage.setItem('vortex_notes', userData.notesBalance);
            localStorage.setItem('vortex_free_checks', userData.freeChecks);
            updateCheckButton();
            return;
        }

        // Переходим на страницу выбора
        const url = `select.html?track=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}`;
        window.location.href = url;

    } catch (error) {
        console.error(error);
        showToast('Сервер недоступен', 'error');
        // Возвращаем ноты при ошибке сети
        if (userData.notesBalance > 0) userData.notesBalance++;
        else if (userData.freeChecks > 0) userData.freeChecks++;
        localStorage.setItem('vortex_notes', userData.notesBalance);
        localStorage.setItem('vortex_free_checks', userData.freeChecks);
    } finally {
        updateCheckButton();
    }
}

// ========== ИНФО / ЛИДЕРЫ ==========
function showInfoPopup() {
    document.getElementById('infoPopup').classList.add('show');
    setTimeout(() => document.getElementById('infoPopup').classList.remove('show'), 2500);
}

function hideInfoPopup() {
    document.getElementById('infoPopup').classList.remove('show');
}

function openLeaderboard() {
    window.location.href = 'leaderboard.html';
}

// ========== ТОСТЫ ==========
function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Ограничение: максимум 3 тоста
    const existingToasts = container.querySelectorAll('.toast');
    if (existingToasts.length >= 3) {
        // Удаляем самый старый
        existingToasts[0].remove();
    }

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-text">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 600);
    }, duration);
}

function toggleBurger() {
    const menu = document.getElementById('burgerMenu');
    const overlay = document.getElementById('burgerOverlay');
    const btn = document.getElementById('burgerBtn');
    const isOpen = menu.classList.contains('open');
    if (isOpen) {
        closeBurger();
    } else {
        menu.classList.add('open');
        overlay.classList.add('show');
        btn.classList.add('active');
    }
}

function closeBurger() {
    document.getElementById('burgerMenu').classList.remove('open');
    document.getElementById('burgerOverlay').classList.remove('show');
    document.getElementById('burgerBtn').classList.remove('active');
}

document.addEventListener('click', (e) => {
    const popup = document.getElementById('langPopup');
    if (popup && popup.classList.contains('show') 
        && !e.target.closest('.lang-popup') 
        && !e.target.closest('[onclick*="toggleLangPopup"]')) {
        popup.classList.remove('show');
    }
});

// ========== ВЫБОР МЕТОДА ПРОВЕРКИ ==========
let currentMethod = localStorage.getItem('vortex_method') || 'genius';

function toggleMethodPopup() {
    const popup = document.getElementById('methodPopup');
    const btn = document.getElementById('methodBtn');
    popup.classList.toggle('show');
    btn.classList.toggle('open');
}

function selectMethod(method) {
    currentMethod = method;
    localStorage.setItem('vortex_method', method);

    const btn = document.getElementById('methodBtn');
    const methodName = document.getElementById('methodName');
    let methodIcon = document.getElementById('methodIcon');
    let emojiIcon = btn.querySelector('.method-emoji-icon');

    // Убираем активные
    document.querySelectorAll('.method-option').forEach(o => o.classList.remove('active'));
    document.querySelector(`.method-option[data-method="${method}"]`).classList.add('active');

    // Скрываем все иконки
    if (methodIcon) methodIcon.style.display = 'none';
    if (emojiIcon) emojiIcon.style.display = 'none';

    // Показываем нужную
    if (method === 'genius') {
        methodName.textContent = 'Genius и LRCLIB';
        if (methodIcon) methodIcon.style.display = 'block';
    } else {
        // Создаём emoji, если нет
        if (!emojiIcon) {
            emojiIcon = document.createElement('span');
            emojiIcon.className = 'method-emoji-icon';
            emojiIcon.style.fontSize = '20px';
            btn.insertBefore(emojiIcon, btn.firstChild);
        }
        emojiIcon.textContent = method === 'mp3' ? '📁' : '🎵';
        emojiIcon.style.display = 'block';
        methodName.textContent = method === 'mp3' ? 'MP3' : 'Стриминговые';
    }

    // Закрываем попап
    document.getElementById('methodPopup').classList.remove('show');
    btn.classList.remove('open');
}

// Закрытие попапа при клике вне
document.addEventListener('click', (e) => {
    const popup = document.getElementById('methodPopup');
    const btn = document.getElementById('methodBtn');
    if (popup && !e.target.closest('.method-wrapper')) {
        popup.classList.remove('show');
        btn.classList.remove('open');
    }
});

// Восстановить выбранный метод
(function restoreMethod() {
    const method = localStorage.getItem('vortex_method') || 'genius';
    const option = document.querySelector(`.method-option[data-method="${method}"]`);
    if (option) {
        option.classList.add('active');
    }
})();

// ===== ДОСТИЖЕНИЯ =====
const ACHIEVEMENTS = [
    { id: 'first',   icon: '🥉', name: 'Первый шаг',  need: 1,   type: 'checks' },
    { id: 'ten',     icon: '🥈', name: 'Мелодист',    need: 10,  type: 'checks' },
    { id: 'fifty',   icon: '🥇', name: 'Меломан',     need: 50,  type: 'checks' },
    { id: 'hundred', icon: '💎', name: 'Легенда',     need: 100, type: 'checks' },
    { id: 'dirty',   icon: '🔥', name: 'Детектив',    need: 5,   type: 'dirty'  },
    { id: 'clean',   icon: '✨', name: 'Чистюля',     need: 10,  type: 'clean'  }
];

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    const checks = userData.songsTranslated || 0;

    grid.innerHTML = ACHIEVEMENTS.map(a => {
        let unlocked = false;
        let progress = 0;

        if (a.type === 'checks') {
            progress = checks;
            unlocked = checks >= a.need;
        } else if (a.type === 'dirty') {
            progress = userData.dirtyCount || 0;
            unlocked = progress >= a.need;
        } else if (a.type === 'clean') {
            progress = userData.cleanCount || 0;
            unlocked = progress >= a.need;
        }

        const tooltip = unlocked 
            ? `✅ ${a.name} — открыто!`
            : `${a.name}: ${progress}/${a.need}`;

        return `
            <div class="achievement ${unlocked ? 'unlocked' : 'locked'}" title="${tooltip}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-name">${a.name}</div>
            </div>
        `;
    }).join('');
}

// ========== ПРЕВЬЮ ДОСТИЖЕНИЙ ==========
const ACHIEVEMENTS_LIST = {
    'first': { icon: '1', name: 'Первый шаг' },
    'ten': { icon: '10', name: 'Мелодист' },
    'fifty': { icon: '50', name: 'Меломан' },
    'hundred': { icon: '100', name: 'Легенда' },
    'dirty': { icon: '5', name: 'Детектив' },
    'clean': { icon: '10', name: 'Чистюля' }
};

function renderAchievementsPreview() {
    const preview = document.getElementById('achievementsPreview');
    if (!preview) return;

    const favorites = JSON.parse(localStorage.getItem('vortex_favorites') || '[]');

    if (favorites.length === 0) {
        preview.innerHTML = '<p style="color: #666; font-size: 13px;">Не выбрано ни одного достижения</p>';
        return;
    }

    preview.innerHTML = favorites.map(id => {
        const a = ACHIEVEMENTS_LIST[id];
        if (!a) return '';
        return `
            <div class="achievement-preview-item">
                <div class="achievement-preview-icon">${a.icon}</div>
                <div class="achievement-preview-name">${a.name}</div>
            </div>
        `;
    }).join('');
}

// ========== ЗАПУСК ==========
userData.cleanCount = parseInt(localStorage.getItem('vortex_clean') || '0');
userData.dirtyCount = parseInt(localStorage.getItem('vortex_dirty') || '0');
loadUser();
updateCheckButton();