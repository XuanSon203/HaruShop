// Test script để kiểm tra API hoàn hàng
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testReturnAPI() {
  try {
    console.log('🧪 Testing Return API...\n');

    // Test data
    const testData = {
      order_id: '68cbde5dc3972946bc997e9c',
      return_reason: 'Sản phẩm bị hỏng trong quá trình vận chuyển',
      return_description: 'Sản phẩm bị vỡ khi nhận hàng',
      return_images: []
    };

    console.log('📤 Sending return request with data:', testData);

    // Test API endpoint
    const response = await axios.post(`${BASE_URL}/api/return/orders/request-return`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'tokenUser=your_token_here' // Thay bằng token thực tế
      }
    });

    console.log('✅ Response status:', response.status);
    console.log('📥 Response data:', response.data);

    if (response.data.success) {
      console.log('🎉 Return request created successfully!');
      console.log('📋 Return request details:', response.data.return_request);
    } else {
      console.log('❌ Return request failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error testing return API:', error.response?.data || error.message);
  }
}

// Chạy test
testReturnAPI();


