const fs = require('fs');
const path = require('path');

// 1. S?a config.js (B?ng gi? chu?n ti?ng Vi?t)
const cfg = `module.exports = {
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
    { id: "pkg_1k", name: "G\\u00f3i Kh\\u1edf\\u0069 \\u0110\\u1ed9ng (1.000 \\u0110i\\u1ec3m)", points: 1000, price: 10000, mother_service_id: "101", is_hot: false },
    { id: "pkg_5k", name: "G\\u00f3i Ph\\u1ed5 Th\\u00f4ng (5.000 \\u0110i\\u1ec3m)", points: 5000, price: 35000, mother_service_id: "102", is_hot: false },
    { id: "pkg_10k", name: "G\\u00f3i Ti\\u00eau Chu\\u1ea9n (10.000 \\u0110i\\u1ec3m)", points: 10000, price: 65000, mother_service_id: "103", is_hot: true },
    { id: "pkg_30k", name: "G\\u00f3i VIP Pro (30.000 \\u0110i\\u1ec3m)", points: 30000, price: 180000, mother_service_id: "104", is_hot: false },
    { id: "pkg_50k", name: "G\\u00f3i Si\\u00eau C\\u1ea5p (50.000 \\u0110i\\u1ec3m)", points: 50000, price: 280000, mother_service_id: "105", is_hot: false },
    { id: "pkg_100k", name: "G\\u00f3i Th\\u1ea7n T\\u1ed1c (100.000 \\u0110i\\u1ec3m)", points: 100000, price: 500000, mother_service_id: "106", is_hot: false }
  ]
};`;
fs.writeFileSync(path.join(__dirname, 'config.js'), cfg, 'utf8');

// 2. S?a index.html (Trang b?n h?ng)
const idx = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>T\\u0103ng \\u0110\\u1ed9 Hot Li\\u00ean Qu\\u00e2n Mobile</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">\\u26a1 LQ HOT PRO</div>
    <div class="nav-links">
      <a href="/">\\u0110\\u1eb7t H\\u00e0ng</a>
      <a href="/check.html">Tra C\\u1ee9u</a>
      <a href="/admin.html">Admin</a>
    </div>
  </nav>

  <div class="container">
    <div class="banner-alert">
      \\ud83d\\udd25 <strong>H\\u1ec7 Th\\u1ed1ng T\\u0103ng \\u0110\\u1ed9 Hot LQMB T\\u1ef1 \\u0110\\u1ed9ng 24/7:</strong> K\\u00e9o \\u0111i\\u1ec3m uy t\\u00edn, l\\u00e0m \\u0111\\u1eb9p h\\u1ed3 s\\u01a1 c\\u00e1 nh\\u00e2n. K\\u1ebft n\\u1ed1i API quatuwu.click!
    </div>

    <div class="card">
      <div class="card-title">1. Nh\\u1eadp UID Li\\u00ean Qu\\u00e2n</div>
      <div class="form-group">
        <label class="form-label">UID / OpenID Ng\\u01b0\\u1eddi Nh\\u1eadn:</label>
        <input type="text" id="targetUid" class="input-field" placeholder="M\\u1edf game > Avatar > Sao ch\\u00e9p OpenID">
      </div>
    </div>

    <div class="card">
      <div class="card-title">2. Ch\\u1ecdn G\\u00f3i T\\u0103ng \\u0110\\u1ed9 Hot</div>
      <div class="package-grid" id="packageList"></div>
    </div>

    <button class="btn-submit" onclick="submitOrder()">T\\u1ea0O \\u0110\\u01a0N & THANH TO\\u00c1N QR</button>
  </div>

  <div class="modal-overlay" id="payModal">
    <div class="modal-box">
      <span class="close-modal" onclick="closePayModal()">&times;</span>
      <h3 style="color: var(--gold);">Qu\\u00e9t M\\u00e3 VietQR Thanh To\\u00e1n</h3>
      <div class="qr-box"><img id="qrImg" src="" alt="QR"></div>
      <div style="text-align: left; margin-bottom: 16px;">
        <div class="pay-info-row"><span>S\\u1ed1 ti\\u1ec1n:</span><span class="val" id="payAmount" style="color: var(--gold);"></span></div>
        <div class="pay-info-row"><span>Ng\\u00e2n h\\u00e0ng:</span><span class="val" id="payBank"></span></div>
        <div class="pay-info-row"><span>S\\u1ed1 t\\u00e0i kho\\u1ea3n:</span><span class="val" id="payAcc"></span></div>
        <div class="pay-info-row"><span>N\\u1ed9i dung CK:</span><span class="val" id="payContent" style="color: var(--warning);"></span></div>
      </div>
      <div id="pollingStatus" class="status-badge status-pending">\\u23f3 \\u0110ang ch\\u1edd thanh to\\u00e1n...</div>
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
          '<div class="pkg-price">' + pkg.price.toLocaleString() + '?</div>';
        container.appendChild(item);
      });
    }

    async function submitOrder() {
      const uid = document.getElementById('targetUid').value.trim();
      if (!uid) return alert('Vui l?ng nh?p UID Li?n Qu?n!');
      const btn = document.querySelector('.btn-submit');
      btn.innerText = '?ANG T?O ??N...';
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
        btn.innerText = 'T?O ??N & THANH TO?N QR';
        btn.disabled = false;
      }
    }

    function showPaymentModal(order) {
      document.getElementById('qrImg').src = order.qr_url;
      document.getElementById('payAmount').innerText = order.amount.toLocaleString() + '?';
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
          document.getElementById('pollingStatus').innerText = '? ?? thanh to?n! ?ang chuy?n trang...';
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
</html>`;
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), idx, 'utf8');

// 3. S?a check.html (Trang tra c?u)
const chk = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tra C\\u1ee9u \\u0110\\u01a1n H\\u00e0ng</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">\\u26a1 LQ HOT PRO</div>
    <div class="nav-links"><a href="/">\\u0110\\u1eb7t H\\u00e0ng</a><a href="/check.html">Tra C\\u1ee9u</a><a href="/admin.html">Admin</a></div>
  </nav>

  <div class="container">
    <div class="card">
      <div class="card-title">\\ud83d\\udd0d Tra C\\u1ee9u Ti\\u1ebfn \\u0110\\u1ed9 \\u0110\\u01a1n H\\u00e0ng</div>
      <div class="form-group">
        <label class="form-label">M\\u00e3 \\u0111\\u01a1n h\\u00e0ng ho\\u1eb7c UID:</label>
        <input type="text" id="searchCode" class="input-field" placeholder="Nh?p m? ??n...">
      </div>
      <button class="btn-submit" onclick="checkOrder()">Ki\\u1ec3m Tra Ngay</button>
    </div>

    <div id="orderResult" style="display: none;" class="card">
      <div class="card-title">Chi Ti\\u1ebft \\u0110\\u01a1n H\\u00e0ng</div>
      <div class="pay-info-row"><span>M\\u00e3 \\u0110\\u01a1n:</span><span class="val" id="rCode"></span></div>
      <div class="pay-info-row"><span>UID Li\\u00ean Qu\\u00e2n:</span><span class="val" id="rUid"></span></div>
      <div class="pay-info-row"><span>G\\u00f3i D\\u1ecbch V\\u1ee5:</span><span class="val" id="rPkg"></span></div>
      <div class="pay-info-row"><span>S\\u1ed1 Ti\\u1ec1n:</span><span class="val" id="rAmount" style="color:var(--gold);"></span></div>
      <div class="pay-info-row"><span>Tr\\u1ea1ng Th\\u00e1i:</span><span id="rStatus"></span></div>
      <div class="pay-info-row"><span>M\\u00e3 \\u0110\\u01a1n M\\u1eb9:</span><span class="val" id="rMotherId"></span></div>
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
      if (!code) return alert('Vui l?ng nh?p m? ??n!');
      try {
        const res = await fetch('/api/orders/' + code);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const o = data.order;
        document.getElementById('rCode').innerText = o.code;
        document.getElementById('rUid').innerText = o.uid;
        document.getElementById('rPkg').innerText = o.package_name;
        document.getElementById('rAmount').innerText = o.amount.toLocaleString() + '?';
        document.getElementById('rMotherId').innerText = o.mother_order_id || 'Ch?a kh?i ch?y';

        const s = document.getElementById('rStatus');
        s.className = 'status-badge status-' + o.status;
        s.innerText = o.status === 'pending' ? 'Ch? thanh to?n' : (o.status === 'paid' ? '?? thanh to?n' : o.status.toUpperCase());
        document.getElementById('orderResult').style.display = 'block';
      } catch (e) {
        alert(e.message);
      }
    }
  </script>
</body>
</html>`;
fs.writeFileSync(path.join(__dirname, 'public', 'check.html'), chk, 'utf8');

console.log("==========================================");
console.log("DA SUA XONG 100% PHONG TIENG VIET!");
console.log("==========================================");