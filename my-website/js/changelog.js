// ✅ js/changelog.js (DYNAMIC REALTIME DATABASE SYNC + AUTO NOTIFICATION BADGE)

const FIREBASE_DB_URL = "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app";

// Fallback sakaling offline o bago pa ang database
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

async function fetchLiveChangelogs() {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/changelogs.json`);
        const data = await res.json();
        if (!data) return FALLBACK_CHANGELOGS;

        // I-sort mula sa pinakabagong update
        const sorted = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return sorted.length > 0 ? sorted : FALLBACK_CHANGELOGS;
    } catch (e) {
        console.warn("Changelog fetch error, using fallback:", e);
        return FALLBACK_CHANGELOGS;
    }
}

async function initChangelogModule() {
    // 1. Fetch live updates
    const logs = await fetchLiveChangelogs();
    const latestVersion = logs[0]?.version || "v2.6";

    // 2. Setup Modal Container
    let overlay = document.getElementById('changelog-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'changelog-modal-overlay';
        overlay.className = 'changelog-overlay';
        document.body.appendChild(overlay);
    }

    const logsHtml = logs.map(log => `
        <div class="changelog-item">
            <div class="changelog-date">
                <span class="changelog-version">${log.version}</span>
                <span>${log.date}</span>
            </div>
            <h4>${log.title}</h4>
            <ul>
                ${(log.changes || []).map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    overlay.innerHTML = `
        <div class="changelog-card">
            <div class="changelog-header">
                <h3>🚀 System Updates & Logs</h3>
                <button class="changelog-close" id="changelog-close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="changelog-body">
                ${logsHtml}
            </div>
        </div>
    `;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('show');
    });

    const closeBtn = document.getElementById('changelog-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => overlay.classList.remove('show');
    }

    // 3. Notification Dot Checker (Dynamic base sa latest version sa DB)
    const btn = document.getElementById('changelog-btn');
    const lastSeenVersion = localStorage.getItem('movies_j_last_version');

    if (btn) {
        if (lastSeenVersion !== latestVersion) {
            btn.style.position = 'relative';
            if (!document.getElementById('changelog-unread-dot')) {
                const dot = document.createElement('span');
                dot.id = 'changelog-unread-dot';
                dot.style.cssText = "position:absolute; top:2px; right:2px; width:8px; height:8px; background:#e50914; border-radius:50%; border:1px solid #000;";
                btn.appendChild(dot);
            }
        }

        btn.onclick = (e) => {
            e.preventDefault();
            overlay.classList.add('show');

            localStorage.setItem('movies_j_last_version', latestVersion);
            const dot = document.getElementById('changelog-unread-dot');
            if (dot) dot.remove();
        };
    }
}

document.addEventListener('DOMContentLoaded', initChangelogModule);