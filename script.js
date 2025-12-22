// Disable right-click
document.addEventListener("contextmenu", e => e.preventDefault());
// ===============================
// ELEMENTS
// MAKE WEBHOOK
// ===============================
const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ywszf6rc5ymdw1evmut2jx4316x8t2cc";
const recordBtn = document.getElementById("recordBtn");
const fileInput = document.getElementById("fileInput");
const form = document.getElementById("wishForm");
const nameInput = document.getElementById("name");
const submitBtn = document.querySelector(".submit-btn");
const deadlineBanner = document.querySelector(".deadline");
// VALIDATION LIMITS
const MIN_NAME_LENGTH = 3;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

// click/ click error sound
const successClick = document.getElementById("successClick");
const errorClick = document.getElementById("errorClick");
successClick.volume = 0.4;
errorClick.volume = 0.45;

document.addEventListener("click", () => {
  successClick.load();
  errorClick.load();
}, { once: true });

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

// Recheck modal
const modal = document.getElementById("recheckModal");
const recheckAudio = document.getElementById("recheckAudio");
const recheckVideo = document.getElementById("recheckVideo");
const redoBtn = document.getElementById("redoBtn");
const confirmBtn = document.getElementById("confirmBtn");

// Audio
const bgm = document.getElementById("bgm");
const musicToggle = document.getElementById("bgmToggle");

// CONFIG
const CLOUD_NAME = "dqmcqdtxn";
const UPLOAD_PRESET = "orina_birthday";

// SUBMISSION DEADLINE
const DEADLINE = new Date("2025-12-25T23:59:00");

// STATE
let mediaRecorder;
let chunks = [];
let mediaBlob = null;
let recording = false;
let confirmed = false;
let recordedSize = 0;

// Music state
let musicPlaying = false;
bgm.volume = 0.18;

// MUSIC TOGGLE (ONLY WAY TO PLAY BGM)
musicToggle.onclick = () => {
  if (!musicPlaying) {
    bgm.play().then(() => {
      musicPlaying = true;
      musicToggle.textContent = "🎧 ᴘᴀᴜsᴇ";
      musicToggle.classList.add("playing");
    });
  } else {
    bgm.pause();
    musicPlaying = false;
    musicToggle.textContent ="🎧 ᴘʟᴀʏ";
    musicToggle.classList.remove("playing");
  }
};

// ===============================
// RECHECK MODAL
// ===============================
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

// ===============================
// AUDIO RECORDING
// ===============================
recordBtn.onclick = async () => {
  if (!recording) {
    recordedSize = 0;
    if (!window.MediaRecorder) {
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
};

// FILE UPLOAD
fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (!validateMediaSize(file)) {
    fileInput.value = "";
    return;
  }

  mediaBlob = file;
  openRecheck(mediaBlob);
};

// MODAL ACTIONS
redoBtn.onclick = () => {
  modal.classList.add("hidden");
  mediaBlob = null;
  confirmed = false;
  fileInput.value = "";
};

confirmBtn.onclick = () => {
  confirmed = true;
  modal.classList.add("hidden");
};

// FORM SUBMIT (NO MUSIC HERE)
form.onsubmit = async (e) => {
  e.preventDefault();

  const userName = nameInput.value.trim();

  if (userName.length < MIN_NAME_LENGTH) {
    errorClick.currentTime = 0;
    errorClick.play();
    setTimeout(() => {
      alert("Please enter at least 3 characters for your name.");
      
    }, 80);
    return;
  }

  if (!mediaBlob) {
    errorClick.currentTime = 0;
    errorClick.play();
    setTimeout(() => {
      alert("Please enter at least 3 characters for your name.");
      
    }, 80);
    return;
  }

  if (!confirmed) {
    errorClick.currentTime = 0;
    errorClick.play();
    setTimeout(() => {
      alert("Please enter at least 3 characters for your name.");
      
    }, 80);
    return;
  }

  // ✅ VALID SUBMIT → success sound
  successClick.currentTime = 0;
  successClick.play();
  
  // Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", mediaBlob);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    if (!data.secure_url) {
      errorClick.currentTime = 0;
      errorClick.play();
      setTimeout(() => {
        alert("Upload failed. Please try again.");
      }, 80);
      return;
    }

    // Send to Makewebhook
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        mediaUrl: data.secure_url,
        source: "Orina Birthday Website"
        
      })
      
    });

    window.location.href = "thankyou.html";

  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
};

function checkDeadline() {
  const now = new Date();

  if (now > DEADLINE) {
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = "⛔ Submissions Closed";
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";

    // Disable recording & upload
    recordBtn.disabled = true;
    fileInput.disabled = true;
    recordBtn.style.opacity = "0.4";
    recordBtn.style.cursor = "not-allowed";

    // Update deadline message
    deadlineBanner.innerHTML =
      "⛔ <b>Submissions are closed.</b> Thank you for the love ❤️";
  }
}

// BALLOON REVERSE RAIN
const balloonContainer = document.querySelector(".balloon-rain");

function createBalloon(startRandom = false) {
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.textContent = "🎈";

  // Random horizontal position
  balloon.style.left = Math.random() * 100 + "vw";

  // Random speed (slow)
  const duration = 18 + Math.random() * 12;
  balloon.style.animationDuration = duration + "s";

  // If preloaded, start at random height
  if (startRandom) {
    const randomOffset = Math.random() * 120;
    balloon.style.transform = `translateY(-${randomOffset}vh)`;
  }

  balloonContainer.appendChild(balloon);

  setTimeout(() => {
    balloon.remove();
  }, duration * 1000);
}
// Pre-fill screen with balloons
for (let i = 0; i < 12; i++) {
  createBalloon(true);
}
// Spawn rate (slow & calm)
setInterval(createBalloon, 1200);
checkDeadline();

// LINK CLICK SOUND
document.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    successClick.currentTime = 0;
    successClick.play();

    const url = link.href;
    const target = link.target;

    setTimeout(() => {
      if (target === "_blank") {
        window.open(url, "_blank");
      } else {
        window.location.href = url;
      }
    }, 120);
  });
});