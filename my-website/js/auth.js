// js/auth.js (With Realtime Banned/Deleted User Auto-Logout Enforcement)
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
    const userRef = doc(db, "users", result.user.uid);
    const snap = await getDoc(userRef);
    
    // Check kung banned o deleted
    if (snap.exists() && snap.data().isBanned === true) {
      await signOut(auth);
      showAuthToast("Your account has been suspended by the administrator.", "error");
      return;
    }

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
    await syncUserToFirestore(result.user);
    await sendEmailVerification(result.user);
    await signOut(auth);
    showAuthToast(`Verification link sent! Please check your Inbox or Spam folder.`, "success");
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

    const userRef = doc(db, "users", result.user.uid);
    const snap = await getDoc(userRef);

    // Check kung banned o deleted
    if (snap.exists() && snap.data().isBanned === true) {
      await signOut(auth);
      showAuthToast("Your account has been suspended by the administrator.", "error");
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
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? snap.data() : {};

    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || existing.displayName || "User",
      email: user.email,
      photoURL: user.photoURL || existing.photoURL || "images/logo-192.png",
      isBanned: existing.isBanned || false,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore sync warning:", err);
  }
}

function compressImage(file, maxWidth = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Observer + Dropdown Profile UI + Real-time Ban Check
export function initAuthObserver(onUserLoggedIn, onGuestMode) {
  setupAuthModalHTML();
  setupContactAdminModalHTML();

  onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById("auth-nav-container");

    if (user && (user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'))) {
      const userRef = doc(db, "users", user.uid);

      // Realtime listener sa status ng user (Auto Kick / Auto Logout kung Banned)
      onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isBanned === true) {
            signOut(auth);
            alert("Your account has been deactivated or banned by the administrator.");
            window.location.reload();
            return;
          }
        }
      });

      let userData = user;
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) userData = userDoc.data();
      } catch (e) {
        console.warn("Could not fetch user doc:", e);
      }

      if (authContainer) {
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

              <button id="menu-contact-admin-btn" style="width:100%; text-align:left; padding:10px 12px; background:transparent; border:none; color:#fff; font-size:12px; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:8px; border-bottom:1px solid #282828;">
                <i class="fas fa-envelope-open-text" style="color:#e50914;"></i> Support & Inquiries
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
      }

      if (onUserLoggedIn) onUserLoggedIn(userData);
    } else {
      if (authContainer) {
        authContainer.innerHTML = `
          <button id="nav-login-btn" style="background:#e50914; color:#fff; border:none; padding:6px 14px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">
            Sign In
          </button>
        `;
        document.getElementById("nav-login-btn").onclick = () => {
          switchAuthMode("login");
          openAuthModal();
        };
      }
      if (onGuestMode) onGuestMode();
    }
  });
}

function setupContactAdminModalHTML() {
  if (document.getElementById("contact-admin-modal")) return;

  const modal = document.createElement("div");
  modal.id = "contact-admin-modal";
  modal.className = "modal";
  modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); z-index:999999; display:none; align-items:center; justify-content:center; padding:15px;";
  modal.innerHTML = `
    <div style="background:#181818; border:1px solid #333; border-radius:12px; max-width:480px; width:100%; padding:22px; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.9); max-height:90vh; overflow-y:auto;">
      <span id="close-contact-modal" style="position:absolute; right:15px; top:12px; font-size:20px; color:#888; cursor:pointer;">&times;</span>
      
      <div style="display:flex; gap:16px; margin-bottom:18px; border-bottom:1px solid #282828; padding-bottom:10px;">
        <button id="tab-btn-send-msg" style="background:transparent; border:none; color:#e50914; font-weight:bold; font-size:13px; cursor:pointer; padding-bottom:4px; border-bottom:2px solid #e50914;">New Inquiry</button>
        <button id="tab-btn-view-replies" style="background:transparent; border:none; color:#888; font-weight:bold; font-size:13px; cursor:pointer; padding-bottom:4px;">My Inquiries & Replies</button>
      </div>

      <div id="contact-view-send">
        <div style="margin-bottom:10px;">
          <label style="font-size:11px; color:#aaa;">Category</label>
          <select id="modal-msg-category" style="width:100%; padding:9px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; font-size:13px; margin-top:4px; outline:none;">
            <option value="Donation Proof / Verification">💖 Donation Proof / Verification</option>
            <option value="Movie / Show Request">🎬 Movie / TV Show Request</option>
            <option value="Broken Server / Stream Issue">⚠️ Broken Server / Stream Issue</option>
            <option value="Account / Login Concern">🔑 Account / Login Concern</option>
            <option value="General Feedback">💬 General Feedback</option>
          </select>
        </div>

        <div style="margin-bottom:10px;">
          <label style="font-size:11px; color:#aaa;">Your Message</label>
          <textarea id="modal-msg-text" rows="3" style="width:100%; padding:9px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; font-size:13px; margin-top:4px; resize:vertical; outline:none; font-family:inherit;" placeholder="Describe your request or paste donation details..."></textarea>
        </div>

        <div style="margin-bottom:15px;">
          <label style="font-size:11px; color:#aaa; display:flex; justify-content:space-between;">
            <span>Attach Screenshot (Proof / Error)</span>
            <span style="color:#4caf50; font-weight:600;">Max: 10MB</span>
          </label>
          <input type="file" id="modal-msg-file" accept="image/*" style="width:100%; padding:6px; background:#222; border:1px dashed #444; color:#aaa; border-radius:6px; font-size:12px; margin-top:4px; cursor:pointer;" />
          <div id="image-preview-container" style="display:none; margin-top:8px;">
            <img id="image-preview" src="" style="max-height:90px; border-radius:4px; border:1px solid #333;" />
          </div>
        </div>

        <button id="modal-msg-send-btn" style="width:100%; padding:10px; background:#e50914; border:none; color:#fff; font-weight:600; border-radius:6px; cursor:pointer; font-size:13px;">Send Message</button>
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
      if (file.size > 10 * 1024 * 1024) {
        showAuthToast("Image file size must be below 10MB.", "error");
        this.value = "";
        return;
      }
      try {
        attachedBase64 = await compressImage(file);
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
      card.style.cssText = "background:#222; border:1px solid #333; border-radius:8px; padding:12px;";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="font-size:11px; color:#e50914; font-weight:bold;">${item.category}</span>
          <span style="font-size:10px; color:${item.adminReply ? '#4caf50' : '#ff9800'}; font-weight:600;">
            ${item.adminReply ? '● Replied' : '● Pending'}
          </span>
        </div>
        <p style="font-size:12px; color:#ddd; margin-bottom:6px;">${item.message}</p>
        ${item.adminReply ? `
          <div style="background:#19271a; border-left:3px solid #4caf50; padding:8px 12px; border-radius:4px; margin-top:6px;">
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