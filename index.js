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
    async (err, results) => {//hon ha yntor ya ema ha ymhsi l7al aw ha yaetini error
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {//iza la2ena nafs a email 409 ya3ni ta3arod
        return res.status(409).json({ message: "Email already exists" });
      }

      // 3) hash password
      const hashedPassword = await bcrypt.hash(password, 10);//hon am yaeml hash 10 marat ya3ni malyon tajrube hata ykshof al password


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

//yali bdi faker fi bl login
//et2akd enu email and pass mawjudin 
//aeml search 3an al user bl (email);
//iza al use not found error
//iza mawjud brja3 baeml hash w b2arna bli abla bdi esta3ml compare mn crypt
//bdi erja3 aeml iza al compartion zaabt w iza laa error
//iza nej7 w klshi tmmm bred response
// Login route
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  // 1) validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // 2) find user by email
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      // 3) user not found
      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];

      // 4) compare password with hash
      const isMatch = await bcrypt.compare(password, user.password_hash);

      // 5) password incorrect
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // 6) success
      res.status(200).json({ message: "Login successful" });
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