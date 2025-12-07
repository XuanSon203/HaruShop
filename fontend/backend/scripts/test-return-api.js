// Script test API hoàn hàng
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testReturnAPI() {
  try {
    console.log('🧪 Testing Return API...\n');

    // Test data - sử dụng order_id từ database
    const testData = {
      order_id: '68d3a0c2d60d302b7e61af81', // Order ID từ database
      return_reason: 'Sản phẩm bị hỏng trong quá trình vận chuyển',
      return_description: 'Sản phẩm bị vỡ khi nhận hàng, cần hoàn lại'
    };

    console.log('📤 Sending return request with data:', testData);

    // Test API endpoint
    const response = await axios.post(`${BASE_URL}/api/return/orders/request-return`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'tokenUser=your_actual_token_here' // Thay bằng token thực tế
      }
    });

    console.log('✅ Response status:', response.status);
    console.log('📥 Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('🎉 Return request created successfully!');
      console.log('📋 Return request details:', response.data.return_request);
    } else {
      console.log('❌ Return request failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error testing return API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Chạy test
testReturnAPI();
