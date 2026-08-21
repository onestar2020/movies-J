// ✅ js/donors.js - VERIFIED SUPPORTERS LIST

const DONORS_LIST = [
    {
        name: "Mark D.",
        amount: "₱200",
        date: "Aug 2026",
        message: "Solid ng Movies-J! Keep it up idol Jay."
    },
    {
        name: "Anonymous",
        amount: "₱100",
        date: "Aug 2026",
        message: "Pang-kape at server support!"
    }
];

function renderDonorsList() {
    const container = document.getElementById('donors-wall-container');
    if (!container) return;

    if (!DONORS_LIST || DONORS_LIST.length === 0) {
        container.innerHTML = `<p style="color:#777; font-size:0.85rem; text-align:center; padding:10px;">Be the first verified supporter!</p>`;
        return;
    }

    container.innerHTML = DONORS_LIST.map(d => `
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

document.addEventListener('DOMContentLoaded', renderDonorsList);