/* ============================================================
   MOVIES-J USER PROFILE & ENGAGEMENT MODULE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initStreakCounter();
    enhanceProfileDropdown();
});

// 1. Watch Streak Counter (Araw-araw na login)
function initStreakCounter() {
    const today = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem("moviesj_last_visit");
    let streak = parseInt(localStorage.getItem("moviesj_streak") || "1");

    if (lastVisit) {
        const lastDate = new Date(lastVisit);
        const currentDate = new Date(today);
        const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak += 1;
            localStorage.setItem("moviesj_streak", streak.toString());
        } else if (diffDays > 1) {
            streak = 1;
            localStorage.setItem("moviesj_streak", "1");
        }
    } else {
        localStorage.setItem("moviesj_streak", "1");
    }
    localStorage.setItem("moviesj_last_visit", today);
}

// 2. Random Movie Picker Logic (100% Working)
window.triggerSurpriseMovie = function() {
    // Listahan ng trending movie & series IDs para siguradong maglo-load agad
    const popularPicks = [
        { id: 1022789, type: 'movie' }, // Inside Out 2
        { id: 533535, type: 'movie' },  // Deadpool & Wolverine
        { id: 573435, type: 'movie' },  // Bad Boys 4
        { id: 693134, type: 'movie' },  // Dune Part Two
        { id: 945961, type: 'movie' },  // Alien Romulus
        { id: 823464, type: 'movie' },  // Godzilla x Kong
        { id: 939243, type: 'tv' },     // Sonic Prime
        { id: 94605, type: 'tv' },      // Arcane
        { id: 1429, type: 'tv' },       // Attack on Titan
        { id: 85937, type: 'tv' }       // Demon Slayer
    ];

    // Kunin ang mga pelikulang naka-display ngayon sa page
    const onPageCards = document.querySelectorAll("a[href*='movie.html?id=']");
    let targetUrl = "";

    if (onPageCards.length > 0) {
        const randomCard = onPageCards[Math.floor(Math.random() * onPageCards.length)];
        targetUrl = randomCard.getAttribute("href");
    } else {
        const pick = popularPicks[Math.floor(Math.random() * popularPicks.length)];
        targetUrl = `movie.html?id=${pick.id}&type=${pick.type}`;
    }

    const btn = document.getElementById("dropdown-surprise-btn");
    if (btn) btn.innerHTML = "<span>🎲 Naghahanap ng movie...</span>";

    setTimeout(() => {
        window.location.href = targetUrl;
    }, 400);
};

// 3. Paglagay ng Avatar, Stats, at Surprise Me sa LOOB ng Dropdown
function enhanceProfileDropdown() {
    const checkDropdown = setInterval(() => {
        const dropdown = document.querySelector(".dropdown-menu, .profile-dropdown, [class*='dropdown']");
        const streak = localStorage.getItem("moviesj_streak") || "1";
        const watchHistory = JSON.parse(localStorage.getItem("movies_j_watch_history") || "[]");

        if (dropdown && !dropdown.classList.contains("enhanced-done")) {
            dropdown.classList.add("enhanced-done");
            dropdown.classList.add("modern-profile-card");

            // Kumuha ng user name
            const userEmailElem = dropdown.querySelector("p, span, .user-email");
            const rawName = userEmailElem ? userEmailElem.innerText.split("@")[0] : "JayJoven";
            const userName = rawName.toUpperCase();

            // Header na may Anime/Bot Avatar & Online Streak
            const customHeader = document.createElement("div");
            customHeader.className = "profile-card-header";
            customHeader.innerHTML = `
                <div class="profile-avatar-wrapper">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${userName}" class="profile-avatar-img" alt="Avatar"/>
                    <span class="profile-streak-badge">🔥 ${streak}d</span>
                </div>
                <div class="profile-user-info">
                    <span class="user-name">${userName}</span>
                    <span class="user-role">VIP Streamer</span>
                </div>
            `;

            // Stats Dashboard
            const statsBox = document.createElement("div");
            statsBox.className = "profile-stats-grid";
            statsBox.innerHTML = `
                <div class="stat-box">
                    <span class="stat-val">${watchHistory.length}</span>
                    <span class="stat-lbl">Watched</span>
                </div>
                <div class="stat-box">
                    <span class="stat-val">🔥 ${streak} Days</span>
                    <span class="stat-lbl">Streak</span>
                </div>
            `;

            // Surprise Me Button (Nasa loob ng dropdown)
            const surpriseRow = document.createElement("div");
            surpriseRow.id = "dropdown-surprise-btn";
            surpriseRow.className = "dropdown-surprise-item";
            surpriseRow.innerHTML = `<span>🎲 Surprise Me (Random Play)</span>`;
            surpriseRow.onclick = (e) => {
                e.stopPropagation();
                window.triggerSurpriseMovie();
            };

            // Ilatag sa loob ng dropdown
            dropdown.insertBefore(surpriseRow, dropdown.firstChild);
            dropdown.insertBefore(statsBox, dropdown.firstChild);
            dropdown.insertBefore(customHeader, dropdown.firstChild);

            clearInterval(checkDropdown);
        }
    }, 600);
}