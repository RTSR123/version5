const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");
const { MongoClient } = require("mongodb");
const app = express();

const PORT = 3000;

// 🔒 Replace this with your MongoDB Atlas connection string
const mongoURL = "mongodb+srv://rtsr:12345@cluster0.x9kidvw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


// Your database and collection names
const dbName = "schemeNavigatorDB";
const collectionName = "USER_DETAILS";

let db, users;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB Atlas
MongoClient.connect(mongoURL, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    users = db.collection(collectionName);
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Register Endpoint
app.post("/register", async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  try {
    const existing = await users.findOne({ email });
    if (existing) {
      return res.json({ success: false, error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.insertOne({
      first_name,
      last_name,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Registration error:",err);
    res.json({ success: false, error: "Server error." });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await users.findOne({ email });
    if (!user) {
      return res.json({ success: false, error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, error: "Incorrect password" });
    }

    // Store info for future use, such as user session, etc.
    const userInfo = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    };

    res.json({ success: true, user: userInfo });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Server error." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/coverpage.html`);
});
