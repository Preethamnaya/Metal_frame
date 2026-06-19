// Global JS and Session Guards for HARSHA METAL_FRAM_WORKS

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initFooter();
  initWhatsAppFloat();
  initScrollReveal();
  checkSessionState();
});

// Toast Utility
window.showToast = function(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "🔔";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "info") icon = "ℹ️";

  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
};

// Unified Navbar Drawer
function initNavbar() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  if (currentPath === "index.html") return; // Login page doesn't need header

  const header = document.createElement("header");
  header.className = "navbar scrolled"; // keep solid on portal pages
  
  header.innerHTML = `
    <div class="container nav-inner">
      <a href="dashboard.html" class="nav-logo">
        <div class="nav-logo-icon">H</div>
        <div class="nav-logo-text">
          <span class="brand-top">HARSHA</span>
          <span class="brand-sub">Metal Frame Works</span>
        </div>
      </a>

      <nav class="nav-links">
        <a href="dashboard.html" class="nav-link ${currentPath === "dashboard.html" ? "active" : ""}">3D Atelier</a>
        <a href="account.html" class="nav-link ${currentPath === "account.html" ? "active" : ""}">My Orders</a>
        <a href="contact.html" class="nav-link ${currentPath === "contact.html" ? "active" : ""}">Support</a>
      </nav>

      <div class="nav-actions" id="nav-auth-actions">
        <button onclick="logoutSession()" class="btn btn-outline btn-sm">Logout</button>
      </div>

      <button class="hamburger" id="nav-hamburger" aria-label="Toggle Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    
    <div class="nav-mobile" id="nav-mobile-menu">
      <a href="dashboard.html" class="nav-link ${currentPath === "dashboard.html" ? "active" : ""}">3D Atelier</a>
      <a href="account.html" class="nav-link ${currentPath === "account.html" ? "active" : ""}">My Orders</a>
      <a href="contact.html" class="nav-link ${currentPath === "contact.html" ? "active" : ""}">Support</a>
      <div id="nav-mobile-auth-actions" style="margin-top: 16px;">
        <button onclick="logoutSession()" class="btn btn-danger btn-full">Logout</button>
      </div>
    </div>
  `;

  document.body.prepend(header);

  // Hamburger Toggle
  const hamburger = document.getElementById("nav-hamburger");
  const mobileMenu = document.getElementById("nav-mobile-menu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open");
    });
  }
}

// Unified Footer
function initFooter() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  if (currentPath === "index.html") return; // Login page doesn't need footer

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="dashboard.html" class="nav-logo" style="margin-bottom: 16px;">
            <div class="nav-logo-icon">H</div>
            <div class="nav-logo-text">
              <span class="brand-top" style="font-size: 1.25rem;">HARSHA</span>
              <span class="brand-sub">Metal Frame Works</span>
            </div>
          </a>
          <p>Premium customized metal picture frame creation. We design precision steel, aluminum, and iron frames built to last.</p>
        </div>
        <div>
          <h3 class="footer-heading">Services</h3>
          <ul class="footer-links">
            <li><a href="dashboard.html">Custom Frames</a></li>
            <li><a href="dashboard.html">Specular Coatings</a></li>
            <li><a href="dashboard.html">3D Visualizer Try-On</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-heading">Quick Links</h3>
          <ul class="footer-links">
            <li><a href="dashboard.html">3D Atelier</a></li>
            <li><a href="account.html">My Orders</a></li>
            <li><a href="contact.html">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-heading">Address</h3>
          <div class="footer-contact-item">
            <span>📍</span>
            <span>HARSHA METAL_FRAM_WORKS,<br>Industrial Area, Bangalore, India</span>
          </div>
          <div class="footer-contact-item">
            <span>📞</span>
            <span>+91 7411464311</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 HARSHA METAL_FRAM_WORKS. All rights reserved.</p>
        <p>Premium Metal Craftsmanship</p>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

// WhatsApp Float
function initWhatsAppFloat() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  if (currentPath === "index.html") return;

  const wa = document.createElement("a");
  wa.href = "https://wa.me/917411464311?text=Hello%20Harsha%20Metal%20Frame%20Works%2C%20I'm%20interested%20in%20ordering%20a%20custom%20frame!";
  wa.target = "_blank";
  wa.className = "whatsapp-float";
  wa.ariaLabel = "Chat with us on WhatsApp to place order";
  wa.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.452 5.43 1.453 5.441 0 9.866-4.42 9.87-9.856.002-2.633-1.02-5.107-2.88-6.97C17.206 1.859 14.73 .836 12.012.836c-5.452 0-9.879 4.42-9.883 9.859-.001 1.942.508 3.84 1.472 5.462l-.993 3.626 3.72-.976zm11.332-6.84c-.3-.15-1.777-.875-2.05-.976-.273-.1-.472-.15-.672.15-.2.3-.777.976-.952 1.176-.176.2-.351.226-.652.077-.302-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.785-1.675-2.086-.176-.3-.019-.462.132-.612.135-.135.302-.35.452-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.672-1.62-.921-2.219-.242-.583-.487-.504-.672-.514-.173-.009-.372-.01-.572-.01-.2 0-.525.075-.8.375-.276.3-.922.901-.922 2.199s.945 2.55 1.07 2.726c.125.176 1.86 2.84 4.505 3.979.629.271 1.12.433 1.503.555.632.201 1.208.173 1.662.105.507-.076 1.777-.726 2.026-1.427.25-.7.25-1.3.175-1.428-.076-.125-.276-.2-.577-.35z"/>
    </svg>
  `;
  document.body.appendChild(wa);
}

function checkSessionState() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const session = localStorage.getItem("user_session");
  
  if (session) {
    try {
      const user = JSON.parse(session);
      
      // If admin accesses client pages, keep them. If client tries to access admin.html, redirect
      if (currentPath === "admin.html" && user.isAdmin !== true) {
        window.location.href = "dashboard.html";
      }

      // If logged in user opens login gate, redirect to their home
      if (currentPath === "index.html") {
        window.location.href = user.isAdmin ? "admin.html" : "dashboard.html";
      }

      // Update name triggers in header
      const userHeaderTag = document.getElementById("nav-auth-actions");
      if (userHeaderTag) {
        userHeaderTag.innerHTML = `
          <div style="display:flex; align-items:center; gap: 12px;">
            ${user.isAdmin ? `<a href="admin.html" class="btn btn-outline btn-sm" style="color:var(--gold); border-color:var(--gold);">Admin Panel</a>` : ""}
            <span style="font-size:0.85rem; color:var(--text-secondary);">Hi, ${user.name.split(" ")[0]}</span>
            <button onclick="logoutSession()" class="btn btn-ghost btn-sm">Logout</button>
          </div>
        `;
      }
    } catch(e){}
  } else {
    // If not logged in and opening protected pages, redirect to entry gate
    if (currentPath !== "index.html" && currentPath !== "contact.html") {
      window.location.href = "index.html";
    }
  }
}

window.logoutSession = function() {
  localStorage.removeItem("user_session");
  window.showToast("Logged out successfully.", "info");
  setTimeout(() => { window.location.href = "index.html"; }, 1000);
};

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const checkReveal = () => {
    for (let i = 0; i < reveals.length; i++) {
      const windowHeight = window.innerHeight;
      const elementTop = reveals[i].getBoundingClientRect().top;
      const elementVisible = 100;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add("active");
      }
    }
  };
  window.addEventListener("scroll", checkReveal);
  checkReveal();
}
