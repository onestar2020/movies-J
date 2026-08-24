// ✅ js/changelog.js (INSTANT-CLICK FIX + DYNAMIC REALTIME DATABASE SYNC)

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
                    ${renderLogsHtml(FALLBACK_CHANGELOGS)}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });

        document.getElementById('changelog-close-btn').onclick = () => {
            overlay.classList.remove('show');
        };
    }
    return overlay;
}

async function initChangelogModule() {
    const overlay = ensureModalCreated();

    // Hanapin ang bell button gamit ang id o class
    const btn = document.getElementById('changelog-btn') || 
                document.querySelector('.changelog-btn') || 
                document.querySelector('[data-target="changelog"]') ||
                document.querySelector('button .fa-bell')?.closest('button') ||
                document.querySelector('a .fa-bell')?.closest('a');

    let currentVersion = "v2.6";

    // 1. I-attach agad ang Click Listener para hindi ma-lock/unclickable
    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            overlay.classList.add('show');

            // Tanggalin ang dot kapag nabuksan na
            localStorage.setItem('movies_j_last_version', currentVersion);
            const dot = document.getElementById('changelog-unread-dot');
            if (dot) dot.remove();
        };
    }

    // 2. Fetch Live Updates mula sa Firebase sa background
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/changelogs.json`);
        const data = await res.json();
        
        if (data) {
            const sorted = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            if (sorted.length > 0) {
                currentVersion = sorted[0].version || "v2.6";
                const bodyContainer = document.getElementById('changelog-body-content');
                if (bodyContainer) {
                    bodyContainer.innerHTML = renderLogsHtml(sorted);
                }
            }
        }
    } catch (err) {
        console.warn("Using fallback changelogs:", err);
    }

    // 3. Notification Dot Logic base sa nakuha sa DB
    const lastSeenVersion = localStorage.getItem('movies_j_last_version');
    if (btn && lastSeenVersion !== currentVersion) {
        btn.style.position = 'relative';
        if (!document.getElementById('changelog-unread-dot')) {
            const dot = document.createElement('span');
            dot.id = 'changelog-unread-dot';
            dot.style.cssText = "position:absolute; top:2px; right:2px; width:8px; height:8px; background:#e50914; border-radius:50%; border:1px solid #000;";
            btn.appendChild(dot);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChangelogModule);
} else {
    initChangelogModule();
}