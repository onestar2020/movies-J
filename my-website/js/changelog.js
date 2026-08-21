// ✅ js/changelog.js (AUTO NOTIFICATION BADGE + LOCALSTORAGE TRACKER)

const CURRENT_APP_VERSION = "v2.5"; // ⬅️ Na-update na sa v2.5 para lumitaw ang red dot sa users

const SITE_CHANGELOGS = [
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

function initChangelogModule() {
    // 1. Setup ng Modal Container
    let overlay = document.getElementById('changelog-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'changelog-modal-overlay';
        overlay.className = 'changelog-overlay';

        const logsHtml = SITE_CHANGELOGS.map(log => `
            <div class="changelog-item">
                <div class="changelog-date">
                    <span class="changelog-version">${log.version}</span>
                    <span>${log.date}</span>
                </div>
                <h4>${log.title}</h4>
                <ul>
                    ${log.changes.map(c => `<li>${c}</li>`).join('')}
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
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });

        document.getElementById('changelog-close-btn').onclick = () => {
            overlay.classList.remove('show');
        };
    }

    // 2. Notification Dot Checker
    const btn = document.getElementById('changelog-btn');
    const lastSeenVersion = localStorage.getItem('movies_j_last_version');

    if (btn) {
        // Lagyan ng red dot kung bago ang version o hindi pa nabubuksan
        if (lastSeenVersion !== CURRENT_APP_VERSION) {
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

            // Tanggalin ang dot at i-save sa browser
            localStorage.setItem('movies_j_last_version', CURRENT_APP_VERSION);
            const dot = document.getElementById('changelog-unread-dot');
            if (dot) dot.remove();
        };
    }
}

document.addEventListener('DOMContentLoaded', initChangelogModule);