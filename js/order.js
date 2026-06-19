// Custom Order JS for HARSHA METAL_FRAM_WORKS

let selectedDesign = "Custom Reference Upload";
let uploadedFileBase64 = "";
let productsCatalog = [];

document.addEventListener("DOMContentLoaded", async () => {
  const session = localStorage.getItem("user_session");
  
  if (!session) {
    document.getElementById("order-main-layout").style.display = "none";
    document.getElementById("auth-warning-overlay").style.display = "block";
    return;
  }

  // Pre-fill user phone from session if exists
  try {
    const user = JSON.parse(session);
    if (user.phone) {
      document.getElementById("customer-phone").value = user.phone;
    }
  } catch(e){}

  await loadOptionsCatalog();
  parseQueryParameters();
  setupOptionSelector();
  setupFileUpload();
  setupLiveCalculation();
  setupFormSubmission();
});

// Load catalog frame samples for quick selection in order page
async function loadOptionsCatalog() {
  const selector = document.getElementById("frame-selector-options");
  try {
    productsCatalog = await dbMock.getProducts();
    
    productsCatalog.forEach(p => {
      const option = document.createElement("div");
      option.className = "frame-option";
      option.setAttribute("data-product-name", p.name);
      option.setAttribute("data-material", p.material);
      option.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <div class="frame-option-name">${p.name}</div>
      `;
      selector.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading selector catalog:", err);
  }
}

// Parse deep linking queries
function parseQueryParameters() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  const material = params.get("material");
  
  if (ref) {
    selectedDesign = ref;
    // Set material choice dropdown if query matches
    if (material) {
      const select = document.getElementById("frame-material");
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === material.toLowerCase()) {
          select.selectedIndex = i;
          break;
        }
      }
    }
    updateSelectionUI();
  }
}

// Option selector setup
function setupOptionSelector() {
  const selector = document.getElementById("frame-selector-options");
  
  selector.addEventListener("click", (e) => {
    const option = e.target.closest(".frame-option");
    if (!option) return;
    
    // Toggle active state
    selector.querySelectorAll(".frame-option").forEach(opt => opt.classList.remove("selected"));
    option.classList.add("selected");
    
    selectedDesign = option.getAttribute("data-product-name");
    
    // Auto-update material dropdown if option has matching material
    const matchingMaterial = option.getAttribute("data-material");
    if (matchingMaterial) {
      const select = document.getElementById("frame-material");
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === matchingMaterial) {
          select.selectedIndex = i;
          break;
        }
      }
    }

    // Set file upload requirement: if custom, it is required. Otherwise, it is optional.
    const fileInput = document.getElementById("file-input");
    if (selectedDesign === "Custom Reference Upload") {
      fileInput.required = true;
    } else {
      fileInput.required = false;
    }

    updateSelectionUI();
    calculatePrice();
  });
}

function updateSelectionUI() {
  document.getElementById("summary-design").innerText = selectedDesign;
  
  // Update selection border in DOM list
  const selector = document.getElementById("frame-selector-options");
  const options = selector.querySelectorAll(".frame-option");
  options.forEach(opt => {
    if (opt.getAttribute("data-product-name") === selectedDesign) {
      opt.classList.add("selected");
    } else {
      opt.classList.remove("selected");
    }
  });
}

// File upload handler
function setupFileUpload() {
  const dropZone = document.getElementById("file-drop-zone");
  const fileInput = document.getElementById("file-input");
  const preview = document.getElementById("file-preview-container");

  // Drag operations
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelection(fileInput.files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleFileSelection(fileInput.files[0]);
    }
  });
}

function handleFileSelection(file) {
  const preview = document.getElementById("file-preview-container");
  
  if (file.size > 5 * 1024 * 1024) {
    window.showToast("File size too large. Limit is 5MB.", "error");
    document.getElementById("file-input").value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFileBase64 = e.target.result;
    
    preview.innerHTML = `
      <div class="file-preview-item">
        <img src="${uploadedFileBase64}" alt="Reference Preview">
        <button type="button" class="file-preview-remove" id="remove-preview-btn">×</button>
      </div>
    `;
    preview.style.display = "grid";
    
    // Setup remove click
    document.getElementById("remove-preview-btn").addEventListener("click", () => {
      uploadedFileBase64 = "";
      document.getElementById("file-input").value = "";
      preview.style.display = "none";
      preview.innerHTML = "";
    });
  };
  reader.readAsDataURL(file);
}

// Pricing Estimate Calculator
function calculatePrice() {
  const material = document.getElementById("frame-material").value;
  const finish = document.getElementById("frame-finish").value;
  const width = parseFloat(document.getElementById("frame-width").value) || 0;
  const height = parseFloat(document.getElementById("frame-height").value) || 0;
  const qty = parseInt(document.getElementById("frame-qty").value) || 1;

  // Multipliers
  let basePerInch = 12; // Aluminum default
  if (material === "Steel") basePerInch = 18;
  if (material === "Iron") basePerInch = 15;

  let finishMultiplier = 1.0;
  if (finish === "Anodized Gold" || finish === "Brushed Bronze") finishMultiplier = 1.25;
  if (finish === "Polished Silver") finishMultiplier = 1.15;

  // Base pricing equation: Perimeter (inches) * basePerInch * finishMultiplier
  const perimeter = 2 * (width + height);
  let unitPrice = Math.max(350, perimeter * basePerInch * finishMultiplier); // minimum price safeguard ₹350
  
  const totalPrice = unitPrice * qty;

  // Round up to nearest ₹10
  const formattedUnit = Math.ceil(unitPrice / 10) * 10;
  const formattedTotal = formattedUnit * qty;

  // Update Invoice Sidebar
  document.getElementById("summary-size").innerText = `${width}" × ${height}"`;
  document.getElementById("summary-material").innerText = material;
  document.getElementById("summary-finish").innerText = finish;
  document.getElementById("summary-unit-price").innerText = `₹${formattedUnit.toLocaleString("en-IN")}.00`;
  document.getElementById("summary-quantity").innerText = qty;
  document.getElementById("summary-total-price").innerText = `₹${formattedTotal.toLocaleString("en-IN")}.00`;

  return formattedTotal;
}

function setupLiveCalculation() {
  const inputs = ["frame-material", "frame-finish", "frame-width", "frame-height", "frame-qty"];
  inputs.forEach(id => {
    document.getElementById(id).addEventListener("input", calculatePrice);
  });
  calculatePrice(); // initial call
}

// Submission
function setupFormSubmission() {
  const form = document.getElementById("order-form");
  const submitBtn = document.getElementById("submit-order-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentSession = localStorage.getItem("user_session");
    if (!currentSession) {
      window.showToast("Session expired. Please log in again.", "error");
      return;
    }
    const user = JSON.parse(currentSession);

    // Validate reference photo if custom reference is active
    if (selectedDesign === "Custom Reference Upload" && !uploadedFileBase64) {
      window.showToast("Please upload a reference picture or design sample.", "error");
      return;
    }

    const material = document.getElementById("frame-material").value;
    const finish = document.getElementById("frame-finish").value;
    const width = parseFloat(document.getElementById("frame-width").value);
    const height = parseFloat(document.getElementById("frame-height").value);
    const qty = parseInt(document.getElementById("frame-qty").value);
    const phone = document.getElementById("customer-phone").value;
    const address = document.getElementById("shipping-address").value;
    const instructions = document.getElementById("special-instructions").value;

    const estimatedTotal = calculatePrice();

    // Loading State
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    const orderData = {
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      designStyle: selectedDesign,
      material: material,
      finish: finish,
      width: width,
      height: height,
      quantity: qty,
      phone: phone,
      address: address,
      instructions: instructions,
      estimatedPrice: estimatedTotal,
      photo: uploadedFileBase64 // Real app uploads this to storage and gets URL. Fallback uses local DataUrl.
    };

    try {
      await dbMock.addOrder(orderData);
      window.showToast("Order placed successfully!", "success");
      
      setTimeout(() => {
        window.location.href = "account.html";
      }, 1500);
    } catch (err) {
      console.error("Submit order error:", err);
      window.showToast("Error processing order. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  });
}
