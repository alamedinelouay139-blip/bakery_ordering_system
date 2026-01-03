import express from "express";
import mysql from "mysql";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bakery backend is running");
});
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
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
//kif lzm faker bas bdi a3ml forgetpassword
//awal shi bdi eshtghl 3a email fa bkhdu const {email}=req.body
//ba3da ba3ml valid iza fade aw keteb validation is emty al errorcoe 400
//baeda bshaghel l query 
//ba3da iza wajad al email yaene result===0 b2lo     message: "If the email exists, a reset token was generated"
//krml ma ykteshf al hacker al emails al mawjudi wl mena mawjudi 
//hydi esma prevent email enumeration
//ba3da bas jib al email ba3mlo hash
//ana bedi esta3ml token hata et2akad huwi nafs al shakhes 

//bsta3ml token hata et2akad nfs shkhs bala ma shuf al password
app.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(200).json({
          message: "If the email exists, a reset token was generated"
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      db.query(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
        [token, expires, email],
        () => {
          res.status(200).json({
            message: "Reset token generated",
            resetToken: token
          });
        }
      );
    }
  );
});
// Reset password
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  db.query(
    "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [token],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [hashedPassword, results[0].id],
        () => {
          res.status(200).json({ message: "Password reset successful" });
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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
