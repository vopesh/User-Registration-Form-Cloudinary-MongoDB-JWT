let idleTime = 0;
const warningTime = 1; // minutes
const logoutTime = 2; // minutes

const showWarning = () => {
  if (!document.getElementById("idle-warning")) {
    const div = document.createElement("div");
    div.id = "idle-warning";
    div.className = "idle-warning";

    div.innerHTML = `
  <div id="idle-warning-close">&times;</div>
  <p>⚠️ You will be logged out in <strong>1 minute</strong> due to inactivity.</p>
  <p>Move your cursor anywhere or close this to stay signed in.</p>
`;

    document.body.appendChild(div);

    // Dismiss button
    document
      .getElementById("idle-warning-close")
      .addEventListener("click", () => {
        resetIdleTimer();
      });
  }
};

const clearWarning = () => {
  const warning = document.getElementById("idle-warning");
  if (warning) warning.remove();
};

const resetIdleTimer = () => {
  idleTime = 0;
  clearWarning();
  console.log("🟢 Activity or dismiss detected. Timer reset.");
};

const checkIdleTime = () => {
  idleTime++;
  console.log(`⏳ Idle for ${idleTime} minute(s)`);

  if (idleTime === warningTime) {
    console.log("⚠️ Showing warning popup...");
    showWarning();
  }

  if (idleTime >= logoutTime) {
    console.log("🔴 Logging out user due to inactivity.");
    window.location.href = "/logout";
  }
};

// Monitor user activity
["mousemove", "mousedown", "keydown", "scroll", "touchstart"].forEach((event) =>
  document.addEventListener(event, resetIdleTimer)
);

// Start interval timer
setInterval(checkIdleTime, 60000);

console.log("✅ Idle timeout script with dismiss button loaded.");
