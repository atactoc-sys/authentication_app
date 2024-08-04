const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then((c) => {
      console.log(`Mongodb connect to: ${c.connection.host}`);
    })
    .catch((e) => {
      console.log(e);
    });
};

module.exports = connectDB;
