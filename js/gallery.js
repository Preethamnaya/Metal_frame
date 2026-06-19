// Gallery page interactivity for HARSHA METAL_FRAM_WORKS

let allProducts = [];
let activeFilter = "all";
let searchKeyword = "";

document.addEventListener("DOMContentLoaded", () => {
  loadGalleryData();
  setupFilterEvents();
  setupSearchEvents();
  setupModalEvents();
});

// Load products
async function loadGalleryData() {
  const skeleton = document.getElementById("loading-skeleton");
  const grid = document.getElementById("gallery-grid");
  
  try {
    allProducts = await dbMock.getProducts();
    
    // Hide skeleton and show grid
    if (skeleton) skeleton.style.display = "none";
    if (grid) grid.style.display = "grid";
    
    renderGallery();
  } catch (error) {
    console.error("Error loading products:", error);
    window.showToast("Failed to load catalog. Please check your internet connection.", "error");
  }
}

// Render grid elements
function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  const emptyState = document.getElementById("empty-state");
  grid.innerHTML = "";

  // Apply filters
  const filtered = allProducts.filter(product => {
    const matchesFilter = activeFilter === "all" || product.material.toLowerCase() === activeFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                          product.material.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          (product.style && product.style.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  emptyState.style.display = "none";

  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "card product-card reveal active";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80'">
      <div class="card-body">
        <div class="material-tags">
          <span class="material-tag">${product.material}</span>
          ${product.style ? `<span class="material-tag" style="background:rgba(212,168,67,0.1); border-color:rgba(212,168,67,0.2); color:var(--gold);">${product.style}</span>` : ""}
        </div>
        <h3 class="card-title">${product.name}</h3>
        <p class="card-desc">${product.description || ""}</p>
      </div>
      <div class="card-footer">
        <span class="card-price">${product.priceRange || "Contact for Quote"}</span>
        <button class="btn btn-primary btn-sm view-details-btn">View Details</button>
      </div>
    `;

    // Click card opens modal
    card.querySelector(".view-details-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openDetailsModal(product);
    });
    card.addEventListener("click", () => {
      openDetailsModal(product);
    });

    grid.appendChild(card);
  });
}

// Setup Material Chips
function setupFilterEvents() {
  const chips = document.querySelectorAll("#filter-container .chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      // Remove active from all
      chips.forEach(c => c.classList.remove("active"));
      // Add active to clicked
      chip.classList.add("active");
      
      activeFilter = chip.getAttribute("data-material");
      renderGallery();
    });
  });
}

// Setup Search
function setupSearchEvents() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchKeyword = e.target.value;
      renderGallery();
    });
  }
}

// Details Modal Manager
function openDetailsModal(product) {
  const modal = document.getElementById("product-modal");
  
  document.getElementById("modal-title").innerText = product.name;
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-image").alt = product.name;
  document.getElementById("modal-desc").innerText = product.description || "Premium custom fabricated metal framework. Built matching specific height and width requests with elegant anodized or brushed detailing.";
  document.getElementById("modal-price").innerText = product.priceRange || "Contact for Quote";
  
  const tagsContainer = document.getElementById("modal-tags");
  tagsContainer.innerHTML = `
    <span class="material-tag">${product.material}</span>
    ${product.style ? `<span class="material-tag" style="background:rgba(212,168,67,0.1); border-color:rgba(212,168,67,0.2); color:var(--gold);">${product.style}</span>` : ""}
  `;
  
  const orderBtn = document.getElementById("modal-order-btn");
  orderBtn.href = `order.html?ref=${encodeURIComponent(product.name)}&material=${encodeURIComponent(product.material)}&style=${encodeURIComponent(product.style || '')}`;
  
  modal.classList.add("active");
}

function setupModalEvents() {
  const modal = document.getElementById("product-modal");
  const closeBtn = document.getElementById("modal-close");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    // Close when clicking overlay background
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}
