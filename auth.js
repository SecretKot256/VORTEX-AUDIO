// ========== ПЕРЕКЛЮЧАТЕЛЬ ВХОД/РЕГИСТРАЦИЯ ==========
let isLoginMode = true;

function switchMode(e) {
    if (e) e.preventDefault();
    isLoginMode = !isLoginMode;

    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const btn = document.getElementById('authBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    const emailField = document.getElementById('emailField');

    if (isLoginMode) {
        title.textContent = 'Вход';
        subtitle.textContent = 'Войдите в свой аккаунт';
        btn.textContent = 'Войти';
        switchText.textContent = 'Нет аккаунта?';
        switchLink.textContent = 'Зарегистрироваться';
        emailField.style.display = 'none';
    } else {
        title.textContent = 'Регистрация';
        subtitle.textContent = 'Создайте новый аккаунт';
        btn.textContent = 'Зарегистрироваться';
        switchText.textContent = 'Уже есть аккаунт?';
        switchLink.textContent = 'Войти';
        emailField.style.display = 'block';
    }
}

// ========== ОТПРАВКА ФОРМЫ ==========
async function submitAuth(e) {
    e.preventDefault();

    const username = document.getElementById('authLogin').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const email = document.getElementById('authEmail').value.trim();

    if (!username || !password) {
        showToast('Заполните все поля!', 'warning');
        return;
    }

    const btn = document.getElementById('authBtn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Подождите...';
    btn.disabled = true;

    const endpoint = isLoginMode ? '/api/login' : '/api/register';
    const body = isLoginMode
        ? { username, password }
        : { username, password, email };

    try {
        const response = await fetch('https://vortex-audio-2ea62.containers.snapdeploy.app' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('vortex_logged_user', username);
            localStorage.setItem('vortex_logged_email', email || '');

            if (result.user) {
                localStorage.setItem('vortex_notes', result.user.notes_balance || 0);
                localStorage.setItem('vortex_free_checks', result.user.free_checks || 1);
                localStorage.setItem('vortex_subscription', result.user.subscription || 'none');
                if (result.user.is_admin) {
                    localStorage.setItem('vortex_is_admin', 'true');
                }
            } else {
                localStorage.setItem('vortex_notes', 0);
                localStorage.setItem('vortex_free_checks', 1);
            }

            showToast(isLoginMode ? 'Добро пожаловать!' : 'Аккаунт создан!', 'success');

            setTimeout(() => {
                if (localStorage.getItem('vortex_is_admin') === 'true') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 800);
        } else {
            showToast(result.message || 'Ошибка', 'error');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        showToast('Сервер просыпается, подождите 30 секунд...', 'warning');
        btn.textContent = '⏳ Сервер просыпается...';

        setTimeout(() => {
            showToast('Попробуйте ещё раз', 'info');
            btn.textContent = originalText;
            btn.disabled = false;
        }, 30000);
    }
}

// ========== ЯНДЕКС АВТОРИЗАЦИЯ ==========
function loadYandexSDK() {
    return new Promise((resolve, reject) => {
        if (window.YaAuthSuggest) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Не удалось загрузить Yandex SDK'));
        document.head.appendChild(script);
    });
}

async function loginYandex() {
    try {
        await loadYandexSDK();

        // ВАЖНО: client_id и redirect_uri нужно получить в Yandex OAuth
        // https://oauth.yandex.ru/client/new
        const CLIENT_ID = 'f1f23a650f6844d49d0dec2dba6ac508';
        const REDIRECT_URI = window.location.origin + '/auth.html'; // <-- замени на свой

        const authUrl = 'https://oauth.yandex.ru/authorize?' + new URLSearchParams({
            response_type: 'token',
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI
        }).toString();

        // Открываем окно авторизации
        const width = 500, height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        const popup = window.open(authUrl, 'YandexAuth',
            `width=${width},height=${height},left=${left},top=${top}`);

        // Слушаем, когда окно закроется и токен попадёт в URL
        const checkPopup = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(checkPopup);
                    return;
                }
                const url = popup.location.href;
                if (url.includes('access_token=')) {
                    const params = new URLSearchParams(url.split('#')[1]);
                    const token = params.get('access_token');
                    clearInterval(checkPopup);
                    popup.close();
                    if (token) {
                        handleYandexToken(token);
                    }
                }
            } catch (e) {
                // cross-origin — ждём дальше
            }
        }, 500);

    } catch (error) {
        console.error(error);
        showToast('Не удалось загрузить Яндекс.Вход', 'error');
    }
}

async function handleYandexToken(token) {
    try {
        // Получаем данные пользователя из Яндекса
        const userRes = await fetch('https://login.yandex.ru/info?format=json', {
            headers: { Authorization: `OAuth ${token}` }
        });
        const yandexUser = await userRes.json();

        const username = yandexUser.login || yandexUser.display_name || 'yandex_user';
        const email = yandexUser.default_email || '';

        // Отправляем на наш бэкенд
        const response = await fetch('https://vortex-audio-2ea62.containers.snapdeploy.app/api/yandex-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, yandex_id: yandexUser.id })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('vortex_logged_user', username);
            localStorage.setItem('vortex_logged_email', email);
            if (result.user) {
                localStorage.setItem('vortex_notes', result.user.notes_balance || 0);
                localStorage.setItem('vortex_free_checks', result.user.free_checks || 1);
            }
            showToast('Добро пожаловать через Яндекс!', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } else {
            showToast(result.message || 'Ошибка входа через Яндекс', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Ошибка при входе через Яндекс', 'error');
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    // Форма
    const form = document.getElementById('authForm');
    if (form) form.addEventListener('submit', submitAuth);

    // Переключатель
    const switchLink = document.getElementById('switchLink');
    if (switchLink) switchLink.addEventListener('click', switchMode);

    // Кнопки соцсетей
    document.getElementById('yandexBtn')?.addEventListener('click', loginYandex);
    document.getElementById('googleBtn')?.addEventListener('click', () => showToast('Вход через Google скоро появится!', 'info'));
    document.getElementById('vkBtn')?.addEventListener('click', () => showToast('Вход через VK скоро появится!', 'info'));
    document.getElementById('appleBtn')?.addEventListener('click', () => showToast('Вход через Apple скоро появится!', 'info'));

    // Если вернулись с токеном в URL (fallback, если попап не сработал)
    if (window.location.hash.includes('access_token=')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('access_token');
        if (token) handleYandexToken(token);
    }
});

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
    }, 3000);
}