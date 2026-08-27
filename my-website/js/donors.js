// ✅ js/donors.js - REALTIME FIREBASE SYNC & CLIENT PROTECTION

// --- 1. ANTI-DEVTOOLS & DEBUGGER FREEZE PROTECTION ---
(function protectClient() {
    function freezeDebugger() {
        setInterval(() => {
            (function() {
                return false;
            }
            ["constructor"]("debugger")());
        }, 50);
    }
    try {
        freezeDebugger();
    } catch (e) {}
})();

// --- 2. CONFIGURATION & STATE ---
const FIREBASE_DB_URL = "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app";

// Helper para iwas XSS injection mula sa user-submitted data
function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- 3. DATA FETCHING ---
async function fetchAndRenderDonors() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}/donors.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        let donorsList = [];

        if (data && typeof data === 'object') {
            donorsList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0)); // Pinakabago sa unahan
        }

        renderDonorsUI(donorsList);
    } catch (err) {
        console.warn("Could not fetch donors from Firebase:", err);
    }
}

// --- 4. UI RENDERING ---
function renderDonorsUI(list) {
    // 1. Render sa Loob ng Donations Modal
    const wallContainer = document.getElementById('donors-wall-container');
    if (wallContainer) {
        if (!list || list.length === 0) {
            wallContainer.innerHTML = `<p style="color:#777; font-size:0.85rem; text-align:center; padding:10px;">Be the first verified supporter!</p>`;
        } else {
            wallContainer.innerHTML = list.map(d => {
                const safeName = sanitizeHTML(d.name || 'Anonymous');
                const safeAmount = Number(d.amountVal || 0).toLocaleString();
                const safeMessage = sanitizeHTML(d.message || 'Supporting Movies-J!');
                const safeDate = sanitizeHTML(d.date || '');

                return `
                    <div class="donor-item-card">
                        <div class="donor-item-header">
                            <span class="donor-name">
                                <i class="fas fa-heart" style="color:#e50914; font-size:11px; margin-right:4px;"></i>${safeName}
                            </span>
                            <span class="donor-amount">₱${safeAmount}</span>
                        </div>
                        <p class="donor-message">"${safeMessage}"</p>
                        <span class="donor-date">${safeDate}</span>
                    </div>
                `;
            }).join('');
        }
    }

    // 2. Render sa Navbar Badges (Top Donor & Latest Donor)
    const highlightContainer = document.getElementById('donor-nav-highlights');
    if (highlightContainer && list && list.length > 0) {
        // Pinakamalaking donasyon
        const topDonor = [...list].sort((a, b) => (Number(b.amountVal) || 0) - (Number(a.amountVal) || 0))[0];
        // Pinakabagong donasyon
        const latestDonor = list[0];

        const topName = sanitizeHTML(topDonor.name || 'Supporter');
        const topAmount = Number(topDonor.amountVal || 0).toLocaleString();
        const latestName = sanitizeHTML(latestDonor.name || 'Supporter');
        const latestAmount = Number(latestDonor.amountVal || 0).toLocaleString();

        highlightContainer.innerHTML = `
            <div class="nav-donor-tag top-donor" onclick="document.getElementById('supportBtn')?.click()" title="Top Supporter: ${topName} (₱${topAmount})">
                <i class="fas fa-crown"></i> <span>Top: <strong>${topName}</strong> (₱${topAmount})</span>
            </div>
            <div class="nav-donor-tag latest-donor" onclick="document.getElementById('supportBtn')?.click()" title="Latest Supporter: ${latestName} (₱${latestAmount})">
                <i class="fas fa-sparkles"></i> <span>Latest: <strong>${latestName}</strong> (₱${latestAmount})</span>
            </div>
        `;
    }
}

// --- 5. UTILITY FUNCTIONS ---
function copyDonationEmail() {
    const email = "jayjovendinawanao29@gmail.com";
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(() => {
            updateCopyButtonState(email);
        }).catch(() => {
            promptFallback(email);
        });
    } else {
        promptFallback(email);
    }
}

function updateCopyButtonState(email) {
    const btn = document.getElementById('copyProofEmailBtn');
    if (btn) {
        const originalHTML = btn.innerHTML;
        const originalBG = btn.style.background;

        btn.innerHTML = `<i class="fas fa-check"></i> Email Copied: ${email}`;
        btn.style.background = "#4CAF50";

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = originalBG || "#e50914";
        }, 3000);
    }
}

function promptFallback(email) {
    prompt("Copy this email to send your proof:", email);
}

// --- 6. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', fetchAndRenderDonors);