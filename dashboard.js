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
function toggleLangPopup() {
    document.getElementById('langPopup').classList.toggle('show');
}

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

    document.getElementById('profileOverlay').classList.add('show');
}

function closeProfile() {
    document.getElementById('profileOverlay').classList.remove('show');
    document.getElementById('avatarEditMenu').classList.remove('show');
}

document.getElementById('profileOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeProfile();
});

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

    if (userData.notesBalance > 0) {
        btn.innerHTML = '<img src="note-icon.png" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;">1 нота';
        btn.onclick = tryCheckTrack;
    } else if (userData.freeChecks > 0) {
        btn.textContent = '🎁 Бесплатно (' + userData.freeChecks + ')';
        btn.style.background = '#4CAF50';
        btn.onclick = tryCheckTrack;
    } else {
        btn.classList.add('disabled');
        btn.textContent = '❌ Не хватает нот';
        btn.style.background = '#444';
        btn.style.color = '#999';
        btn.onclick = null;
    }
}

function showErrorNotes() { document.getElementById('errorNotesOverlay').classList.add('show'); }
function openShopFromError() {
    document.getElementById('errorNotesOverlay').classList.remove('show');
    openShop();
}

document.getElementById('errorNotesOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
});

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

    const btn = document.getElementById('checkTrackBtn');
    btn.innerHTML = '⏳ Анализируем...';
    btn.classList.add('disabled');
    btn.onclick = null;

    if (userData.notesBalance > 0) userData.notesBalance--;
    else if (userData.freeChecks > 0) userData.freeChecks--;
    else { updateCheckButton(); return; }

    userData.songsTranslated++;
    localStorage.setItem('vortex_notes', userData.notesBalance);
    localStorage.setItem('vortex_free_checks', userData.freeChecks);

    try {
        const response = await fetch('https://vortex-audio-2ea62.containers.snapdeploy.app/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_name: trackName, artist: artistName })
        });
        const result = await response.json();

        if (result.success) {
            window.location.href = 'result.html?data=' + encodeURIComponent(JSON.stringify(result));
        } else {
            showToast(result.message || 'Песня не найдена', 'error');
            userData.notesBalance++;
            userData.songsTranslated--;
        }
    } catch (error) {
        console.error(error);
        showToast('Сервер недоступен', 'error');
        userData.notesBalance++;
        userData.songsTranslated--;
    } finally {
        updateCheckButton();
    }
}

// ========== МАГАЗИН ==========
let selectedNotes = 100, selectedPrice = 1000, shopTab = 'notes';

function openShop() {
    document.getElementById('shopBalance').textContent = userData.notesBalance + ' нот';
    document.getElementById('customNotesInput').value = selectedNotes;
    document.getElementById('customPriceInput').value = selectedPrice;
    document.getElementById('notesSlider').value = selectedNotes;
    switchShopTab(shopTab);
    document.getElementById('shopOverlay').classList.add('show');
    clearPackSelection();
}

function switchShopTab(tab) {
    shopTab = tab;
    document.getElementById('tabNotes').classList.toggle('active', tab === 'notes');
    document.getElementById('tabSubs').classList.toggle('active', tab === 'subs');
    document.getElementById('notesContent').classList.toggle('hidden', tab !== 'notes');
    document.getElementById('subsContent').classList.toggle('hidden', tab !== 'subs');
}

function selectPack(element, notes, price) {
    clearPackSelection();
    element.classList.add('selected');
    selectedNotes = notes; selectedPrice = price;
    document.getElementById('customNotesInput').value = notes;
    document.getElementById('customPriceInput').value = price;
    document.getElementById('notesSlider').value = notes;
}

function clearPackSelection() {
    document.querySelectorAll('.note-pack').forEach(p => p.classList.remove('selected'));
}

function onSliderInput() {
    clearPackSelection();
    selectedNotes = parseInt(document.getElementById('notesSlider').value);
    selectedPrice = selectedNotes * 10;
    document.getElementById('customNotesInput').value = selectedNotes;
    document.getElementById('customPriceInput').value = selectedPrice;
}

function onCustomNotesInput() {
    clearPackSelection();
    let notes = parseInt(document.getElementById('customNotesInput').value);
    if (isNaN(notes) || notes < 1) notes = 1;
    selectedNotes = notes; selectedPrice = notes * 10;
    document.getElementById('customPriceInput').value = selectedPrice;
}

function onCustomPriceInput() {
    clearPackSelection();
    let price = parseInt(document.getElementById('customPriceInput').value);
    if (isNaN(price) || price < 10) price = 10;
    selectedPrice = price; selectedNotes = Math.floor(price / 10);
    document.getElementById('customNotesInput').value = selectedNotes;
}

function selectSub(element, sub) {
    userData.subscription = sub;
    localStorage.setItem('vortex_subscription', sub);
    document.getElementById('shopOverlay').classList.remove('show');
    const names = { bronze: 'Бронзовый минимум', gold: 'Золотая середина', diamond: 'Бриллиантовый максимум' };
    showToast('Подписка «' + names[sub] + '» активирована!', 'success');
}

function buyNotes() {
    document.getElementById('shopOverlay').classList.remove('show');
    setTimeout(() => {
        document.getElementById('paymentSuccessOverlay').classList.add('show');
        userData.notesBalance += selectedNotes;
        localStorage.setItem('vortex_notes', userData.notesBalance);
        updateCheckButton();
        setTimeout(() => document.getElementById('paymentSuccessOverlay').classList.remove('show'), 2000);
    }, 1000);
}

document.getElementById('shopOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
});
document.getElementById('paymentSuccessOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
});

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

function toggleLangPopup() {
    closeBurger();
    document.getElementById('langPopup').classList.toggle('show');
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
        methodName.textContent = 'Genius';
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

    const names = { genius: 'Genius', mp3: 'MP3', streaming: 'Стриминговые' };
    showToast('Метод проверки песни: ' + names[method], 'success');
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

// ========== ЗАПУСК ==========
loadUser();
updateCheckButton();