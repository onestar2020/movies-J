// ✅ js/donors.js - REALTIME FIREBASE SYNC

const FIREBASE_DB_URL = "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app";

async function fetchAndRenderDonors() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}/donors.json`);
        const data = await response.json();
        
        let donorsList = [];
        if (data) {
            donorsList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Pinakabago sa unahan
        }

        renderDonorsUI(donorsList);
    } catch (err) {
        console.warn("Could not fetch donors from Firebase:", err);
    }
}

function renderDonorsUI(list) {
    // 1. Render sa Loob ng Donations Modal
    const wallContainer = document.getElementById('donors-wall-container');
    if (wallContainer) {
        if (!list || list.length === 0) {
            wallContainer.innerHTML = `<p style="color:#777; font-size:0.85rem; text-align:center; padding:10px;">Be the first verified supporter!</p>`;
        } else {
            wallContainer.innerHTML = list.map(d => `
                <div class="donor-item-card">
                    <div class="donor-item-header">
                        <span class="donor-name"><i class="fas fa-heart" style="color:#e50914; font-size:11px; margin-right:4px;"></i>${d.name}</span>
                        <span class="donor-amount">₱${d.amountVal}</span>
                    </div>
                    <p class="donor-message">"${d.message}"</p>
                    <span class="donor-date">${d.date}</span>
                </div>
            `).join('');
        }
    }

    // 2. Render sa Navbar Badges (Top Donor & Latest Donor)
    const highlightContainer = document.getElementById('donor-nav-highlights');
    if (highlightContainer && list && list.length > 0) {
        // Pinakamalaking donasyon
        const topDonor = [...list].sort((a, b) => Number(b.amountVal) - Number(a.amountVal))[0];
        // Pinakabagong donasyon (Index 0)
        const latestDonor = list[0];

        highlightContainer.innerHTML = `
            <div class="nav-donor-tag top-donor" onclick="document.getElementById('supportBtn').click()" title="Top Supporter: ${topDonor.name} (₱${topDonor.amountVal})">
                <i class="fas fa-crown"></i> <span>Top: <strong>${topDonor.name}</strong> (₱${topDonor.amountVal})</span>
            </div>
            <div class="nav-donor-tag latest-donor" onclick="document.getElementById('supportBtn').click()" title="Latest Supporter: ${latestDonor.name} (₱${latestDonor.amountVal})">
                <i class="fas fa-sparkles"></i> <span>Latest: <strong>${latestDonor.name}</strong> (₱${latestDonor.amountVal})</span>
            </div>
        `;
    }
}

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
    }).catch(() => {
        prompt("Copy this email to send your proof:", email);
    });
}

document.addEventListener('DOMContentLoaded', fetchAndRenderDonors);