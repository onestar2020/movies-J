// ✅ js/changelog.js (STATIC + DYNAMIC FIREBASE CHANGELOG MERGE)

const FIREBASE_DB_URL = "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app";

// Mga lumang logs na naka-hardcode para laging nandiyan
const SITE_CHANGELOGS = [
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
    },
    {
        version: "v2.5",
        date: "August 21, 2026",
        title: "Quality Transparency, Ad-Block Tip & UI Polish",
        changes: [
            "Smart Quality Detector: May live indicators na ang mga server buttons at metadata kung (HD) o (CAM / SD) pa ang copy.",
            "Video Quality Notice Modal: Nagbibigay ng paalala kapag kakalabas pa lang ng movie sa sinehan para iwas kalituhan sa video quality.",
            "Cast Scroller Optimization: Inayos ang smooth horizontal wheel/drag scrolling at tinanggal ang mga placeholder cards na walang picture.",
            "Floating Brave Browser Tip: Dagdag na dismissable recommendation banner para sa mas malinis at ad-free streaming experience."
        ]
    },
    {
        version: "v2.4",
        date: "August 20, 2026",
        title: "Unreleased Media Protection & Watch Order",
        changes: [
            "Smart Release Countdown: May live indicators na ang mga unreleased anime, TV episodes, at movies.",
            "Anti-Fake Stream Blocker: Pinipigilan ang 404 player errors sa mga hindi pa nailalabas na media.",
            "Chronological Franchise Order: Nakaayos na ang MCU at movie collections ayon sa tamang sequence (#1, #2...).",
            "Trademark Trailer Mode: Laging opisyal na trailer ang unang maglo-load bago pumili ng server."
        ]
    },
    {
        version: "v2.3",
        date: "August 2026",
        title: "System Performance & Live Users",
        changes: [
            "Mabilis na server switching at dynamic proxy integration.",
            "Real-time online visitor counter.",
            "Auto-scroll optimization sa mobile devices."
        ]
    }
];

async function initChangelogModule() {
    let allLogs = [...SITE_CHANGELOGS];
    let latestVersion = SITE_CHANGELOGS[0].version;

    try {
        const res = await fetch(`${FIREBASE_DB_URL}/changelogs.json`);
        const data = await res.json();
        
        if (data) {
            const firebaseLogs = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Pagsamahin ang Firebase logs at static logs, tapos i-sort ayon sa bago
            allLogs = [...firebaseLogs, ...SITE_CHANGELOGS].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            if (allLogs.length > 0) {
                latestVersion = allLogs[0].version;
            }
        }
    } catch (err) {
        console.warn("Could not fetch changelogs from Firebase:", err);
    }

    // 1. Setup ng Modal Container
    let overlay = document.getElementById('changelog-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'changelog-modal-overlay';
        overlay.className = 'changelog-overlay';

        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });
    }

    const logsHtml = allLogs.map(log => `
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

    const closeBtn = document.getElementById('changelog-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            overlay.classList.remove('show');
        };
    }

    // 2. Notification Dot Checker
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