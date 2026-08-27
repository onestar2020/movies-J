// js/comments.js
import { auth, db } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Utility: Relative time formatter (e.g. "5 mins ago")
function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return "Just now";
}

export function initCommentsSystem(mediaId, mediaType) {
  if (!mediaId) return;

  const commentInput = document.getElementById("comment-textarea");
  const postBtn = document.getElementById("post-comment-btn");
  const commentsFeed = document.getElementById("comments-feed-list");
  const countElem = document.getElementById("comments-count");
  const userAvatar = document.getElementById("current-user-comment-avatar");

  // Sync current logged in user avatar in input box
  auth.onAuthStateChanged((user) => {
    if (user && userAvatar) {
      userAvatar.src = user.photoURL || "images/logo-192.png";
    } else if (userAvatar) {
      userAvatar.src = "images/logo-192.png";
    }
  });

  // 1. Realtime Listen to Comments for this Movie/Show
  const commentsRef = collection(db, `media_comments_${mediaId}`);
  const q = query(commentsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    if (!commentsFeed) return;

    const count = snapshot.size;
    if (countElem) countElem.textContent = count;

    if (count === 0) {
      commentsFeed.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #777; background: #141414; border-radius: 8px; border: 1px dashed #333;">
          <i class="far fa-comment-dots" style="font-size: 28px; margin-bottom: 8px; color: #555;"></i>
          <p style="margin: 0; font-size: 13px;">No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    commentsFeed.innerHTML = "";
    const currentUser = auth.currentUser;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const commentId = docSnap.id;
      const isOwner = currentUser && currentUser.uid === data.userId;

      const commentCard = document.createElement("div");
      commentCard.style.cssText = `
        background: #181818;
        border: 1px solid #282828;
        border-radius: 8px;
        padding: 14px;
        display: flex;
        gap: 12px;
        position: relative;
      `;

      commentCard.innerHTML = `
        <img src="${data.userPhoto || 'images/logo-192.png'}" alt="Avatar" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600; font-size: 13px; color: #fff;">${data.userName || 'User'}</span>
              <span style="font-size: 11px; color: #777;">${timeAgo(data.createdAt)}</span>
            </div>
            ${isOwner ? `
              <button class="delete-comment-btn" data-id="${commentId}" style="background: transparent; border: none; color: #777; cursor: pointer; font-size: 12px;" title="Delete comment">
                <i class="fas fa-trash-alt"></i>
              </button>
            ` : ''}
          </div>
          <p style="color: #ddd; font-size: 13px; line-height: 1.5; margin: 0; word-break: break-word;">
            ${escapeHtml(data.text)}
          </p>
        </div>
      `;

      commentsFeed.appendChild(commentCard);
    });

    // Attach Delete Listeners
    document.querySelectorAll(".delete-comment-btn").forEach((btn) => {
      btn.onclick = async () => {
        const cId = btn.getAttribute("data-id");
        if (confirm("Do you want to delete this comment?")) {
          try {
            await deleteDoc(doc(db, `media_comments_${mediaId}`, cId));
          } catch (e) {
            console.error("Error deleting comment:", e);
          }
        }
      };
    });
  });

  // 2. Post Comment Handler
  if (postBtn && commentInput) {
    postBtn.onclick = async () => {
      const user = auth.currentUser;
      if (!user) {
        // Buksan ang Sign In modal kapag hindi naka-login
        const navLoginBtn = document.getElementById("nav-login-btn");
        if (navLoginBtn) navLoginBtn.click();
        return;
      }

      const text = commentInput.value.trim();
      if (!text) return;

      postBtn.disabled = true;
      postBtn.style.opacity = "0.5";

      try {
        await addDoc(collection(db, `media_comments_${mediaId}`), {
          mediaId: String(mediaId),
          mediaType: mediaType || "movie",
          userId: user.uid,
          userName: user.displayName || "User",
          userPhoto: user.photoURL || "images/logo-192.png",
          text: text,
          createdAt: serverTimestamp()
        });

        commentInput.value = "";
      } catch (err) {
        console.error("Failed to post comment:", err);
      } finally {
        postBtn.disabled = false;
        postBtn.style.opacity = "1";
      }
    };
  }
}

// Security: Prevent XSS script injection in comments
function escapeHtml(string) {
  const div = document.createElement("div");
  div.innerText = string;
  return div.innerHTML;
}