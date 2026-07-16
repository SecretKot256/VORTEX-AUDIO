// ========== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ==========
let userData = {
    isLoggedIn: false,
    nickname: 'User',
    email: 'user@example.com',
    avatar: 'default-avatar.png',
    phone: null,
    notesBalance: 0,        // было 42, теперь 0 для теста
    songsTranslated: 0,     // было 17
    freeChecks: 3,          // бесплатные проверки
    lang: 'ru',
    subscription: null
};

const savedAvatar = localStorage.getItem('vortex_avatar');
if (savedAvatar) {
    userData.avatar = savedAvatar;
}

function saveUserData() {
    if (userData.avatar !== 'default-avatar.png') {
        localStorage.setItem('vortex_avatar', userData.avatar);
    } else {
        localStorage.removeItem('vortex_avatar');
    }
}

// ========== ПРЕМИУМ ==========
function checkPremium() {
    const isPremium = localStorage.getItem('vortex_premium') === 'true';
    if (isPremium) {
        document.getElementById('premiumContent').classList.remove('hidden');
        document.getElementById('guestContent').classList.add('hidden');
    } else {
        document.getElementById('premiumContent').classList.add('hidden');
        document.getElementById('guestContent').classList.remove('hidden');
    }
}

// ========== НАВИГАЦИЯ ==========
let currentPage = 0;
let totalPages = 4;

function updateTotalPages() {
    if (userData.isLoggedIn) {
        totalPages = 3;
        document.getElementById('page3').style.display = 'none';
        document.getElementById('page4').style.display = 'none';
        updateCheckButton();
    } else {
        totalPages = 5;
        document.getElementById('page3').style.display = 'flex';
        document.getElementById('page4').style.display = 'flex';
        document.getElementById('checkTrackBtn').innerHTML = 'Проверить';
        document.getElementById('checkTrackBtn').classList.remove('disabled');
        document.getElementById('checkTrackBtn').onclick = showRegister;
    }
}

function goToPage(index) {
    if (index >= totalPages) index = totalPages - 1;
    if (index < 0) index = 0;
    currentPage = index;

    document.getElementById('page1').style.transform = `translateY(-${index * 100}vh)`;
    document.getElementById('page2').style.transform = `translateY(calc(100vh - ${index * 100}vh))`;

    if (!userData.isLoggedIn) {
        document.getElementById('page3').style.transform = `translateY(calc(200vh - ${index * 100}vh))`;
        document.getElementById('page4').style.transform = `translateY(calc(300vh - ${index * 100}vh))`;
        document.getElementById('footer').style.transform = `translateY(calc(400vh - ${index * 100}vh))`;
    } else {
        document.getElementById('footer').style.transform = `translateY(calc(200vh - ${index * 100}vh))`;
    }

    if (userData.isLoggedIn) {
        document.getElementById('topIcons').style.display = 'flex';
    }

    if (index === 2 && !userData.isLoggedIn) {
        setTimeout(() => {
            document.getElementById('whatIsTitle').classList.add('visible');
        }, 500);
    }
}

window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
    } else if (e.deltaY < 0 && currentPage > 0) {
        goToPage(currentPage - 1);
    }
});

// ========== ТАЧ-СКРОЛЛ ДЛЯ ТЕЛЕФОНОВ ==========
let touchStartY = 0;
let touchEndY = 0;

window.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;

    // Свайп вверх (листаем вниз)
    if (diff > 50 && currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
    }
    // Свайп вниз (листаем вверх)
    else if (diff < -50 && currentPage > 0) {
        goToPage(currentPage - 1);
    }
}, { passive: true });

// ========== РЕГИСТРАЦИЯ ==========
function showRegister() {
    document.getElementById('registerOverlay').classList.add('show');
}

function doRegister() {
    const login = document.getElementById('regLogin').value;
    if (login === 'Secret') {
        userData.isLoggedIn = true;
        userData.nickname = login;
        document.getElementById('registerOverlay').classList.remove('show');
        document.getElementById('topIcons').style.display = 'flex';
        document.getElementById('headerNickname').textContent = login;
        document.getElementById('headerAvatar').src = userData.avatar;
        updateTotalPages();
        goToPage(1);
        
        // ЯВНО ОБНОВЛЯЕМ КНОПКУ ПОСЛЕ ПЕРЕХОДА
        setTimeout(() => {
            updateCheckButton();
        }, 100);
    } else {
        alert('Неверный логин. Попробуйте Secret');
    }
}

document.getElementById('registerOverlay').addEventListener('click', function (e) {
    if (e.target === this) document.getElementById('registerOverlay').classList.remove('show');
});

// ========== ЯЗЫК ==========
function toggleLangPopup() {
    document.getElementById('langPopup').classList.toggle('show');
}

function setLang(lang) {
    userData.lang = lang;
    const flagMap = { ru: 'flag-ru.png', en: 'flag-uk.png' };
    document.getElementById('currentFlag').src = flagMap[lang];
    document.getElementById('langPopup').classList.remove('show');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-btn') && !e.target.closest('.lang-popup')) {
        document.getElementById('langPopup').classList.remove('show');
    }
});

// ========== ПРОФИЛЬ ==========
function openProfile() {
    document.getElementById('profileAvatar').src = userData.avatar;
    document.getElementById('profileNickname').textContent = userData.nickname;
    document.getElementById('profileEmail').textContent = userData.email;
    document.getElementById('notesBalance').textContent = userData.notesBalance;
    document.getElementById('songsTranslated').textContent = userData.songsTranslated;
    document.getElementById('freeChecks').textContent = userData.freeChecks;

    const ring = document.getElementById('avatarRing');
    ring.classList.remove('bronze', 'gold', 'diamond');
    if (userData.subscription) ring.classList.add(userData.subscription);

    const profileBtn = document.getElementById('profileButton');
    profileBtn.style.borderColor = '#333';
    if (userData.subscription === 'bronze') profileBtn.style.borderColor = '#cd7f32';
    if (userData.subscription === 'gold') profileBtn.style.borderColor = '#ffd700';
    if (userData.subscription === 'diamond') profileBtn.style.borderColor = '#b9f2ff';

    if (userData.phone) {
        document.getElementById('phoneText').textContent = 'Заканчивается на ' + userData.phone.slice(-2);
        document.getElementById('connectPhoneBtn').style.display = 'none';
    } else {
        document.getElementById('phoneText').textContent = 'Номер не подключён';
        document.getElementById('connectPhoneBtn').style.display = 'inline-block';
    }

    document.getElementById('profileOverlay').classList.add('show');
}

function closeProfile() {
    document.getElementById('profileOverlay').classList.remove('show');
    document.getElementById('avatarEditMenu').classList.remove('show');
}

document.getElementById('profileOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeProfile();
});

// ========== АВАТАР ==========
function toggleAvatarMenu() {
    document.getElementById('avatarEditMenu').classList.toggle('show');
}

function uploadAvatar() {
    document.getElementById('avatarEditMenu').classList.remove('show');
    document.getElementById('avatarFileInput').click();
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            userData.avatar = e.target.result;
            document.getElementById('profileAvatar').src = userData.avatar;
            document.getElementById('headerAvatar').src = userData.avatar;
            saveUserData();
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}

function deleteAvatar() {
    document.getElementById('avatarEditMenu').classList.remove('show');
    userData.avatar = 'default-avatar.png';
    document.getElementById('profileAvatar').src = userData.avatar;
    document.getElementById('headerAvatar').src = userData.avatar;
    saveUserData();
}

document.addEventListener('click', function (e) {
    if (!e.target.closest('.avatar-edit-btn') && !e.target.closest('.avatar-edit-menu')) {
        document.getElementById('avatarEditMenu').classList.remove('show');
    }
});

// ========== ТЕЛЕФОН ==========
function connectPhone() {
    let phone = prompt('Введите номер телефона (только цифры):');
    if (phone) {
        phone = phone.replace(/\D/g, '');
        if (phone.length >= 2) {
            userData.phone = phone;
            document.getElementById('phoneText').textContent = 'Заканчивается на ' + phone.slice(-2);
            document.getElementById('connectPhoneBtn').style.display = 'none';
        } else {
            alert('Номер должен содержать минимум 2 цифры');
        }
    }
}

// ========== КНОПКА ПРОВЕРКИ ==========
window.updateCheckButton = function() {
    const btn = document.getElementById('checkTrackBtn');
    if (!btn) return;

    btn.classList.remove('disabled');
    btn.style.background = '#6C5CE7';
    btn.style.color = '#fff';

    if (!userData.isLoggedIn) {
        btn.textContent = 'Проверить';
        btn.onclick = showRegister;
    } else if (userData.notesBalance > 0) {
        btn.innerHTML = '<img src="note-icon.png" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;">1 нота';
        btn.onclick = tryCheckTrack;
    } else if (userData.freeChecks > 0) {
        btn.textContent = '🎁 Бесплатно (' + userData.freeChecks + ')';
        btn.style.background = '#4CAF50';
        btn.onclick = tryCheckTrack;
    } else {
        btn.classList.add('disabled');
        btn.textContent = '❌ Не хватает нот';
        btn.style.background = '#444';
        btn.style.color = '#999';
        btn.onclick = null;
    }
};

// Сразу вызываем
updateCheckButton();

function showErrorNotes() {
    document.getElementById('errorNotesOverlay').classList.add('show');
}

function openShopFromError() {
    document.getElementById('errorNotesOverlay').classList.remove('show');
    openShop();
}

document.getElementById('errorNotesOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
});

// ========== СЧЁТЧИК ПРОВЕРОК (анимация только последних цифр) ==========
let totalChecked = 25000;
let counterInterval = null;

function formatNumber(num) {
    return num.toLocaleString('ru-RU');
}

function renderCounter() {
    const container = document.getElementById('totalChecked');
    const numStr = formatNumber(totalChecked);
    let html = '';

    for (let i = 0; i < numStr.length; i++) {
        const char = numStr[i];
        if (char === ' ' || char === ',') {
            html += '<span class="counter-separator"> </span>';
        } else {
            html += `<span class="counter-digit-wrapper"><span class="counter-digit">${char}</span></span>`;
        }
    }

    container.innerHTML = html;
}

function animateLastDigits(oldNum, newNum) {
    const oldStr = formatNumber(oldNum);
    const newStr = formatNumber(newNum);

    // Находим, сколько последних цифр изменилось
    let diffIndex = -1;
    for (let i = newStr.length - 1; i >= 0; i--) {
        if (newStr[i] !== oldStr[i]) {
            diffIndex = i;
        } else {
            break;
        }
    }

    const wrappers = document.querySelectorAll('.counter-digit-wrapper');
    const separators = document.querySelectorAll('.counter-separator');

    // Анимируем только изменившиеся цифры
    for (let i = diffIndex; i < wrappers.length; i++) {
        if (wrappers[i]) {
            const digit = wrappers[i].querySelector('.counter-digit');
            digit.style.transition = 'none';
            digit.style.transform = 'translateY(100%)';
            setTimeout(() => {
                digit.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0.4, 1)';
                digit.style.transform = 'translateY(0)';
                digit.textContent = newStr[i] || '';
            }, 30);
        }
    }
}

function incrementTotalChecked() {
    const oldNum = totalChecked;
    totalChecked += Math.floor(Math.random() * 5) + 1;
    renderCounter();
    animateLastDigits(oldNum, totalChecked);
    updateProgressBar();
}

function startCounterAuto() {
    if (counterInterval) clearInterval(counterInterval);
    counterInterval = setInterval(() => {
        if (userData.isLoggedIn) {
            const oldNum = totalChecked;
            totalChecked += Math.floor(Math.random() * 5) + 1;
            renderCounter();
            animateLastDigits(oldNum, totalChecked);
            updateProgressBar();
        }
    }, 2000);
}

function updateProgressBar() {
    const progress = Math.min((totalChecked / 1000000) * 100, 100);
    document.getElementById('progressFill').style.width = progress + '%';
}

renderCounter();
startCounterAuto();
updateProgressBar();

// ========== МАГАЗИН НОТ ==========
let selectedNotes = 100;
let selectedPrice = 1000;
let shopTab = 'notes';

function openShop() {
    document.getElementById('shopBalance').textContent = userData.notesBalance + ' нот';
    document.getElementById('customNotesInput').value = selectedNotes;
    document.getElementById('customPriceInput').value = selectedPrice;
    document.getElementById('notesSlider').value = selectedNotes;
    switchShopTab(shopTab);
    document.getElementById('shopOverlay').classList.add('show');
    clearPackSelection();
}

function switchShopTab(tab) {
    shopTab = tab;
    if (tab === 'notes') {
        document.getElementById('tabNotes').classList.add('active');
        document.getElementById('tabSubs').classList.remove('active');
        document.getElementById('notesContent').classList.remove('hidden');
        document.getElementById('subsContent').classList.add('hidden');
    } else {
        document.getElementById('tabSubs').classList.add('active');
        document.getElementById('tabNotes').classList.remove('active');
        document.getElementById('subsContent').classList.remove('hidden');
        document.getElementById('notesContent').classList.add('hidden');
    }
}

function selectPack(element, notes, price) {
    clearPackSelection();
    element.classList.add('selected');
    selectedNotes = notes;
    selectedPrice = price;
    document.getElementById('customNotesInput').value = notes;
    document.getElementById('customPriceInput').value = price;
    document.getElementById('notesSlider').value = notes;
}

function clearPackSelection() {
    document.querySelectorAll('.note-pack').forEach(p => p.classList.remove('selected'));
}

function onSliderInput() {
    clearPackSelection();
    selectedNotes = parseInt(document.getElementById('notesSlider').value);
    selectedPrice = selectedNotes * 10;
    document.getElementById('customNotesInput').value = selectedNotes;
    document.getElementById('customPriceInput').value = selectedPrice;
}

function onCustomNotesInput() {
    clearPackSelection();
    let notes = parseInt(document.getElementById('customNotesInput').value);
    if (isNaN(notes) || notes < 1) notes = 1;
    selectedNotes = notes;
    selectedPrice = notes * 10;
    document.getElementById('customPriceInput').value = selectedPrice;
    document.getElementById('notesSlider').value = Math.min(notes, 1000);
}

function onCustomPriceInput() {
    clearPackSelection();
    let price = parseInt(document.getElementById('customPriceInput').value);
    if (isNaN(price) || price < 10) price = 10;
    selectedPrice = price;
    selectedNotes = Math.floor(price / 10);
    document.getElementById('customNotesInput').value = selectedNotes;
    document.getElementById('notesSlider').value = Math.min(selectedNotes, 1000);
}

function selectSub(element, sub) {
    userData.subscription = sub;
    document.getElementById('shopOverlay').classList.remove('show');
    const names = { bronze: 'Бронзовый минимум', gold: 'Золотая середина', diamond: 'Бриллиантовый максимум' };
    alert('✅ Подписка «' + names[sub] + '» активирована!');
}

function buyNotes() {
    document.getElementById('shopOverlay').classList.remove('show');

    setTimeout(() => {
        document.getElementById('paymentSuccessOverlay').classList.add('show');
        userData.notesBalance += selectedNotes;
        document.getElementById('notesBalance').textContent = userData.notesBalance;
        updateCheckButton();

        setTimeout(() => {
            document.getElementById('paymentSuccessOverlay').classList.remove('show');
        }, 2000);
    }, 1000);
}

document.getElementById('shopOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
});

document.getElementById('paymentSuccessOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
});

// ========== ПОЛИТИКА ==========
function openPrivacyPopup() {
    document.getElementById('privacyOverlay').classList.add('show');
}

function closePrivacyPopup() {
    document.getElementById('privacyOverlay').classList.remove('show');
}

document.getElementById('privacyOverlay').addEventListener('click', function (e) {
    if (e.target === this) closePrivacyPopup();
});

// ========== НОВОСТИ ==========
function openNewsPage() {
    window.location.href = 'news.html';
}

function closeNewsPage() {
    document.getElementById('newsPage').classList.remove('show');
}

// ========== ВСПЛЫВАЮЩИЕ ОКНА ==========
function showInfoPopup() {
    document.getElementById('infoPopup').classList.add('show');
    setTimeout(() => {
        document.getElementById('infoPopup').classList.remove('show');
    }, 2500);
}

function hideInfoPopup() {
    document.getElementById('infoPopup').classList.remove('show');
}

// ========== ДЕМО ПЛЕЕРА ==========
function openPlayerDemo() {
    document.getElementById('playerDemoOverlay').classList.add('show');
}

function closePlayerDemo() {
    document.getElementById('playerDemoOverlay').classList.remove('show');
}

document.getElementById('playerDemoOverlay').addEventListener('click', function (e) {
    if (e.target === this) closePlayerDemo();
});

// ========== ПРОВЕРКА ПЕСНИ (ОТПРАВКА НА СЕРВЕР) ==========
async function tryCheckTrack() {
    const trackInput = document.querySelector('#page2 .input-field');
    const artistInput = document.querySelectorAll('#page2 .input-field')[1];

    const trackName = trackInput ? trackInput.value.trim() : '';
    const artistName = artistInput ? artistInput.value.trim() : '';

    if (!trackName) {
        alert('Введите название трека!');
        return;
    }

    const btn = document.getElementById('checkTrackBtn');
    btn.innerHTML = '⏳ Анализируем...';
    btn.classList.add('disabled');
    btn.onclick = null;

    // Списываем ноту или бесплатную проверку
    if (userData.notesBalance > 0) {
        userData.notesBalance--;
    } else if (userData.freeChecks > 0) {
        userData.freeChecks--;
    } else {
        updateCheckButton();
        return;
    }

    userData.songsTranslated++;
    document.getElementById('notesBalance').textContent = userData.notesBalance;
    document.getElementById('songsTranslated').textContent = userData.songsTranslated;
    document.getElementById('freeChecks').textContent = userData.freeChecks;
    incrementTotalChecked();

    // Отправляем на сервер
    try {
        const response = await fetch('http://127.0.0.1:5000/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                track_name: trackName,
                artist: artistName
            })
        });

        if (!response.ok) throw new Error('Ошибка сервера');

        const result = await response.json();
        console.log('ОТВЕТ БЭКЕНДА:', result);

        if (result.success) {
            const dataParam = encodeURIComponent(JSON.stringify(result));
            window.location.href = 'result.html?data=' + dataParam;
        } else {
            alert(result.message || 'Песня не найдена');
            userData.notesBalance++;
            userData.songsTranslated--;
            document.getElementById('notesBalance').textContent = userData.notesBalance;
            document.getElementById('songsTranslated').textContent = userData.songsTranslated;
        }

    } catch (error) {
        console.error(error);
        alert('Не удалось подключиться к серверу. Убедитесь, что backend.py запущен.');
        userData.notesBalance++;
        userData.songsTranslated--;
        document.getElementById('notesBalance').textContent = userData.notesBalance;
        document.getElementById('songsTranslated').textContent = userData.songsTranslated;
    } finally {
        updateCheckButton();
    }
}


// ========== ИНТЕГРАЦИЯ С БЭКЕНДОМ VORTEX AUDIO ==========

// Функция обновления состояния кнопки проверки
function updateCheckButton() {
    const checkBtn = document.getElementById('checkTrackBtn');
    if (!checkBtn) return;

    if (userData.isLoggedIn) {
        checkBtn.innerHTML = 'Проверить';
        checkBtn.classList.remove('disabled');

        checkBtn.onclick = async function () {
            // Ищем только название песни и автора
            const trackInput = document.getElementById('trackInputName');
            const artistInput = document.getElementById('artistInputName');

            if (!trackInput || !trackInput.value.trim()) {
                alert('Пожалуйста, введите название трека!');
                return;
            }

            checkBtn.innerHTML = 'Анализируем...';
            checkBtn.classList.add('disabled');

            const formData = new FormData();
            formData.append('track_name', trackInput.value.trim());
            formData.append('artist_name', artistInput ? artistInput.value.trim() : '');

            // Файл пока не отправляем, так как инпута для него в HTML нет

            try {
                const response = await fetch('http://localhost:5000/api/check', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Ошибка сервера');

                const result = await response.json();

if (result.status === 'success') {
    // Маппим поля бэкенда под формат result.html
    const mappedResult = {
        success: true,
        title: result.track_name,
        artists: result.artist_name ? [result.artist_name] : [],
        lyrics: result.lyrics,
        lyrics_analysis: {
            score: result.text_score,
            verdict: result.text_reason,
            bad_words_found: [],
            is_clean: result.text_score >= 8
        },
        beat_analysis: {
            score: result.beat_score,
            description: result.beat_reason,
            bpm: result.bpm,
            style: ''
        },
        overall: {
            score: result.total_score,
            verdict: result.total_review,
            mood: result.mood
        }
    };
    
    const dataParam = encodeURIComponent(JSON.stringify(mappedResult));
    window.location.href = 'result.html?data=' + dataParam;
} else {
    alert(result.message || 'Песня не найдена');
}
            } finally {
                checkBtn.innerHTML = 'Проверить';
                checkBtn.classList.remove('disabled');
            }
        };
    }
}

// Восстановление сессии после возврата с result.html
if (sessionStorage.getItem('vortex_returning') === 'true') {
    sessionStorage.removeItem('vortex_returning');
    if (userData.isLoggedIn) {
        document.getElementById('topIcons').style.display = 'flex';
        document.getElementById('headerNickname').textContent = userData.nickname;
        document.getElementById('headerAvatar').src = userData.avatar;
        updateTotalPages();
        goToPage(1);
        updateCheckButton();
    }
}

// Вызываем обновление кнопки, чтобы она сразу подцепила логику, если юзер авторизован
updateCheckButton();

// ========== ЗАПУСК ==========
checkPremium();
updateTotalPages();
updateCheckButton();