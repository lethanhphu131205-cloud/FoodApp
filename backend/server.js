const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Food = require("./models/Food");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Trang goc
app.get("/", (req, res) => {
  res.json({
    message: "FoodApp Backend API is running!"
  });
});

// Kiem tra tinh trang server va MongoDB
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "UP" : "DEGRADED",
    database: connected ? "connected" : "disconnected"
  });
});

// Lay danh sach mon an va tim kiem
app.get("/api/foods", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { foodId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    if (category) {
      filter.category = {
        $regex: category,
        $options: "i"
      };
    }

    const foods = await Food.find(filter).sort({
      createdAt: -1
    });

    res.status(200).json(foods);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi khi lay danh sach mon an"
    });
  }
});

// Lay chi tiet mon an
app.get("/api/foods/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID mon an khong hop le"
      });
    }

    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: "Khong tim thay mon an"
      });
    }

    res.status(200).json(food);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi khi lay chi tiet mon an"
    });
  }
});

// Them mon an
app.post("/api/foods", async (req, res) => {
  try {
    const {
      foodId,
      name,
      category,
      price,
      description,
      image
    } = req.body;

    if (
      !foodId?.trim() ||
      !name?.trim() ||
      !category?.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        message: "Vui long nhap ma, ten, danh muc va gia mon an"
      });
    }

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message: "Gia mon an phai la so khong am"
      });
    }

    const existingFood = await Food.findOne({
      foodId: foodId.trim()
    });

    if (existingFood) {
      return res.status(409).json({
        message: "Ma mon an da ton tai"
      });
    }

    const food = await Food.create({
      foodId,
      name,
      category,
      price: parsedPrice,
      description,
      image
    });

    res.status(201).json({
      message: "Them mon an thanh cong",
      food
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ma mon an da ton tai"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Loi khi them mon an"
    });
  }
});

// Cap nhat mon an
app.put("/api/foods/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID mon an khong hop le"
      });
    }

    const {
      foodId,
      name,
      category,
      price,
      description,
      image
    } = req.body;

    if (
      !foodId?.trim() ||
      !name?.trim() ||
      !category?.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        message: "Vui long nhap ma, ten, danh muc va gia mon an"
      });
    }

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message: "Gia mon an phai la so khong am"
      });
    }

    const duplicate = await Food.findOne({
      foodId: foodId.trim(),
      _id: { $ne: req.params.id }
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Ma mon an da duoc su dung"
      });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      {
        foodId,
        name,
        category,
        price: parsedPrice,
        description,
        image
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!food) {
      return res.status(404).json({
        message: "Khong tim thay mon an"
      });
    }

    res.status(200).json({
      message: "Cap nhat mon an thanh cong",
      food
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ma mon an da ton tai"
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Loi khi cap nhat mon an"
    });
  }
});

// Xoa mon an
app.delete("/api/foods/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID mon an khong hop le"
      });
    }

    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: "Khong tim thay mon an"
      });
    }

    res.status(200).json({
      message: "Xoa mon an thanh cong",
      food
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Loi khi xoa mon an"
    });
  }
});

// Xu ly loi JSON khong hop le
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      message: "Du lieu JSON khong hop le"
    });
  }

  next(err);
});

// Khoi dong server sau khi ket noi MongoDB
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "Chua cau hinh MONGODB_URI trong file .env"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Da ket noi MongoDB Atlas");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `FoodApp API dang chay tai cong ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Khong the khoi dong server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();