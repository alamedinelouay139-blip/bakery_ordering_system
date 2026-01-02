import express from "express";
import mysql from "mysql";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bakery backend is running");
});
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bakery_db"
});

// Signup route
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  // 1) validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // 2) check if email exists
  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // 3) hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4) insert user
      db.query(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        [email, hashedPassword],
        (err) => {
          if (err) {
            return res.status(500).json({ message: "Failed to create user" });
          }

          // 5) success
          res.status(201).json({ message: "User created successfully" });
        }
      );
    }
  );
});


db.connect((err) => {
  if (err) {
    console.log("DB error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});