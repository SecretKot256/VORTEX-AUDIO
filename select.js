// ========== API ==========
const API_URL = 'https://vortex-audio-2ea62.containers.snapdeploy.app';

// ========== ПОЛУЧАЕМ ДАННЫЕ ИЗ URL ==========
const params = new URLSearchParams(window.location.search);
const trackName = params.get('track') || '';
const artistName = params.get('artist') || '';

const FUN_FACTS = [
    "Первая в мире песня была записана в 1860 году.",
    "У королевы Великобритании есть свой плейлист на Spotify.",
    "Слово 'фонк' происходит от бразильского 'funk' (вечеринка).",
    "Песня 'Happy Birthday' до сих пор под защитой авторских прав.",
    "У кошек есть своя музыка — она написана в высоких частотах.",
    "Самый длинный концерт длился 453 часа (это почти 19 дней!).",
    "Моцарт написал свою первую симфонию в 8 лет.",
    "В космосе нельзя петь так, как на Земле — нет воздуха для звука."
];

// ========== СКЕЛЕТОН ==========
function renderSkeleton(count = 4) {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    // Добавляем забавный факт
    const factDiv = document.createElement('div');
    factDiv.className = 'fun-fact';
    factDiv.style.cssText = 'text-align: center; color: #888; font-size: 14px; margin-bottom: 20px; animation: fadeIn 0.5s ease;';
    factDiv.innerHTML = `💡 <b>А вы знали?</b> ${FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]}`;
    list.appendChild(factDiv);
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
        card.onclick = () => openConfirm(song);

        const durationText = song.duration
            ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}`
            : '';

        const coverStyle = song.cover ? `style="background-image: url('${song.cover}')"` : '';

card.innerHTML = `
    <div class="song-cover" ${coverStyle}>
        ${song.cover ? '' : '🎵'}
    </div>
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

        if (response.status === 503) {
                document.getElementById('loadingOverlay').classList.add('hide');
                document.getElementById('selectWrapper').classList.add('show');
                document.getElementById('emptyState').style.display = 'block';
                document.querySelector('.empty-title').textContent = 'Сервер спит 😴';
                document.querySelector('.empty-text').textContent = 'LRCLIB перегружен или сервер просыпается. Попробуй через минуту!';
                return;
            }

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

// ===== ЛОГИКА ПОПАПА =====
let currentSelectedSong = null;
let audioPreview = null;

// Эта функция вызывается вместо selectSong, когда ты кликаешь по карточке
function openConfirm(song) {
    currentSelectedSong = song;
        
            // Заполняем попап
                document.getElementById('confirmTitle').textContent = song.title;
                    document.getElementById('confirmArtist').textContent = song.artist;
                        document.getElementById('confirmAlbum').textContent = song.album || 'Сингл';
                            document.getElementById('confirmCover').style.backgroundImage = song.cover ? `url('${song.cover}')` : 'none';
                                
                                    // Сбрасываем кнопку аудио
                                        const playBtn = document.getElementById('confirmPlayBtn');
                                            playBtn.textContent = '▶ Слушать отрывок';
                                                playBtn.style.background = '#2a2a2a';
                                                    
                                                        // Останавливаем предыдущее аудио
                                                            if (audioPreview) {
                                                                    audioPreview.pause();
                                                                            audioPreview = null;
                                                                                }
                                                                                    
                                                                                        // Вставляем текст (первые 4 строчки)
                                                                                            const lyricsBox = document.getElementById('confirmLyrics');
                                                                                                lyricsBox.textContent = 'Загрузка...';
                                                                                                    
                                                                                                        if (song.preview) {
                                                                                                                playBtn.style.display = 'block';
                                                                                                                    } else {
                                                                                                                            playBtn.style.display = 'none'; // Если аудио нет
                                                                                                                                }
                                                                                                                                    
                                                                                                                                        // Показываем попап
                                                                                                                                            document.getElementById('confirmOverlay').classList.add('show');
                                                                                                                                                
                                                                                                                                                    // Ищем текст для превью через check-by-id (но пока просто заглушка)
                                                                                                                                                        lyricsBox.textContent = "Нажми на 'Проверить эту песню', чтобы увидеть полный текст...";
                                                                                                                                                        }

                                                                                                                                                        function closeConfirm() {
                                                                                                                                                            document.getElementById('confirmOverlay').classList.remove('show');
                                                                                                                                                                if (audioPreview) {
                                                                                                                                                                        audioPreview.pause();
                                                                                                                                                                                audioPreview = null;
                                                                                                                                                                                    }
                                                                                                                                                                                    }

                                                                                                                                                                                    function togglePreview() {
                                                                                                                                                                                        const playBtn = document.getElementById('confirmPlayBtn');
                                                                                                                                                                                            
                                                                                                                                                                                                if (audioPreview && !audioPreview.paused) {
                                                                                                                                                                                                        // Если играет - ставим на паузу
                                                                                                                                                                                                                audioPreview.pause();
                                                                                                                                                                                                                        playBtn.textContent = '▶ Слушать отрывок';
                                                                                                                                                                                                                                playBtn.style.background = '#2a2a2a';
                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                            // Если не играет - включаем
                                                                                                                                                                                                                                                    if (!audioPreview) {
                                                                                                                                                                                                                                                                audioPreview = new Audio(currentSelectedSong.preview);
                                                                                                                                                                                                                                                                            audioPreview.volume = 0.5;
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                            audioPreview.play();
                                                                                                                                                                                                                                                                                                    playBtn.textContent = '⏸ Пауза';
                                                                                                                                                                                                                                                                                                            playBtn.style.background = '#6C5CE7';
                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                            // Останавливаем через 10 секунд (или когда трек закончится)
                                                                                                                                                                                                                                                                                                                                    setTimeout(() => {
                                                                                                                                                                                                                                                                                                                                                if (audioPreview) audioPreview.pause();
                                                                                                                                                                                                                                                                                                                                                            playBtn.textContent = '▶ Слушать отрывок';
                                                                                                                                                                                                                                                                                                                                                                        playBtn.style.background = '#2a2a2a';
                                                                                                                                                                                                                                                                                                                                                                                }, 10000); 
                                                                                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                                                                                                                    // Эта функция вызывается при нажатии на зелёную кнопку "Проверить эту песню"
                                                                                                                                                                                                                                                                                                                                                                                    function proceedToCheck() {
                                                                                                                                                                                                                                                                                                                                                                                        if (!currentSelectedSong) return;
                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                // Закрываем попап
                                                                                                                                                                                                                                                                                                                                                                                                    closeConfirm();
                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                            // Вызываем старую функцию selectSong, которая делает запрос
                                                                                                                                                                                                                                                                                                                                                                                                                selectSong(currentSelectedSong);
                                                                                                                                                                                                                                                                                                                                                                                                                }