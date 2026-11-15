const fs = require('fs');
const path = require('path');

// 1. Sửa config.js (Bảng giá chuẩn tiếng Việt)
const configContent = `module.exports = {
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
    { id: "pkg_1k", name: "Gói Khởi Động (1.000 Điểm)", points: 1000, price: 10000, mother_service_id: "101", is_hot: false },
    { id: "pkg_5k", name: "Gói Phổ Thông (5.000 Điểm)", points: 5000, price: 35000, mother_service_id: "102", is_hot: false },
    { id: "pkg_10k", name: "Gói Tiêu Chuẩn (10.000 Điểm)", points: 10000, price: 65000, mother_service_id: "103", is_hot: true },
    { id: "pkg_30k", name: "Gói VIP Pro (30.000 Điểm)", points: 30000, price: 180000, mother_service_id: "104", is_hot: false },
    { id: "pkg_50k", name: "Gói Siêu Cấp (50.000 Điểm)", points: 50000, price: 280000, mother_service_id: "105", is_hot: false },
    { id: "pkg_100k", name: "Gói Thần Tốc (100.000 Điểm)", points: 100000, price: 500000, mother_service_id: "106", is_hot: false }
  ]
};
`;
fs.writeFileSync(path.join(__dirname, 'config.js'), configContent, 'utf8');

// 2. Sửa public/index.html (Trang bán hàng)
const indexContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tăng Độ Hot Liên Quân Mobile Tự Động 24/7</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">⚡ LQ HOT PRO</div>
    <div class="nav-links">
      <a href="/">Đặt Hàng</a>
      <a href="/check.html">Tra Cứu</a>
      <a href="/admin.html">Admin</a>
    </div>
  </nav>

  <div class="container">
    <div class="banner-alert">
      🔥 <strong>Hệ Thống Tăng Độ Hot LQMB Tự Động 24/7:</strong> Kéo điểm uy tín, làm đẹp hồ sơ trang cá nhân. Tự động kết nối API quatuwu.click!
    </div>

    <div class="card">
      <div class="card-title">1. Nhập UID Liên Quân</div>
      <div class="form-group">
        <label class="form-label">UID / OpenID Người Nhận:</label>
        <input type="text" id="targetUid" class="input-field" placeholder="Mở game > Avatar > Sao chép OpenID">
      </div>
    </div>

    <div class="card">
      <div class="card-title">2. Chọn Gói Tăng Độ Hot</div>
      <div class="package-grid" id="packageList"></div>
    </div>

    <button class="btn-submit" onclick="submitOrder()">TẠO ĐƠN & THANH TOÁN QR</button>
  </div>

  <div class="modal-overlay" id="payModal">
    <div class="modal-box">
      <span class="close-modal" onclick="closePayModal()">&times;</span>
      <h3 style="color: var(--gold);">Quét Mã VietQR Thanh Toán</h3>
      <div class="qr-box"><img id="qrImg" src="" alt="QR"></div>
      <div style="text-align: left; margin-bottom: 16px;">
        <div class="pay-info-row"><span>Số tiền:</span><span class="val" id="payAmount" style="color: var(--gold);"></span></div>
        <div class="pay-info-row"><span>Ngân hàng:</span><span class="val" id="payBank"></span></div>
        <div class="pay-info-row"><span>Số tài khoản:</span><span class="val" id="payAcc"></span></div>
        <div class="pay-info-row"><span>Nội dung CK:</span><span class="val" id="payContent" style="color: var(--warning);"></span></div>
      </div>
      <div id="pollingStatus" class="status-badge status-pending">⏳ Đang chờ thanh toán...</div>
    </div>
  </div>

  <script>
    let selectedPkg = null;
    let pollInterval = null;

    async function loadPackages() {
      const res = await fetch('/api/packages');
      const data = await res.json();
      const container = document.getElementById('packageList');
      container.innerHTML = '';
      data.packages.forEach((pkg, index) => {
        const item = document.createElement('div');
        item.className = 'package-item ' + (index === 0 ? 'active' : '');
        if (index === 0) selectedPkg = pkg.id;
        item.onclick = () => {
          document.querySelectorAll('.package-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          selectedPkg = pkg.id;
        };
        item.innerHTML = (pkg.is_hot ? '<span class="pkg-badge">HOT</span>' : '') +
          '<div class="pkg-points">' + pkg.name + '</div>' +
          '<div class="pkg-price">' + pkg.price.toLocaleString() + 'đ</div>';
        container.appendChild(item);
      });
    }

    async function submitOrder() {
      const uid = document.getElementById('targetUid').value.trim();
      if (!uid) return alert('Vui lòng nhập UID Liên Quân!');
      const btn = document.querySelector('.btn-submit');
      btn.innerText = 'ĐANG TẠO ĐƠN...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, package_id: selectedPkg })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        showPaymentModal(data.order);
      } catch (e) {
        alert(e.message);
      } finally {
        btn.innerText = 'TẠO ĐƠN & THANH TOÁN QR';
        btn.disabled = false;
      }
    }

    function showPaymentModal(order) {
      document.getElementById('qrImg').src = order.qr_url;
      document.getElementById('payAmount').innerText = order.amount.toLocaleString() + 'đ';
      document.getElementById('payBank').innerText = order.bank_info.bank_id;
      document.getElementById('payAcc').innerText = order.bank_info.account_no;
      document.getElementById('payContent').innerText = order.bank_info.content;
      document.getElementById('payModal').classList.add('open');

      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(async () => {
        const res = await fetch('/api/orders/' + order.code);
        const result = await res.json();
        if (result.success && (result.order.status === 'paid' || result.order.status === 'processing')) {
          clearInterval(pollInterval);
          document.getElementById('pollingStatus').className = 'status-badge status-paid';
          document.getElementById('pollingStatus').innerText = '✅ Đã thanh toán! Đang chuyển trang...';
          setTimeout(() => { window.location.href = '/check.html?code=' + order.code; }, 1500);
        }
      }, 3000);
    }

    function closePayModal() {
      document.getElementById('payModal').classList.remove('open');
      if (pollInterval) clearInterval(pollInterval);
    }

    loadPackages();
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), indexContent, 'utf8');

// 3. Sửa public/check.html (Trang tra cứu)
const checkContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tra Cứu Đơn Hàng - LQ HOT PRO</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">⚡ LQ HOT PRO</div>
    <div class="nav-links"><a href="/">Đặt Hàng</a><a href="/check.html">Tra Cứu</a><a href="/admin.html">Admin</a></div>
  </nav>

  <div class="container">
    <div class="card">
      <div class="card-title">🔍 Tra Cứu Tiến Độ Đơn Hàng</div>
      <div class="form-group">
        <label class="form-label">Mã đơn hàng (VD: HOT123456) hoặc UID:</label>
        <input type="text" id="searchCode" class="input-field" placeholder="Nhập mã đơn...">
      </div>
      <button class="btn-submit" onclick="checkOrder()">Kiểm Tra Ngay</button>
    </div>

    <div id="orderResult" style="display: none;" class="card">
      <div class="card-title">Chi Tiết Đơn Hàng</div>
      <div class="pay-info-row"><span>Mã Đơn:</span><span class="val" id="rCode"></span></div>
      <div class="pay-info-row"><span>UID Liên Quân:</span><span class="val" id="rUid"></span></div>
      <div class="pay-info-row"><span>Gói Dịch Vụ:</span><span class="val" id="rPkg"></span></div>
      <div class="pay-info-row"><span>Số Tiền:</span><span class="val" id="rAmount" style="color:var(--gold);"></span></div>
      <div class="pay-info-row"><span>Trạng Thái:</span><span id="rStatus"></span></div>
      <div class="pay-info-row"><span>Mã Đơn Mẹ:</span><span class="val" id="rMotherId"></span></div>
    </div>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const initialCode = urlParams.get('code');
    if (initialCode) {
      document.getElementById('searchCode').value = initialCode;
      checkOrder();
    }

    async function checkOrder() {
      const code = document.getElementById('searchCode').value.trim();
      if (!code) return alert('Vui lòng nhập mã đơn!');
      try {
        const res = await fetch('/api/orders/' + code);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const o = data.order;
        document.getElementById('rCode').innerText = o.code;
        document.getElementById('rUid').innerText = o.uid;
        document.getElementById('rPkg').innerText = o.package_name;
        document.getElementById('rAmount').innerText = o.amount.toLocaleString() + 'đ';
        document.getElementById('rMotherId').innerText = o.mother_order_id || 'Chưa khởi chạy';

        const s = document.getElementById('rStatus');
        s.className = 'status-badge status-' + o.status;
        s.innerText = o.status === 'pending' ? 'Chờ thanh toán' : (o.status === 'paid' ? 'Đã thanh toán' : o.status.toUpperCase());
        document.getElementById('orderResult').style.display = 'block';
      } catch (e) {
        alert(e.message);
      }
    }
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'public', 'check.html'), checkContent, 'utf8');

console.log("====================================================");
console.log("✅ ĐÃ SỬA XONG 100% LỖI PHÔNG TIẾNG VIỆT!");
console.log("====================================================");