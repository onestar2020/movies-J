// ✅ js/changelog.js (GLOBAL EVENT DELEGATION + AUTO REALTIME DATABASE SYNC)

const FIREBASE_DB_URL = "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app";

const FALLBACK_CHANGELOGS = [
    {
        version: "v2.6",
        date: "August 21, 2026",
        title: "Verified Supporters Wall & Real-Time Sync",
        changes: [
            "Real-Time Supporters Wall: Live dynamic database sync para sa lahat ng verified supporters at donasyon via GCash/PayPal.",
            "Dynamic Navbar Badges: Awtomatikong pinapakita ang 👑 Top Supporter at ✨ Latest Supporter badges sa desktop at mobile header.",
            "Secure Admin Manager: Pinabilis na admin dashboard para sa instant adding at removal ng supporters nang walang code editing.",
            "Mobile UI/UX Refinement: Inayos ang responsive layout ng support modal at mobile drawer badges para fit sa lahat ng screen sizes."
        ]
    }
];

let cachedLogs = FALLBACK_CHANGELOGS;
let latestAppVersion = "v2.6";

function renderLogsHtml(logs) {
    return logs.map(log => `
        <div class="changelog-item">
            <div class="changelog-date">
                <span class="changelog-version">${log.version || ''}</span>
                <span>${log.date || ''}</span>
            </div>
            <h4>${log.title || ''}</h4>
            <ul>
                ${(log.changes || []).map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function ensureModalCreated() {
    let overlay = document.getElementById('changelog-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'changelog-modal-overlay';
        overlay.className = 'changelog-overlay';
        overlay.innerHTML = `
            <div class="changelog-card">
                <div class="changelog-header">
                    <h3>🚀 System Updates & Logs</h3>
                    <button class="changelog-close" id="changelog-close-btn" aria-label="Close">&times;</button>
                </div>
                <div class="changelog-body" id="changelog-body-content">
                    ${renderLogsHtml(cachedLogs)}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });

        const closeBtn = document.getElementById('changelog-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => overlay.classList.remove('show');
        }
    }
    return overlay;
}

function openChangelogModal() {
    const overlay = ensureModalCreated();
    overlay.classList.add('show');

    // I-save ang version para mawala ang red badge
    localStorage.setItem('movies_j_last_version', latestAppVersion);
    const dot = document.getElementById('changelog-unread-dot');
    if (dot) dot.remove();
}

// 🎯 GLOBAL EVENT DELEGATION: Kahit bagong render ang navbar ng homepage, magka-click pa rin
document.addEventListener('click', (e) => {
    const target = e.target.closest('#changelog-btn, .changelog-btn, [data-target="changelog"], button:has(.fa-bell), a:has(.fa-bell)');
    const isBellDirect = e.target.classList.contains('fa-bell') || e.target.closest('.fa-bell');
    
    if (target || isBellDirect) {
        e.preventDefault();
        e.stopPropagation();
        openChangelogModal();
    }
});

async function loadChangelogData() {
    ensureModalCreated();

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/changelogs.json`);
        const data = await res.json();
        
        if (data) {
            const sorted = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            if (sorted.length > 0) {
                cachedLogs = sorted;
                latestAppVersion = sorted[0].version || "v2.6";

                const bodyContainer = document.getElementById('changelog-body-content');
                if (bodyContainer) {
                    bodyContainer.innerHTML = renderLogsHtml(sorted);
                }
            }
        }
    } catch (err) {
        console.warn("Changelog fetch warning:", err);
    }

    // Check Notification Badge
    const lastSeen = localStorage.getItem('movies_j_last_version');
    const bellBtn = document.getElementById('changelog-btn') || 
                    document.querySelector('.changelog-btn') || 
                    document.querySelector('.fa-bell')?.parentElement;

    if (bellBtn && lastSeen !== latestAppVersion) {
        bellBtn.style.position = 'relative';
        if (!document.getElementById('changelog-unread-dot')) {
            const dot = document.createElement('span');
            dot.id = 'changelog-unread-dot';
            dot.style.cssText = "position:absolute; top:2px; right:2px; width:8px; height:8px; background:#e50914; border-radius:50%; border:1px solid #000; pointer-events:none;";
            bellBtn.appendChild(dot);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadChangelogData);
} else {
    loadChangelogData();
}