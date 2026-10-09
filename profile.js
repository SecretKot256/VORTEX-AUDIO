// ========== ПОЛУЧАЕМ НИК ИЗ URL ==========
const params = new URLSearchParams(window.location.search);
const profileUser = params.get('user') || localStorage.getItem('vortex_logged_user');

// ========== ДАННЫЕ (заглушка — потом с сервера) ==========
const usersDB = {
    'Secret': {
        nickname: 'Secret',
        avatar: 'default-avatar.png',
        subscription: 'diamond',
        checks: 127,
        notes: 999,
        achievements: ['first', 'ten', 'fifty']
    }
};

const user = usersDB[profileUser] || {
    nickname: profileUser || 'Гость',
    avatar: 'default-avatar.png',
    subscription: null,
    checks: 0,
    notes: 0,
    achievements: []
};

// ========== ОТРИСОВКА ==========
function renderProfile() {
    document.getElementById('profileAvatar').src = user.avatar;
    document.getElementById('profileNickname').textContent = user.nickname;
    document.getElementById('statChecks').textContent = user.checks;
    document.getElementById('statNotes').textContent = user.notes;
    document.getElementById('statAch').textContent = user.achievements.length;

    // Бейдж подписки
    const badge = document.getElementById('profileBadge');
    if (user.subscription === 'bronze') {
        badge.textContent = 'Бронзовый минимум';
        badge.classList.add('bronze');
    } else if (user.subscription === 'gold') {
        badge.textContent = 'Золотая середина';
        badge.classList.add('gold');
    } else if (user.subscription === 'diamond') {
        badge.textContent = 'Бриллиантовый максимум';
        badge.classList.add('diamond');
    } else {
        badge.textContent = 'Без подписки';
    }

    // Избранные достижения
    const ACHIEVEMENTS = {
        'first': { icon: '1', name: 'Первый шаг', desc: 'Проверить 1 песню' },
        'ten': { icon: '10', name: 'Мелодист', desc: 'Проверить 10 песен' },
        'fifty': { icon: '50', name: 'Меломан', desc: 'Проверить 50 песен' },
        'hundred': { icon: '100', name: 'Легенда', desc: 'Проверить 100 песен' },
        'dirty': { icon: '5', name: 'Детектив', desc: 'Найти 5 грязных песен' },
        'clean': { icon: '10', name: 'Чистюля', desc: 'Найти 10 чистых песен' }
    };

    const grid = document.getElementById('favoritesGrid');
    if (user.achievements.length === 0) {
        grid.innerHTML = '<div class="empty-message">Пользователь не выбрал избранные достижения</div>';
    } else {
        grid.innerHTML = user.achievements.map(id => {
            const a = ACHIEVEMENTS[id];
            if (!a) return '';
            return `
                <div class="achievement">
                    <div class="achievement-icon">${a.icon}</div>
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                </div>
            `;
        }).join('');
    }
}

renderProfile();