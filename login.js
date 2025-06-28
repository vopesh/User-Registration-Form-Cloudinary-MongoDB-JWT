// public/js/login.js

const errorDiv = document.getElementById("validation-error");

// ✅ 1. Get query params
const urlParams = new URLSearchParams(window.location.search);

// ✅ 2. Handle localStorage timing
const blockedAt = localStorage.getItem("ipBlockTime");

if (!blockedAt && urlParams.get("limit") === "ip") {
  localStorage.setItem("ipBlockTime", Date.now());
}
// for hour
//if (blockedAt) {
//const hoursPassed = (Date.now() - Number(blockedAt)) / (1000 * 60 * 60);
//if (hoursPassed > 2) {
//localStorage.removeItem("ipBlockActive");
//localStorage.removeItem("ipBlockTime");
//window.location.href = "/login"; // reload clean
//}
//}

if (blockedAt) {
  const hoursPassed = (Date.now() - Number(blockedAt)) / (1000 * 60);
  if (hoursPassed > 2) {
    localStorage.removeItem("ipBlockActive");
    localStorage.removeItem("ipBlockTime");
    window.location.href = "/login"; // reload clean
  }
}

// ✅ 3. Show error box if IP limit triggered
if (urlParams.get("limit") === "ip") {
  localStorage.setItem("ipBlockActive", "true");
  showIpBlockMessage();
} else if (localStorage.getItem("ipBlockActive") === "true") {
  showIpBlockMessage();
}

// ✅ 4. Function to render the error box
function showIpBlockMessage() {
  if (errorDiv) {
    errorDiv.style.display = "block";
    errorDiv.innerHTML = `
      <p style="color:red;">
        🚫 Too many login attempts from your IP.<br/>
        You've been blocked for 2 hours. Please try again later.
      </p>`;
  }
}
