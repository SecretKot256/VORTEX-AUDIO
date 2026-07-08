// ========== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ==========
let userData = {
    isLoggedIn: false,
    nickname: 'User',
    email: 'user@example.com',
    avatar: 'default-avatar.png',
    phone: null,
    notesBalance: 42,
    songsTranslated: 17,
    lang: 'ru',
    subscription: null // 'bronze', 'gold', 'diamond'
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

function setPremium() {
    localStorage.setItem('vortex_premium', 'true');
    checkPremium();
}

function removePremium() {
    localStorage.removeItem('vortex_premium');
    checkPremium();
}

// ========== НАВИГАЦИЯ ==========
let currentPage = 0;
let totalPages = 4; // 4 контентные страницы + футер = 5 позиций

function updateTotalPages() {
    if (userData.isLoggedIn) {
        totalPages = 3; // страницы 1, 2, футер (индексы 0, 1, 2)
        document.getElementById('page3').style.display = 'none';
        document.getElementById('page4').style.display = 'none';
        document.getElementById('checkTrackBtn').onclick = tryCheckTrack;
    } else {
        totalPages = 5; // все страницы + футер
        document.getElementById('page3').style.display = 'flex';
        document.getElementById('page4').style.display = 'flex';
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
        updateCheckButton();
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

// ========== РЕГИСТРАЦИЯ ==========
function showRegister() {
    document.getElementById('registerOverlay').classList.add('show');
}

function hideRegister() {
    document.getElementById('registerOverlay').classList.remove('show');
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
        updateCheckButton();
        goToPage(1); // сразу на страницу проверки
    } else {
        alert('Неверный логин. Попробуйте Secret');
    }
}

// Закрытие регистрации по клику вне
document.getElementById('registerOverlay').addEventListener('click', function(e) {
    if (e.target === this) hideRegister();
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

    // Обводка подписки
    const ring = document.getElementById('avatarRing');
    ring.classList.remove('bronze', 'gold', 'diamond');
    if (userData.subscription) {
        ring.classList.add(userData.subscription);
    }

    // Профиль-кнопка в шапке тоже с обводкой
    const profileBtn = document.getElementById('profileButton');
    profileBtn.style.borderColor = '#333';
    if (userData.subscription === 'bronze') profileBtn.style.borderColor = '#cd7f32';
    if (userData.subscription === 'gold') profileBtn.style.borderColor = '#ffd700';
    if (userData.subscription === 'diamond') profileBtn.style.borderColor = '#b9f2ff';

    if (userData.phone) {
        document.getElementById('phoneText').textContent = 
            'Заканчивается на ' + userData.phone.slice(-2);
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

document.getElementById('profileOverlay').addEventListener('click', function(e) {
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
        reader.onload = function(e) {
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

document.addEventListener('click', function(e) {
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
            document.getElementById('phoneText').textContent = 
                'Заканчивается на ' + phone.slice(-2);
            document.getElementById('connectPhoneBtn').style.display = 'none';
        } else {
            alert('Номер должен содержать минимум 2 цифры');
        }
    }
}

// ========== КНОПКА ПРОВЕРКИ ==========
function updateCheckButton() {
    const btn = document.getElementById('checkTrackBtn');
    if (userData.notesBalance < 1) {
        btn.classList.add('disabled');
        btn.innerHTML = 'Недостаточно нот';
        btn.onclick = showErrorNotes;
    } else {
        btn.classList.remove('disabled');
        btn.innerHTML = '<img class="note-icon-btn" src="note-icon.png" alt="♪"> 1';
        btn.onclick = tryCheckTrack;
    }
}

function tryCheckTrack() {
    if (userData.notesBalance >= 1) {
        userData.notesBalance--;
        userData.songsTranslated++;
        document.getElementById('notesBalance').textContent = userData.notesBalance;
        document.getElementById('songsTranslated').textContent = userData.songsTranslated;
        updateCheckButton();
        incrementTotalChecked();
        alert('✅ Песня проверена!');
    }
}

function showErrorNotes() {
    document.getElementById('errorNotesOverlay').classList.add('show');
}

function openShopFromError() {
    document.getElementById('errorNotesOverlay').classList.remove('show');
    openShop();
}

document.getElementById('errorNotesOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
});

// ========== СЧЁТЧИК ПРОВЕРОК ==========
let totalChecked = 25000;

function incrementTotalChecked() {
    totalChecked++;
    document.getElementById('totalChecked').textContent = totalChecked.toLocaleString();
    updateProgressBar();
}

function updateProgressBar() {
    const progress = Math.min((totalChecked / 1000000) * 100, 100);
    document.getElementById('progressFill').style.width = progress + '%';
}

// Автоинкремент каждую секунду (имитация)
setInterval(() => {
    if (userData.isLoggedIn) {
        totalChecked += Math.floor(Math.random() * 3) + 1;
        document.getElementById('totalChecked').textContent = totalChecked.toLocaleString();
        updateProgressBar();
    }
}, 1000);

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
    alert('✅ Подписка «' + (sub === 'bronze' ? 'Бронзовый минимум' : sub === 'gold' ? 'Золотая середина' : 'Бриллиантовый максимум') + '» активирована!');
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

document.getElementById('shopOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
});

document.getElementById('paymentSuccessOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
});

// ========== ПОЛИТИКА ==========
function openPrivacyPopup() {
    document.getElementById('privacyOverlay').classList.add('show');
}

function closePrivacyPopup() {
    document.getElementById('privacyOverlay').classList.remove('show');
}

document.getElementById('privacyOverlay').addEventListener('click', function(e) {
    if (e.target === this) closePrivacyPopup();
});

// ========== НОВОСТИ ==========
function openNewsPage() {
    document.getElementById('newsPage').classList.add('show');
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

// ========== ЗАПУСК ==========
checkPremium();
updateTotalPages();
updateCheckButton();
