// ✅ js/vault.js - FULL RE-OPTIMIZED VERSION
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

// Eksaktong config mula sa iyong Firebase Console
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

// Pilitin ang browser na i-remember ang login (Persistence)
setPersistence(auth, browserLocalPersistence);

// --- Auth State Logic ---
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes("login.html");
    const isVaultPage = currentPage.includes("vault.html");

    if (user) {
        console.log("✅ User is logged in:", user.displayName);
        // Kung nasa login page, lipat sa vault
        if (isLoginPage) {
            window.location.href = "vault.html";
        }
        // I-display ang pangalan
        const userNameEl = document.getElementById("userName");
        if (userNameEl) userNameEl.textContent = user.displayName;
        
        // I-render ang mga movies
        if (document.getElementById("vaultContainer")) {
            renderVault();
        }
    } else {
        console.log("❌ No user detected.");
        // Kung nasa vault pero hindi logged in, balik sa login
        if (isVaultPage) {
            window.location.href = "login.html";
        }
    }
});

// --- Button Click Listeners ---
window.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) {
        loginBtn.onclick = async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                console.log("Login Success:", result.user);
            } catch (error) {
                console.error("Firebase Login Error:", error.code, error.message);
                // Detalyadong alert para malaman natin ang error
                alert(`Login Error: ${error.code}\n\nMake sure to wait 5 minutes after saving settings in Google Cloud.`);
            }
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            try {
                await signOut(auth);
                window.location.href = "index.html";
            } catch (error) {
                console.error("Logout Error:", error);
            }
        };
    }
});

// --- Content Renderer ---
function renderVault() {
    const container = document.getElementById("vaultContainer");
    
    // Check kung loaded na ang data mula sa js/uploads.js
    if (typeof uploads === 'undefined' || !Array.isArray(uploads)) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <p style="color: #888;">Fetching vault content... Make sure uploads.js is loaded.</p>
        </div>`;
        return;
    }

    container.innerHTML = uploads.map(item => `
        <div class="dl-card fade-in">
            <div class="dl-badge">Premium</div>
            <img src="images/logo-192.png" alt="Movie Logo">
            <div class="dl-info">
                <h3>${item.title}</h3>
                <p>Direct Google Drive Access</p>
                <a href="https://drive.google.com/uc?export=download&id=${item.id}" target="_blank" class="dl-btn">
                    <i class="fas fa-download"></i> Download Now
                </a>
            </div>
        </div>
    `).join('');
}