const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "database.json");

function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ orders: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

async function forwardOrderToMother(order) {
  if (!config.MOTHER_API.KEY || config.MOTHER_API.KEY === "YOUR_QUATUWU_API_KEY_HERE") {
    console.warn("[API Máº¸] ChÆ°a Ä‘iá»n API Key quatuwu.click");
    return { success: false, message: "ChÆ°a cáº¥u hÃ¬nh API Key" };
  }

  try {
    const pkg = config.PACKAGES.find(p => p.id === order.package_id);
    if (!pkg) throw new Error("GÃ³i dá»‹ch vá»¥ khÃ´ng há»£p lá»‡");

    const params = new URLSearchParams();
    params.append("key", config.MOTHER_API.KEY);
    params.append("action", "add");
    params.append("service", pkg.mother_service_id);
    params.append("link", order.uid);
    params.append("quantity", pkg.points.toString());

    const response = await axios.post(config.MOTHER_API.URL, params);
    const data = response.data;

    if (data && data.order) {
      order.mother_order_id = data.order;
      order.status = "processing";
      order.mother_logs = JSON.stringify(data);
      console.log(`[API Máº¸] Báº¯n Ä‘Æ¡n thÃ nh cÃ´ng! MÃ£ Ä‘Æ¡n máº¹: ${data.order}`);
      return { success: true, mother_order_id: data.order };
    } else {
      order.mother_logs = JSON.stringify(data || "Lá»—i");
      return { success: false, error: data };
    }
  } catch (err) {
    order.mother_logs = err.message;
    return { success: false, error: err.message };
  }
}

app.get("/api/packages", (req, res) => {
  res.json({ success: true, packages: config.PACKAGES });
});

app.post("/api/orders/create", (req, res) => {
  const { uid, package_id } = req.body;
  if (!uid || !package_id) {
    return res.status(400).json({ success: false, message: "Vui lÃ²ng nháº­p UID vÃ  chá»n gÃ³i" });
  }

  const pkg = config.PACKAGES.find(p => p.id === package_id);
  if (!pkg) return res.status(400).json({ success: false, message: "GÃ³i khÃ´ng tá»“n táº¡i" });

  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const orderCode = `${config.PAYMENT.ORDER_PREFIX}${randomNum}`;

  const vietQrUrl = `https://img.vietqr.io/image/${config.PAYMENT.BANK_ID}-${config.PAYMENT.ACCOUNT_NO}-compact2.png?amount=${pkg.price}&addInfo=${orderCode}&accountName=${encodeURIComponent(config.PAYMENT.ACCOUNT_NAME)}`;

  const newOrder = {
    code: orderCode,
    uid: uid.trim(),
    package_id: pkg.id,
    package_name: pkg.name,
    points: pkg.points,
    amount: pkg.price,
    status: "pending",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + config.PAYMENT.EXPIRE_MINUTES * 60000).toISOString(),
    qr_url: vietQrUrl,
    bank_info: {
      bank_id: config.PAYMENT.BANK_ID,
      account_no: config.PAYMENT.ACCOUNT_NO,
      account_name: config.PAYMENT.ACCOUNT_NAME,
      amount: pkg.price,
      content: orderCode
    },
    mother_order_id: null
  };

  const db = getDB();
  db.orders.unshift(newOrder);
  saveDB(db);

  res.json({ success: true, order: newOrder });
});

app.get("/api/orders/:code", (req, res) => {
  const db = getDB();
  const order = db.orders.find(o => o.code === req.params.code || o.uid === req.params.code);
  if (!order) return res.status(404).json({ success: false, message: "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng" });
  res.json({ success: true, order });
});

app.post("/api/payment/webhook", async (req, res) => {
  const body = req.body;
  const content = (body.content || body.description || body.orderCode || "").toString().toUpperCase();
  const amount = Number(body.amount || body.transferAmount || 0);

  const db = getDB();
  const order = db.orders.find(o => content.includes(o.code) && o.status === "pending");

  if (order && amount >= order.amount) {
    order.status = "paid";
    order.paid_at = new Date().toISOString();
    if (config.MOTHER_API.AUTO_FORWARD) {
      await forwardOrderToMother(order);
    }
    saveDB(db);
    return res.json({ success: true, message: "ÄÃ£ xá»­ lÃ½ thanh toÃ¡n" });
  }

  res.json({ success: true, message: "Webhook received" });
});

app.post("/api/admin/confirm-order", async (req, res) => {
  const { code, password } = req.body;
  if (password !== config.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Sai máº­t kháº©u Admin" });
  }

  const db = getDB();
  const order = db.orders.find(o => o.code === code);
  if (!order) return res.status(404).json({ success: false, message: "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n" });

  order.status = "paid";
  order.paid_at = new Date().toISOString();
  await forwardOrderToMother(order);
  saveDB(db);

  res.json({ success: true, message: "ÄÃ£ duyá»‡t Ä‘Æ¡n vÃ  báº¯n API máº¹", order });
});

app.get("/api/admin/data", async (req, res) => {
  const pwd = req.headers["authorization"];
  if (pwd !== config.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const db = getDB();
  let motherBalance = "ChÆ°a káº¿t ná»‘i";

  if (config.MOTHER_API.KEY && config.MOTHER_API.KEY !== "YOUR_QUATUWU_API_KEY_HERE") {
    try {
      const params = new URLSearchParams();
      params.append("key", config.MOTHER_API.KEY);
      params.append("action", "balance");
      const resp = await axios.post(config.MOTHER_API.URL, params, { timeout: 4000 });
      if (resp.data && resp.data.balance) {
        motherBalance = `${resp.data.balance} ${resp.data.currency || "VND"}`;
      }
    } catch (e) {
      motherBalance = "Lá»—i check sá»‘ dÆ° (" + e.message + ")";
    }
  }

  res.json({ success: true, orders: db.orders, motherBalance });
});

app.listen(config.PORT, () => {
  console.log("====================================================");
  console.log(`Website dang chay tai: http://localhost:${config.PORT}`);
  console.log("====================================================");
});