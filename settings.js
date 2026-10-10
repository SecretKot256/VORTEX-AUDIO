// ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ==========
let userData = {
    nickname: 'User',
    email: '',
    avatar: 'default-avatar.png',
    phone: null,
    lang: 'ru'
};

function loadSettingsUser() {
    const savedUser = localStorage.getItem('vortex_logged_user');
    if (!savedUser) {
        window.location.href = 'auth.html';
        return;
    }
    userData.nickname = savedUser;
    userData.email = localStorage.getItem('vortex_logged_email') || '';
    userData.avatar = localStorage.getItem('vortex_avatar') || 'default-avatar.png';
    userData.phone = localStorage.getItem('vortex_phone') || null;
    userData.lang = localStorage.getItem('vortex_lang') || 'ru';

    // Заполняем поля
    document.getElementById('settingsNickname').value = userData.nickname;
    document.getElementById('settingsEmail').value = userData.email;

    if (userData.phone) {
        document.getElementById('settingsPhoneText').textContent = 'Заканчивается на ' + userData.phone.slice(-2);
        document.getElementById('phoneActionBtn').textContent = 'Отключить';
    }

    // Язык
    updateLangButtons();
}

// ========== ВКЛАДКИ ==========
function switchSettingsTab(tab) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));

    document.querySelector(`.settings-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
}

// ========== ТЕМА ==========
function toggleTheme() {
    const isLight = document.getElementById('themeToggle').checked;
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('vortex_theme', isLight ? 'light' : 'dark');
}

// Восстанавливаем тему при загрузке
(function restoreTheme() {
    const savedTheme = localStorage.getItem('vortex_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeToggle').checked = true;
    }
})();

// ========== ЯЗЫК ==========
function setSettingsLang(lang) {
    userData.lang = lang;
    localStorage.setItem('vortex_lang', lang);
    updateLangButtons();
    showToast(lang === 'ru' ? 'Язык: Русский' : 'Language: English', 'success');
}

function updateLangButtons() {
    const ruBtn = document.getElementById('langRuBtn');
    const enBtn = document.getElementById('langEnBtn');
    if (userData.lang === 'ru') {
        ruBtn.classList.add('active');
        ruBtn.textContent = 'Выбран';
        enBtn.classList.remove('active');
        enBtn.textContent = 'Выбрать';
    } else {
        enBtn.classList.add('active');
        enBtn.textContent = 'Selected';
        ruBtn.classList.remove('active');
        ruBtn.textContent = 'Выбрать';
    }
}

// ========== ПРОФИЛЬ ==========
function saveProfileSettings() {
    const newNick = document.getElementById('settingsNickname').value.trim();
    if (!newNick) {
        showToast('Ник не может быть пустым', 'warning');
        return;
    }
    if (newNick.length < 3) {
        showToast('Ник должен быть минимум 3 символа', 'warning');
        return;
    }
    userData.nickname = newNick;
    localStorage.setItem('vortex_logged_user', newNick);
    showToast('Профиль сохранён!', 'success');
}

// ========== ТЕЛЕФОН ==========
function settingsPhoneAction() {
    if (userData.phone) {
        // Отключение
        if (confirm('Отключить номер телефона?')) {
            userData.phone = null;
            localStorage.removeItem('vortex_phone');
            document.getElementById('settingsPhoneText').textContent = 'Номер не подключён';
            document.getElementById('phoneActionBtn').textContent = 'Подключить';
            showToast('Номер отключён', 'info');
        }
    } else {
        // Подключение
        let phone = prompt('Введите номер телефона (только цифры):');
        if (phone) {
            phone = phone.replace(/\D/g, '');
            if (phone.length >= 10) {
                userData.phone = phone;
                localStorage.setItem('vortex_phone', phone);
                document.getElementById('settingsPhoneText').textContent = 'Заканчивается на ' + phone.slice(-2);
                document.getElementById('phoneActionBtn').textContent = 'Отключить';
                showToast('Номер подключён!', 'success');
            } else {
                showToast('Номер слишком короткий', 'warning');
            }
        }
    }
}

// ========== УДАЛЕНИЕ АККАУНТА ==========
function confirmDeleteAccount() {
    const answer = prompt('Это действие необратимо! Введите "УДАЛИТЬ" для подтверждения:');
    if (answer === 'УДАЛИТЬ') {
        localStorage.clear();
        alert('Аккаунт удалён. Прощай... 😢');
        window.location.href = 'index.html';
    } else {
        showToast('Удаление отменено', 'info');
    }
}

// ========== ТОСТЫ (мини-копия) ==========
function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-text">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 600);
    }, duration);
}

// ========== ЗАПУСК ==========
loadSettingsUser();