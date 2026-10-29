const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      required: [true, "Ma mon an khong duoc de trong"],
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: [true, "Ten mon an khong duoc de trong"],
      trim: true
    },

    category: {
      type: String,
      required: [true, "Danh muc khong duoc de trong"],
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Gia mon an khong duoc de trong"],
      min: [0, "Gia mon an khong duoc am"]
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    image: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Food", foodSchema, "foods");