// ========== ПЕРЕКЛЮЧАТЕЛЬ ВХОД/РЕГИСТРАЦИЯ ==========
let isLoginMode = true;

function switchMode(e) {
    e.preventDefault();
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
        showToast('Сервер недоступен. Запустите backend.py', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
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