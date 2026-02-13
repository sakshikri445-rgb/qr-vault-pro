/**
 * QR Vault Pro - Client Logic
 * Handles User Identification, API Communication, and UI Updates
 */

const UI = {
    input: document.getElementById('qr-input'),
    generateBtn: document.getElementById('generate-btn'),
    historyContainer: document.getElementById('history-container'),
    historyCount: document.getElementById('history-count'),
    qrcodeWrapper: document.getElementById('qrcode'),
    displayCard: document.getElementById('display-card'),
    userDisplay: document.getElementById('user-display-id'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-msg'),
    downloadBtn: document.getElementById('download-btn'),
    copyBtn: document.getElementById('copy-btn')
};

// 1. Initialize User ID (Unique per Browser)
const USER_ID = (() => {
    let id = localStorage.getItem('qr_vault_user_id');
    if (!id) {
        id = 'usr_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('qr_vault_user_id', id);
    }
    return id;
})();

// 2. State Management
let currentQR = null;

function showToast(msg) {
    UI.toastMsg.innerText = msg;
    UI.toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
    setTimeout(() => {
        UI.toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
    }, 3000);
}

// 3. API Calls
async function loadHistory() {
    try {
        const response = await fetch(`/api/history?user_id=${USER_ID}`);
        const data = await response.json();
        renderHistory(data);
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

async function saveToVault(content) {
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, user_id: USER_ID })
        });
        
        if (response.ok) {
            showToast("Successfully added to vault");
            loadHistory();
        } else {
            const error = await response.json();
            showToast(error.error || "Save failed");
        }
    } catch (err) {
        showToast("Server connection error");
    }
}

async function deleteFromVault(id) {
    try {
        const res = await fetch(`/api/history/${id}?user_id=${USER_ID}`, { method: 'DELETE' });
        if (res.ok) {
            showToast("Removed from history");
            loadHistory();
        }
    } catch (err) {
        showToast("Delete failed");
    }
}

// 4. UI Rendering
function renderQR(text) {
    UI.qrcodeWrapper.innerHTML = "";
    UI.displayCard.classList.remove('hidden');
    
    currentQR = new QRCode(UI.qrcodeWrapper, {
        text: text,
        width: 240,
        height: 240,
        colorDark : "#1e1b4b",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

function renderHistory(items) {
    UI.historyCount.innerText = items.length;
    
    if (items.length === 0) {
        UI.historyContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                <i class="fa-solid fa-box-open text-4xl mb-4"></i>
                <p class="text-sm italic">Vault is empty</p>
            </div>
        `;
        return;
    }

    UI.historyContainer.innerHTML = items.map(item => `
        <div class="history-item group bg-slate-50 p-4 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm hover:shadow-md">
            <div class="flex justify-between items-start gap-3">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-700 truncate" title="${item.content}">
                        ${item.content}
                    </p>
                    <p class="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <i class="fa-regular fa-clock"></i> ${new Date(item.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="viewItem('${item.content.replace(/'/g, "\\'")}')" class="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg">
                        <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                    <button onclick="deleteFromVault(${item.id})" class="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewItem(content) {
    UI.input.value = content;
    renderQR(content);
}

// 5. Event Listeners
UI.generateBtn.addEventListener('click', () => {
    const val = UI.input.value.trim();
    if (!val) return showToast("Enter content first");
    renderQR(val);
    saveToVault(val);
});

UI.downloadBtn.addEventListener('click', () => {
    const img = UI.qrcodeWrapper.querySelector('img');
    if (!img) return;
    const link = document.createElement('a');
    link.download = `QR_Vault_${Date.now()}.png`;
    link.href = img.src;
    link.click();
});

UI.copyBtn.addEventListener('click', () => {
    const val = UI.input.value;
    navigator.clipboard.writeText(val);
    showToast("Copied to clipboard");
});

// 6. Bootstrap
window.onload = () => {
    UI.userDisplay.innerText = USER_ID;
    loadHistory();
};