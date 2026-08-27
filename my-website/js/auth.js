// js/auth.js (With Dropdown Message Admin Modal + File Attachments)
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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ================= CUSTOM TOAST NOTIFICATION =================
function showAuthToast(message, type = "error") {
  let toast = document.getElementById("auth-toast-msg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "auth-toast-msg";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      z-index: 999999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      opacity: 0;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  const isSuccess = type === "success";
  toast.style.background = isSuccess ? "#1e4620" : "#3b1111";
  toast.style.border = `1px solid ${isSuccess ? "#2e7d32" : "#d32f2f"}`;
  toast.innerHTML = `<i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="color:${isSuccess ? '#4caf50' : '#e50914'}; font-size:16px;"></i> ${message}`;

  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-10px)";
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
      return "Too many failed attempts. Please wait a moment or reset your password.";
    case "auth/popup-closed-by-user":
      return "Google Sign-In was cancelled.";
    default:
      return "Authentication error. Please check your details and try again.";
  }
}

// 1. Google Login
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    await syncUserToFirestore(result.user);
    closeAuthModal();
    showAuthToast(`Welcome back, ${result.user.displayName || "User"}!`, "success");
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
    await sendEmailVerification(result.user);
    await signOut(auth);
    showAuthToast(`Verification link sent to ${email}! Check inbox/spam.`, "success");
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
      showAuthToast("Please verify your email first! Check your inbox or spam.", "error");
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
    await signOut(auth);
    showAuthToast("Logged out successfully.", "success");
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

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
  setupContactAdminModalHTML();

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

      const isAdmin = user.email === "jayjovendinawanao2020@gmail.com";

      authContainer.innerHTML = `
        <div style="position:relative; display:inline-block;">
          <div id="user-profile-btn" style="display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px 8px; border-radius:6px; background:#1c1c1c; border:1px solid #333;">
            <img src="${userData.photoURL || 'images/logo-192.png'}" style="width:26px; height:26px; border-radius:50%; object-fit:cover;" alt="Avatar" />
            <span style="font-size:12px; color:#fff; font-weight:600;">${(userData.displayName || "User").split(" ")[0]}</span>
            <i class="fas fa-chevron-down" style="font-size:10px; color:#888;"></i>
          </div>
          
          <div id="user-dropdown-menu" style="display:none; position:absolute; right:0; top:38px; background:#181818; border:1px solid #333; border-radius:8px; width:190px; z-index:99999; box-shadow:0 8px 24px rgba(0,0,0,0.9); overflow:hidden;">
            <div style="padding:10px; border-bottom:1px solid #282828;">
              <p style="font-size:11px; color:#aaa; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${userData.email || 'User'}</p>
            </div>
            
            ${isAdmin ? `
              <a href="admin-donations.html" style="width:100%; text-align:left; padding:10px 12px; background:transparent; border:none; color:#4caf50; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; text-decoration:none; border-bottom:1px solid #282828;">
                <i class="fas fa-gauge-high"></i> Admin Control Panel
              </a>
            ` : ''}

            <!-- MESSAGE ADMIN DROPDOWN OPTION -->
            <button id="menu-contact-admin-btn" style="width:100%; text-align:left; padding:10px 12px; background:transparent; border:none; color:#fff; font-size:12px; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:8px; border-bottom:1px solid #282828;">
              <i class="fas fa-envelope-open-text" style="color:#e50914;"></i> Message Admin
            </button>

            <button id="menu-logout-btn" style="width:100%; text-align:left; padding:10px 12px; background:transparent; border:none; color:#e50914; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      `;

      const profileBtn = document.getElementById("user-profile-btn");
      const dropMenu = document.getElementById("user-dropdown-menu");
      const logoutBtn = document.getElementById("menu-logout-btn");
      const contactAdminBtn = document.getElementById("menu-contact-admin-btn");

      profileBtn.onclick = (e) => {
        e.stopPropagation();
        dropMenu.style.display = dropMenu.style.display === "block" ? "none" : "block";
      };

      document.addEventListener("click", () => {
        if (dropMenu) dropMenu.style.display = "none";
      });

      if (contactAdminBtn) {
        contactAdminBtn.onclick = (e) => {
          e.stopPropagation();
          dropMenu.style.display = "none";
          openContactAdminModal(userData);
        };
      }

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

// ================= CONTACT ADMIN MODAL WITH ATTACHMENT =================
function setupContactAdminModalHTML() {
  if (document.getElementById("contact-admin-modal")) return;

  const modal = document.createElement("div");
  modal.id = "contact-admin-modal";
  modal.className = "modal";
  modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); z-index:999999; display:none; align-items:center; justify-content:center; padding:15px;";
  modal.innerHTML = `
    <div style="background:#181818; border:1px solid #333; border-radius:12px; max-width:440px; width:100%; padding:22px; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.9);">
      <span id="close-contact-modal" style="position:absolute; right:15px; top:12px; font-size:20px; color:#888; cursor:pointer;">&times;</span>
      
      <h3 style="margin-bottom:6px; font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-paper-plane" style="color:#e50914;"></i> Message Admin
      </h3>
      <p style="color:#888; font-size:12px; margin-bottom:15px;">Send a movie request, broken server report, or screenshot.</p>

      <div style="margin-bottom:10px;">
        <label style="font-size:11px; color:#aaa;">Category</label>
        <select id="modal-msg-category" style="width:100%; padding:9px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; font-size:13px; margin-top:4px; outline:none;">
          <option value="Movie / Show Request">🎬 Movie / TV Show Request</option>
          <option value="Broken Server / Stream Issue">⚠️ Broken Server / Stream Issue</option>
          <option value="Account / Login Concern">🔑 Account / Login Concern</option>
          <option value="General Feedback">💬 General Feedback</option>
        </select>
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:11px; color:#aaa;">Your Message</label>
        <textarea id="modal-msg-text" rows="3" style="width:100%; padding:9px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; font-size:13px; margin-top:4px; resize:vertical; outline:none; font-family:inherit;" placeholder="Describe your request or issue..."></textarea>
      </div>

      <!-- FILE / PICTURE ATTACHMENT -->
      <div style="margin-bottom:15px;">
        <label style="font-size:11px; color:#aaa; display:flex; justify-content:space-between;">
          <span>Attach Screenshot / Image (Optional)</span>
          <span id="file-size-hint" style="color:#666;">Max: 2MB</span>
        </label>
        <input type="file" id="modal-msg-file" accept="image/*" style="width:100%; padding:6px; background:#222; border:1px dashed #444; color:#aaa; border-radius:6px; font-size:12px; margin-top:4px; cursor:pointer;" />
        <div id="image-preview-container" style="display:none; margin-top:8px;">
          <img id="image-preview" src="" style="max-height:80px; border-radius:4px; border:1px solid #333;" />
        </div>
      </div>

      <button id="modal-msg-send-btn" style="width:100%; padding:10px; background:#e50914; border:none; color:#fff; font-weight:600; border-radius:6px; cursor:pointer; font-size:13px;">Send Message</button>
    </div>
  `;
  document.body.appendChild(modal);

  let attachedBase64 = "";

  document.getElementById("modal-msg-file").addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAuthToast("Image file size must be below 2MB.", "error");
        this.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = function(evt) {
        attachedBase64 = evt.target.result;
        const prevContainer = document.getElementById("image-preview-container");
        const prevImg = document.getElementById("image-preview");
        prevImg.src = attachedBase64;
        prevContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
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
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });

      showAuthToast("Message and file sent to Admin successfully!", "success");
      document.getElementById("modal-msg-text").value = "";
      document.getElementById("modal-msg-file").value = "";
      document.getElementById("image-preview-container").style.display = "none";
      attachedBase64 = "";
      modal.style.display = "none";
    } catch (err) {
      console.error("Error sending admin message:", err);
      showAuthToast("Failed to send message. Please try again.", "error");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Message";
    }
  };
}

function openContactAdminModal(userData) {
  const modal = document.getElementById("contact-admin-modal");
  if (modal) modal.style.display = "flex";
}

// Modal State Manager
let currentMode = "login";

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
  if (modal) modal.style.display = "block";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-custom-modal");
  if (modal) modal.style.display = "none";
}