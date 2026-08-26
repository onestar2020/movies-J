// js/auth.js
import { auth, provider, db } from "./firebase-config.js";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Google Login
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    await syncUserToFirestore(result.user);
    closeAuthModal();
  } catch (error) {
    alert(error.message);
  }
}

// 2. Email/Password Register
export async function registerWithEmail(email, password, username) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });
    await syncUserToFirestore({ ...result.user, displayName: username });
    closeAuthModal();
  } catch (error) {
    alert(error.message);
  }
}

// 3. Email/Password Login
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserToFirestore(result.user);
    closeAuthModal();
  } catch (error) {
    alert(error.message);
  }
}

// 4. Logout
export async function logoutUser() {
  await signOut(auth);
}

// Helper: Sync User profile sa Firestore
async function syncUserToFirestore(user) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName: user.displayName || "User",
    email: user.email,
    photoURL: user.photoURL || "images/logo-192.png",
    lastLogin: new Date().toISOString()
  }, { merge: true });
}

// UI & State Observer
export function initAuthObserver(onUserLoggedIn, onGuestMode) {
  setupAuthModalHTML();

  onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById("auth-nav-container");
    if (!authContainer) return;

    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.exists() ? userDoc.data() : user;

      authContainer.innerHTML = `
        <div id="user-profile-btn" style="display:flex; align-items:center; gap:8px; cursor:pointer;" title="Click to Logout">
          <img src="${data.photoURL || 'images/logo-192.png'}" style="width:28px; height:28px; border-radius:50%; border:2px solid #e50914;" />
          <span style="font-size:12px; color:#fff; font-weight:600;">${(data.displayName || "User").split(" ")[0]}</span>
        </div>
      `;
      document.getElementById("user-profile-btn").onclick = logoutUser;
      if (onUserLoggedIn) onUserLoggedIn(data);
    } else {
      authContainer.innerHTML = `
        <button id="nav-login-btn" style="background:#e50914; color:#fff; border:none; padding:5px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">
          Sign In
        </button>
      `;
      document.getElementById("nav-login-btn").onclick = openAuthModal;
      if (onGuestMode) onGuestMode();
    }
  });
}

// Modal Setup
function setupAuthModalHTML() {
  if (document.getElementById("auth-custom-modal")) return;

  const modal = document.createElement("div");
  modal.id = "auth-custom-modal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 380px; text-align: left; padding: 25px;">
      <span class="close" id="close-auth-modal" style="position:absolute; right:15px; top:10px;">&times;</span>
      <h2 id="auth-modal-title" style="margin-bottom:15px; font-size:1.3rem; color:#fff;">Sign In</h2>

      <div id="auth-username-field" style="display:none; margin-bottom:10px;">
        <label style="font-size:12px; color:#aaa;">Username</label>
        <input type="text" id="auth-username-input" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:5px;" placeholder="Your Display Name">
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:12px; color:#aaa;">Email</label>
        <input type="email" id="auth-email-input" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:5px;" placeholder="name@email.com">
      </div>

      <div style="margin-bottom:15px;">
        <label style="font-size:12px; color:#aaa;">Password</label>
        <input type="password" id="auth-password-input" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:#fff; border-radius:5px;" placeholder="••••••••">
      </div>

      <button id="auth-submit-btn" style="width:100%; padding:10px; background:#e50914; border:none; color:#fff; font-weight:600; border-radius:5px; cursor:pointer;">Sign In</button>

      <div style="text-align:center; margin:15px 0 10px; font-size:12px; color:#888;">OR</div>

      <button id="auth-google-btn" style="width:100%; padding:10px; background:#fff; border:none; color:#111; font-weight:600; border-radius:5px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
        <i class="fab fa-google" style="color:#e50914;"></i> Continue with Google
      </button>

      <p id="auth-toggle-text" style="font-size:12px; color:#aaa; margin-top:15px; text-align:center; cursor:pointer;">
        No account yet? <span style="color:#e50914; font-weight:600;">Register here</span>
      </p>
    </div>
  `;
  document.body.appendChild(modal);

  // Event Listeners
  document.getElementById("close-auth-modal").onclick = closeAuthModal;
  document.getElementById("auth-google-btn").onclick = loginWithGoogle;

  let isRegisterMode = false;
  const toggleBtn = document.getElementById("auth-toggle-text");
  const title = document.getElementById("auth-modal-title");
  const usernameField = document.getElementById("auth-username-field");
  const submitBtn = document.getElementById("auth-submit-btn");

  toggleBtn.onclick = () => {
    isRegisterMode = !isRegisterMode;
    title.innerText = isRegisterMode ? "Create Account" : "Sign In";
    submitBtn.innerText = isRegisterMode ? "Register" : "Sign In";
    usernameField.style.display = isRegisterMode ? "block" : "none";
    toggleBtn.innerHTML = isRegisterMode 
      ? `Already have an account? <span style="color:#e50914; font-weight:600;">Sign in here</span>`
      : `No account yet? <span style="color:#e50914; font-weight:600;">Register here</span>`;
  };

  submitBtn.onclick = () => {
    const email = document.getElementById("auth-email-input").value.trim();
    const pass = document.getElementById("auth-password-input").value.trim();
    const uname = document.getElementById("auth-username-input").value.trim();

    if (!email || !pass) return alert("Please fill in email and password.");
    if (isRegisterMode) {
      if (!uname) return alert("Please enter a username.");
      registerWithEmail(email, pass, uname);
    } else {
      loginWithEmail(email, pass);
    }
  };
}

function openAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "block";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "none";
}