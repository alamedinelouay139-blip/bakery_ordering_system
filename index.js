import express from "express";
import mysql from "mysql";
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