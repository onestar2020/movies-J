// ✅ js/vault.js - FINAL SYNC VERSION
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut,
    setPersistence,
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Firebase Configuration mula sa iyong console
const firebaseConfig = {
  apiKey: "AIzaSyAauNF6VBg_bcC1kDjxw6W03C7vvSUKY-Q",
  authDomain: "movies-j-vault.firebaseapp.com",
  projectId: "movies-j-vault",
  storageBucket: "movies-j-vault.firebasestorage.app",
  messagingSenderId: "16270353501",
  appId: "1:16270353501:web:0d2a8461cd761bd319b4",
  measurementId: "G-TH5LWS3R11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Pilitin ang browser na i-remember ang session (para hindi laging login)
setPersistence(auth, browserLocalPersistence);

// --- Authentication Watcher ---
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isLoginPage = path.includes("login.html");
    const isVaultPage = path.includes("vault.html");

    if (user) {
        console.log("✅ Access Granted:", user.displayName);
        
        // Redirect kung nasa login page pero logged in na
        if (isLoginPage) {
            window.location.href = "vault.html";
        }

        // I-update ang UI sa Vault
        const userNameEl = document.getElementById("userName");
        if (userNameEl) {
            userNameEl.textContent = user.displayName;
        }
        
        // Tawagin ang function para ipakita ang movies
        if (document.getElementById("vaultContainer")) {
            renderVault();
        }
    } else {
        console.log("❌ No active session.");
        // Redirect pabalik sa login kung sinusubukang pumasok sa vault nang hindi logged in
        if (isVaultPage) {
            window.location.href = "login.html";
        }
    }
});

// --- Button Event Listeners ---
window.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Auth Error:", error.code);
                alert("Login Failed: " + error.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.href = "index.html";
            } catch (error) {
                console.error("Logout Error:", error);
            }
        });
    }
});

// --- Main Renderer (Sync with uploads.js) ---
function renderVault() {
    const container = document.getElementById("vaultContainer");
    
    // Sinisiguro na mahanap ang 'uploads' variable mula sa uploads.js
    const data = window.uploads || (typeof uploads !== 'undefined' ? uploads : null);

    if (!data || !Array.isArray(data)) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: #333; margin-bottom: 15px;"></i>
                <p style="color: #888;">Your vault is currently empty or loading...</p>
            </div>`;
        return;
    }

    // I-generate ang HTML cards para sa bawat movie sa listahan
    container.innerHTML = data.map(item => `
        <div class="dl-card">
            <div class="dl-badge">Premium</div>
            <img src="images/logo-192.png" alt="Movies-J">
            <div class="dl-info">
                <h3>${item.title}</h3>
                <p style="color: #666; font-size: 0.8rem; margin-bottom: 15px;">Verified Direct Link</p>
                <a href="https://drive.google.com/uc?export=download&id=${item.id}" target="_blank" class="dl-btn">
                    <i class="fas fa-download"></i> Download Now
                </a>
            </div>
        </div>
    `).join('');
}