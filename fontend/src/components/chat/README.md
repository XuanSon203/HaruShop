# Hệ thống Chat AI với Tích hợp API

## Tổng quan

Hệ thống chat AI được nâng cấp để có thể gọi API từ foods, accessories và services riêng biệt, đưa ra các sản phẩm hay câu trả lời thông minh cho khách hàng.

## Cấu trúc Components

### 1. **ProductService.js**
Service chính để gọi API từ các endpoint khác nhau:

#### **API Methods:**
- `searchAll(query, limit)` - Tìm kiếm tất cả sản phẩm
- `searchFoods(query, limit)` - Tìm kiếm thức ăn
- `searchAccessories(query, limit)` - Tìm kiếm phụ kiện
- `searchServices(query, limit)` - Tìm kiếm dịch vụ
- `getPopularProducts(category, limit)` - Lấy sản phẩm phổ biến
- `getProductsByPriceRange(minPrice, maxPrice, category, limit)` - Tìm theo khoảng giá

#### **Utility Methods:**
- `getProductImageUrl(product)` - Lấy URL hình ảnh
- `formatProduct(product)` - Format sản phẩm cho hiển thị
- `shuffleArray(array)` - Xáo trộn mảng

### 2. **AIAssistant.js** (Enhanced)
AI Assistant được nâng cấp với khả năng:

#### **Smart Search:**
- `searchProducts(analysis, userMessage)` - Tìm kiếm thông minh
- `searchProductsByPrice(analysis, userMessage)` - Tìm theo giá
- `getContextualRecommendations(analysis)` - Gợi ý theo ngữ cảnh

#### **Response Generation:**
- `generateSearchResponse(analysis, products, userMessage)` - Tạo phản hồi tìm kiếm
- `generateNoResultsResponse(analysis, userMessage)` - Phản hồi khi không tìm thấy

#### **Enhanced Keywords:**
- Mở rộng từ khóa cho foods, accessories, services
- Hỗ trợ tìm kiếm theo giá, đánh giá, chăm sóc
- Phân tích loại thú cưng và độ tuổi

### 3. **ChatBox.jsx** (Updated)
ChatBox được cập nhật để sử dụng AI Assistant mới:

#### **Features:**
- Tích hợp ProductService
- Sử dụng AI Assistant nâng cấp
- Hiển thị sản phẩm với hình ảnh đúng
- Xử lý lỗi tốt hơn

### 4. **ChatTest.jsx** (New)
Component test để kiểm tra tích hợp:

#### **Test Functions:**
- Test từng API riêng biệt
- Test AI Analysis
- Test AI Search
- Test tất cả cùng lúc

## Cách hoạt động

### 1. **Phân tích tin nhắn người dùng**
```javascript
const analysis = aiAssistant.analyzeIntent(userMessage);
// Trả về: intent, productType, priceRange, petType, ageGroup, keywords
```

### 2. **Tìm kiếm sản phẩm thông minh**
```javascript
// Nếu có productType cụ thể
if (analysis.productType === 'food') {
  products = await productService.searchFoods(query, 6);
} else if (analysis.productType === 'accessory') {
  products = await productService.searchAccessories(query, 6);
} else if (analysis.productType === 'service') {
  products = await productService.searchServices(query, 6);
} else {
  products = await productService.searchAll(query, 6);
}
```

### 3. **Tìm kiếm theo giá**
```javascript
if (analysis.intent === 'price') {
  products = await aiAssistant.searchProductsByPrice(analysis, userMessage);
}
```

### 4. **Gợi ý sản phẩm phổ biến**
```javascript
if (products.length === 0) {
  products = await aiAssistant.getContextualRecommendations(analysis);
}
```

## Ví dụ sử dụng

### **Tìm kiếm thức ăn cho chó:**
- Input: "tôi cần thức ăn cho chó"
- AI phân tích: productType = 'food', petType = 'dog'
- Gọi API: `searchFoods('thức ăn chó', 6)`
- Hiển thị: Danh sách thức ăn phù hợp

### **Tìm kiếm theo giá:**
- Input: "tôi cần phụ kiện dưới 100k"
- AI phân tích: productType = 'accessory', priceRange = 'cheap'
- Gọi API: `getProductsByPriceRange(0, 100000, 'accessory', 6)`
- Hiển thị: Phụ kiện trong khoảng giá

### **Tìm kiếm dịch vụ:**
- Input: "tôi cần dịch vụ spa cho mèo"
- AI phân tích: productType = 'service', petType = 'cat'
- Gọi API: `searchServices('spa mèo', 6)`
- Hiển thị: Dịch vụ spa phù hợp

## API Endpoints được sử dụng

### **Foods:**
- `GET /products/food?search={query}&limit={limit}`
- `GET /products/food?sort=popular&limit={limit}`
- `GET /products/food?minPrice={min}&maxPrice={max}&limit={limit}`

### **Accessories:**
- `GET /products/accessory?search={query}&limit={limit}`
- `GET /products/accessory?sort=popular&limit={limit}`
- `GET /products/accessory?minPrice={min}&maxPrice={max}&limit={limit}`

### **Services:**
- `GET /services?search={query}&limit={limit}`
- `GET /services?sort=popular&limit={limit}`
- `GET /services?minPrice={min}&maxPrice={max}&limit={limit}`

### **General Search:**
- `GET /search?q={query}&limit={limit}`

## Tính năng mới

### 1. **Tìm kiếm thông minh**
- Phân tích ngữ cảnh và ý định
- Gọi API phù hợp với loại sản phẩm
- Fallback khi không tìm thấy

### 2. **Gợi ý sản phẩm**
- Sản phẩm phổ biến theo danh mục
- Gợi ý theo loại thú cưng và độ tuổi
- Tìm kiếm theo khoảng giá

### 3. **Xử lý lỗi tốt hơn**
- Retry với từ khóa khác
- Hiển thị sản phẩm phổ biến khi không tìm thấy
- Thông báo lỗi rõ ràng

### 4. **Test Integration**
- Component test để kiểm tra API
- Hiển thị kết quả chi tiết
- Đo thời gian thực thi

## Cách test

1. Truy cập `/test-search` để mở ChatTest component
2. Chạy các test riêng lẻ hoặc tất cả
3. Kiểm tra kết quả và thời gian thực thi
4. Test với các câu hỏi khác nhau trong chat

## Cải tiến mới (Latest Updates)

### 1. **Backend API Improvements**
- **ServiceController (Client)**: Thêm API endpoints cho client với tìm kiếm nâng cao
- **AccessoriesController**: Cải thiện tìm kiếm với filter theo giá, category, sort
- **FoodController**: Nâng cấp API với tìm kiếm theo giá và sắp xếp
- **SearchController**: Controller mới cho tìm kiếm tổng hợp

### 2. **Enhanced ProductService**
- Cập nhật tất cả API endpoints để sử dụng URL mới
- Chuẩn hóa tên trường dữ liệu (name thay vì foodName, accessoryName)
- Cải thiện error handling và logging
- Thêm method formatProduct để chuẩn hóa dữ liệu

### 3. **Improved AIAssistant**
- Mở rộng từ khóa tìm kiếm cho tất cả loại sản phẩm
- Cải thiện logic phân tích intent với thứ tự ưu tiên
- Tăng cường fallback search khi không tìm thấy sản phẩm
- Thêm logging chi tiết để debug

### 4. **New Test Component**
- **ChatIntegrationTest**: Component test tích hợp toàn diện
- Test AI analysis và product search
- Validation kết quả và đo performance
- UI thân thiện để debug và monitor

### 5. **API Endpoints mới**

#### **Foods:**
- `GET /products/food?search={query}&limit={limit}&minPrice={min}&maxPrice={max}&sort={sort}`
- `GET /products/food/popular?limit={limit}`
- `GET /products/food/category/{id}?page={page}&limit={limit}`

#### **Accessories:**
- `GET /products/accessory?search={query}&limit={limit}&minPrice={min}&maxPrice={max}&sort={sort}`
- `GET /products/accessory/popular?limit={limit}`
- `GET /products/accessory/category/{id}?page={page}&limit={limit}`

#### **Services:**
- `GET /services?search={query}&limit={limit}&minPrice={min}&maxPrice={max}&sort={sort}`
- `GET /services/popular?limit={limit}`
- `GET /services/category/{id}?page={page}&limit={limit}`

#### **Search:**
- `GET /search?q={query}&limit={limit}&type={type}`
- `GET /search/suggestions?q={query}&limit={limit}`
- `GET /search/popular?category={category}&limit={limit}`

## Lưu ý

- Tất cả API calls đều có error handling và logging chi tiết
- Hình ảnh được xử lý tự động theo loại sản phẩm
- Sản phẩm được format chuẩn cho hiển thị
- Hỗ trợ tìm kiếm tiếng Việt và tiếng Anh
- Fallback search khi không tìm thấy sản phẩm cụ thể
- Performance monitoring và test integration

