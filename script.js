// Disable right-click
document.addEventListener("contextmenu", e => e.preventDefault());

// ===============================
// ELEMENTS
// ===============================
const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ywszf6rc5ymdw1evmut2jx4316x8t2cc";
const recordBtn = document.getElementById("recordBtn");
const fileInput = document.getElementById("fileInput");
const form = document.getElementById("wishForm");
form.setAttribute("action", "javascript:void(0)");
form.noValidate = true;
const nameInput = document.getElementById("name");
const submitBtn = document.querySelector(".submit-btn");
const deadlineBanner = document.querySelector(".deadline");

// VALIDATION LIMITS
const MIN_NAME_LENGTH = 3;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

// Click sounds
const successClick = document.getElementById("successClick");
const errorClick = document.getElementById("errorClick");
successClick.volume = 0.4;
errorClick.volume = 0.45;

// Unlock audio on first user gesture (avoids autoplay blocking)
document.addEventListener("click", () => {
  successClick.load();
  errorClick.load();
}, { once: true });

// Functions
function validateMediaSize(blob) {
  if (!blob || !blob.type) return false;
  // Audio
  if (blob.type.startsWith("audio")) {
    if (blob.size > MAX_AUDIO_SIZE) {
      alert("Audio file size must be 50 MB or less.");
      return false;
    }
  }
  // Video
  if (blob.type.startsWith("video")) {
    if (blob.size > MAX_VIDEO_SIZE) {
      alert("Video file size must be 100 MB or less.");
      return false;
    }
  }
  return true;
}

// Modal elements
const modal = document.getElementById("recheckModal");
const recheckAudio = document.getElementById("recheckAudio");
const recheckVideo = document.getElementById("recheckVideo");
const redoBtn = document.getElementById("redoBtn");
const confirmBtn = document.getElementById("confirmBtn");

// Background music
const bgm = document.getElementById("bgm");
const musicToggle = document.getElementById("bgmToggle");

// Cloudinary config
const CLOUD_NAME = "dqmcqdtxn";
const UPLOAD_PRESET = "orina_birthday";

// Submission deadline
const DEADLINE = new Date("2025-12-25T23:59:00");

// State
let mediaRecorder;
let chunks = [];
let mediaBlob = null;
let recording = false;
let confirmed = false;
let recordedSize = 0;

// Music state
let musicPlaying = false;
bgm.volume = 0.18;

// MUSIC TOGGLE (USER must click to start)
musicToggle.addEventListener("click", () => {
  successClick.currentTime = 0; successClick.play();
  if (!musicPlaying) {
    bgm.play().then(() => {
      musicPlaying = true;
      musicToggle.textContent = "🎧 ᴘᴀᴜsᴇ";
      musicToggle.classList.add("playing");
    });
  } else {
    bgm.pause();
    musicPlaying = false;
    musicToggle.textContent = "🎧 ᴘʟᴀʏ";
    musicToggle.classList.remove("playing");
  }
});

// RECHECK MODAL
function openRecheck(blob) {
  confirmed = false;
  modal.classList.remove("hidden");
  recheckAudio.hidden = true;
  recheckVideo.hidden = true;

  if (blob.type.startsWith("video")) {
    recheckVideo.src = URL.createObjectURL(blob);
    recheckVideo.hidden = false;
  } else {
    const url = URL.createObjectURL(blob);
    recheckAudio.src = url;
    recheckAudio.onended = () => URL.revokeObjectURL(url);
    recheckAudio.hidden = false;    
  }
}

// AUDIO RECORDING
recordBtn.addEventListener("click", async () => {
  // Play click sound for record button
  successClick.currentTime = 0; successClick.play();

  if (!recording) {
    recordedSize = 0;
    if (!window.MediaRecorder) {
      errorClick.currentTime = 0; errorClick.play();
      alert("Audio recording is not supported on this browser. Please upload a file");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
      recordedSize += e.data.size;
      if (recordedSize > MAX_AUDIO_SIZE) {
        alert("Recording limit reached (50 MB). Recording stopped automatically.");
        mediaRecorder.stop();
      }
    };
    
    mediaRecorder.onstop = () => {
      const recordedBlob = new Blob(chunks, { type: "audio/webm" });
      if (!validateMediaSize(recordedBlob)) {
        mediaBlob = null;
        return;
      }
      mediaBlob = recordedBlob;
      openRecheck(mediaBlob);
    };
    mediaRecorder.start();
    recording = true;
    recordBtn.textContent = "⏹ Stop Recording";
    
  } else {
    mediaRecorder.stop();
    recording = false;
    recordBtn.textContent = "🎙️ Record Audio";
  }
});

// FILE UPLOAD
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (!validateMediaSize(file)) {
    fileInput.value = "";
    return;
  }
  mediaBlob = file;
  openRecheck(mediaBlob);
});

// MODAL ACTIONS
redoBtn.addEventListener("click", () => {
  successClick.currentTime = 0; successClick.play();
  modal.classList.add("hidden");
  mediaBlob = null;
  confirmed = false;
  fileInput.value = "";
});

confirmBtn.addEventListener("click", () => {
  successClick.currentTime = 0; successClick.play();
  confirmed = true;
  modal.classList.add("hidden");
});

// FORM SUBMIT
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userName = nameInput.value.trim();

  // Validation: name length
  if (userName.length < MIN_NAME_LENGTH) {
    errorClick.currentTime = 0; errorClick.play();
    alert("Please enter at least 3 characters for your name.");
    return;
  }
  // Validation: media present
  if (!mediaBlob) {
    errorClick.currentTime = 0; errorClick.play();
    alert("Please record or upload your wish.");
    return;
  }
  // Validation: confirm recording
  if (!confirmed) {
    errorClick.currentTime = 0; errorClick.play();
    alert("Please confirm your recording first.");
    return;
  }

  // ✅ Valid submission: play success sound
  successClick.currentTime = 0;
  successClick.play();

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", mediaBlob);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!data.secure_url) {
      alert("Upload failed. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "💌 SUBMIT YOUR WISH";
      return;
    }

    // Send to Make.com webhook
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        mediaUrl: data.secure_url,
        source: "Orina Birthday Website"
      })
    });

    // Redirect to thank-you page
    window.location.href = "thankyou.html";

  } catch (err) {
    console.error(err);
    errorClick.currentTime = 0; errorClick.play();
    alert("Something went wrong. Please try again.");
    submitBtn.disabled = false;
    submitBtn.textContent = "💌 SUBMIT YOUR WISH";
  }
});

// DEADLINE CHECK
function checkDeadline() {
  const now = new Date();
  if (now > DEADLINE) {
    // Disable submit and inputs
    submitBtn.disabled = true;
    submitBtn.textContent = "⛔ Submissions Closed";
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";
    recordBtn.disabled = true;
    fileInput.disabled = true;
    recordBtn.style.opacity = "0.4";
    recordBtn.style.cursor = "not-allowed";

    // Update banner
    deadlineBanner.innerHTML =
      "⛔ <b>Submissions are closed.</b> Thank you for the love ❤️";
  }
}

// BALLOON ANIMATION (unchanged)
const balloonContainer = document.querySelector(".balloon-rain");
function createBalloon(startRandom = false) {
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.textContent = "🎈";
  balloon.style.left = Math.random() * 100 + "vw";
  const duration = 18 + Math.random() * 12;
  balloon.style.animationDuration = duration + "s";
  if (startRandom) {
    const randomOffset = Math.random() * 120;
    balloon.style.transform = `translateY(-${randomOffset}vh)`;
  }
  balloonContainer.appendChild(balloon);
  setTimeout(() => { balloon.remove(); }, duration * 1000);
}
for (let i = 0; i < 12; i++) createBalloon(true);
setInterval(createBalloon, 1200);
checkDeadline();

// LINK CLICK SOUND
document.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    successClick.currentTime = 0;
    successClick.play();
  });
});