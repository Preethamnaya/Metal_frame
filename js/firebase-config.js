// Firebase Configuration and Mock Service Layer for HARSHA METAL_FRAM_WORKS

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "harsha-metal-frame-works.firebaseapp.com",
  projectId: "harsha-metal-frame-works",
  storageBucket: "harsha-metal-frame-works.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Hardcoded Admin Credentials
const ADMIN_ACCOUNTS = [
  { email: "admin@harsha.com", password: "admin123", name: "Harsha Prasad (Admin)" },
  { email: "harsha@metal.com", password: "harsha123", name: "Harsha (Owner)" },
  { email: "frameworks@harsha.com", password: "frameworks123", name: "Harsha Frames Admin" }
];

let app;
let auth;
let db;
let storage;
let isFirebaseInitialized = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    isFirebaseInitialized = true;
    console.log("Firebase initialized successfully!");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase credentials are not set. Running in Demo Mode with LocalStorage fallback.");
}

// Fallback Mock Service Layer
const dbMock = {
  getProducts: async () => {
    if (isFirebaseInitialized) {
      try {
        const snapshot = await db.collection("products").get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch(e) { console.error("Firestore products read failed, using fallback:", e); }
    }
    const local = localStorage.getItem("mock_products");
    if (local) return JSON.parse(local);

    // Initial gorgeous, premium metal frame styles
    const defaultProducts = [
      {
        id: "prod_gold",
        name: "Imperial Brushed Gold Frame",
        material: "Aluminum",
        style: "Modern",
        priceRange: "₹1,499 - ₹4,899",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        description: "Anodized imperial gold with subtle brushed texture. Adds high-end gallery aesthetics to canvases."
      },
      {
        id: "prod_steel",
        name: "Industrial Chrome Steel Frame",
        material: "Steel",
        style: "Rustic",
        priceRange: "₹1,899 - ₹5,499",
        image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80",
        description: "Hand-molded raw steel profile with industrial bolts and clear powder coat protection."
      },
      {
        id: "prod_black",
        name: "Midnight Obsidian Matte Frame",
        material: "Iron",
        style: "Classic",
        priceRange: "₹1,299 - ₹3,999",
        image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        description: "Sandblasted heavy iron frame in carbon matte black. Ultra-slim profile for clean layouts."
      },
      {
        id: "prod_bronze",
        name: "Antic Brushed Copper Frame",
        material: "Steel",
        style: "Classic",
        priceRange: "₹2,199 - ₹6,299",
        image: "https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=800&auto=format&fit=crop&q=80",
        description: "Rich copper tint with dark highlights, creating a vintage Renaissance-style framing look."
      }
    ];
    localStorage.setItem("mock_products", JSON.stringify(defaultProducts));
    return defaultProducts;
  },

  addProduct: async (product) => {
    if (isFirebaseInitialized) {
      try {
        const docRef = await db.collection("products").add(product);
        return { id: docRef.id, ...product };
      } catch(e) { console.error("Firestore add failed, using fallback:", e); }
    }
    const products = await dbMock.getProducts();
    const newProduct = { id: "prod_" + Date.now(), ...product };
    products.push(newProduct);
    localStorage.setItem("mock_products", JSON.stringify(products));
    return newProduct;
  },

  deleteProduct: async (id) => {
    if (isFirebaseInitialized) {
      try {
        await db.collection("products").doc(id).delete();
        return;
      } catch(e) { console.error("Firestore delete failed, using fallback:", e); }
    }
    let products = await dbMock.getProducts();
    products = products.filter(p => p.id !== id);
    localStorage.setItem("mock_products", JSON.stringify(products));
  },

  getOrders: async () => {
    if (isFirebaseInitialized) {
      try {
        const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch(e) { console.error("Firestore orders read failed:", e); }
    }
    const local = localStorage.getItem("mock_orders") || "[]";
    return JSON.parse(local).sort((a, b) => b.createdAt - a.createdAt);
  },

  addOrder: async (order) => {
    const enrichedOrder = {
      ...order,
      status: "pending",
      createdAt: Date.now()
    };
    if (isFirebaseInitialized) {
      try {
        const docRef = await db.collection("orders").add(enrichedOrder);
        return { id: docRef.id, ...enrichedOrder };
      } catch(e) { console.error("Firestore add order failed:", e); }
    }
    const local = localStorage.getItem("mock_orders") || "[]";
    const orders = JSON.parse(local);
    const newOrder = { id: "order_" + Date.now(), ...enrichedOrder };
    orders.push(newOrder);
    localStorage.setItem("mock_orders", JSON.stringify(orders));
    return newOrder;
  },

  updateOrderStatus: async (id, status) => {
    if (isFirebaseInitialized) {
      try {
        await db.collection("orders").doc(id).update({ status });
        return;
      } catch(e) { console.error("Firestore status update failed:", e); }
    }
    const local = localStorage.getItem("mock_orders") || "[]";
    const orders = JSON.parse(local);
    const orderIdx = orders.findIndex(o => o.id === id);
    if (orderIdx !== -1) {
      orders[orderIdx].status = status;
      localStorage.setItem("mock_orders", JSON.stringify(orders));
    }
  },

  deleteOrder: async (id) => {
    if (isFirebaseInitialized) {
      try {
        await db.collection("orders").doc(id).delete();
        return;
      } catch(e) { console.error("Firestore delete order failed:", e); }
    }
    const local = localStorage.getItem("mock_orders") || "[]";
    let orders = JSON.parse(local);
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem("mock_orders", JSON.stringify(orders));
  }
};
