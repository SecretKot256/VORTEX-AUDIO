const API_URL = 'https://vortex-audio-2ea62.containers.snapdeploy.app';

let currentMode = 'clean';
let isPlaying = false;
let trackQueue = [];
let currentIndex = 0;
const audio = document.getElementById('radioAudio');

// ===== ПРОВЕРКА ПОДПИСКИ =====
function checkSubscription() {
    const sub = localStorage.getItem('vortex_subscription');
    if (sub !== 'radio' && sub !== 'diamond') {
        showToast('Для доступа к радио нужна подписка «Радио» или «Бриллиант»', 'warning');
        setTimeout(() => window.location.href = 'shop.html', 1500);
        return false;
    }
    return true;
}

// ===== РЕЖИМ =====
function setRadioMode(mode, e) {
    currentMode = mode;
    document.querySelectorAll('.radio-mode').forEach(btn => btn.classList.remove('active'));
    if (e && e.target) e.target.classList.add('active');
    const labels = { clean: 'Чистые', dirty: 'Грязные', instrumental: 'Инструментал', acoustic: 'Акустика' };
    showToast('Режим: ' + labels[mode], 'info');
    // Сбрасываем очередь при смене режима
    trackQueue = [];
    currentIndex = 0;
}

// ===== ПОИСК И ЗАПУСК =====
async function searchAndPlay() {
    if (!checkSubscription()) return;

    const query = document.getElementById('radioSearchInput').value.trim();
    if (!query) {
        showToast('Введи название трека или жанр', 'warning');
        return;
    }

    showToast('Ищем треки...', 'info');

    try {
        const response = await fetch(API_URL + '/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_name: query, artist: '' })
        });

        const data = await response.json();

        if (!data.success || !data.results || data.results.length === 0) {
            showToast('Ничего не найдено', 'error');
            return;
        }

        // Фильтруем по режиму (instrumental — только инструментал, остальное — все)
        let filtered = data.results;
        if (currentMode === 'instrumental') {
            filtered = filtered.filter(t => t.instrumental);
        }
        if (filtered.length === 0) {
            showToast('По этому фильтру ничего нет, попробуй другой режим', 'warning');
            return;
        }

        trackQueue = filtered;
        currentIndex = 0;
        loadTrack();
        playAudio();

    } catch (err) {
        console.error(err);
        showToast('Ошибка поиска. Сервер просыпается?', 'error');
    }
}

// ===== ЗАГРУЗКА ТРЕКА =====
function loadTrack() {
    if (!trackQueue[currentIndex]) return;
    const track = trackQueue[currentIndex];

    document.getElementById('radioTrack').textContent = track.title || 'Без названия';
    document.getElementById('radioArtist').textContent = track.artist || 'Неизвестен';
    document.getElementById('radioCover').textContent = track.instrumental ? '🎹' : '🎵';
    audio.src = track.preview || '';
    if (!track.preview) {
        showToast('У этого трека нет превью, пропускаем...', 'info');
        setTimeout(nextTrack, 800);
    }
}

// ===== PLAY / PAUSE =====
function toggleRadio() {
    if (!checkSubscription()) return;
    if (!audio.src) {
        searchAndPlay();
        return;
    }
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        document.getElementById('radioPlayBtn').textContent = '▶';
    } else {
        playAudio();
    }
}

function playAudio() {
    if (!audio.src) return;
    audio.play().then(() => {
        isPlaying = true;
        document.getElementById('radioPlayBtn').textContent = '⏸';
    }).catch(err => {
        console.error(err);
        showToast('Не удалось воспроизвести', 'error');
    });
}

// ===== NEXT / PREV =====
function nextTrack() {
    if (trackQueue.length === 0) return;
    currentIndex = (currentIndex + 1) % trackQueue.length;
    loadTrack();
    if (isPlaying) playAudio();
}

function prevTrack() {
    if (trackQueue.length === 0) return;
    currentIndex = (currentIndex - 1 + trackQueue.length) % trackQueue.length;
    loadTrack();
    if (isPlaying) playAudio();
}

audio.addEventListener('ended', () => nextTrack());

// ===== ТОСТЫ =====
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

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    if (!checkSubscription()) return;
});