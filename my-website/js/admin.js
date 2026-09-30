// ✅ js/admin.js - STRICT ADMIN ONLY (WITH AUTO-GENRE DETECT & USER REWARDS ENGINE)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAauNF6VBg_bcC1kDjxw6WO3cTvvSUKY-Q", 
  authDomain: "movies-j-vault.firebaseapp.com",
  projectId: "movies-j-vault",
  storageBucket: "movies-j-vault.firebasestorage.app",
  messagingSenderId: "16270353501",
  appId: "1:16270353501:web:0d2a8461cd761bd319b4",
  measurementId: "G-TH5LWS3R11"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const TMDB_PROXY = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev';

const ADMIN_UID = 'ys5KRWrQmbYsLAue4wjKBZmFZnF2'; 

// ================= USERS DATABASE (movies-j-stream project) =================
// Ang mga registered users ay nakatira sa "movies-j-stream" Firestore — hiwalay
// na app instance, pero pareho ang Firebase Auth session (same Google account).
import { initializeApp as initStreamApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
    getAuth as getStreamAuth,
    signInWithPopup as streamSignInWithPopup,
    signOut as streamSignOut,
    onAuthStateChanged as streamOnAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
    getFirestore as getStreamFirestore,
    collection as streamCollection,
    getDocs as streamGetDocs,
    doc as streamDoc,
    updateDoc as streamUpdateDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const STREAM_CONFIG = {
    apiKey: "AIzaSyDGVvGPJt95ZHTp9Hm349ouyWemFktbwNY",
    authDomain: "movies-j-stream.firebaseapp.com",
    databaseURL: "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "movies-j-stream",
    storageBucket: "movies-j-stream.firebasestorage.app",
    messagingSenderId: "1066305700283",
    appId: "1:1066305700283:web:1b94c85927d4b88240789e"
};
const streamApp = getApps().some(a => a.options.projectId === 'movies-j-stream')
    ? getApp('movies-j-stream')
    : initStreamApp(STREAM_CONFIG, 'movies-j-stream');
const streamAuth = getStreamAuth(streamApp);
const streamDb = getStreamFirestore(streamApp);

// Admin identity (runtime-decoded, hindi plaintext)
const _ak = ['M','j','P','r','0','t','3','c','t','2','0','2','6','!'];
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
const ADMIN_EMAIL = _adec('QPF4yDatVUfNxI~DYEAA9zCjAUQT5~1WQ0gVC8FGpswJ');
// Pangalawang admin account
const ADMIN_EMAIL_2 = _adec('=AiTVxBXbVhDUR~TCA9zCjAUQT51W~Q0gVC8FGpswJ');
const ADMIN_EMAILS = [ADMIN_EMAIL, ADMIN_EMAIL_2];
function isAdminEmail(email) {
    return !!email && ADMIN_EMAILS.indexOf(email) !== -1;
}

// ================= GATE + TABS + STATS + USERS =================
const gate = document.getElementById('adminGate');
const tabsEl = document.getElementById('adminTabs');
const sectionUsers = document.getElementById('section-users');
const sectionVault = document.getElementById('section-vault');
const gateStatus = document.getElementById('gateStatus');

function showGate(msg) {
    if (gate) {
        gate.style.display = 'block';
        if (msg && gateStatus) { gateStatus.textContent = msg; gateStatus.style.display = 'block'; }
    }
    if (tabsEl) tabsEl.style.display = 'none';
    if (sectionUsers) sectionUsers.style.display = 'none';
    if (sectionVault) sectionVault.style.display = 'none';
}
function showPanel() {
    if (gate) gate.style.display = 'none';
    if (tabsEl) tabsEl.style.display = 'flex';
    if (sectionUsers) sectionUsers.style.display = 'block';
    if (sectionVault) sectionVault.style.display = 'none';
}

// Tabs switching
document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        if (sectionUsers) sectionUsers.style.display = tab === 'users' ? 'block' : 'none';
        if (sectionVault) sectionVault.style.display = tab === 'vault' ? 'block' : 'none';
    });
});

const RTDB = 'https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app';

function timeAgo(iso) {
    try {
        const d = new Date(iso);
        const s = Math.floor((Date.now() - d.getTime()) / 1000);
        if (isNaN(s)) return '';
        if (s < 60) return 'just now';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        return Math.floor(s / 86400) + 'd ago';
    } catch (e) { return ''; }
}

async function loadStats() {
    const summary = document.getElementById('statsSummary');
    const chart = document.getElementById('statsChart');
    if (!summary || !chart) return;
    try {
        const res = await fetch(RTDB + '/stats.json');
        const data = (await res.json()) || {};
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().slice(0, 10));
        }
        let totViews = 0, totVisitors = 0, todayViews = 0;
        const today = days[13];
        const rows = days.map(day => {
            const v = data[day] || {};
            const views = v.views || 0;
            const visitors = v.visitors ? Object.keys(v.visitors).length : 0;
            totViews += views;
            totVisitors += visitors;
            if (day === today) todayViews = views;
            return { day, views, visitors };
        });
        const maxVal = Math.max(1, ...rows.map(r => Math.max(r.views, r.visitors)));
        summary.innerHTML = `
            <div class="stat-box"><div class="val">${totViews.toLocaleString()}</div><div class="lbl">Views (14d)</div></div>
            <div class="stat-box"><div class="val">${totVisitors.toLocaleString()}</div><div class="lbl">Unique Visitors (14d)</div></div>
            <div class="stat-box"><div class="val">${todayViews.toLocaleString()}</div><div class="lbl">Views Today</div></div>`;
        chart.innerHTML = rows.map(r => `
            <div class="chart-col" title="${r.day}: ${r.views} views, ${r.visitors} visitors">
                <div class="chart-bars">
                    <div class="chart-bar views" style="height:${Math.round((r.views / maxVal) * 100)}%"></div>
                    <div class="chart-bar visitors" style="height:${Math.round((r.visitors / maxVal) * 100)}%"></div>
                </div>
                <div class="chart-label">${r.day.slice(5)}</div>
            </div>`).join('');
    } catch (err) {
        console.error('Stats load error:', err);
        if (summary) summary.innerHTML = '<p style="color:#ff6b6b;">Failed to load stats.</p>';
    }
}

let _allUsers = [];

async function loadUsers() {
    const listEl = document.getElementById('usersList');
    const countEl = document.getElementById('userCount');
    if (!listEl) return;
    try {
        const snap = await streamGetDocs(streamCollection(streamDb, 'users'));
        _allUsers = [];
        snap.forEach(d => _allUsers.push(d.data()));
        await loadPresence(); // real-time online status mula sa RTDB
        renderUsers();
        if (countEl) countEl.textContent = _allUsers.length;
    } catch (err) {
        console.error('Users load error:', err);
        listEl.innerHTML = '<p style="color:#ff6b6b;">Failed to load users: ' + (err.code || err.message) + '</p>';
    }
}

// ================= REAL-TIME PRESENCE (RTDB) =================
// presence/{uid} = timestamp ng huling heartbeat (kada 60s mula sa auth.js)
const PRESENCE_ONLINE_MS = 150000; // 2.5 min: tatlong missed beats = offline
let _presenceMap = {};
let _guestPresence = {};
let _presenceTimer = null;

async function loadPresence() {
    try {
        const res = await fetch(RTDB + '/presence.json');
        const data = await res.json() || {};
        _presenceMap = data || {};
        _guestPresence = data.guests || {};
    } catch (e) { _presenceMap = {}; _guestPresence = {}; }
}

function isUserOnline(uid) {
    const ts = _presenceMap[uid];
    if (!ts) return false;
    return (Date.now() - Number(ts)) < PRESENCE_ONLINE_MS;
}

// Auto-refresh ng presence + dots kada 30s habang naka-bukas ang Users tab
function startPresenceAutoRefresh() {
    if (_presenceTimer) return;
    _presenceTimer = setInterval(async () => {
        if (document.hidden) return;
        if (!document.getElementById('usersList')) return; // hindi sa Users tab
        await loadPresence();
        renderUsers();
        renderGuests();
    }, 30000);
}

// ================= GUEST VISITORS (hindi naka-login) =================
function isGuestOnline(vid) {
    const ts = _guestPresence[vid];
    if (!ts) return false;
    return (Date.now() - Number(ts)) < PRESENCE_ONLINE_MS;
}

function guestName(vid) {
    // "Guest 1A2B" — huling 4 na karakter ng random visitor ID (walang PII)
    const suffix = String(vid).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '????';
    return 'Guest ' + suffix;
}

function guestColor(vid) {
    // Deterministic hue mula sa ID — consistent na avatar color per guest
    let h = 0;
    const s = String(vid);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return 'hsl(' + h + ', 55%, 45%)';
}

function renderGuests() {
    const listEl = document.getElementById('guestsList');
    const countEl = document.getElementById('guestOnlineCount');
    if (countEl) {
        let online = 0;
        Object.keys(_guestPresence).forEach(v => { if (isGuestOnline(v)) online++; });
        countEl.textContent = online;
    }
    if (!listEl) return;
    const vids = Object.keys(_guestPresence)
        .filter(v => isGuestOnline(v))
        .sort();
    if (vids.length === 0) {
        listEl.innerHTML = '<p style="text-align:center;color:#888;font-size:0.9rem;">Walang online na guests ngayon.</p>';
        return;
    }
    listEl.innerHTML = vids.map(v => `
        <div class="user-item">
            <div class="avatar-wrap">
                <div class="guest-avatar" style="background:${guestColor(v)}">${guestName(v).slice(-2)}</div>
                <span class="presence-dot presence-online" title="Online ngayon"></span>
            </div>
            <div class="user-info">
                <h4>${guestName(v)}</h4>
                <p>Naka-login na bisita • walang account</p>
            </div>
            <div class="user-meta">
                <span class="badge badge-free">Guest</span>
                <span class="badge badge-online">Online</span>
            </div>
        </div>
    `).join('');
}

function renderUsers() {
    const listEl = document.getElementById('usersList');
    if (!listEl) return;
    const q = (document.getElementById('userSearch')?.value || '').toLowerCase().trim();
    const filtered = q ? _allUsers.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    ) : _allUsers;
    // Sort: admin first, then by lastActive (pinakabago sa taas)
    filtered.sort((a, b) => {
        const aAdmin = isAdminEmail(a.email) ? 1 : 0;
        const bAdmin = isAdminEmail(b.email) ? 1 : 0;
        if (aAdmin !== bAdmin) return bAdmin - aAdmin;
        return (b.lastActive || b.lastLogin || b.createdAt || '').localeCompare(a.lastActive || a.lastLogin || a.createdAt || '');
    });
    if (filtered.length === 0) {
        listEl.innerHTML = '<p style="text-align:center;color:#888;">Walang nahanap na users.</p>';
        return;
    }
    listEl.innerHTML = filtered.map(u => {
        const isAdminUser = isAdminEmail(u.email);
        const isOnline = isUserOnline(u.uid); // RTDB heartbeat-based, real-time
        const banned = !!u.isBanned;
        const when = u.lastActive ? timeAgo(u.lastActive) : (u.createdAt ? 'joined ' + timeAgo(u.createdAt) : '');
        const dot = banned ? '<span class="presence-dot presence-offline" title="Banned"></span>' : (isOnline ? '<span class="presence-dot presence-online" title="Online ngayon"></span>' : '<span class="presence-dot presence-offline" title="Offline"></span>');
        return `
        <div class="user-item">
            <div class="avatar-wrap"> 
                <img src="${u.photoURL || 'images/logo-192.png'}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='images/logo-192.png'">
                ${dot}
            </div>
            <div class="user-info">
                <h4>${(u.displayName || 'User') + (isAdminUser ? ' 👑' : '')}</h4>
                <p>${u.email || u.uid}</p>
            </div>
            <div class="user-meta">
                <span class="badge ${banned ? 'badge-banned' : (isAdminUser ? 'badge-admin' : 'badge-free')}">${banned ? 'Banned' : (isAdminUser ? 'Admin' : 'Member')}</span>
                ${isOnline && !banned ? '<span class="badge badge-online">Online</span>' : ''}
                <span class="when">${when}</span>
            </div>
            <div class="user-actions">
                ${!isAdminUser ? `<button class="${banned ? 'btn-unban' : 'btn-ban'}" data-uid="${u.uid}" data-ban="${banned ? '0' : '1'}">${banned ? 'Unban' : 'Ban'}</button>` : ''}
            </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.user-actions button').forEach(btn => {
        btn.onclick = async () => {
            const uid = btn.getAttribute('data-uid');
            const toBan = btn.getAttribute('data-ban') === '1';
            if (!confirm(toBan ? 'I-ban ang user na ito?' : 'I-unban ang user na ito?')) return;
            btn.disabled = true;
            try {
                await streamUpdateDoc(streamDoc(streamDb, 'users', uid), { isBanned: toBan });
                const local = _allUsers.find(x => x.uid === uid);
                if (local) local.isBanned = toBan;
                renderUsers();
            } catch (err) {
                alert('Failed: ' + (err.code || err.message));
                btn.disabled = false;
            }
        };
    });
}

const searchInput = document.getElementById('userSearch');
if (searchInput) searchInput.addEventListener('input', renderUsers);

// Refresh button para sa stats (dinagdag para handy)
// ================= STREAM AUTH STATE (gate) =================
streamOnAuthStateChanged(streamAuth, (user) => {
    if (user && isAdminEmail(user.email)) {
        showPanel();
        loadStats();
        loadUsers();
        loadPresence().then(renderGuests); // guests section
        startPresenceAutoRefresh(); // real-time dots kada 30s
    } else if (user) {
        showGate('ACCESS DENIED: Hindi ito ang admin account (' + user.email + ').');
    } else {
        showGate();
    }
});

const gateLoginBtn = document.getElementById('gateLoginBtn');
if (gateLoginBtn) {
    gateLoginBtn.onclick = () => streamSignInWithPopup(streamAuth, provider);
}

// ================= VAULT AUTH (movies-j-vault; email-based para parehong admin pasok) =================
onAuthStateChanged(auth, (user) => {
    const list = document.getElementById('inventoryList');
    if (!list) return;
    if (user && isAdminEmail(user.email)) {
        loadInventory();
    } else {
        list.innerHTML = `
            <div style="text-align:center; padding:40px; border: 2px dashed #333; border-radius: 10px;">
                <i class="fas fa-film" style="font-size: 2.5rem; color: #ff9800; margin-bottom: 15px;"></i>
                <h3 style="color: #fff;">Vault Access Required</h3>
                <p style="color:#888; font-size:0.8rem; margin-bottom:15px;">Mag-sign in sa vault project para makapag-upload.</p>
                <button id="manualAdminLogin" class="submit-btn" style="max-width: 250px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18"> Login with Google
                </button>
            </div>
        `;
        const loginBtn = document.getElementById('manualAdminLogin');
        if (loginBtn) loginBtn.onclick = () => signInWithPopup(auth, provider);
    }
});

// --- TMDB Genre ID to Admin Select Value Mapping ---
const genreMapping = {
    28: "action", 12: "action", 10759: "action", // Action, Adventure
    35: "comedy", // Comedy
    27: "horror", 53: "horror", // Horror, Thriller
    10749: "romance", 18: "romance", // Romance, Drama
    878: "scifi", 14: "scifi", 10765: "scifi", // Sci-Fi, Fantasy
    16: "animation" // Animation
};

// --- Auto Fetch Poster & Auto Select Genre ---
const fetchPosterBtn = document.getElementById('fetchPosterBtn');
if (fetchPosterBtn) {
    fetchPosterBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('movieTitle');
        const title = titleInput ? titleInput.value : '';
        const btn = document.getElementById('fetchPosterBtn');
        if (!title) return alert("Type the movie title first!");

        btn.textContent = "Searching...";
        try {
            const res = await fetch(`${TMDB_PROXY}/search/multi?query=${encodeURIComponent(title)}`);
            const data = await res.json();
            
            const result = data.results && data.results.find(item => item.poster_path);

            if (result) {
                const posterInput = document.getElementById('posterUrl');
                if (posterInput) {
                    posterInput.value = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
                }
                
                if (result.genre_ids && result.genre_ids.length > 0) {
                    let matchedGenre = "action";
                    for (let id of result.genre_ids) {
                        if (genreMapping[id]) {
                            matchedGenre = genreMapping[id];
                            break;
                        }
                    }
                    const genreSelect = document.getElementById('movieGenre');
                    if (genreSelect) {
                        genreSelect.value = matchedGenre;
                    }
                }

                btn.innerHTML = '<i class="fas fa-check"></i> Found!';
                setTimeout(() => btn.innerHTML = '<i class="fas fa-search"></i> Get Poster', 2000);
            } else {
                alert("No poster found.");
                btn.innerHTML = '<i class="fas fa-search"></i> Get Poster';
            }
        } catch (err) {
            btn.innerHTML = '<i class="fas fa-search"></i> Get Poster';
        }
    });
}

async function loadInventory() {
    const list = document.getElementById('inventoryList');
    if (!list) return;

    list.innerHTML = '<p style="text-align: center; color: #888;">Fetching vault items...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "movies"));
        let movies = [];
        querySnapshot.forEach((docSnap) => movies.push({ id: docSnap.id, ...docSnap.data() }));
        movies.sort((a, b) => (b.timestamp ? b.timestamp.toMillis() : 0) - (a.timestamp ? a.timestamp.toMillis() : 0));

        if (movies.length === 0) return list.innerHTML = '<p style="text-align: center; color: #888;">Vault is empty.</p>';

        list.innerHTML = '';
        movies.forEach(movie => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <div class="inv-info">
                    <h4>${movie.title} ${movie.isNew ? '<span style="color:#4caf50;font-size:10px;">(NEW)</span>' : ''}</h4>
                    <p style="font-size: 0.75rem; color: #666; font-family: monospace;">Category: ${movie.genre || 'N/A'}</p>
                </div>
                <div class="inv-actions">
                    <button class="btn-edit" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(div);
            div.querySelector('.btn-edit').onclick = () => startEdit(movie);
            div.querySelector('.btn-delete').onclick = () => deleteMovie(movie.id, movie.title);
        });
    } catch (error) {
        list.innerHTML = '<p style="color: #ff4444; text-align:center;">Failed to load data. Database is locked.</p>';
    }
}

async function deleteMovie(id, title) {
    if (confirm(`Sigurado ka bang burahin ang "${title}"?`)) {
        await deleteDoc(doc(db, "movies", id));
        loadInventory();
    }
}

function startEdit(movie) {
    const formHeader = document.getElementById('formHeader');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (formHeader) formHeader.textContent = "✏️ Editing: " + movie.title;
    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (cancelEditBtn) cancelEditBtn.style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('editDocId').value = movie.id;
    document.getElementById('movieTitle').value = movie.title || '';
    document.getElementById('movieGenre').value = movie.genre || 'action'; 
    document.getElementById('posterUrl').value = movie.posterUrl || '';
    document.getElementById('fileInfo').value = movie.fileInfo || '';
    document.getElementById('isNewMovie').checked = movie.isNew || false;

    ['driveLink', 'mediafireLink', 'megaLink', 'teraboxLink', 'otherPlatformName', 'otherLink'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    if (movie.links) {
        movie.links.forEach(link => {
            const p = link.platform.toLowerCase();
            if (p.includes("drive")) document.getElementById('driveLink').value = link.url;
            else if (p.includes("mediafire")) document.getElementById('mediafireLink').value = link.url;
            else if (p.includes("mega")) document.getElementById('megaLink').value = link.url;
            else if (p.includes("terabox")) document.getElementById('teraboxLink').value = link.url;
            else {
                const otherNameEl = document.getElementById('otherPlatformName');
                const otherLinkEl = document.getElementById('otherLink');
                if (otherNameEl) otherNameEl.value = link.platform;
                if (otherLinkEl) otherLinkEl.value = link.url;
            }
        });
    }
}

function resetForm() {
    const form = document.getElementById('uploadForm');
    if (form) form.reset();
    const editDocId = document.getElementById('editDocId');
    if (editDocId) editDocId.value = '';
    const formHeader = document.getElementById('formHeader');
    if (formHeader) formHeader.textContent = "🎬 Upload to Vault";
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.textContent = "Upload Movie";
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

const cancelBtn = document.getElementById('cancelEditBtn');
if (cancelBtn) cancelBtn.onclick = resetForm;

const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const submitBtn = document.getElementById('submitBtn');
        const statusMsg = document.getElementById('statusMessage');
        const editId = document.getElementById('editDocId').value;
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        const links = [];
        const fields = {
            drive: document.getElementById('driveLink').value,
            mf: document.getElementById('mediafireLink').value,
            mega: document.getElementById('megaLink').value,
            tera: document.getElementById('teraboxLink').value,
            other: document.getElementById('otherLink').value,
            otherName: document.getElementById('otherPlatformName').value || "Link"
        };

        if (fields.drive) links.push({ platform: "Google Drive", url: fields.drive });
        if (fields.mf) links.push({ platform: "MediaFire", url: fields.mf });
        if (fields.mega) links.push({ platform: "Mega", url: fields.mega });
        if (fields.tera) links.push({ platform: "TeraBox", url: fields.tera });
        if (fields.other) links.push({ platform: fields.otherName, url: fields.other });

        const movieData = {
            title: document.getElementById('movieTitle').value,
            genre: document.getElementById('movieGenre').value, 
            isNew: document.getElementById('isNewMovie').checked,
            posterUrl: document.getElementById('posterUrl').value,
            fileInfo: document.getElementById('fileInfo').value,
            links: links,
            timestamp: editId ? undefined : new Date()
        };

        try {
            if (editId) {
                delete movieData.timestamp;
                await updateDoc(doc(db, "movies", editId), movieData);
                statusMsg.textContent = "✅ Na-update na ang movie!";
            } else {
                await addDoc(collection(db, "movies"), movieData);
                statusMsg.textContent = "✅ Tagumpay na naidagdag!";
            }
            statusMsg.style.display = "block";
            statusMsg.style.color = "#4caf50";
            resetForm();
            loadInventory();
            setTimeout(() => statusMsg.style.display = "none", 3000);
        } catch (error) {
            statusMsg.textContent = "❌ Error: Hindi na-save ang movie.";
            statusMsg.style.display = "block";
            statusMsg.style.color = "#ff4444";
        } finally {
            submitBtn.disabled = false;
            if (!editId) submitBtn.textContent = "Upload Movie";
        }
    });
}