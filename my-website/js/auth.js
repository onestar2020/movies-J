// js/auth.js
import { auth, provider, db } from "./firebase-config.js";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Google Sign-In
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // I-save o i-update ang basic profile sa Firestore nang walang bayad
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    }, { merge: true });

    return user;
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed: " + error.message);
  }
}

// Logout
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

// Global Auth State Observer
export function initAuthObserver(onUserLoggedIn, onGuestMode) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Kunin ang user data (kasama ang roles/badges kung meron)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : user;
      
      updateNavUI(userData);
      if (onUserLoggedIn) onUserLoggedIn(userData);
    } else {
      updateNavUI(null);
      if (onGuestMode) onGuestMode();
    }
  });
}

// Helper para i-update ang Login Button sa Header
function updateNavUI(user) {
  const authContainer = document.getElementById("auth-nav-container");
  if (!authContainer) return;

  if (user) {
    authContainer.innerHTML = `
      <div class="user-profile-badge" id="user-profile-btn" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
        <img src="${user.photoURL || 'images/logo-192.png'}" style="width:30px; height:30px; border-radius:50%; border:2px solid #e50914;" alt="Avatar" />
        <span style="font-size:13px; color:#fff; font-weight:600;">${user.displayName ? user.displayName.split(" ")[0] : "User"}</span>
      </div>
    `;
    document.getElementById("user-profile-btn").onclick = logoutUser;
  } else {
    authContainer.innerHTML = `
      <button id="nav-login-btn" style="background:#e50914; color:#fff; border:none; padding:6px 14px; border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
        Sign In
      </button>
    `;
    document.getElementById("nav-login-btn").onclick = loginWithGoogle;
  }
}