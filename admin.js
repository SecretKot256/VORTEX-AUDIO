// ========== ПРОВЕРКА АДМИНА ==========
const adminUser = localStorage.getItem('vortex_logged_user');

if (!adminUser) {
    window.location.href = 'auth.html';
}

// Проверка на бэке (если не админ — редирект)
async function checkAdminAccess() {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/stats?username=${adminUser}`);
        const data = await res.json();
        if (!data.success) {
            showToast('Нет доступа к админке', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
            return false;
        }
        return true;
    } catch (e) {
        showToast('Сервер недоступен', 'error');
        return false;
    }
}

document.getElementById('adminName').textContent = adminUser;

// ========== ВКЛАДКИ ==========
function switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(c => c.classList.add('hidden'));

    event.target.classList.add('active');
    document.getElementById('tab-' + tab).classList.remove('hidden');

    if (tab === 'stats') loadStats();
    if (tab === 'news') loadNews();
    if (tab === 'users') loadUsers();
}

// ========== СТАТИСТИКА ==========
async function loadStats() {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/stats?username=${adminUser}`);
        const data = await res.json();
        if (data.success) {
            document.getElementById('statUsers').textContent = data.stats.total_users;
            document.getElementById('statChecks').textContent = data.stats.total_checks;
            document.getElementById('statNews').textContent = data.stats.total_news;
        }
    } catch (e) {
        console.error(e);
    }
}

// ========== НОВОСТИ ==========
async function loadNews() {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/news');
        const data = await res.json();
        const container = document.getElementById('newsContainer');

        if (!data.news || data.news.length === 0) {
            container.innerHTML = '<p style="color:#777;text-align:center;padding:20px;">Новостей пока нет</p>';
            return;
        }

        container.innerHTML = data.news.map(n => `
            <div class="news-item">
                <div class="news-item-info">
                    <div class="news-item-title">${n.title}</div>
                    <div class="news-item-date">${n.date}</div>
                    <span class="news-item-tag">${n.tag}</span>
                </div>
                <button class="delete-btn" onclick="deleteNews(${n.id})">🗑 Удалить</button>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function createNews() {
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const tag = document.getElementById('newsTag').value.trim() || 'Новое';

    if (!title || !content) {
        showToast('Заполните заголовок и текст!', 'warning');
        return;
    }

    try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminUser, title, content, tag })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Новость опубликована!', 'success');
            document.getElementById('newsTitle').value = '';
            document.getElementById('newsContent').value = '';
            document.getElementById('newsTag').value = '';
            loadNews();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) {
        showToast('Сервер недоступен', 'error');
    }
}

async function deleteNews(id) {
    if (!confirm('Удалить новость?')) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/news/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminUser })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Новость удалена', 'success');
            loadNews();
        }
    } catch (e) {
        showToast('Ошибка', 'error');
    }
}

// ========== ПОЛЬЗОВАТЕЛИ ==========
async function loadUsers() {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/users?username=${adminUser}`);
        const data = await res.json();
        const container = document.getElementById('usersContainer');

        if (!data.users || data.users.length === 0) {
            container.innerHTML = '<p style="color:#777;text-align:center;padding:20px;">Пользователей нет</p>';
            return;
        }

        container.innerHTML = data.users.map(u => `
            <div class="user-item">
                <div class="user-item-info">
                    <div class="user-item-name">${u.username}</div>
                    <div class="user-item-sub">${u.email || 'без email'} · ${u.songs_checked} проверок</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

// ========== ВЫХОД ==========
function logoutAdmin() {
    localStorage.clear();
    window.location.href = 'auth.html';
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
(async () => {
    const ok = await checkAdminAccess();
    if (ok) loadStats();
})();