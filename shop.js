let currentPayment = { type: '', item: '', amount: 0 };

// Баланс из localStorage
let notesBalance = parseInt(localStorage.getItem('vortex_notes') || '0');
document.getElementById('shopBalance').textContent = notesBalance;

function switchTab(tab) {
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function buyPack(amount, price) {
    currentPayment = { type: 'notes', item: `${amount} нот`, amount: price, notes: amount };
    document.getElementById('payItem').textContent = `${amount} нот`;
    document.getElementById('payAmount').textContent = price;
    document.getElementById('payOverlay').classList.add('show');
}

function buySub(sub) {
    let itemName = sub === 'bronze' ? 'Бронзовая подписка' : sub === 'gold' ? 'Золотая подписка' : 'Бриллиантовая подписка';
    let price = sub === 'bronze' ? 299 : sub === 'gold' ? 499 : 799;
    
    currentPayment = { type: 'sub', item: itemName, amount: price, sub: sub };
    document.getElementById('payItem').textContent = itemName;
    document.getElementById('payAmount').textContent = price;
    document.getElementById('payOverlay').classList.add('show');
}

function closePayment() {
    document.getElementById('payOverlay').classList.remove('show');
}

function confirmPayment() {
    if (currentPayment.type === 'notes') {
        notesBalance += currentPayment.notes;
        localStorage.setItem('vortex_notes', notesBalance);
        document.getElementById('shopBalance').textContent = notesBalance;
        showToast(`Успешно куплено ${currentPayment.notes} нот!`, 'success');
    } else if (currentPayment.type === 'sub') {
        localStorage.setItem('vortex_subscription', currentPayment.sub);
        showToast(`Подписка "${currentPayment.item}" активирована!`, 'success');
    }
    closePayment();
}

function activatePromo() {
    const promo = prompt('Введите промокод:');
    if (promo === 'VORTEX2026') {
        notesBalance += 6;
        localStorage.setItem('vortex_notes', notesBalance);
        document.getElementById('shopBalance').textContent = notesBalance;
        showToast('Промокод активирован! +6 нот', 'success');
    } else {
        showToast('Неверный промокод', 'error');
    }
}

// Простой тост (можно заменить на toast.js)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:15px 25px;background:#1a1a1a;border:1px solid #333;border-radius:12px;color:#fff;z-index:9999;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}