// ✅ js/changelog.js (STANDALONE CHANGELOG MODULE)

const SITE_CHANGELOGS = [
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
    // 1. Gumawa ng Modal DOM kung wala pa
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

        // Close events
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });

        document.getElementById('changelog-close-btn').onclick = () => {
            overlay.classList.remove('show');
        };
    }

    // 2. I-bind sa lahat ng button na may class/id
    const btn = document.getElementById('changelog-btn');
    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            overlay.classList.add('show');
        };
    }
}

document.addEventListener('DOMContentLoaded', initChangelogModule);