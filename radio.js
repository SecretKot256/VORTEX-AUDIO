let currentMode = 'clean';
let isPlaying = false;

function setRadioMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.radio-mode').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    showToast('Режим: ' + (mode === 'clean' ? 'Чистые' : mode === 'dirty' ? 'Грязные' : 'Инструментал'), 'info');
}

function toggleRadio() {
    const btn = document.getElementById('radioPlayBtn');
    const track = document.getElementById('radioTrack');
    const artist = document.getElementById('radioArtist');
    const cover = document.getElementById('radioCover');

    if (isPlaying) {
        isPlaying = false;
        btn.textContent = '▶';
        track.textContent = 'Пауза...';
        artist.textContent = 'VORTEX RADIO';
    } else {
        isPlaying = true;
        btn.textContent = '⏸';
        track.textContent = 'Скоро здесь будет музыка...';
        artist.textContent = 'Режим: ' + (currentMode === 'clean' ? 'Чистые' : currentMode === 'dirty' ? 'Грязные' : 'Инструментал');
        cover.textContent = '🎧';
    }
}

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