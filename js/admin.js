// Admin dashboard JS for HARSHA METAL_FRAM_WORKS

let allOrders = [];
let allCatalog = [];
let uploadedProductBase64 = "";

// Cancellation reason modal state
let pendingCancelOrderId = null;
let pendingCancelDropdown = null;
let pendingPrevStatus = "pending";

const CANCEL_REASONS = [
  "Payment Failed",
  "Duplicate Order",
  "Out of Stock / Material Unavailable",
  "Too Many Orders — Capacity Full",
  "Customer Request",
  "Incorrect Order Details",
  "Other"
];

const STATUS_LABELS = {
  "pending":     { label: "Pending",     emoji: "⏳", color: "#f59e0b" },
  "in progress": { label: "In Progress", emoji: "⚙️", color: "#3b82f6" },
  "ready":       { label: "Ready",       emoji: "✅", color: "#10b981" },
  "delivered":   { label: "Delivered",   emoji: "🚀", color: "#8b5cf6" },
  "cancelled":   { label: "Cancelled",   emoji: "❌", color: "#ef4444" }
};

document.addEventListener("DOMContentLoaded", () => {
  const session = localStorage.getItem("user_session");
  if (!session) { showAccessDenied(); return; }

  try {
    const adminUser = JSON.parse(session);
    if (adminUser.isAdmin !== true) { showAccessDenied(); return; }
    document.getElementById("admin-user-tag").innerText = `Admin: ${adminUser.name}`;
  } catch(e) { showAccessDenied(); return; }

  initTabs();
  loadDashboardData();
  setupProductForm();
  setupProductImageUpload();
  setupModalEvents();
  setupCancelReasonModal();

  // Real-time order polling every 8 seconds
  setInterval(loadOrdersRealtime, 8000);
});

function showAccessDenied() {
  document.getElementById("admin-main-dashboard").style.display = "none";
  document.getElementById("admin-guard-overlay").style.display = "flex";
}

function initTabs() {
  const links = document.querySelectorAll(".admin-nav-link[data-target]");
  const sections = document.querySelectorAll(".admin-section");
  links.forEach(link => {
    link.addEventListener("click", () => {
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const targetId = link.getAttribute("data-target");
      sections.forEach(s => s.id === targetId ? s.classList.add("active") : s.classList.remove("active"));
    });
  });
}

async function loadDashboardData() {
  try {
    allOrders  = await dbMock.getOrders();
    allCatalog = await dbMock.getProducts();
    renderOverview();
    renderOrdersQueue();
    renderCatalogList();
  } catch (err) {
    console.error("Dashboard load failed:", err);
    window.showToast("Failed to fetch dashboard data.", "error");
  }
}

async function loadOrdersRealtime() {
  try {
    const updated = await dbMock.getOrders();
    if (updated.length !== allOrders.length) {
      window.showToast("🆕 New customer order received!", "info");
      allOrders = updated;
      renderOverview();
      renderOrdersQueue();
    }
  } catch(e) {}
}

function renderOverview() {
  const total   = allOrders.length;
  const pending = allOrders.filter(o => o.status === "pending").length;
  const revenue = allOrders.filter(o => o.status !== "cancelled")
                            .reduce((s, o) => s + o.estimatedPrice, 0);

  document.getElementById("stat-total-orders").innerText    = total;
  document.getElementById("stat-pending-orders").innerText  = pending;
  document.getElementById("stat-catalog-items").innerText   = allCatalog.length;
  document.getElementById("stat-estimated-revenue").innerText = `₹${revenue.toLocaleString("en-IN")}`;

  const logsList = document.getElementById("admin-activity-logs");
  logsList.innerHTML = "";
  if (!allOrders.length) {
    logsList.innerHTML = `<li style="color:var(--text-secondary);font-size:0.9rem;">⏳ No orders yet.</li>`;
    return;
  }
  allOrders.slice(0, 7).forEach(o => {
    const time = new Date(o.createdAt).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
    const st   = STATUS_LABELS[o.status] || STATUS_LABELS["pending"];
    const li   = document.createElement("li");
    li.style.cssText = "margin-bottom:10px;font-size:0.875rem;display:flex;align-items:center;gap:8px;";
    li.innerHTML = `
      <span style="color:${st.color};font-size:1rem;">${st.emoji}</span>
      <span><strong>${o.customerName}</strong> — ${o.designStyle} &nbsp;
        <span style="font-size:0.75rem;color:var(--text-muted);">${time}</span>
      </span>
      <span style="margin-left:auto;font-size:0.75rem;padding:2px 8px;border-radius:50px;background:${st.color}22;color:${st.color};border:1px solid ${st.color}44;">${st.label}</span>
    `;
    logsList.appendChild(li);
  });
}

function renderOrdersQueue() {
  const tbody      = document.getElementById("admin-orders-table-body");
  const emptyState = document.getElementById("admin-orders-empty");
  tbody.innerHTML  = "";

  if (!allOrders.length) {
    emptyState.style.display = "block";
    tbody.parentElement.parentElement.style.display = "none";
    return;
  }
  emptyState.style.display = "none";
  tbody.parentElement.parentElement.style.display = "block";

  allOrders.forEach(order => {
    const tr = document.createElement("tr");
    const st = STATUS_LABELS[order.status] || STATUS_LABELS["pending"];

    const statusSelectHtml = `
      <select class="form-select status-select-dropdown"
        style="padding:6px 10px;font-size:0.82rem;width:140px;border-color:${st.color}66;"
        data-order-id="${order._id || order.id}">
        ${Object.entries(STATUS_LABELS).map(([val, info]) =>
          `<option value="${val}" ${order.status === val ? "selected" : ""}>${info.emoji} ${info.label}</option>`
        ).join("")}
      </select>`;

    const cancelNote = (order.status === "cancelled" && order.cancelReason)
      ? `<div style="margin-top:4px;font-size:0.7rem;color:#ef4444;background:rgba(239,68,68,0.08);padding:3px 8px;border-radius:4px;border-left:2px solid #ef4444;">
           ⚠️ ${order.cancelReason}
         </div>`
      : "";

    tr.innerHTML = `
      <td>
        <strong>${order.customerName}</strong><br>
        <span style="font-size:0.72rem;color:var(--text-muted);">${order.customerEmail}</span>
      </td>
      <td>
        <span style="color:var(--gold);">${order.designStyle}</span><br>
        <span style="font-size:0.78rem;color:var(--text-muted);">${order.width}" × ${order.height}" · ${order.material} · ${order.finish}</span>
      </td>
      <td style="font-weight:700;color:var(--gold);">₹${order.estimatedPrice.toLocaleString("en-IN")}</td>
      <td>
        ${statusSelectHtml}
        ${cancelNote}
      </td>
      <td>
        <div class="flex gap-sm">
          <button class="btn btn-ghost btn-sm view-spec-btn">📋 View</button>
          <button class="btn btn-danger btn-sm delete-order-btn">🗑️</button>
        </div>
      </td>
    `;

    // Status dropdown change
    tr.querySelector(".status-select-dropdown").addEventListener("change", async (e) => {
      const newStatus = e.target.value;
      const ordId     = e.target.getAttribute("data-order-id");

      if (newStatus === "cancelled") {
        // Show cancel reason modal before saving
        pendingCancelOrderId  = ordId;
        pendingCancelDropdown = e.target;
        pendingPrevStatus     = order.status;
        openCancelReasonModal(order.customerName);
      } else {
        try {
          await dbMock.updateOrderStatus(ordId, newStatus);
          window.showToast(`✅ Status updated to "${STATUS_LABELS[newStatus].label}"`, "success");
          loadDashboardData();
        } catch(err) {
          window.showToast("Status update failed.", "error");
          e.target.value = order.status; // revert
        }
      }
    });

    tr.querySelector(".view-spec-btn").addEventListener("click", () => openAdminSpecsModal(order));

    tr.querySelector(".delete-order-btn").addEventListener("click", async () => {
      if (!confirm(`Delete order by ${order.customerName}?`)) return;
      try {
        await dbMock.deleteOrder(order._id || order.id);
        window.showToast("Order deleted.", "info");
        loadDashboardData();
      } catch(e) {
        window.showToast("Failed to delete.", "error");
      }
    });

    tbody.appendChild(tr);
  });
}

// ============ CANCEL REASON MODAL ============
function setupCancelReasonModal() {
  const overlay = document.getElementById("cancel-reason-modal");
  if (!overlay) return;

  document.getElementById("cancel-reason-confirm").addEventListener("click", async () => {
    const reasonSelect = document.getElementById("cancel-reason-select");
    const reasonOther  = document.getElementById("cancel-reason-other");
    let reason = reasonSelect.value;
    if (reason === "Other") reason = reasonOther.value.trim() || "Other";

    if (!reason) {
      window.showToast("Please select a cancellation reason.", "error");
      return;
    }

    try {
      await dbMock.updateOrderStatus(pendingCancelOrderId, "cancelled", reason);
      window.showToast(`❌ Order cancelled — Reason: ${reason}`, "info");
      closeCancelReasonModal();
      loadDashboardData();
    } catch(err) {
      window.showToast("Cancel failed.", "error");
    }
  });

  document.getElementById("cancel-reason-dismiss").addEventListener("click", () => {
    // Revert dropdown
    if (pendingCancelDropdown) pendingCancelDropdown.value = pendingPrevStatus;
    closeCancelReasonModal();
  });

  document.getElementById("cancel-reason-select").addEventListener("change", (e) => {
    const otherBox = document.getElementById("cancel-reason-other-box");
    otherBox.style.display = e.target.value === "Other" ? "block" : "none";
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      if (pendingCancelDropdown) pendingCancelDropdown.value = pendingPrevStatus;
      closeCancelReasonModal();
    }
  });
}

function openCancelReasonModal(customerName) {
  const overlay = document.getElementById("cancel-reason-modal");
  document.getElementById("cancel-reason-customer").innerText = customerName;
  document.getElementById("cancel-reason-select").value = CANCEL_REASONS[0];
  document.getElementById("cancel-reason-other-box").style.display = "none";
  document.getElementById("cancel-reason-other").value = "";
  overlay.style.display = "flex";
}

function closeCancelReasonModal() {
  document.getElementById("cancel-reason-modal").style.display = "none";
  pendingCancelOrderId  = null;
  pendingCancelDropdown = null;
}

// ============ CATALOG ============
function renderCatalogList() {
  const container = document.getElementById("admin-catalog-list");
  container.innerHTML = "";
  if (!allCatalog.length) {
    container.innerHTML = `<p style="font-size:0.9rem;color:var(--text-muted);">No products yet. Create your first design!</p>`;
    return;
  }
  allCatalog.forEach(p => {
    const item = document.createElement("div");
    item.className = "card";
    item.style.cssText = "display:flex;align-items:center;gap:16px;padding:12px;";
    item.innerHTML = `
      <img src="${p.image}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius-sm);border:1px solid var(--border);">
      <div style="flex:1;">
        <h4 style="font-family:var(--font-heading);font-size:1rem;color:var(--gold);">${p.name}</h4>
        <span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${p.material} — ${p.style}</span>
        <div style="font-size:0.85rem;font-weight:600;margin-top:2px;">₹${p.basePricePerSqInch}/sq.in</div>
      </div>
      <button class="btn btn-danger btn-sm del-prod-btn" style="padding:6px 12px;font-size:0.75rem;">Delete</button>
    `;
    item.querySelector(".del-prod-btn").addEventListener("click", async () => {
      if (!confirm(`Remove "${p.name}"?`)) return;
      try {
        await dbMock.deleteProduct(p._id || p.id);
        window.showToast("Product deleted.", "info");
        loadDashboardData();
      } catch(e) { window.showToast("Delete failed.", "error"); }
    });
    container.appendChild(item);
  });
}

// ============ PRODUCT UPLOAD ============
function setupProductImageUpload() {
  const dropZone = document.getElementById("prod-file-drop");
  const fileInput = document.getElementById("prod-file-input");
  const preview   = document.getElementById("prod-file-preview");
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;
    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) { window.showToast("Max 5MB image.", "error"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      uploadedProductBase64 = e.target.result;
      preview.innerHTML = `<div class="file-preview-item" style="max-width:100px;"><img src="${uploadedProductBase64}"></div>`;
      preview.style.display = "grid";
    };
    reader.readAsDataURL(file);
  });
}

function setupProductForm() {
  const form      = document.getElementById("admin-add-product-form");
  const submitBtn = document.getElementById("prod-submit-btn");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!uploadedProductBase64) { window.showToast("Upload a product image first.", "error"); return; }

    submitBtn.disabled = true;
    submitBtn.innerText = "Adding...";

    const newProduct = {
      name:               document.getElementById("prod-name").value.trim(),
      material:           document.getElementById("prod-material").value,
      style:              document.getElementById("prod-style").value,
      basePricePerSqInch: parseFloat(document.getElementById("prod-price").value),
      description:        document.getElementById("prod-desc").value.trim(),
      image:              uploadedProductBase64
    };

    try {
      await dbMock.addProduct(newProduct);
      window.showToast("Product added to catalog!", "success");
      form.reset();
      uploadedProductBase64 = "";
      document.getElementById("prod-file-preview").style.display = "none";
      loadDashboardData();
    } catch(err) {
      window.showToast("Failed to add product.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Add Design to Catalog";
    }
  });
}

// ============ ORDER SPECS MODAL ============
function openAdminSpecsModal(order) {
  const modal = document.getElementById("admin-order-modal");
  const st    = STATUS_LABELS[order.status] || STATUS_LABELS["pending"];

  document.getElementById("admin-modal-cname").innerText    = order.customerName;
  document.getElementById("admin-modal-cemail").innerText   = order.customerEmail;
  document.getElementById("admin-modal-cphone").innerText   = order.phone || "Not specified";
  document.getElementById("admin-modal-caddress").innerText = order.address;
  document.getElementById("admin-modal-csize").innerText    = `${order.width}" × ${order.height}" inches`;
  document.getElementById("admin-modal-cmaterial").innerText= `${order.material} (${order.finish})`;
  document.getElementById("admin-modal-cnotes").innerText   = order.instructions || "None";

  // Status row
  const statusRow = document.getElementById("admin-modal-status");
  if (statusRow) {
    statusRow.innerHTML = `<span style="color:${st.color};font-weight:700;font-size:1rem;">${st.emoji} ${st.label}</span>`;
    if (order.status === "cancelled" && order.cancelReason) {
      statusRow.innerHTML += `<div style="margin-top:6px;font-size:0.8rem;color:#ef4444;background:rgba(239,68,68,0.1);padding:6px 10px;border-radius:6px;border-left:3px solid #ef4444;">
        <strong>Cancellation Reason:</strong> ${order.cancelReason}
      </div>`;
    }
  }

  // Photo
  const imgC = document.getElementById("admin-modal-photo-container");
  const imgE = document.getElementById("admin-modal-photo");
  if (order.photo) { imgE.src = order.photo; imgC.style.display = "block"; }
  else { imgC.style.display = "none"; }

  // WhatsApp link
  const waBtn = document.getElementById("admin-modal-whatsapp-link");
  const num   = (order.phone || "7411464311").replace(/\D/g, "");
  const msg   = `Hello ${order.customerName},\nThis is Harsha Metal Frame Works.\nYour order for *${order.designStyle}* is now *${st.label}*.\nSize: ${order.width}" × ${order.height}". Estimated: ₹${order.estimatedPrice.toLocaleString("en-IN")}.\nThank you! 🙏`;
  waBtn.href = `https://wa.me/91${num}?text=${encodeURIComponent(msg)}`;

  modal.classList.add("active");
}

function setupModalEvents() {
  const modal    = document.getElementById("admin-order-modal");
  const closeBtn = document.getElementById("admin-modal-close");
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("active"); });
  }
}
