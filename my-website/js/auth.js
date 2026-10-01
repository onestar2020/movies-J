// js/auth.js
import { auth, provider, db } from "./firebase-config.js";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Admin identity (runtime-decoded, para walang plaintext sa shipped source)
const _ak = ['M', 'j', 'P', 'r', '0', 't', '3', 'c', 't', '2', '0', '2', '6', '!'];
const _adec = function (s) {
  var b64 = s.split('~').join('').split('').reverse().join('');
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  var x = atob(b64);
  var out = '';
  for (var i = 0; i < x.length; i++) {
    out += String.fromCharCode(x.charCodeAt(i) ^ _ak[i % _ak.length].charCodeAt(0));
  }
  return out;
};
const DEDICATED_ADMIN_EMAIL = _adec('QPF4yDatVUfNxI~DYEAA9zCjAUQT5~1WQ0gVC8FGpswJ');
// Pangalawang admin account (runtime-decoded din)
const ADMIN_EMAIL_2 = _adec('=AiTVxBXbVhDUR~TCA9zCjAUQT51W~Q0gVC8FGpswJ');
const ADMIN_EMAILS = [DEDICATED_ADMIN_EMAIL, ADMIN_EMAIL_2];
function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.indexOf(email) !== -1;
}

// ================= PROFILE CUSTOMIZATION (libre para sa LAHAT) =================
const RANK_TIERS = {
  free: { label: "Member", badgeClass: "role-free", icon: "" },
  vip: { label: "SUPPORTER", badgeClass: "role-vip", icon: "fa-star" },
  "top-donor": { label: "TOP SUPPORTER", badgeClass: "role-top-donor", icon: "fa-crown" },
  legendary: { label: "LEGENDARY", badgeClass: "role-legendary", icon: "fa-gem" }
};

const AVATAR_BORDERS = [
  { id: "none", label: "⚪ Default / Clean", class: "" },
  { id: "emerald", label: "💚 Emerald Glow", class: "avatar-border-vip" },
  { id: "cyber", label: "💙 Cyberpunk Neon", class: "avatar-border-cyber" },
  { id: "fire", label: "❤️ Crimson Ember", class: "avatar-border-fire" },
  { id: "gold", label: "💛 Royal Gold", class: "avatar-border-gold" },
  { id: "amethyst", label: "💜 Royal Amethyst", class: "avatar-border-amethyst" },
  { id: "rainbow", label: "🌈 Cosmic RGB Pulse", class: "avatar-border-rainbow" }
];

const NAME_GLOWS = [
  { id: "none", label: "⚪ Default White", class: "" },
  { id: "emerald", label: "💚 Emerald Glow", class: "name-glow-emerald" },
  { id: "blue", label: "💙 Cyan Plasma", class: "name-glow-blue" },
  { id: "red", label: "❤️ Fire Crimson", class: "name-glow-red" },
  { id: "gold", label: "✨ Shiny Gold", class: "name-glow-gold" },
  { id: "purple", label: "🔮 Mystic Purple", class: "name-glow-purple" },
  { id: "rgb", label: "🌈 Rainbow Aurora", class: "name-glow-rgb" }
];

const NAME_GRADIENTS = [
  { id: "none", label: "⚪ Solid Color", class: "" },
  { id: "sunset", label: "🌅 Sunset Blaze", class: "name-gradient-sunset" },
  { id: "ocean", label: "🌊 Ocean Depth", class: "name-gradient-ocean" },
  { id: "candy", label: "🍬 Candy Pop", class: "name-gradient-candy" },
  { id: "matrix", label: "🟢 Matrix Green", class: "name-gradient-matrix" },
  { id: "royal", label: "👑 Royal Gold", class: "name-gradient-royal" }
];

const CARD_THEMES = [
  { id: "none", label: "⚫ Classic Dark", class: "" },
  { id: "crimson", label: "🔴 Movies-J Red", class: "card-theme-crimson" },
  { id: "ocean", label: "🔵 Deep Ocean", class: "card-theme-ocean" },
  { id: "forest", label: "💚 Emerald Forest", class: "card-theme-forest" },
  { id: "royal", label: "💜 Royal Purple", class: "card-theme-royal" },
  { id: "sunset", label: "🌅 Sunset Gold", class: "card-theme-sunset" }
];

function findCosmetic(list, id) {
  return (list.find(x => x.id === id) || {}).class || "";
}

// ================= RANDOM SURPRISE ME ROULETTE LOGIC =================
window.triggerDropdownSurprise = function(e) {
  if (e) e.stopPropagation();

  const popularPicks = [
    { id: 1022789, type: 'movie' },
    { id: 533535, type: 'movie' },
    { id: 573435, type: 'movie' },
    { id: 693134, type: 'movie' },
    { id: 945961, type: 'movie' },
    { id: 823464, type: 'movie' },
    { id: 939243, type: 'tv' },
    { id: 94605, type: 'tv' },
    { id: 1429, type: 'tv' },
    { id: 85937, type: 'tv' }
  ];

  const onPageCards = document.querySelectorAll("a[href*='movie.html?id=']");
  let targetUrl = "";

  if (onPageCards.length > 0) {
    const randomCard = onPageCards[Math.floor(Math.random() * onPageCards.length)];
    targetUrl = randomCard.getAttribute("href");
  } else {
    const pick = popularPicks[Math.floor(Math.random() * popularPicks.length)];
    targetUrl = `movie.html?id=${pick.id}&type=${pick.type}`;
  }

  const surpriseBtn = document.getElementById("dropdown-surprise-btn");
  if (surpriseBtn) {
    surpriseBtn.innerHTML = "<span>🎲 Naghahanap ng movie...</span>";
  }

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 400);
};

// ================= FLOATING TOAST =================
function showAuthToast(message, type = "error") {
  let toast = document.getElementById("auth-toast-msg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "auth-toast-msg";
    toast.style.cssText = `
      position: fixed;
      top: 25px;
      left: 50%;
      transform: translateX(-50%) translateY(-25px);
      padding: 12px 22px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      z-index: 99999999;
      box-shadow: 0 16px 36px rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      pointer-events: none;
      backdrop-filter: blur(14px);
      font-family: inherit;
    `;
    document.body.appendChild(toast);
  }

  const isSuccess = type === "success";
  toast.style.background = isSuccess ? "rgba(22, 54, 25, 0.92)" : "rgba(50, 15, 15, 0.92)";
  toast.style.border = `1px solid ${isSuccess ? "rgba(76, 175, 80, 0.6)" : "rgba(229, 9, 20, 0.6)"}`;
  toast.innerHTML = `
    <i class="fas ${isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation'}" style="color:${isSuccess ? '#4caf50' : '#e50914'}; font-size:16px;"></i>
    <span>${message}</span>
  `;

  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-20px)";
  }, 4000);
}

function getCleanErrorMessage(errCode) {
  switch (errCode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment.";
    case "auth/popup-closed-by-user":
      return "Google Sign-In was cancelled.";
    default:
      return "Authentication error. Please check your details.";
  }
}

// 1. Google Login
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    let snap = null;
    try {
      snap = await getDoc(userRef);
    } catch (permErr) {
      console.warn("Ban-check read blocked (Firestore rules):", permErr && permErr.code);
    }

    if (snap && snap.exists() && snap.data().isBanned === true) {
      await signOut(auth);
      showAuthToast("Your account has been banned by the administrator.", "error");
      return;
    }

    await syncUserToFirestore(user);
    closeAuthModal();
    showAuthToast(`Welcome, ${user.displayName || "User"}!`, "success");
  } catch (error) {
    console.error("Google Auth Error:", error);
    showAuthToast(getCleanErrorMessage(error.code), "error");
  }
}

// 2. Email/Password Register
export async function registerWithEmail(email, password, username) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });
    await syncUserToFirestore(result.user);
    await sendEmailVerification(result.user);
    await signOut(auth);
    showAuthToast(`Verification link sent! Please check your Inbox.`, "success");
    switchAuthMode("login");
  } catch (error) {
    console.error("Register Error:", error);
    showAuthToast(getCleanErrorMessage(error.code), "error");
  }
}

// 3. Email/Password Login
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!result.user.emailVerified) {
      await signOut(auth);
      showAuthToast("Please verify your email first! Check your inbox.", "error");
      return;
    }

    const userRef = doc(db, "users", result.user.uid);
    let snap = null;
    try {
      snap = await getDoc(userRef);
    } catch (permErr) {
      console.warn("Ban-check read blocked (Firestore rules):", permErr && permErr.code);
    }

    if (snap && snap.exists() && snap.data().isBanned === true) {
      await signOut(auth);
      showAuthToast("Your account has been banned by the administrator.", "error");
      return;
    }

    await syncUserToFirestore(result.user);
    closeAuthModal();
    showAuthToast(`Welcome back, ${result.user.displayName || "User"}!`, "success");
  } catch (error) {
    console.error("Login Error:", error);
    showAuthToast(getCleanErrorMessage(error.code), "error");
  }
}

// 4. Forgot Password
export async function forgotPassword(email) {
  if (!email) return showAuthToast("Please enter your email address first.", "error");
  try {
    await sendPasswordResetEmail(auth, email);
    showAuthToast(`Password reset link sent to ${email}!`, "success");
    switchAuthMode("login");
  } catch (error) {
    console.error("Password Reset Error:", error);
    showAuthToast(getCleanErrorMessage(error.code), "error");
  }
}

// 5. User Logout
export async function logoutUser() {
  try {
    stopPresenceHeartbeat(); // offline agad sa admin dashboard
    await signOut(auth);
    showAuthToast("Logged out successfully.", "success");
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

async function syncUserToFirestore(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "User",
        email: user.email,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isBanned: false,
        role: "free",
        avatarBorder: "none",
        nameGlow: "none"
      });
    } else {
      await setDoc(userRef, {
        displayName: user.displayName || snap.data().displayName || "User",
        photoURL: snap.data().photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore sync warning:", err);
  }
}

/* ------------------------------------------------------------------
   REAL-TIME PRESENCE HEARTBEAT (RTDB)
   Nagpapadala ng "buhay pa ako" signal kada 60s habang naka-login
   ang user. Binabasa ito ng admin dashboard para sa green (online) /
   red (offline) dot. Auto-stop sa logout; auto-pause kapag hidden ang
   tab (visibilitychange) para tipid sa reads.
   ------------------------------------------------------------------ */
let _presenceTimer = null;
let _presenceUid = null;
const PRESENCE_RTDB = 'https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app';

function _presenceBeat() {
  if (!_presenceUid || document.hidden) return; // tipid kapag hidden ang tab
  try {
    fetch(PRESENCE_RTDB + '/presence/' + _presenceUid + '.json', {
      method: 'PUT',
      body: JSON.stringify(Date.now())
    }).catch(function () {});
  } catch (e) { /* ignore */ }
}
let _visibilityWired = false;

function startPresenceHeartbeat(uid) {
  if (_presenceUid === uid && _presenceTimer) return; // same user, tumatakbo na — iwas race condition
  stopPresenceHeartbeat();
  _presenceUid = uid;
  _presenceBeat(); // agad na unang beat
  _presenceTimer = setInterval(_presenceBeat, 60000);
  if (!_visibilityWired) { // isang listener lang sa buong app lifetime
    _visibilityWired = true;
    document.addEventListener('visibilitychange', _presenceBeat);
  }
}

function stopPresenceHeartbeat() {
  if (_presenceTimer) { clearInterval(_presenceTimer); _presenceTimer = null; }
  if (_presenceUid) {
    const uid = _presenceUid;
    _presenceUid = null;
    try {
      fetch(PRESENCE_RTDB + '/presence/' + uid + '.json', {
        method: 'PUT',
        body: 'null' // clear sa RTDB = offline agad
      }).catch(function () {});
  } catch (e) { /* ignore */ }
  }
}

function compressAvatar(file, size = 180, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Observer + Realtime Profile Rendering
export function initAuthObserver(onUserLoggedIn, onGuestMode) {
  // Single-boot guard: pigilan ang doble/multiple observer registration
  // (app.js dynamic import + module self-boot + manual calls)
  if (window.__mjAuthObserverStarted) return;
  window.__mjAuthObserverStarted = true;

  setupAuthModalHTML();

  onAuthStateChanged(auth, async (user) => {
    try {
    const authContainer = document.getElementById("auth-nav-container");

    if (user && (user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'))) {
      const userRef = doc(db, "users", user.uid);
      let userDoc = null;
      try {
        userDoc = await getDoc(userRef);
      } catch (permErr) {
        console.warn("User profile fetch blocked (Firestore rules):", permErr && permErr.code);
      }

      if (userDoc && !userDoc.exists()) {
        try {
          await syncUserToFirestore(user);
          userDoc = await getDoc(userRef);
        } catch (syncErr) {
          console.warn("Profile sync skipped (Firestore rules):", syncErr && syncErr.code);
        }
      }

      if (userDoc && userDoc.exists() && userDoc.data().isBanned === true && !isAdminEmail(user.email)) {
        await signOut(auth);
        showAuthToast("Your account has been banned by the administrator.", "error");
        return;
      }

      // Real-time presence: SA LAHAT ng login paths (fresh login + session restore)
      startPresenceHeartbeat(user.uid);

      let userData = (userDoc && userDoc.exists()) ? userDoc.data() : user;
      const isAdmin = isAdminEmail(user.email);

      // Realtime listener sa sariling user document
      onSnapshot(userRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const liveData = docSnap.data();                    if (liveData.isBanned === true && !isAdminEmail(user.email)) {
          signOut(auth);
          showAuthToast("Your account has been banned by the administrator.", "error");
          return;
        }
        updateUserUIEffects(liveData, isAdmin);
      }, (listenErr) => {
        console.warn("Realtime profile listener blocked (Firestore rules):", listenErr && listenErr.code);
      });

      if (authContainer) {
        const displayName = userData.displayName || "User";
        const currentAvatar = userData.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`;
        const streak = localStorage.getItem("moviesj_streak") || "1";
        const watchHistory = JSON.parse(localStorage.getItem("movies_j_watch_history") || "[]");

        const userRole = isAdmin ? "admin" : (userData.role || "free");
        const activeTier = isAdmin 
          ? { label: "Admin", badgeClass: "role-admin", icon: "fa-shield-alt" } 
          : (RANK_TIERS[userRole] || RANK_TIERS.free);

        let borderClass = findCosmetic(AVATAR_BORDERS, userData.avatarBorder);
        let glowClass = findCosmetic(NAME_GLOWS, userData.nameGlow);
        let gradientClass = findCosmetic(NAME_GRADIENTS, userData.nameGradient);
        let cardThemeClass = findCosmetic(CARD_THEMES, userData.cardTheme);

        const nameStyleClass = gradientClass || glowClass;

        authContainer.innerHTML = `
          <div style="position:relative; display:inline-block; margin-left: 8px;" id="user-profile-dropdown">
            <div id="user-profile-btn" class="nav-profile-pill">
              <img src="${currentAvatar}" class="nav-user-avatar ${borderClass}" alt="Avatar" id="nav-avatar-img" />
              <span class="nav-user-name ${nameStyleClass}" id="nav-user-name-label">${displayName.split(" ")[0]}</span>
              <i class="fas fa-chevron-down nav-dropdown-icon"></i>
            </div>
            
            <div id="user-dropdown-menu" class="dropdown-menu ${cardThemeClass}" style="display:none; position:absolute; top:46px; z-index:99999;">
              <div class="dropdown-header">
                <div class="profile-card-header">
                  <div class="profile-avatar-wrapper">
                    <img src="${currentAvatar}" class="profile-avatar-img ${borderClass}" alt="Avatar" id="dropdown-avatar-preview" />
                    <span class="profile-streak-badge">🔥 ${streak}d</span>
                    <label for="change-avatar-input" class="avatar-edit-overlay" title="Change Profile Picture">
                      <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" id="change-avatar-input" accept="image/*" style="display:none;" />
                  </div>

                  <div class="profile-user-info">
                    <div class="profile-name-row">
                      <span class="user-name ${nameStyleClass}" id="user-display-name-label">${displayName.toUpperCase()}</span>
                      <button id="rename-profile-btn" class="rename-icon-btn" title="Edit Display Name"><i class="fas fa-pen"></i></button>
                    </div>
                    <div id="user-rank-badge-container">
                      <span class="user-role ${activeTier.badgeClass}">
                        ${activeTier.icon ? `<i class="fas ${activeTier.icon}"></i> ` : ''}${activeTier.label}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Modern Transparent Inline Rename Box -->
                <div id="rename-box" class="rename-box" style="display:none;">
                  <input type="text" id="rename-input" value="${displayName}" maxlength="22" placeholder="New Display Name" autocomplete="off" />
                  <button id="save-rename-btn" class="rename-action-btn btn-save" title="Save"><i class="fas fa-check"></i></button>
                  <button id="cancel-rename-btn" class="rename-action-btn btn-cancel" title="Cancel"><i class="fas fa-times"></i></button>
                </div>

                <!-- Profile Customizer (libre para sa LAHAT ng users) -->
                <div class="cosmetics-toolbar">
                  <button id="toggle-cosmetics-btn" class="cosmetics-btn"><i class="fas fa-wand-magic-sparkles"></i> Customize Profile</button>
                  <div id="cosmetics-panel" class="cosmetics-panel">
                    <label>Avatar Ring:</label>
                    <select id="user-border-select">
                      ${AVATAR_BORDERS.map(b => `<option value="${b.id}" ${userData.avatarBorder === b.id ? 'selected' : ''}>${b.label}</option>`).join('')}
                    </select>

                    <label>Name Effect:</label>
                    <select id="user-glow-select">
                      ${NAME_GLOWS.map(g => `<option value="${g.id}" ${userData.nameGlow === g.id ? 'selected' : ''}>${g.label}</option>`).join('')}
                    </select>

                    <label>Name Gradient:</label>
                    <select id="user-gradient-select">
                      ${NAME_GRADIENTS.map(g => `<option value="${g.id}" ${userData.nameGradient === g.id ? 'selected' : ''}>${g.label}</option>`).join('')}
                    </select>

                    <label>Menu Theme:</label>
                    <select id="user-card-theme-select">
                      ${CARD_THEMES.map(t => `<option value="${t.id}" ${userData.cardTheme === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div class="profile-stats-grid">
                  <div class="stat-box">
                    <span class="stat-val">${watchHistory.length}</span>
                    <span class="stat-lbl">Watched</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-val">🔥 ${streak}d</span>
                    <span class="stat-lbl">Daily Streak</span>
                  </div>
                </div>
              </div>

              <!-- 🎲 Surprise Me Button -->
              <div class="dropdown-surprise-item" id="dropdown-surprise-btn" onclick="triggerDropdownSurprise(event)">
                <span>🎲 Surprise Me (Random Play)</span>
              </div>

              <div class="dropdown-actions-list">
                ${isAdmin ? `
                  <a href="admin.html" class="profile-action-btn admin-link">
                    <i class="fas fa-gauge-high"></i> <span>Admin Control Panel</span>
                  </a>
                ` : ''}

                <button id="menu-logout-btn" class="profile-action-btn logout-action-btn">
                  <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        `;

        const profileBtn = document.getElementById("user-profile-btn");
        const dropMenu = document.getElementById("user-dropdown-menu");
        const logoutBtn = document.getElementById("menu-logout-btn");

        profileBtn.onclick = (e) => {
          e.stopPropagation();
          dropMenu.style.display = dropMenu.style.display === "block" ? "none" : "block";
        };

        dropMenu.onclick = (e) => e.stopPropagation();

        document.addEventListener("click", (e) => {
          const profileWrapper = document.getElementById("user-profile-dropdown");
          if (profileWrapper && !profileWrapper.contains(e.target)) {
            if (dropMenu) dropMenu.style.display = "none";
          }
        });

        logoutBtn.onclick = (e) => {
          e.stopPropagation();
          logoutUser();
        };

        // Profile customizer toggle & save (4 options)
        const toggleCosmeticsBtn = document.getElementById("toggle-cosmetics-btn");
        const cosmeticsPanel = document.getElementById("cosmetics-panel");
        const borderSelect = document.getElementById("user-border-select");
        const glowSelect = document.getElementById("user-glow-select");
        const gradientSelect = document.getElementById("user-gradient-select");
        const cardThemeSelect = document.getElementById("user-card-theme-select");

        if (toggleCosmeticsBtn) {
          toggleCosmeticsBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = cosmeticsPanel.classList.toggle("open");
            // Belt and suspenders: i-set din ang inline style para siguradong
            // talo kahit anong CSS specificity o cached stylesheet
            cosmeticsPanel.style.display = isOpen ? "grid" : "none";
          };
        }

        if (borderSelect && glowSelect && gradientSelect && cardThemeSelect) {
          let saveTimer = null;
          const handleEffectSave = async () => {
            const newBorder = borderSelect.value;
            const newGlow = glowSelect.value;
            const newGradient = gradientSelect.value;
            const newCardTheme = cardThemeSelect.value;
            try {
              await setDoc(doc(db, "users", auth.currentUser.uid), {
                avatarBorder: newBorder,
                nameGlow: newGlow,
                nameGradient: newGradient,
                cardTheme: newCardTheme
              }, { merge: true });
              showAuthToast("Customization saved!", "success");
            } catch (err) {
              console.warn("Customization save failed:", err);
              showAuthToast("Could not save customization. Check your connection.", "error");
            }
          };
          const debouncedSave = () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(handleEffectSave, 600);
          };
          borderSelect.onchange = debouncedSave;
          glowSelect.onchange = debouncedSave;
          gradientSelect.onchange = debouncedSave;
          cardThemeSelect.onchange = debouncedSave;
        }

        // Rename Handlers
        const renameBtn = document.getElementById("rename-profile-btn");
        const renameBox = document.getElementById("rename-box");
        const saveRenameBtn = document.getElementById("save-rename-btn");
        const cancelRenameBtn = document.getElementById("cancel-rename-btn");
        const renameInput = document.getElementById("rename-input");

        if (renameBtn) {
          renameBtn.onclick = (e) => {
            e.stopPropagation();
            renameBox.style.display = "flex";
            renameInput.focus();
          };
        }

        if (cancelRenameBtn) {
          cancelRenameBtn.onclick = (e) => {
            e.stopPropagation();
            renameBox.style.display = "none";
          };
        }

        if (renameInput) {
          renameInput.onclick = (e) => e.stopPropagation();
          renameInput.onkeydown = (e) => {
            if (e.key === "Enter") saveRenameBtn.click();
            if (e.key === "Escape") cancelRenameBtn.click();
          };
        }

        if (saveRenameBtn) {
          saveRenameBtn.onclick = async (e) => {
            e.stopPropagation();
            const newName = renameInput.value.trim();
            if (!newName) return showAuthToast("Please enter a valid name.", "error");

            saveRenameBtn.disabled = true;
            try {
              await updateProfile(auth.currentUser, { displayName: newName });
              await setDoc(doc(db, "users", auth.currentUser.uid), { displayName: newName }, { merge: true });

              document.getElementById("user-display-name-label").innerText = newName.toUpperCase();
              document.getElementById("nav-user-name-label").innerText = newName.split(" ")[0];
              renameBox.style.display = "none";
              showAuthToast("Display name updated!", "success");
            } catch (err) {
              console.error("Rename Error:", err);
              showAuthToast("Failed to rename user.", "error");
            } finally {
              saveRenameBtn.disabled = false;
            }
          };
        }

        // Change Avatar Handler
        const avatarInput = document.getElementById("change-avatar-input");
        if (avatarInput) {
          avatarInput.onchange = async (e) => {
            e.stopPropagation();
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 25 * 1024 * 1024) {
              return showAuthToast("Image must be under 25MB.", "error");
            }

            try {
              showAuthToast("Compressing & updating avatar...", "success");
              const base64Img = await compressAvatar(file, 180, 0.82);

              await setDoc(doc(db, "users", auth.currentUser.uid), { photoURL: base64Img }, { merge: true });

              document.getElementById("nav-avatar-img").src = base64Img;
              document.getElementById("dropdown-avatar-preview").src = base64Img;
              showAuthToast("Profile picture updated!", "success");
            } catch (err) {
              console.error("Avatar Upload Error:", err);
              showAuthToast("Failed to upload avatar.", "error");
            }
          };
        }
      }

      if (onUserLoggedIn) onUserLoggedIn(userData);
    } else {
      stopPresenceHeartbeat(); // guest na / logout — offline sa dashboard
      if (authContainer) {
        authContainer.innerHTML = `
          <button id="nav-login-btn" style="background:linear-gradient(135deg,#e50914,#b0060f); color:#fff; border:none; padding:9px 20px; border-radius:24px; font-size:13px; font-weight:700; cursor:pointer; margin-left:10px; white-space:nowrap; display:inline-flex; align-items:center; gap:7px; box-shadow:0 4px 14px rgba(229,9,20,.35); transition:transform .18s ease, box-shadow .18s ease;">
            <i class="fas fa-right-to-bracket"></i> Sign In
          </button>
        `;
        document.getElementById("nav-login-btn").onclick = () => {
          switchAuthMode("login");
          openAuthModal();
        };
      }
      if (onGuestMode) onGuestMode();
    }
    } catch (renderErr) {
      console.error("Auth UI render failed - showing safe fallback:", renderErr);
      renderSafeFallbackUI();
    }
  });
}

// Safety net: kung mag-crash man ang normal render (hal. Firestore rules blocked),
// may makikita pa ring Sign In / profile UI ang user imbes na blangko.
function renderSafeFallbackUI() {
  const authContainer = document.getElementById("auth-nav-container");
  if (!authContainer || authContainer.innerHTML.trim() !== "") return;

  authContainer.innerHTML = `
    <div style="position:relative; display:inline-block; margin-left: 8px;" id="user-profile-dropdown">
      <div id="user-profile-btn" class="nav-profile-pill">
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=MoviesJ" class="nav-user-avatar" alt="Avatar" id="nav-avatar-img" />
        <span class="nav-user-name" id="nav-user-name-label">Account</span>
        <i class="fas fa-chevron-down nav-dropdown-icon"></i>
      </div>
      <div id="user-dropdown-menu" class="dropdown-menu" style="display:none; position:absolute; top:46px; z-index:99999;">
        <div class="dropdown-header" style="padding:14px 15px;">
          <p style="color:#aaa; font-size:12px; margin:0 0 10px;">We couldn't load your full profile right now. Sign in again to restore everything.</p>
          <button id="fallback-signin-btn" style="width:100%; padding:9px; background:linear-gradient(135deg,#e50914,#b0060f); color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px;">
            <i class="fas fa-right-to-bracket"></i> Sign In / Switch Account
          </button>
        </div>
      </div>
    </div>
  `;

  const pill = document.getElementById("user-profile-btn");
  const menu = document.getElementById("user-dropdown-menu");
  if (pill && menu) {
    pill.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    };
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) menu.style.display = "none";
    });
  }

  const signInBtn = document.getElementById("fallback-signin-btn");
  if (signInBtn) {
    signInBtn.onclick = async () => {
      try { await signOut(auth); } catch (e) { /* ignore */ }
      switchAuthMode("login");
      openAuthModal();
    };
  }
}

function updateUserUIEffects(data, isAdmin = false) {
  const navAvatar = document.getElementById("nav-avatar-img");
  const dropAvatar = document.getElementById("dropdown-avatar-preview");
  const navName = document.getElementById("nav-user-name-label");
  const dropName = document.getElementById("user-display-name-label");
  const rankContainer = document.getElementById("user-rank-badge-container");

  const borderClass = findCosmetic(AVATAR_BORDERS, data.avatarBorder);
  const glowClass = findCosmetic(NAME_GLOWS, data.nameGlow);
  const gradientClass = findCosmetic(NAME_GRADIENTS, data.nameGradient);
  const cardThemeClass = findCosmetic(CARD_THEMES, data.cardTheme);
  const nameStyleClass = gradientClass || glowClass;

  const dropMenu = document.getElementById("user-dropdown-menu");

  AVATAR_BORDERS.forEach(b => {
    if (b.class) {
      if (navAvatar) navAvatar.classList.remove(b.class);
      if (dropAvatar) dropAvatar.classList.remove(b.class);
    }
  });

  const allNameStyles = [...NAME_GLOWS, ...NAME_GRADIENTS];
  allNameStyles.forEach(g => {
    if (g.class) {
      if (navName) navName.classList.remove(g.class);
      if (dropName) dropName.classList.remove(g.class);
    }
  });

  CARD_THEMES.forEach(t => {
    if (t.class && dropMenu) dropMenu.classList.remove(t.class);
  });

  if (borderClass) {
    if (navAvatar) navAvatar.classList.add(borderClass);
    if (dropAvatar) dropAvatar.classList.add(borderClass);
  }

  if (nameStyleClass) {
    if (navName) navName.classList.add(nameStyleClass);
    if (dropName) dropName.classList.add(nameStyleClass);
  }

  if (cardThemeClass && dropMenu) dropMenu.classList.add(cardThemeClass);

  const role = isAdmin ? "admin" : (data.role || "free");
  const activeTier = isAdmin 
    ? { label: "Admin", badgeClass: "role-admin", icon: "fa-shield-alt" }
    : (RANK_TIERS[role] || RANK_TIERS.free);

  if (rankContainer) {
    rankContainer.innerHTML = `
      <span class="user-role ${activeTier.badgeClass}">
        ${activeTier.icon ? `<i class="fas ${activeTier.icon}"></i> ` : ''}${activeTier.label}
      </span>
    `;
  }
}

function setupContactAdminModalHTML() {
  if (document.getElementById("contact-admin-modal")) return;

  const modal = document.createElement("div");
  modal.id = "contact-admin-modal";
  modal.className = "modal";
  modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:999999; display:none; align-items:center; justify-content:center; padding:15px;";
  modal.innerHTML = `
    <div style="background:#141414; border:1px solid rgba(255,255,255,0.12); border-radius:16px; max-width:480px; width:100%; padding:22px; position:relative; box-shadow:0 16px 40px rgba(0,0,0,0.9); max-height:90vh; overflow-y:auto;">
      <span id="close-contact-modal" style="position:absolute; right:15px; top:12px; font-size:20px; color:#888; cursor:pointer;">&times;</span>
      
      <div style="display:flex; gap:16px; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
        <button id="tab-btn-send-msg" style="background:transparent; border:none; color:#e50914; font-weight:bold; font-size:13px; cursor:pointer; padding-bottom:4px; border-bottom:2px solid #e50914;">New Inquiry</button>
        <button id="tab-btn-view-replies" style="background:transparent; border:none; color:#888; font-weight:bold; font-size:13px; cursor:pointer; padding-bottom:4px;">My Inquiries & Replies</button>
      </div>

      <div id="contact-view-send">
        <div style="margin-bottom:10px;">
          <label style="font-size:11px; color:#aaa;">Category</label>
          <select id="modal-msg-category" style="width:100%; padding:9px; background:#1e1e1e; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; font-size:13px; margin-top:4px; outline:none;">
            <option value="Donation Proof / Verification">💖 Donation Proof / Verification</option>
            <option value="Movie / Show Request">🎬 Movie / TV Show Request</option>
            <option value="Broken Server / Stream Issue">⚠️ Broken Server / Stream Issue</option>
            <option value="Account / Login Concern">🔑 Account / Login Concern</option>
            <option value="General Feedback">💬 General Feedback</option>
          </select>
        </div>

        <div style="margin-bottom:10px;">
          <label style="font-size:11px; color:#aaa;">Your Message</label>
          <textarea id="modal-msg-text" rows="3" style="width:100%; padding:9px; background:#1e1e1e; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; font-size:13px; margin-top:4px; resize:vertical; outline:none; font-family:inherit;" placeholder="Describe your request or paste donation details..."></textarea>
        </div>

        <div style="margin-bottom:15px;">
          <label style="font-size:11px; color:#aaa; display:flex; justify-content:space-between;">
            <span>Attach Screenshot (Proof / Error)</span>
            <span style="color:#4caf50; font-weight:600;">Max: 25MB</span>
          </label>
          <input type="file" id="modal-msg-file" accept="image/*" style="width:100%; padding:6px; background:#1e1e1e; border:1px dashed rgba(255,255,255,0.15); color:#aaa; border-radius:8px; font-size:12px; margin-top:4px; cursor:pointer;" />
          <div id="image-preview-container" style="display:none; margin-top:8px;">
            <img id="image-preview" src="" style="max-height:90px; border-radius:6px; border:1px solid #333;" />
          </div>
        </div>

        <button id="modal-msg-send-btn" style="width:100%; padding:10px; background:#e50914; border:none; color:#fff; font-weight:700; border-radius:8px; cursor:pointer; font-size:13px;">Send Message</button>
      </div>

      <div id="contact-view-replies" style="display:none;">
        <div id="user-replies-feed" style="display:flex; flex-direction:column; gap:10px;">
          <p style="color:#777; font-size:12px; text-align:center; padding:15px;">Loading...</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let attachedBase64 = "";

  const tabSend = document.getElementById("tab-btn-send-msg");
  const tabReplies = document.getElementById("tab-btn-view-replies");
  const viewSend = document.getElementById("contact-view-send");
  const viewReplies = document.getElementById("contact-view-replies");

  tabSend.onclick = () => {
    tabSend.style.color = "#e50914"; tabSend.style.borderBottom = "2px solid #e50914";
    tabReplies.style.color = "#888"; tabReplies.style.borderBottom = "none";
    viewSend.style.display = "block"; viewReplies.style.display = "none";
  };

  tabReplies.onclick = () => {
    tabReplies.style.color = "#e50914"; tabReplies.style.borderBottom = "2px solid #e50914";
    tabSend.style.color = "#888"; tabSend.style.borderBottom = "none";
    viewSend.style.display = "none"; viewReplies.style.display = "block";
    loadUserReplies();
  };

  document.getElementById("modal-msg-file").addEventListener("change", async function(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        showAuthToast("Image file size must be below 25MB.", "error");
        this.value = "";
        return;
      }
      try {
        attachedBase64 = await compressAvatar(file, 800, 0.75);
        const prevContainer = document.getElementById("image-preview-container");
        const prevImg = document.getElementById("image-preview");
        prevImg.src = attachedBase64;
        prevContainer.style.display = "block";
      } catch (err) {
        console.error("Compression Error:", err);
        showAuthToast("Failed to process image.", "error");
      }
    }
  });

  document.getElementById("close-contact-modal").onclick = () => {
    modal.style.display = "none";
  };

  document.getElementById("modal-msg-send-btn").onclick = async () => {
    const text = document.getElementById("modal-msg-text").value.trim();
    const category = document.getElementById("modal-msg-category").value;
    const sendBtn = document.getElementById("modal-msg-send-btn");

    if (!text && !attachedBase64) {
      showAuthToast("Please enter a message or attach a picture.", "error");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    const currentUser = auth.currentUser;

    try {
      await addDoc(collection(db, "admin_messages"), {
        senderName: currentUser ? (currentUser.displayName || "User") : "Guest User",
        senderEmail: currentUser ? currentUser.email : "guest@user.com",
        userId: currentUser ? currentUser.uid : "guest",
        category: category,
        message: text,
        attachment: attachedBase64 || null,
        adminReply: null,
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });

      showAuthToast("Message sent to Admin!", "success");
      document.getElementById("modal-msg-text").value = "";
      document.getElementById("modal-msg-file").value = "";
      document.getElementById("image-preview-container").style.display = "none";
      attachedBase64 = "";
      modal.style.display = "none";
    } catch (err) {
      console.error("Error sending admin message:", err);
      showAuthToast("Failed to send message.", "error");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Message";
    }
  };
}

function loadUserReplies() {
  const repliesContainer = document.getElementById("user-replies-feed");
  const user = auth.currentUser;
  if (!user) {
    repliesContainer.innerHTML = `<p style="color:#777; font-size:12px; text-align:center; padding:15px;">Please sign in to view your conversation.</p>`;
    return;
  }

  onSnapshot(collection(db, "admin_messages"), (snapshot) => {
    const myMessages = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (data.userId === user.uid || data.senderEmail === user.email) {
        myMessages.push({ id: d.id, ...data });
      }
    });

    myMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (myMessages.length === 0) {
      repliesContainer.innerHTML = `<p style="color:#777; font-size:12px; text-align:center; padding:15px;">No previous inquiries found.</p>`;
      return;
    }

    repliesContainer.innerHTML = "";
    myMessages.forEach(item => {
      const card = document.createElement("div");
      card.style.cssText = "background:#1e1e1e; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px;";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="font-size:11px; color:#e50914; font-weight:bold;">${item.category}</span>
          <span style="font-size:10px; color:${item.adminReply ? '#4caf50' : '#ff9800'}; font-weight:600;">
            ${item.adminReply ? '● Replied' : '● Pending'}
          </span>
        </div>
        <p style="font-size:12px; color:#ddd; margin-bottom:6px;">${item.message}</p>
        ${item.adminReply ? `
          <div style="background:#19271a; border-left:3px solid #4caf50; padding:8px 12px; border-radius:6px; margin-top:6px;">
            <strong style="color:#4caf50; font-size:11px;"><i class="fas fa-user-shield"></i> Admin:</strong>
            <p style="color:#fff; font-size:12px; margin-top:2px;">${item.adminReply}</p>
          </div>
        ` : ''}
      `;
      repliesContainer.appendChild(card);
    });
  });
}

function openContactAdminModal(userData) {
  const modal = document.getElementById("contact-admin-modal");
  if (modal) modal.style.display = "flex";
}

let currentMode = "login";

function switchAuthMode(mode) {
  const title = document.getElementById("auth-modal-title");
  const usernameField = document.getElementById("auth-username-field");
  const submitBtn = document.getElementById("auth-submit-btn");
  const toggleFooter = document.getElementById("auth-toggle-footer");
  const googleBtn = document.getElementById("auth-google-btn");
  const orDivider = document.getElementById("auth-or-divider");
  const passContainer = document.getElementById("auth-password-container");

  if (!title) return;
  currentMode = mode;

  if (mode === "register") {
    title.innerText = "Create Account";
    submitBtn.innerText = "Register";
    usernameField.style.display = "block";
    passContainer.style.display = "block";
    googleBtn.style.display = "flex";
    orDivider.style.display = "block";
    toggleFooter.innerHTML = `
      Already have an account? <span id="link-to-login" style="color:#e50914; font-weight:600; cursor:pointer;">Sign in here</span>
    `;
  } else if (mode === "forgot") {
    title.innerText = "Reset Password";
    submitBtn.innerText = "Send Reset Link";
    usernameField.style.display = "none";
    passContainer.style.display = "none";
    googleBtn.style.display = "none";
    orDivider.style.display = "none";
    toggleFooter.innerHTML = `
      Remember your password? <span id="link-to-login" style="color:#e50914; font-weight:600; cursor:pointer;">Back to Login</span>
    `;
  } else {
    title.innerText = "Sign In";
    submitBtn.innerText = "Sign In";
    usernameField.style.display = "none";
    passContainer.style.display = "block";
    googleBtn.style.display = "flex";
    orDivider.style.display = "block";
    toggleFooter.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <span id="link-to-forgot" style="color:#888; cursor:pointer; font-size:12px;">Forgot Password?</span>
        <span id="link-to-register" style="color:#e50914; font-weight:600; cursor:pointer; font-size:12px;">Register here</span>
      </div>
    `;
  }

  attachDynamicLinks();
}

function attachDynamicLinks() {
  const toReg = document.getElementById("link-to-register");
  const toLogin = document.getElementById("link-to-login");
  const toForgot = document.getElementById("link-to-forgot");

  if (toReg) toReg.onclick = () => switchAuthMode("register");
  if (toLogin) toLogin.onclick = () => switchAuthMode("login");
  if (toForgot) toForgot.onclick = () => switchAuthMode("forgot");
}

function setupAuthModalHTML() {
  if (document.getElementById("auth-custom-modal")) return;

  const modal = document.createElement("div");
  modal.id = "auth-custom-modal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 380px; text-align: left; padding: 25px; position: relative;">
      <span class="close" id="close-auth-modal" style="position:absolute; right:15px; top:10px; cursor:pointer;">&times;</span>
      <h2 id="auth-modal-title" style="margin-bottom:15px; font-size:1.3rem; color:#fff;">Sign In</h2>

      <div id="auth-username-field" style="display:none; margin-bottom:10px;">
        <label style="font-size:12px; color:#aaa;">Username</label>
        <input type="text" id="auth-username-input" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:5px; margin-top:4px;" placeholder="Your Display Name">
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:12px; color:#aaa;">Email Address</label>
        <input type="email" id="auth-email-input" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:5px; margin-top:4px;" placeholder="name@gmail.com">
      </div>

      <div id="auth-password-container" style="margin-bottom:15px;">
        <label style="font-size:12px; color:#aaa;">Password</label>
        <div style="position:relative; width:100%; margin-top:4px;">
          <input type="password" id="auth-password-input" style="width:100%; padding:10px 38px 10px 10px; background:#222; border:1px solid #444; color:#fff; border-radius:5px;" placeholder="••••••••">
          <i class="fas fa-eye" id="togglePasswordVisibility" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#888; cursor:pointer;" title="Show/Hide Password"></i>
        </div>
      </div>

      <button id="auth-submit-btn" style="width:100%; padding:10px; background:#e50914; border:none; color:#fff; font-weight:600; border-radius:5px; cursor:pointer;">Sign In</button>

      <div id="auth-or-divider" style="text-align:center; margin:15px 0 10px; font-size:12px; color:#888;">OR</div>

      <button id="auth-google-btn" style="width:100%; padding:10px; background:#fff; border:none; color:#111; font-weight:600; border-radius:5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
        <i class="fab fa-google" style="color:#e50914;"></i> Continue with Google
      </button>

      <div id="auth-toggle-footer" style="margin-top:15px;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const pwdInput = document.getElementById("auth-password-input");
  const pwdToggle = document.getElementById("togglePasswordVisibility");

  pwdToggle.onclick = () => {
    const isPassword = pwdInput.getAttribute("type") === "password";
    pwdInput.setAttribute("type", isPassword ? "text" : "password");
    pwdToggle.classList.toggle("fa-eye", !isPassword);
    pwdToggle.classList.toggle("fa-eye-slash", isPassword);
    pwdToggle.style.color = isPassword ? "#e50914" : "#888";
  };

  document.getElementById("close-auth-modal").onclick = closeAuthModal;
  document.getElementById("auth-google-btn").onclick = loginWithGoogle;

  document.getElementById("auth-submit-btn").onclick = () => {
    const email = document.getElementById("auth-email-input").value.trim();
    const pass = document.getElementById("auth-password-input").value.trim();
    const uname = document.getElementById("auth-username-input").value.trim();

    if (currentMode === "forgot") {
      forgotPassword(email);
    } else if (currentMode === "register") {
      if (!email || !pass || !uname) return showAuthToast("Please complete all fields.", "error");
      registerWithEmail(email, pass, uname);
    } else {
      if (!email || !pass) return showAuthToast("Please enter your email and password.", "error");
      loginWithEmail(email, pass);
    }
  };

  switchAuthMode("login");
}

function openAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "flex";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "none";
}

/* ============================================================
   GLOBAL HELPERS PARA SA SPG/LOGIN GATING (movie.js, home.js, browse.js)
   Ito ang ginagamit ng ibang scripts para malaman kung naka-login
   at para mabuksan ang auth modal kahit saang page.
   ============================================================ */
window.mjIsLoggedIn = function () {
  try { return !!auth.currentUser; } catch (e) { return false; }
};

window.mjOpenAuthModal = function () {
  try {
    switchAuthMode("login");
    openAuthModal();
    return true;
  } catch (e) {
    return false;
  }
};

// Self-boot: tatakbo rin ang auth observer kahit sa pages na walang
// auth-nav-container (hal. movie.html) — kailangan ito ng SPG gate
// at para gumana ang login modal sa movie page mismo.
if (!document.getElementById('auth-nav-container')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAuthObserver());
  } else {
    initAuthObserver();
  }
}