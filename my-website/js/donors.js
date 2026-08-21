// ✅ js/donors.js - VERIFIED SUPPORTERS & NAVBAR HIGHLIGHTS

const DONORS_LIST = [
    {
        name: "Aljhon",
        amount: "₱50",
        amountVal: 50,
        date: "Aug 21, 2026",
        message: "Pang-kape at server support!"
    },
    {
        name: "Mark D.",
        amount: "₱200",
        amountVal: 200,
        date: "Aug 20, 2026",
        message: "Solid ng Movies-J! Keep it up idol Jay."
    }
];

function renderDonorsAndHighlights() {
    // 1. Render sa Loob ng Modal
    const wallContainer = document.getElementById('donors-wall-container');
    if (wallContainer) {
        if (!DONORS_LIST || DONORS_LIST.length === 0) {
            wallContainer.innerHTML = `<p style="color:#777; font-size:0.85rem; text-align:center; padding:10px;">Be the first verified supporter!</p>`;
        } else {
            wallContainer.innerHTML = DONORS_LIST.map(d => `
                <div class="donor-item-card">
                    <div class="donor-item-header">
                        <span class="donor-name"><i class="fas fa-heart" style="color:#e50914; font-size:11px; margin-right:4px;"></i>${d.name}</span>
                        <span class="donor-amount">${d.amount}</span>
                    </div>
                    <p class="donor-message">"${d.message}"</p>
                    <span class="donor-date">${d.date}</span>
                </div>
            `).join('');
        }
    }

    // 2. Render sa Navbar Highlights (Top & Latest Donor)
    const highlightContainer = document.getElementById('donor-nav-highlights');
    if (highlightContainer && DONORS_LIST && DONORS_LIST.length > 0) {
        // Awtomatikong kinukuha ang may pinakamataas na amount
        const topDonor = [...DONORS_LIST].sort((a, b) => b.amountVal - a.amountVal)[0];
        // Awtomatikong kinukuha ang pinakaunang item sa array bilang latest
        const latestDonor = DONORS_LIST[0];

        highlightContainer.innerHTML = `
            <div class="nav-donor-tag top-donor" onclick="document.getElementById('supportBtn').click()" title="Top Supporter: ${topDonor.name} (${topDonor.amount})">
                <i class="fas fa-crown"></i> <span>Top: <strong>${topDonor.name}</strong> (${topDonor.amount})</span>
            </div>
            <div class="nav-donor-tag latest-donor" onclick="document.getElementById('supportBtn').click()" title="Latest Supporter: ${latestDonor.name} (${latestDonor.amount})">
                <i class="fas fa-sparkles"></i> <span>Latest: <strong>${latestDonor.name}</strong> (${latestDonor.amount})</span>
            </div>
        `;
    }
}

// Function para kopyahin ang Gmail at magpakita ng dark toast
function copyDonationEmail() {
    const email = "jayjovendinawanao29@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
        const btn = document.getElementById('copyProofEmailBtn');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-check"></i> Email Copied: ${email}`;
            btn.style.background = "#4CAF50";
            setTimeout(() => {
                btn.innerHTML = `<i class="fas fa-copy"></i> Copy Proof Email (${email})`;
                btn.style.background = "#e50914";
            }, 3000);
        }
    }).catch(err => {
        prompt("Copy this email to send your proof:", email);
    });
}

document.addEventListener('DOMContentLoaded', renderDonorsAndHighlights);