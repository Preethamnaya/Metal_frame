// Account / My Orders Page JS — HARSHA METAL_FRAM_WORKS

const STATUS_STEPS = ["pending", "in progress", "ready", "delivered"];

const STATUS_META = {
  "pending":     { label: "Pending",     emoji: "⏳", color: "#f59e0b" },
  "in progress": { label: "In Progress", emoji: "⚙️",  color: "#3b82f6" },
  "ready":       { label: "Ready",       emoji: "✅",  color: "#10b981" },
  "delivered":   { label: "Delivered",   emoji: "🚀",  color: "#8b5cf6" },
  "cancelled":   { label: "Cancelled",   emoji: "❌",  color: "#ef4444" }
};

let userOrders = [];
let refreshInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  const session = localStorage.getItem("user_session");
  if (!session) { window.location.href = "auth.html"; return; }

  const user = JSON.parse(session);
  document.getElementById("profile-name").innerText        = user.name || "User";
  document.getElementById("profile-email").innerText       = user.email || "";
  document.getElementById("profile-avatar-char").innerText = (user.avatar || user.name?.charAt(0) || "U").toString();

  loadUserOrders(user.id);
  setupModalEvents();
  setup3DFloatingFrames();
  setupBouncingIcons();
  setupSparkleTrail();

  // Auto-refresh every 10 seconds to pick up admin status changes
  refreshInterval = setInterval(() => {
    loadUserOrders(user.id, true /* silent */);
  }, 10000);
});

// ───────── LOAD ORDERS ─────────
async function loadUserOrders(userId, silent = false) {
  const container  = document.getElementById("orders-container");
  const emptyState = document.getElementById("orders-empty-state");

  try {
    const fresh = await dbMock.getOrders(userId);

    // Check if anything changed (silent refresh)
    if (silent) {
      const changed = fresh.some((o, i) => {
        const old = userOrders.find(u => (u._id || u.id) === (o._id || o.id));
        return !old || old.status !== o.status;
      });
      if (!changed && fresh.length === userOrders.length) return;
      if (changed) window.showToast("📦 Your order status has been updated!", "info");
    }

    userOrders = fresh;

    // Update count badge
    const badge = document.getElementById("order-count-badge");
    if (badge) badge.innerText = userOrders.length ? `${userOrders.length} order${userOrders.length > 1 ? "s" : ""}` : "";

    container.innerHTML = "";

    if (!userOrders.length) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    userOrders.forEach((order, idx) => {
      const card = buildOrderCard(order, idx);
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading orders:", err);
    if (!silent) window.showToast("Failed to load your orders.", "error");
  }
}

// ───────── BUILD ORDER CARD ─────────
function buildOrderCard(order, idx) {
  const card = document.createElement("div");
  card.className = "order-card-ultra";
  card.style.animationDelay = `${idx * 0.1}s`;

  const st = STATUS_META[order.status] || STATUS_META["pending"];
  const isCancelled = order.status === "cancelled";
  const oid = (order._id || order.id || "").slice(-8).toUpperCase();

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });

  // Status stepper (not shown for cancelled)
  const stepperHtml = isCancelled ? "" : buildStatusStepper(order.status);

  // Cancel notice
  const cancelHtml = isCancelled ? `
    <div class="cancel-notice">
      <div class="cancel-notice-title">❌ Order Cancelled</div>
      <div class="cancel-notice-reason">
        <strong>Reason:</strong> ${order.cancelReason || "Cancelled by administrator"}
      </div>
    </div>` : "";

  card.innerHTML = `
    <!-- Card top bar already via CSS ::before -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
      <div>
        <h3 style="font-family:var(--font-heading); font-size:1.1rem; color:var(--gold); margin-bottom:4px;">${order.designStyle}</h3>
        <span style="font-size:0.72rem; font-family:'Courier New',monospace; color:var(--text-muted); letter-spacing:1px;">ID: #${oid} · ${formattedDate}</span>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
        <span style="font-size:0.78rem; padding:4px 12px; border-radius:50px; background:${st.color}22; color:${st.color}; border:1px solid ${st.color}44; font-weight:700;">
          ${st.emoji} ${st.label}
        </span>
        <span style="font-size:1rem; color:var(--gold); font-weight:700;">₹${order.estimatedPrice.toLocaleString("en-IN")}</span>
      </div>
    </div>

    ${stepperHtml}
    ${cancelHtml}

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin:16px 0; padding:16px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
      <div><div style="font-size:0.67rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Dimensions</div><div style="font-size:0.9rem;">${order.width}" × ${order.height}"</div></div>
      <div><div style="font-size:0.67rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Material</div><div style="font-size:0.9rem;">${order.material}</div></div>
      <div><div style="font-size:0.67rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Finish</div><div style="font-size:0.9rem;">${order.finish}</div></div>
      <div><div style="font-size:0.67rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Qty</div><div style="font-size:0.9rem;">${order.quantity}</div></div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <span style="font-size:0.75rem; color:var(--text-muted);">
        ${isCancelled ? "❌ Order was cancelled." : "✨ Crafting starts after admin confirms specs"}
      </span>
      <button class="btn btn-ghost btn-sm view-details-btn" style="border-color:rgba(197,160,89,0.3);">View Details →</button>
    </div>
  `;

  card.querySelector(".view-details-btn").addEventListener("click", () => openOrderDetailModal(order));
  return card;
}

// ───────── STATUS STEPPER ─────────
function buildStatusStepper(currentStatus) {
  const stepIdx = STATUS_STEPS.indexOf(currentStatus);
  const steps   = [
    { key: "pending",     label: "Pending",  icon: "⏳" },
    { key: "in progress", label: "Making",   icon: "⚙️" },
    { key: "ready",       label: "Ready",    icon: "✅" },
    { key: "delivered",   label: "Delivered",icon: "🚀" }
  ];

  const items = steps.map((s, i) => {
    const isDone   = i < stepIdx;
    const isActive = i === stepIdx;
    const cls      = isDone ? "done" : isActive ? "active" : "";
    return `
      <div class="step-item ${cls}">
        <div class="step-dot">${isDone ? "✓" : s.icon}</div>
        <div class="step-label">${s.label}</div>
      </div>`;
  }).join("");

  return `<div class="status-stepper">${items}</div>`;
}

// ───────── ORDER DETAIL MODAL ─────────
function openOrderDetailModal(order) {
  const modal = document.getElementById("order-detail-modal");
  const st    = STATUS_META[order.status] || STATUS_META["pending"];
  const oid   = (order._id || order.id || "").slice(-10).toUpperCase();

  document.getElementById("modal-order-id").innerText = `📋 Order #${oid}`;

  // Status
  const statusEl = document.getElementById("modal-status");
  statusEl.innerHTML = `<span style="color:${st.color}; font-weight:700; font-size:1rem;">${st.emoji} ${st.label}</span>`;

  document.getElementById("modal-price").innerText   = `₹${order.estimatedPrice.toLocaleString("en-IN")}.00`;
  document.getElementById("modal-design").innerText  = order.designStyle;
  document.getElementById("modal-size").innerText    = `${order.width}" × ${order.height}"`;
  document.getElementById("modal-material").innerText= order.material;
  document.getElementById("modal-finish").innerText  = order.finish;
  document.getElementById("modal-quantity").innerText= order.quantity;
  document.getElementById("modal-phone").innerText   = order.phone || "Not specified";
  document.getElementById("modal-instructions").innerText = order.instructions || "No instructions";
  document.getElementById("modal-address").innerText = order.address;

  // Cancel notice in modal
  const cancelNotice = document.getElementById("modal-cancel-notice");
  if (order.status === "cancelled") {
    cancelNotice.style.display = "block";
    cancelNotice.innerHTML = `
      <div class="cancel-notice" style="margin-bottom:16px;">
        <div class="cancel-notice-title">❌ Order Cancelled by Administrator</div>
        <div class="cancel-notice-reason">
          <strong>Reason:</strong> ${order.cancelReason || "Cancelled by admin"}
        </div>
      </div>`;
  } else {
    cancelNotice.style.display = "none";
  }

  // Photo
  const imgC = document.getElementById("modal-photo-container");
  const imgE = document.getElementById("modal-photo");
  if (order.photo) { imgE.src = order.photo; imgC.style.display = "block"; }
  else { imgC.style.display = "none"; }

  // Actions
  const actionsEl = document.getElementById("modal-actions-container");
  actionsEl.innerHTML = "";
  if (order.status === "pending") {
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-full";
    cancelBtn.style.cssText = "background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.4);color:#ef4444;margin-top:8px;";
    cancelBtn.innerText = "❌ Cancel This Order";
    cancelBtn.addEventListener("click", () => userCancelOrder(order._id || order.id));
    actionsEl.appendChild(cancelBtn);
  }

  modal.style.display = "flex";
}

// ───────── USER CANCEL ORDER ─────────
async function userCancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;
  try {
    await dbMock.updateOrderStatus(orderId, "cancelled", "Cancelled by customer");
    window.showToast("Order cancelled.", "info");
    document.getElementById("order-detail-modal").style.display = "none";
    const session = localStorage.getItem("user_session");
    if (session) loadUserOrders(JSON.parse(session).id);
  } catch(err) {
    window.showToast("Failed to cancel.", "error");
  }
}

// ───────── MODAL EVENTS ─────────
function setupModalEvents() {
  const modal    = document.getElementById("order-detail-modal");
  const closeBtn = document.getElementById("modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
  if (modal) modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
}

// ═══════════════════════════════════════════════════
//  3D FLOATING FRAMES BACKGROUND
// ═══════════════════════════════════════════════════
function setup3DFloatingFrames() {
  const configs = [
    { w:120, h:90,  color:"rgba(197,160,89,0.5)", top:"10%",  left:"4%",  delay:"0s",   duration:"9s"  },
    { w:80,  h:100, color:"rgba(6,182,212,0.4)",  top:"60%",  left:"2%",  delay:"2s",   duration:"12s" },
    { w:140, h:100, color:"rgba(139,92,246,0.35)",top:"20%",  right:"5%", delay:"1s",   duration:"10s" },
    { w:60,  h:80,  color:"rgba(245,158,11,0.4)", top:"70%",  right:"3%", delay:"3s",   duration:"14s" },
    { w:100, h:70,  color:"rgba(255,42,133,0.3)", top:"45%",  left:"1%",  delay:"1.5s", duration:"11s" },
  ];

  configs.forEach(c => {
    const div = document.createElement("div");
    div.className = "frame-float";
    div.style.width    = c.w + "px";
    div.style.height   = c.h + "px";
    div.style.borderColor = c.color;
    div.style.top      = c.top;
    if (c.left)  div.style.left  = c.left;
    if (c.right) div.style.right = c.right;
    div.style.animationDelay    = c.delay;
    div.style.animationDuration = `1s, ${c.duration}`;

    // Inner shine
    div.style.boxShadow = `inset 0 0 20px ${c.color.replace(')', ',0.3)').replace('rgba', 'rgba')}, 0 0 15px ${c.color}`;
    div.style.background = `linear-gradient(135deg, ${c.color.replace(/[\d.]+\)$/, '0.05)')} 0%, transparent 100%)`;

    document.body.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
//  BOUNCING BACKGROUND ICONS
// ═══════════════════════════════════════════════════
function setupBouncingIcons() {
  const icons = ["🖼️","⭐","✨","💎","🎨","🏆","🌟","🔮","💫","🎯","🪙","🏅"];
  const count = 10;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "bounce-icon";
    el.innerText = icons[Math.floor(Math.random() * icons.length)];
    el.style.left     = `${Math.random() * 95}%`;
    el.style.fontSize = `${1.2 + Math.random() * 1.5}rem`;
    el.style.animationDuration  = `${8 + Math.random() * 12}s`;
    el.style.animationDelay     = `-${Math.random() * 15}s`;
    document.body.appendChild(el);
  }
}

// ═══════════════════════════════════════════════════
//  SPARKLE TRAIL ON CURSOR
// ═══════════════════════════════════════════════════
function setupSparkleTrail() {
  const COLORS = ["#c5a059","#06b6d4","#ff2a85","#a78bfa","#f59e0b"];
  let lastSparkle = 0;

  document.addEventListener("mousemove", e => {
    const now = Date.now();
    if (now - lastSparkle < 50) return;
    lastSparkle = now;

    const spark = document.createElement("div");
    spark.className = "sparkle";
    const size = 4 + Math.random() * 6;
    spark.style.cssText = `
      left: ${e.clientX - size / 2}px;
      top:  ${e.clientY - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
      box-shadow: 0 0 ${size * 2}px currentColor;
      animation-duration: ${0.5 + Math.random() * 0.5}s;
    `;
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 900);
  });
}
