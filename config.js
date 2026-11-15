module.exports = {
  PORT: process.env.PORT || 3000,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  MOTHER_API: {
    URL: "https://quatuwu.click/api/v2",
    KEY: "YOUR_QUATUWU_API_KEY_HERE",
    AUTO_FORWARD: true
  },
  PAYMENT: {
    BANK_ID: "MB",
    ACCOUNT_NO: "0999999999",
    ACCOUNT_NAME: "NGUYEN VAN A",
    ORDER_PREFIX: "HOT",
    EXPIRE_MINUTES: 10
  },
  PACKAGES: [
    { id: "pkg_1k", name: "G\u00f3i Kh\u1edf\u0069 \u0110\u1ed9ng (1.000 \u0110i\u1ec3m)", points: 1000, price: 10000, mother_service_id: "101", is_hot: false },
    { id: "pkg_5k", name: "G\u00f3i Ph\u1ed5 Th\u00f4ng (5.000 \u0110i\u1ec3m)", points: 5000, price: 35000, mother_service_id: "102", is_hot: false },
    { id: "pkg_10k", name: "G\u00f3i Ti\u00eau Chu\u1ea9n (10.000 \u0110i\u1ec3m)", points: 10000, price: 65000, mother_service_id: "103", is_hot: true },
    { id: "pkg_30k", name: "G\u00f3i VIP Pro (30.000 \u0110i\u1ec3m)", points: 30000, price: 180000, mother_service_id: "104", is_hot: false },
    { id: "pkg_50k", name: "G\u00f3i Si\u00eau C\u1ea5p (50.000 \u0110i\u1ec3m)", points: 50000, price: 280000, mother_service_id: "105", is_hot: false },
    { id: "pkg_100k", name: "G\u00f3i Th\u1ea7n T\u1ed1c (100.000 \u0110i\u1ec3m)", points: 100000, price: 500000, mother_service_id: "106", is_hot: false }
  ]
};