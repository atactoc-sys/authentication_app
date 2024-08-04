require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(process.env.PORT, () =>
  console.log(`Server running on port: ${process.env.PORT}`)
);
