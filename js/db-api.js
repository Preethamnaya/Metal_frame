// MONGODB API REST Connector wrapper for HARSHA METAL_FRAM_WORKS
// This replaces Firebase configuration scripts and maps mock methods directly to your Node server database API.

const isFirebaseInitialized = false;

// Hardcoded Admin Credentials matching for Admin Login Page verification
const ADMIN_ACCOUNTS = [
  { email: "aprretham@gmail.com", password: "frame123", name: "Preetham (Admin)" },
  { email: "aprrethamgmail.com", password: "frame123", name: "Preetham (Admin)" },
  { email: "ppreetu63@gmail.com", password: "frame123", name: "Preetu (Admin)" }
];

const dbMock = {
  // Products REST API Call
  getProducts: async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("HTTP error reading products catalog");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("MongoDB fetch catalog failed, using default offline data:", err);
      return [];
    }
  },

  addProduct: async (product) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error("Failed to write product to MongoDB");
    return await res.json();
  },

  deleteProduct: async (id) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete product in MongoDB");
    return await res.json();
  },

  // Orders REST API Call
  getOrders: async (userId = null) => {
    try {
      let url = '/api/orders';
      if (userId) url += `?userId=${encodeURIComponent(userId)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP error reading orders queue");
      const data = await res.json();
      return data;
    } catch(err) {
      console.error("MongoDB fetch orders failed:", err);
      return [];
    }
  },

  addOrder: async (order) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error("Failed to post order to MongoDB server");
    return await res.json();
  },

  updateOrderStatus: async (id, status, cancelReason = '') => {
    const body = { status };
    if (cancelReason) body.cancelReason = cancelReason;
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Failed to update status in MongoDB");
    return await res.json();
  },

  deleteOrder: async (id) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete order entry in MongoDB");
    return await res.json();
  },

  // Contact REST API Call
  addContactMessage: async (msg) => {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
    if (!res.ok) throw new Error("Failed to submit support message to MongoDB");
    return await res.json();
  }
};
