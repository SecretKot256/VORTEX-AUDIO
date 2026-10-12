// ========== ПОЛУЧАЕМ ДАННЫЕ ИЗ URL ==========
const params = new URLSearchParams(window.location.search);
const trackName = params.get('track') || '';
const artistName = params.get('artist') || '';

// ========== ЗАГЛУШКА (потом заменим на реальный API) ==========
// Пока бэкенда нет — показываем тестовые данные
function getMockSongs(track, artist) {
    return [
        { id: '1', title: track || 'Believer', artist: artist || 'Imagine Dragons', source: 'Genius' },
        { id: '2', title: track || 'Believer', artist: 'Lil Wayne', source: 'Genius' },
        { id: '3', title: (track || 'Believer') + ' (Remix)', artist: 'Various Artists', source: 'LRCLIB' },
        { id: '4', title: (track || 'Believer') + ' (Live)', artist: artist || 'Imagine Dragons', source: 'Genius' }
    ];
}

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

        card.innerHTML = `
            <div class="song-cover" ${song.cover ? `style="background-image: url('${song.cover}')"` : ''}>
                ${song.cover ? '' : '🎵'}
            </div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-meta">
                    <span class="song-badge">${song.source || 'VORTEX'}</span>
                </div>
            </div>
            <div class="song-arrow">→</div>
        `;
        list.appendChild(card);
    });
}

// ========== ВЫБОР ПЕСНИ ==========
function selectSong(song) {
    // Пока — заглушка. Потом здесь будет запрос к /api/check-by-id
    showToast('Выбрано: ' + song.title, 'success');

    // TODO: заменить на реальный запрос
    // fetch(API_URL + '/api/check-by-id', { method: 'POST', ... })
    //     .then(r => r.json())
    //     .then(data => {
    //         window.location.href = 'result.html?data=' + encodeURIComponent(JSON.stringify(data));
    //     });

    // Временная заглушка — переход на result с пустыми данными
    setTimeout(() => {
        const mockResult = {
            success: true,
            title: song.title,
            artists: [song.artist],
            lyrics: 'Текст песни будет здесь...',
            cover_url: song.cover || '',
            source: song.source?.toLowerCase() || 'vortex',
            lyrics_analysis: { score: 8, verdict: 'Чисто', is_clean: true, bad_words: [] },
            beat_analysis: { score: 7, description: 'Бит будет позже', bpm: 120, style: '' },
            overall: { score: 7.5, verdict: '👍 Хорошо', mood: '🎵' }
        };
        window.location.href = 'result.html?data=' + encodeURIComponent(JSON.stringify(mockResult));
    }, 400);
}

// ========== ТОСТЫ (мини-копия) ==========
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
window.addEventListener('load', () => {
    // Показываем скелетон сразу
    renderSkeleton(4);

    // Через 1.2 сек — «загружаем» данные (заглушка)
    setTimeout(() => {
        // Прячем чёрный экран
        document.getElementById('loadingOverlay').classList.add('hide');

        // Показываем контент
        document.getElementById('selectWrapper').classList.add('show');

        // Обновляем заголовок
        if (trackName) {
            document.getElementById('selectTitle').textContent = 'Выбери песню';
            document.getElementById('selectSubtitle').textContent =
                `Результаты по запросу: «${trackName}${artistName ? ' — ' + artistName : ''}»`;
        }

        // Показываем «загруженные» песни
        const songs = getMockSongs(trackName, artistName);
        renderSongs(songs);
    }, 1200);
});