// Full-Stack Express Server & MongoDB Connection for HARSHA METAL_FRAM_WORKS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Mongo Atlas URL (Provided by User)
const MONGODB_URI = "mongodb+srv://preetham:mongodb123@ourproject.lh011ok.mongodb.net/harsha_metal_frames?retryWrites=true&w=majority&appName=ourproject";

// Configure middlewares
app.use(cors());
// Parse JSON payloads (Extended limit to allow user-uploaded base64 photo data)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch(err => console.error("MongoDB connection error:", err));

// ================= MONGOOSE SCHEMAS & MODELS =================

// Frame Catalog Product Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  material: { type: String, required: true },
  style: { type: String, required: true },
  basePricePerSqInch: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true } // Base64 dataURL
});
const Product = mongoose.model('Product', productSchema);

// Customer Custom Frame Order Model
const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  designStyle: { type: String, required: true },
  material: { type: String, required: true },
  finish: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  instructions: { type: String },
  estimatedPrice: { type: Number, required: true },
  photo: { type: String }, // Base64 dataURL
  status: { type: String, default: 'pending' },
  cancelReason: { type: String, default: '' }, // Admin cancellation reason
  statusUpdatedAt: { type: Number, default: null }, // When admin last changed status
  createdAt: { type: Number, default: () => Date.now() }
});
const Order = mongoose.model('Order', orderSchema);

// Customer Contact Support Model
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() }
});
const Contact = mongoose.model('Contact', contactSchema);

// ================= REST API ROUTING ENDPOINTS =================

// Seed initial mockup metal frame designs if MongoDB catalog is empty
async function seedDefaultProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const defaultProducts = [
        {
          name: "Imperial Brushed Gold Frame",
          material: "Aluminum",
          style: "Modern",
          basePricePerSqInch: 3.5,
          description: "Anodized imperial gold with subtle brushed texture. Adds high-end gallery aesthetics to canvases.",
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
        },
        {
          name: "Industrial Chrome Steel Frame",
          material: "Steel",
          style: "Rustic",
          basePricePerSqInch: 2.8,
          description: "Hand-molded raw steel profile with industrial bolts and clear powder coat protection.",
          image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80"
        },
        {
          name: "Midnight Obsidian Matte Frame",
          material: "Iron",
          style: "Classic",
          basePricePerSqInch: 2.2,
          description: "Sandblasted heavy iron frame in carbon matte black. Ultra-slim profile for clean layouts.",
          image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80"
        }
      ];
      await Product.insertMany(defaultProducts);
      console.log("Seeded database with initial product catalog.");
    }
  } catch(e) { console.error("Error seeding catalog:", e); }
}
seedDefaultProducts();

// --- Products Endpoints ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to read products." });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: "Failed to insert product." });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete product." });
  }
});

// --- Orders Endpoints ---
app.get('/api/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) query = { userId };
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to load orders." });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: "Failed to post custom order." });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const updateData = { status, statusUpdatedAt: Date.now() };
    if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update status." });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order removed." });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete order entry." });
  }
});

// --- Contacts Endpoints ---
app.post('/api/contacts', async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    res.status(400).json({ error: "Failed to submit message." });
  }
});

// ================= STATIC CLIENT PAGE SERVING =================
app.use(express.static(path.join(__dirname, '..')));

// Fallback index.html router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start Express Server (only when run directly or not on Vercel)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
