// ========== API ==========
const API_URL = 'https://vortex-audio-2ea62.containers.snapdeploy.app';

// ========== ПОЛУЧАЕМ ДАННЫЕ ИЗ URL ==========
const params = new URLSearchParams(window.location.search);
const trackName = params.get('track') || '';
const artistName = params.get('artist') || '';

// ========== СКЕЛЕТОН ==========
function renderSkeleton(count = 4) {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.style.animationDelay = (i * 0.1) + 's';
        card.innerHTML = `
            <div class="skeleton-block skeleton-cover"></div>
            <div class="skeleton-lines">
                <div class="skeleton-block skeleton-line long"></div>
                <div class="skeleton-block skeleton-line short"></div>
            </div>
        `;
        list.appendChild(card);
    }
}

// ========== ОТРИСОВКА ПЕСЕН ==========
function renderSongs(songs) {
    const list = document.getElementById('songsList');
    list.innerHTML = '';

    if (!songs || songs.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('selectSubtitle').style.display = 'none';
        return;
    }

    songs.forEach((song, i) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.style.animationDelay = (i * 0.08) + 's';
        card.onclick = () => selectSong(song);

        const durationText = song.duration
            ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}`
            : '';

        card.innerHTML = `
            <div class="song-cover">🎵</div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}${song.album ? ' · ' + song.album : ''}</div>
                <div class="song-meta">
                    <span class="song-badge">${song.source || 'LRCLIB'}</span>
                    ${durationText ? `<span class="song-badge">${durationText}</span>` : ''}
                </div>
            </div>
            <div class="song-arrow">→</div>
        `;
        list.appendChild(card);
    });
}

// ========== ВЫБОР ПЕСНИ ==========
async function selectSong(song) {
    showToast('Загружаем текст...', 'info');

    try {
        const response = await fetch(API_URL + '/api/check-by-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                song_id: song.id,
                username: localStorage.getItem('vortex_logged_user') || ''
            })
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = 'result.html?data=' + encodeURIComponent(JSON.stringify(result));
        } else {
            showToast(result.message || 'Не удалось загрузить текст', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Сервер недоступен', 'error');
    }
}

// ========== ТОСТЫ ==========
function showToast(message, type = 'info', duration = 2500) {
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
window.addEventListener('load', async () => {
    renderSkeleton(4);

    // Обновляем заголовок
    if (trackName) {
        document.getElementById('selectTitle').textContent = 'Выбери песню';
        document.getElementById('selectSubtitle').textContent =
            `Результаты по запросу: «${trackName}${artistName ? ' — ' + artistName : ''}»`;
    }

    // Запрос к бэкенду
    try {
        const response = await fetch(API_URL + '/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_name: trackName, artist: artistName })
        });

        const data = await response.json();

        // Прячем чёрный экран
        document.getElementById('loadingOverlay').classList.add('hide');
        document.getElementById('selectWrapper').classList.add('show');

        if (data.success && data.results && data.results.length > 0) {
            renderSongs(data.results);
        } else {
            renderSongs([]);
        }
    } catch (error) {
        console.error(error);
        document.getElementById('loadingOverlay').classList.add('hide');
        document.getElementById('selectWrapper').classList.add('show');
        renderSongs([]);
        showToast('Сервер недоступен', 'error');
    }
});