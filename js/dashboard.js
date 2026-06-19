// Interactive 3D Customizer and Dashboard JS for HARSHA METAL_FRAM_WORKS

let products = [];
let activeProduct = null;
let activeFinish = "glassy";
let localPhotoBase64 = "";

document.addEventListener("DOMContentLoaded", async () => {
  // Guard routing check
  const session = localStorage.getItem("user_session");
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const parsedSession = JSON.parse(session);
  await loadDashboardProducts();
  setup3DTiltEffect();
  setupCustomizerControls();
  setupCustomizerImageUpload();
  setupWhatsAppOrder();

  // Ultra UI Features
  setupWelcomePopup(parsedSession);
  setupInteractiveBackgroundParticles();
  setupHolographicHoverSheen();
});

// Fetch catalogs
async function loadDashboardProducts() {
  const grid = document.getElementById("dashboard-gallery-grid");
  if (!grid) return;

  try {
    products = await dbMock.getProducts();
    grid.innerHTML = "";

    products.forEach((p, index) => {
      const card = document.createElement("div");
      card.className = "card product-card popup-3d";
      card.style.animationDelay = `${index * 0.15}s`;
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'">
        <div class="card-body">
          <span class="card-tag">${p.material}</span>
          <h3 class="card-title">${p.name}</h3>
          <p class="card-desc">${p.description}</p>
        </div>
        <div class="card-footer">
          <span class="card-price">₹${p.basePricePerSqInch}/sq.in</span>
          <button class="btn btn-primary btn-sm customize-trigger">Interactive 3D Preview</button>
        </div>
      `;

      card.addEventListener("click", () => open3DCustomizer(p));
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading products:", err);
    window.showToast("Failed to fetch product catalog.", "error");
  }
}

// Open customizer overlay
function open3DCustomizer(product) {
  activeProduct = product;
  const modal = document.getElementById("customizer-modal");

  document.getElementById("customizer-molding-type").innerText = `${product.material} Molding Design`;
  document.getElementById("customizer-frame-name").innerText = product.name;

  // Apply visual molding texture matching material
  const molding = document.getElementById("preview-molding");
  molding.className = "frame-molding";
  
  const mat = product.material.toLowerCase();
  if (mat.includes("gold") || mat.includes("aluminum")) {
    molding.classList.add("finish-gold");
  } else if (mat.includes("metal") || mat.includes("steel") || mat.includes("silver")) {
    molding.classList.add("finish-silver");
  } else {
    molding.classList.add("finish-black");
  }

  // Clear previous canvas
  resetCanvasPreview();

  // Reset parameters
  document.getElementById("input-width").value = 12;
  document.getElementById("input-height").value = 16;
  
  applyFinishEffect("glassy");
  calculateCustomizerPrice();
  
  modal.classList.add("active");
}

function resetCanvasPreview() {
  const canvas = document.getElementById("preview-canvas");
  localPhotoBase64 = "";
  document.getElementById("customizer-file-input").value = "";
  canvas.innerHTML = `
    <div style="width: 100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 20px; text-align:center; color: var(--text-muted);">
      <span style="font-size: 2.5rem; margin-bottom: 8px;">📷</span>
      <p style="font-size: 0.8rem;">Upload your portrait to preview inside the frame</p>
    </div>
  `;
}

// 3D Mouse Tilt Translation Engine
function setup3DTiltEffect() {
  const visualizer = document.querySelector(".visualizer-wrapper");
  const frame = document.getElementById("preview-frame-3d");

  if (!visualizer || !frame) return;

  let isDragging = false;
  let startX, startY;
  let rotateX = 0, rotateY = 0;

  // Mouse move tilt effect (Desktop default hover)
  visualizer.addEventListener("mousemove", (e) => {
    if (isDragging) return;
    const rect = visualizer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    // Constrain angles to max 35deg
    const angleY = ((x - midX) / midX) * 35;
    const angleX = -((y - midY) / midY) * 35;

    frame.style.transform = `rotateY(${angleY}deg) rotateX(${angleX}deg)`;
    updateHudCoordinates(angleY, angleX);
  });

  // Reset orientation on mouse leave
  visualizer.addEventListener("mouseleave", () => {
    if (isDragging) return;
    frame.style.transform = `rotateY(0deg) rotateX(0deg)`;
    updateHudCoordinates(0, 0);
  });

  // Support click-and-drag for more extreme rotations
  visualizer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    visualizer.style.cursor = "grabbing";
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      visualizer.style.cursor = "default";
      frame.style.transform = `rotateY(0deg) rotateX(0deg)`;
      updateHudCoordinates(0, 0);
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    rotateY += deltaX * 0.15;
    rotateX -= deltaY * 0.15;

    // Constrain X axis rotation to avoid flipping upside down
    rotateX = Math.max(-50, Math.min(50, rotateX));

    frame.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    updateHudCoordinates(rotateY, rotateX);

    startX = e.clientX;
    startY = e.clientY;
  });
}

function updateHudCoordinates(y, x) {
  const hudX = document.getElementById("hud-coord-x");
  const hudY = document.getElementById("hud-coord-y");
  if (hudX && hudY) {
    hudX.innerText = Math.round(y);
    hudY.innerText = Math.round(x);
  }
}

// Image Loader parser
function setupCustomizerImageUpload() {
  const dropZone = document.getElementById("customizer-file-drop");
  const fileInput = document.getElementById("customizer-file-input");
  const canvas = document.getElementById("preview-canvas");

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      const file = fileInput.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        window.showToast("Files must be under 5MB size limit.", "error");
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        localPhotoBase64 = e.target.result;
        canvas.innerHTML = `<img src="${localPhotoBase64}" alt="Your artwork" style="width: 100%; height:100%; object-fit:cover;">`;
        window.showToast("Artwork uploaded to preview frame!", "success");
      };
      reader.readAsDataURL(file);
    }
  });
}

// Controls, finishes and sizing inputs
function setupCustomizerControls() {
  const closeBtn = document.getElementById("customizer-close-btn");
  const modal = document.getElementById("customizer-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  // Sizing change updates pricing
  document.getElementById("input-width").addEventListener("input", calculateCustomizerPrice);
  document.getElementById("input-height").addEventListener("input", calculateCustomizerPrice);

  // Finish option clicks
  const finishButtons = document.querySelectorAll(".finish-selector-btn");
  finishButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      finishButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const finishVal = btn.getAttribute("data-finish");
      applyFinishEffect(finishVal);
      calculateCustomizerPrice();
    });
  });
}

function applyFinishEffect(finish) {
  activeFinish = finish;
  
  const glass = document.getElementById("preview-glass");
  const glow = document.getElementById("preview-backlight");
  const specular = document.getElementById("preview-specular");

  const titleDesc = document.getElementById("finish-title-desc");
  const textDesc = document.getElementById("finish-text-desc");

  // Disable all overlays
  glass.className = "frame-glass-overlay";
  glow.className = "frame-glow-backlight";
  specular.className = "frame-metal-specular";

  if (finish === "glassy") {
    glass.classList.add("active");
    titleDesc.innerText = "Glassy Finish Frame";
    textDesc.innerText = "Adds a premium protective high-gloss sheet. Reflects ambient room light, preserving your portrait depth and creating elegant glass beams.";
  } else if (finish === "glow") {
    glow.classList.add("active");
    titleDesc.innerText = "Ultra Glow Frame";
    textDesc.innerText = "Adds an ambient back-light neon glow module behind the frame borders. Emits customized lighting to match any dark/glow aesthetic.";
  } else {
    specular.classList.add("active");
    titleDesc.innerText = "Fully Metal Glow Frame Finish";
    textDesc.innerText = "Provides deep specular chrome polishing. Reflects shifting light beams across the metallic surfaces during rotation.";
  }
}

// pricing calculator
function calculateCustomizerPrice() {
  const width = parseFloat(document.getElementById("input-width").value) || 0;
  const height = parseFloat(document.getElementById("input-height").value) || 0;

  let basePricePerSqInch = 3.5; // fallback baseline
  if (activeProduct) {
    basePricePerSqInch = activeProduct.basePricePerSqInch || 3.5;
  }

  const total = width * height * basePricePerSqInch;
  const rounded = Math.ceil(total);

  document.getElementById("customizer-total-price").innerText = `₹${rounded.toLocaleString("en-IN")}.00`;

  // Update physical telemetry indicators
  const weightSpan = document.getElementById("hud-weight");
  const densitySpan = document.getElementById("hud-density");
  if (weightSpan && densitySpan) {
    let density = 2.70; // Aluminum g/cm3
    if (activeProduct) {
      const mat = activeProduct.material.toLowerCase();
      if (mat.includes("steel") || mat.includes("metal")) density = 7.85;
      if (mat.includes("iron")) density = 7.87;
      if (mat.includes("gold")) density = 19.30;
    }
    // Simulate weight in kg: Area * density * thickness multiplier (0.005)
    const weightVal = (width * height * density * 0.005).toFixed(2);
    weightSpan.innerText = `${weightVal} kg`;
    densitySpan.innerText = `${density.toFixed(2)} g/cm³`;
  }

  return rounded;
}

// WhatsApp Invoice Generator
function setupWhatsAppOrder() {
  const waBtn = document.getElementById("whatsapp-order-btn");
  if (!waBtn) return;

  waBtn.addEventListener("click", async () => {
    if (!activeProduct) return;

    const session = JSON.parse(localStorage.getItem("user_session"));
    const width = document.getElementById("input-width").value;
    const height = document.getElementById("input-height").value;
    const finalPrice = calculateCustomizerPrice();

    let finishName = "Glassy Finish Frame";
    if (activeFinish === "glow") finishName = "Ultra Glow Frame";
    if (activeFinish === "metal") finishName = "Fully Metal Glow Frame Finish";

    // 1. Submit order details to Firestore/mock db so it pops up in the admin console
    const orderData = {
      userId: session.id,
      customerName: session.name,
      customerEmail: session.email,
      designStyle: activeProduct.name,
      material: activeProduct.material,
      finish: finishName,
      width: parseFloat(width),
      height: parseFloat(height),
      quantity: 1,
      phone: session.phone || "7411464311",
      address: "Ordered via direct WhatsApp checkout portal",
      instructions: "Direct WhatsApp Client order.",
      estimatedPrice: finalPrice,
      photo: localPhotoBase64 // Base64 encoding preview
    };

    try {
      await dbMock.addOrder(orderData);
      window.showToast("Invoice processed. Redirecting to WhatsApp...", "success");
    } catch(err) {
      console.error(err);
    }

    // 2. Build WhatsApp redirect details
    const textMsg = `*HARSHA METAL_FRAM_WORKS - ORDER INVOICE*\n` +
                    `----------------------------------------\n` +
                    `*Customer:* ${session.name}\n` +
                    `*Frame:* ${activeProduct.name}\n` +
                    `*Material:* ${activeProduct.material}\n` +
                    `*Finish Style:* ${finishName}\n` +
                    `*Size (Width x Height):* ${width}" x ${height}" inches\n` +
                    `----------------------------------------\n` +
                    `*ESTIMATED BILLING:* ₹${finalPrice.toLocaleString("en-IN")}.00\n` +
                    `----------------------------------------\n` +
                    `Please check my uploaded reference photo in the Admin Console.`;

    setTimeout(() => {
      const waUrl = `https://wa.me/917411464311?text=${encodeURIComponent(textMsg)}`;
      window.open(waUrl, "_blank");
    }, 800);
  });
}

function setupWelcomePopup(user) {
  if (user && user.isNewLogin) {
    const welcomeModal = document.getElementById("welcome-popup");
    if (!welcomeModal) return;

    // Fill details
    document.getElementById("welcome-user-name").innerText = user.name;
    document.getElementById("welcome-user-email").innerText = user.email;
    document.getElementById("welcome-avatar-badge").innerText = user.avatar || "👨‍💻";

    // Show modal
    welcomeModal.style.display = "flex";

    // Close button
    const closeBtn = document.getElementById("welcome-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        // Fade out
        welcomeModal.style.opacity = "0";
        setTimeout(() => {
          welcomeModal.style.display = "none";
          // Remove the flag so it doesn't pop up again
          user.isNewLogin = false;
          localStorage.setItem("user_session", JSON.stringify(user));
        }, 500);
      });
    }

    // Trigger canvas particle burst inside the modal background!
    triggerWelcomeConfetti();
  }
}

function triggerWelcomeConfetti() {
  const modal = document.getElementById("welcome-popup");
  if (!modal) return;
  
  for (let i = 0; i < 40; i++) {
    const spark = document.createElement("div");
    spark.className = "sparkle-particle";
    const colors = ["#ff2a85", "#4338ca", "#06b6d4", "#f59e0b", "#c5a059"];
    spark.style.cssText = `
      position: absolute;
      width: ${Math.random() * 8 + 4}px;
      height: ${Math.random() * 8 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      top: 50%;
      left: 50%;
      pointer-events: none;
      filter: blur(1px);
      box-shadow: 0 0 10px currentColor;
      opacity: 0.8;
      z-index: 10;
      transform: translate(-50%, -50%);
      transition: all 1.5s cubic-bezier(0.1, 0.8, 0.3, 1);
    `;
    modal.appendChild(spark);

    // Explode particles outwards after a tiny delay
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200 + 50;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      spark.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0)`;
      spark.style.opacity = "0";
      setTimeout(() => spark.remove(), 1500);
    }, 50);
  }
}

function setupInteractiveBackgroundParticles() {
  const canvas = document.createElement("canvas");
  canvas.id = "bg-particle-canvas";
  canvas.style.cssText = "position: fixed; inset: 0; z-index: -3; pointer-events: none; opacity: 0.8;";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const COLORS = [
    { r: 197, g: 160, b: 89 },  // gold
    { r: 6,   g: 182, b: 212 }, // cyan
    { r: 255, g: 42,  b: 133 }, // pink
    { r: 67,  g: 56,  b: 202 }, // indigo
    { r: 245, g: 158, b: 11 },  // amber
  ];

  const particles = [];
  const COUNT = 60;
  const MAX_DIST = 140;
  let mouse = { x: -9999, y: -9999 };
  const REPEL_RADIUS = 100;
  const REPEL_FORCE = 1.5;

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x  = init ? Math.random() * width  : (Math.random() > 0.5 ? Math.random() * width : (Math.random() > 0.5 ? 0 : width));
      this.y  = init ? Math.random() * height : (Math.random() > 0.5 ? Math.random() * height : (Math.random() > 0.5 ? 0 : height));
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.size = Math.random() * 2.5 + 1;
      this.colorIdx = Math.floor(Math.random() * COLORS.length);
      this.pulsePeriod = 2000 + Math.random() * 3000;
      this.phaseOffset = Math.random() * Math.PI * 2;
      this.opacity = 0.4 + Math.random() * 0.4;
    }
    update() {
      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE;
        this.vx += (dx / dist) * force * 0.08;
        this.vy += (dy / dist) * force * 0.08;
      }

      // Dampen velocity
      this.vx *= 0.995;
      this.vy *= 0.995;
      // Clamp
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 1.5) { this.vx = (this.vx / speed) * 1.5; this.vy = (this.vy / speed) * 1.5; }

      this.x += this.vx;
      this.y += this.vy;

      // Wrap around
      if (this.x < -10)  this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10)  this.y = height + 10;
      if (this.y > height + 10) this.y = -10;
    }
    draw(now) {
      const c = COLORS[this.colorIdx];
      const pulse = 0.5 + 0.5 * Math.sin((now / this.pulsePeriod) * Math.PI * 2 + this.phaseOffset);
      const alpha = this.opacity * (0.6 + 0.4 * pulse);

      // Outer aura
      const auraRadius = this.size * (3 + pulse * 2);
      const auraGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, auraRadius);
      auraGrad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${alpha * 0.5})`);
      auraGrad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},${alpha * 0.8})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener("resize", () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });

  function animate(now) {
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.2;
          const ci = COLORS[particles[i].colorIdx];
          const cj = COLORS[particles[j].colorIdx];
          const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          grad.addColorStop(0, `rgba(${ci.r},${ci.g},${ci.b},${alpha})`);
          grad.addColorStop(1, `rgba(${cj.r},${cj.g},${cj.b},${alpha})`);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Mouse aura connections
      if (mouse.x !== -9999) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST * 1.6) {
          const alpha = (1 - dist / (MAX_DIST * 1.6)) * 0.35;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(197,160,89,${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    // Update & draw particles
    particles.forEach(p => { p.update(); p.draw(now); });

    // Mouse dot
    if (mouse.x !== -9999) {
      const mousePulse = 0.5 + 0.5 * Math.sin(now / 600);
      const mouseAura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 20 + mousePulse * 10);
      mouseAura.addColorStop(0, `rgba(197,160,89,${0.3 + mousePulse * 0.2})`);
      mouseAura.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 20 + mousePulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = mouseAura;
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function setupHolographicHoverSheen() {
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseXPercentage = (x / width) * 100;
    const mouseYPercentage = (y / height) * 100;
    
    card.style.setProperty("--mouse-x", `${mouseXPercentage}%`);
    card.style.setProperty("--mouse-y", `${mouseYPercentage}%`);
    
    const tiltX = ((y - height / 2) / (height / 2)) * -6;
    const tiltY = ((x - width / 2) / (width / 2)) * 6;
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    card.style.boxShadow = "0 20px 40px rgba(197, 160, 89, 0.15), 0 0 30px rgba(6, 182, 212, 0.1)";
  });

  document.addEventListener("mouseout", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;
    
    const related = e.relatedTarget;
    if (related && card.contains(related)) return;

    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    card.style.setProperty("--mouse-x", "50%");
    card.style.setProperty("--mouse-y", "50%");
    card.style.boxShadow = "";
  });
}
