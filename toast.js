// Универсальная функция тостов с крестиком для всех страниц
function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const existingToasts = container.querySelectorAll('.toast');
    if (existingToasts.length >= 3) {
        existingToasts[0].remove();
    }
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-text">${message}</span>
        <span style="cursor:pointer; margin-left:10px; font-size:16px;" onclick="this.parentElement.remove()">✕</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 600);
        }
    }, duration);
}