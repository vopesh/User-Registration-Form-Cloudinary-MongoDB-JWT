document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("whitelistForm");
  const msgBox = document.getElementById("whitelist-message");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const res = await fetch("/whitelist-ip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const text = await res.text(); // Always extract body

        if (res.ok) {
          msgBox.innerHTML = `<div class="success-msg">${
            text || "✅ Safe IP enabled!"
          }</div>`;
        } else {
          msgBox.innerHTML = `<div class="error-msg">⚠️ ${
            text || "Something went wrong."
          }</div>`;
        }

        // Auto-remove message after 5 seconds
        setTimeout(() => {
          msgBox.innerHTML = "";
        }, 5000);
      } catch (err) {
        msgBox.innerHTML = `<div class="error-msg">🚫 Network error: ${err.message}</div>`;
        setTimeout(() => {
          msgBox.innerHTML = "";
        }, 5000);
      }
    });
  }
});
