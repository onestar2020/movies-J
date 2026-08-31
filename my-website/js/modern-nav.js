/* ============================================================
   MOVIES-J INTERACTIVE FEATURES (Surprise Me, Streak, App Badge)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initStreakCounter();
    injectNavButtons();
    enhanceProfileDropdown();
});

// 1. Watch Streak System (Local Storage Based)
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

// 2. Paglagay ng "🎲 Surprise Me" at "📱 Get App" Buttons sa Top Bar
function injectNavButtons() {
    const navRight = document.querySelector(".header-right, .nav-right, header .right-items, .nav-actions");
    
    // Hanapin ang tamang lagayan bago ang search/profile
    const targetContainer = navRight || document.querySelector("header, nav");

    if (targetContainer && !document.getElementById("surprise-me-btn")) {
        const actionsWrapper = document.createElement("div");
        actionsWrapper.style = "display: inline-flex; align-items: center; gap: 8px; margin-right: 12px;";

        // Surprise Me Button
        const surpriseBtn = document.createElement("button");
        surpriseBtn.id = "surprise-me-btn";
        surpriseBtn.className = "surprise-btn";
        surpriseBtn.innerHTML = "🎲 Surprise Me";
        surpriseBtn.title = "Watch a random trending movie!";
        surpriseBtn.onclick = triggerSurpriseMovie;

        // APK Download Pill
        const apkPill = document.createElement("a");
        apkPill.className = "apk-download-pill";
        apkPill.href = "https://github.com/onestar2020/Movies-J-App/releases/latest/download/Movies-J.apk";
        apkPill.innerHTML = "📱 Get App";
        apkPill.target = "_blank";

        actionsWrapper.appendChild(surpriseBtn);
        actionsWrapper.appendChild(apkPill);

        // Ilagay sa unahan ng profile/search icons
        targetContainer.insertBefore(actionsWrapper, targetContainer.firstChild);
    }
}

// 3. Random Movie Picker Logic
function triggerSurpriseMovie() {
    // Kunin ang lahat ng available movie links sa page
    const movieCards = document.querySelectorAll("a[href*='movie.html?id='], a[href*='movie.html']");
    if (movieCards.length > 0) {
        const randomCard = movieCards[Math.floor(Math.random() * movieCards.length)];
        const targetUrl = randomCard.getAttribute("href");
        
        // Visual effect bago mag-redirect
        const btn = document.getElementById("surprise-me-btn");
        if(btn) btn.innerHTML = "✨ Picking...";
        
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 600);
    } else {
        // Fallback default kung nasa ibang page
        window.location.href = "browse.html";
    }
}

// 4. Pagpapaganda ng Profile Dropdown gamit ang Avatar at Stats
function enhanceProfileDropdown() {
    const checkDropdown = setInterval(() => {
        const dropdown = document.querySelector(".dropdown-menu, .profile-dropdown, [class*='dropdown']");
        const streak = localStorage.getItem("moviesj_streak") || "1";
        const watchHistory = JSON.parse(localStorage.getItem("moviesj_watch_history") || "[]");

        if (dropdown && !dropdown.classList.contains("enhanced-done")) {
            dropdown.classList.add("enhanced-done");
            dropdown.classList.add("modern-profile-card");

            // Kumuha ng user name kung mayroon, or default
            const userEmailElem = dropdown.querySelector("p, span, .user-email");
            const userName = userEmailElem ? userEmailElem.innerText.split("@")[0] : "Movies-J Streamer";

            const customHeader = document.createElement("div");
            customHeader.className = "profile-card-header";
            customHeader.innerHTML = `
                <div class="profile-avatar-wrapper">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${userName}" class="profile-avatar-img" alt="Avatar"/>
                    <span class="profile-streak-badge">🔥 ${streak}d</span>
                </div>
                <div class="profile-user-info">
                    <span class="user-name">${userName}</span>
                    <span class="user-role">Free VIP Member</span>
                </div>
            `;

            const statsBox = document.createElement("div");
            statsBox.className = "profile-stats-grid";
            statsBox.innerHTML = `
                <div class="stat-box">
                    <span class="stat-val">${watchHistory.length}</span>
                    <span class="stat-lbl">Watched</span>
                </div>
                <div class="stat-box">
                    <span class="stat-val">🔥 ${streak} Days</span>
                    <span class="stat-lbl">Daily Streak</span>
                </div>
            `;

            dropdown.insertBefore(statsBox, dropdown.firstChild);
            dropdown.insertBefore(customHeader, dropdown.firstChild);

            clearInterval(checkDropdown);
        }
    }, 800);
}