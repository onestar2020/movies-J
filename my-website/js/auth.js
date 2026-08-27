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
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Google Login (Auto-verified na ang Google accounts)
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    await syncUserToFirestore(result.user);
    closeAuthModal();
  } catch (error) {
    console.error("Google Auth Error:", error);
    alert("Google Sign-In Error: " + error.message);
  }
}

// 2. Email/Password Register (May Email Verification para i-block ang fake email)
export async function registerWithEmail(email, password, username) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });
    
    // Send Verification Email
    await sendEmailVerification(result.user);
    
    // I-logout muna para hindi makapasok ang hindi verified
    await signOut(auth);
    
    alert(`Verification link has been sent to ${email}!\nPlease check your inbox/spam and verify before logging in.`);
    switchAuthMode("login");
  } catch (error) {
    console.error("Register Error:", error);
    alert("Registration Error: " + error.message);
  }
}

// 3. Email/Password Login (Bina-block kung hindi pa na-click ang link sa Gmail)
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    if (!result.user.emailVerified) {
      await signOut(auth);
      alert("Please verify your email address first! Check the link sent to your inbox/spam folder.");
      return;
    }

    await syncUserToFirestore(result.user);
    closeAuthModal();
  } catch (error) {
    console.error("Login Error:", error);
    alert("Login Error: " + error.message);
  }
}

// 4. Forgot Password (Magpapadala ng reset link sa email)
export async function forgotPassword(email) {
  if (!email) {
    alert("Please enter your email address first.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert(`Password reset link sent to ${email}! Check your inbox or spam.`);
    switchAuthMode("login");
  } catch (error) {
    console.error("Password Reset Error:", error);
    alert("Reset Error: " + error.message);
  }
}

// 5. User Logout
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

// Sync to Firestore
async function syncUserToFirestore(user) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: user.displayName || "User",
      email: user.email,
      photoURL: user.photoURL || "images/logo-192.png",
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore sync warning:", err);
  }
}

// Observer + Dropdown Profile UI
export function initAuthObserver(onUserLoggedIn, onGuestMode) {
  setupAuthModalHTML();

  onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById("auth-nav-container");
    if (!authContainer) return;

    if (user && (user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'))) {
      let userData = user;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) userData = userDoc.data();
      } catch (e) {
        console.warn("Could not fetch remote user doc:", e);
      }

      // Profile Button na may Popup Dropdown Menu (hindi na mag-back to sign in agad)
      authContainer.innerHTML = `
        <div style="position:relative; display:inline-block;">
          <div id="user-profile-btn" style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px 8px; border-radius:6px; background:#1c1c1c; border:1px solid #333;">
            <img src="${userData.photoURL || 'images/logo-192.png'}" style="width:26px; height:26px; border-radius:50%; object-fit:cover;" alt="Avatar" />
            <span style="font-size:12px; color:#fff; font-weight:600;">${(userData.displayName || "User").split(" ")[0]}</span>
            <i class="fas fa-chevron-down" style="font-size:10px; color:#888;"></i>
          </div>
          
          <div id="user-dropdown-menu" style="display:none; position:absolute; right:0; top:36px; background:#181818; border:1px solid #333; border-radius:6px; width:160px; z-index:9999; box-shadow:0 6px 16px rgba(0,0,0,0.8); overflow:hidden;">
            <div style="padding:10px; border-bottom:1px solid #282828;">
              <p style="font-size:11px; color:#aaa; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${userData.email || 'Google User'}</p>
            </div>
            <button id="menu-logout-btn" style="width:100%; text-align:left; padding:10px 12px; background:transparent; border:none; color:#e50914; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      `;

      // Profile Dropdown Toggle Listener
      const profileBtn = document.getElementById("user-profile-btn");
      const dropMenu = document.getElementById("user-dropdown-menu");
      const logoutBtn = document.getElementById("menu-logout-btn");

      profileBtn.onclick = (e) => {
        e.stopPropagation();
        dropMenu.style.display = dropMenu.style.display === "block" ? "none" : "block";
      };

      document.addEventListener("click", () => {
        if (dropMenu) dropMenu.style.display = "none";
      });

      logoutBtn.onclick = logoutUser;

      if (onUserLoggedIn) onUserLoggedIn(userData);
    } else {
      authContainer.innerHTML = `
        <button id="nav-login-btn" style="background:#e50914; color:#fff; border:none; padding:6px 14px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">
          Sign In
        </button>
      `;
      document.getElementById("nav-login-btn").onclick = () => {
        switchAuthMode("login");
        openAuthModal();
      };
      if (onGuestMode) onGuestMode();
    }
  });
}

// Modal Setup & Form Switching
let currentMode = "login"; // 'login', 'register', 'forgot'

function switchAuthMode(mode) {
  currentMode = mode;
  const title = document.getElementById("auth-modal-title");
  const usernameField = document.getElementById("auth-username-field");
  const submitBtn = document.getElementById("auth-submit-btn");
  const toggleFooter = document.getElementById("auth-toggle-footer");
  const googleBtn = document.getElementById("auth-google-btn");
  const orDivider = document.getElementById("auth-or-divider");
  const passContainer = document.getElementById("auth-password-container");

  if (!title) return;

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
      Remembered your password? <span id="link-to-login" style="color:#e50914; font-weight:600; cursor:pointer;">Back to Login</span>
    `;
  } else {
    // login mode
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

  // Eye Icon Show/Hide Password
  const pwdInput = document.getElementById("auth-password-input");
  const pwdToggle = document.getElementById("togglePasswordVisibility");

  pwdToggle.onclick = () => {
    const isPassword = pwdInput.getAttribute("type") === "password";
    pwdInput.setAttribute("type", isPassword ? "text" : "password");
    pwdToggle.classList.toggle("fa-eye", !isPassword);
    pwdToggle.classList.toggle("fa-eye-slash", isPassword);
    pwdToggle.style.color = isPassword ? "#e50914" : "#888";
  };

  // Close & Google Auth Actions
  document.getElementById("close-auth-modal").onclick = closeAuthModal;
  document.getElementById("auth-google-btn").onclick = loginWithGoogle;

  // Submit Handler
  document.getElementById("auth-submit-btn").onclick = () => {
    const email = document.getElementById("auth-email-input").value.trim();
    const pass = document.getElementById("auth-password-input").value.trim();
    const uname = document.getElementById("auth-username-input").value.trim();

    if (currentMode === "forgot") {
      forgotPassword(email);
    } else if (currentMode === "register") {
      if (!email || !pass || !uname) return alert("Please fill in username, email, and password.");
      registerWithEmail(email, pass, uname);
    } else {
      if (!email || !pass) return alert("Please enter your email and password.");
      loginWithEmail(email, pass);
    }
  };

  switchAuthMode("login");
}

function openAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "block";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "none";
}