const https = require('https');
const crypto = require('crypto');
const PaymentMethod = require('../../model/PaymentMethodModel');

module.exports.createMomoPayment = async (req, res) => {
  try {
    const {
      amount = 0,
      orderInfo = 'Thanh toán đơn hàng',
      redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/orders',
      ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:8080/payment/momo/ipn',
      requestType = 'captureWallet',
      extraData = '',
    } = req.body || {};

    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';

    if (!accessKey || !secretKey) {
      return res.status(500).json({ success: false, message: 'Chưa cấu hình MOMO_ACCESS_KEY/MOMO_SECRET_KEY' });
    }

    const orderId = partnerCode + Date.now();
    const requestId = orderId;

    const rawSignature =
      'accessKey=' + accessKey +
      '&amount=' + amount +
      '&extraData=' + extraData +
      '&ipnUrl=' + ipnUrl +
      '&orderId=' + orderId +
      '&orderInfo=' + orderInfo +
      '&partnerCode=' + partnerCode +
      '&redirectUrl=' + redirectUrl +
      '&requestId=' + requestId +
      '&requestType=' + requestType;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
      partnerCode,
      partnerName: 'HaruShop',
      storeId: 'HaruShopStore',
      requestId,
      amount: String(amount),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature,
    });

    const options = {
      hostname: process.env.MOMO_ENDPOINT || 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const momoReq = https.request(options, (momoRes) => {
      let data = '';
      momoRes.on('data', (chunk) => { data += chunk; });
      momoRes.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (parsed && parsed.payUrl) {
            return res.json({ success: true, payUrl: parsed.payUrl, orderId });
          }
          return res.status(400).json({ success: false, message: parsed.message || 'Không tạo được payUrl', data: parsed });
        } catch (e) {
          return res.status(500).json({ success: false, message: 'Phản hồi MoMo không hợp lệ', data });
        }
      });
    });

    momoReq.on('error', (e) => {
      return res.status(500).json({ success: false, message: e.message });
    });

    momoReq.write(requestBody);
    momoReq.end();
  } catch (err) {
    console.error('createMomoPayment error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server tạo thanh toán MoMo' });
  }
};

module.exports.listMethods = async (req, res) => {
  try {
    // Lấy danh sách phương thức theo model mới (name, description, image, status)
    let methods = await PaymentMethod.find({ status: true, deleted: false })
      .sort({ createdAt: 1 })
      .select('name description image status slug _id')
      .lean();

    // Fallback nhẹ khi DB chưa có dữ liệu
    if (!methods || methods.length === 0) {
      methods = [
        { name: 'Chuyển khoản ngân hàng', description: 'Thanh toán qua ngân hàng', status: true },
      ];
      if (process.env.MOMO_ACCESS_KEY && process.env.MOMO_SECRET_KEY) {
        methods.push({ name: 'Ví MoMo', description: 'Thanh toán nhanh qua MoMo', status: true });
      }
    }
    return res.json({ success: true, methods });
  } catch (err) {
    console.error('listMethods error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy phương thức thanh toán' });
  }
};
