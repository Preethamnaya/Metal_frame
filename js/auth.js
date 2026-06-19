// Authentication JS for HARSHA METAL_FRAM_WORKS login gates

document.addEventListener("DOMContentLoaded", () => {
  setupAdminLogin();
  setupGoogleUserLogin();
  setupQuickTestingLogins();
  
  // Clear any previous session on loading index login page
  localStorage.removeItem("user_session");
});

function setupQuickTestingLogins() {
  const quickCustBtn = document.getElementById("quick-customer-btn");
  const quickAdminBtn = document.getElementById("quick-admin-btn");
  if (quickCustBtn) {
    quickCustBtn.addEventListener("click", () => {
      const session = {
        id: "google_mock_user_" + Date.now(),
        name: "Preetham Kumar",
        email: "preetham@google.com",
        isAdmin: false
      };
      localStorage.setItem("user_session", JSON.stringify(session));
      window.showToast("Logged in as Demo Customer!", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
    });
  }
  if (quickAdminBtn) {
    quickAdminBtn.addEventListener("click", () => {
      const session = {
        id: "admin_" + Date.now(),
        name: "Preetham (Admin)",
        email: "aprretham@gmail.com",
        isAdmin: true
      };
      localStorage.setItem("user_session", JSON.stringify(session));
      window.showToast("Logged in as Admin!", "success");
      setTimeout(() => { window.location.href = "admin.html"; }, 800);
    });
  }
}

// Admin credentials matching (Hardcoded)
function setupAdminLogin() {
  const adminForm = document.getElementById("admin-login-form");
  const adminSubmitBtn = document.getElementById("admin-submit-btn");
  const errorBox = document.getElementById("auth-error-box");

  if (!adminForm) return;

  adminForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.style.display = "none";

    const email = document.getElementById("admin-email").value.trim().toLowerCase();
    const password = document.getElementById("admin-password").value;

    adminSubmitBtn.disabled = true;
    adminSubmitBtn.classList.add("loading");

    // Match hardcoded admin list
    const foundAdmin = ADMIN_ACCOUNTS.find(acc => acc.email === email && acc.password === password);

    setTimeout(() => {
      if (foundAdmin) {
        const session = {
          id: "admin_" + Date.now(),
          name: foundAdmin.name,
          email: foundAdmin.email,
          isAdmin: true
        };
        localStorage.setItem("user_session", JSON.stringify(session));
        window.showToast("Admin access approved!", "success");
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 1000);
      } else {
        errorBox.innerText = "Invalid administrator credentials. Access Denied.";
        errorBox.style.display = "block";
        adminSubmitBtn.disabled = false;
        adminSubmitBtn.classList.remove("loading");
      }
    }, 800);
  });
}

// Google User Login
function setupGoogleUserLogin() {
  const googleBtn = document.getElementById("user-google-btn");
  const simModal  = document.getElementById("google-login-modal");
  const cancelBtn = document.getElementById("google-sim-cancel");
  const simForm   = document.getElementById("google-auth-sim-form");

  if (!googleBtn || !simModal) return;

  // Open simulated Google popup
  googleBtn.addEventListener("click", () => {
    simModal.style.display = "flex";
    simModal.style.flexDirection = "column";
    // Reset form each time
    if (simForm) simForm.reset();
    // Reset avatar highlights
    document.querySelectorAll(".av-btn").forEach((btn, idx) => {
      if (idx === 0) {
        btn.style.border = "2px solid rgba(197,160,89,0.8)";
        btn.style.background = "rgba(197,160,89,0.1)";
        btn.style.boxShadow = "0 0 12px rgba(197,160,89,0.3)";
      } else {
        btn.style.border = "2px solid rgba(255,255,255,0.1)";
        btn.style.background = "rgba(255,255,255,0.04)";
        btn.style.boxShadow = "none";
      }
    });
  });

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      simModal.style.display = "none";
    });
  }

  // Close on backdrop click
  simModal.addEventListener("click", (e) => {
    if (e.target === simModal) {
      simModal.style.display = "none";
    }
  });

  // Avatar button highlight — use event delegation on avatar-row
  const avatarRow = document.getElementById("avatar-row");
  if (avatarRow) {
    avatarRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".av-btn");
      if (!btn) return;

      // Deselect all
      document.querySelectorAll(".av-btn").forEach(b => {
        b.style.border = "2px solid rgba(255,255,255,0.1)";
        b.style.background = "rgba(255,255,255,0.04)";
        b.style.boxShadow = "none";
      });

      // Highlight selected
      btn.style.border = "2px solid rgba(197,160,89,0.8)";
      btn.style.background = "rgba(197,160,89,0.1)";
      btn.style.boxShadow = "0 0 12px rgba(197,160,89,0.3)";

      // Check the hidden radio inside the parent label
      const radio = btn.closest("label")?.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  }

  // Submit form
  if (simForm) {
    simForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name  = document.getElementById("google-sim-name").value.trim();
      const email = document.getElementById("google-sim-email").value.trim();

      // Get selected avatar
      const radioChecked = simForm.querySelector('input[name="google-avatar"]:checked');
      const avatar = radioChecked ? radioChecked.value : "👨‍💻";

      if (!name || !email) {
        window.showToast("Please fill in your name and Gmail.", "error");
        return;
      }

      const proceedBtn = document.getElementById("google-sim-proceed");
      if (proceedBtn) {
        proceedBtn.disabled = true;
        proceedBtn.innerText = "Authenticating...";
        proceedBtn.style.opacity = "0.7";
      }

      setTimeout(() => {
        const session = {
          id: "google_user_" + Date.now(),
          name:  name,
          email: email,
          avatar: avatar,
          isAdmin:   false,
          isNewLogin: true  // triggers welcome popup
        };

        localStorage.setItem("user_session", JSON.stringify(session));
        window.showToast(`✅ Authenticated as ${name}!`, "success");

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      }, 1200);
    });
  }
}
