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

    if (!savedUser) return;

    userData.isLoggedIn = true;
    userData.nickname = savedUser;
    userData.email = savedEmail || '';
    userData.avatar = savedAvatar || 'default-avatar.png';
    userData.notesBalance = parseInt(localStorage.getItem('vortex_notes') || '0');
    userData.freeChecks = parseInt(localStorage.getItem('vortex_free_checks') || '1');
    userData.subscription = localStorage.getItem('vortex_subscription') || null;
}

// Если залогинен — редирект на dashboard
if (userData.isLoggedIn) {
    // window.location.href = 'dashboard.html';
}

// ========== ТЕМА ==========
function toggleTheme() {
    const isLight = document.getElementById('themeToggle')?.checked;
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('vortex_theme', isLight ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('vortex_theme');
if (savedTheme === 'light') {
    document.body.classList.add('light');
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.checked = true;
}

// ========== НАВИГАЦИЯ ==========
let currentPage = 0;
let totalPages = 7; // 1 герой + 5 блоков + футер
let scrollAccumulator = 0;
const scrollThreshold = window.innerHeight / 3;
let isScrolling = false;

function goToPage(index) {
    if (index >= totalPages) index = totalPages - 1;
    if (index < 0) index = 0;
    if (index === currentPage) return;

    currentPage = index;
    isScrolling = true;

    // Двигаем все страницы
    const pages = ['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'footer'];
    pages.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
            el.style.transform = `translateY(calc(${i * 100}vh - ${index * 100}vh))`;
        }
    });

    setTimeout(() => {
        isScrolling = false;
        scrollAccumulator = 0;
    }, 700);
}

// Колёсико мыши
window.addEventListener('wheel', (e) => {
    if (isScrolling) return;

    scrollAccumulator += e.deltaY;

    if (scrollAccumulator > scrollThreshold && currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
        scrollAccumulator = 0;
    } else if (scrollAccumulator < -scrollThreshold && currentPage > 0) {
        goToPage(currentPage - 1);
        scrollAccumulator = 0;
    }

    clearTimeout(window.scrollResetTimer);
    window.scrollResetTimer = setTimeout(() => {
        scrollAccumulator = 0;
    }, 200);
});

// Тач-скролл
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (isScrolling) return;

    const diff = touchStartY - e.changedTouches[0].screenY;
    const threshold = window.innerHeight / 5;

    if (diff > threshold && currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
    } else if (diff < -threshold && currentPage > 0) {
        goToPage(currentPage - 1);
    }
}, { passive: true });

// Плавный скролл на #page2 при клике на «Больше о Vortex»
function scrollToAbout() {
    goToPage(1);
}

// ========== ТОСТЫ ==========
function showToast(message, type = 'info') {
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
    }, 3000);
}

// ========== ЗАПУСК ==========
loadUser();  