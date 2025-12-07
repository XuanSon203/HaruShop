// AI Assistant for natural language processing and product recommendations
import ProductService from '../../services/ProductService';

export class AIAssistant {
  constructor() {
    this.productService = new ProductService();
    
    this.productKeywords = {
      food: ['thức ăn', 'đồ ăn', 'cơm', 'pate', 'hạt', 'kibble', 'wet food', 'dry food', 'snack', 'bánh thưởng', 'thức ăn chó', 'thức ăn mèo', 'pate mèo', 'hạt chó', 'hạt mèo', 'cơm khô', 'cơm ướt', 'bánh kẹo', 'treat', 'food', 'meal'],
      accessory: ['phụ kiện', 'đồ chơi', 'collar', 'dây xích', 'chuồng', 'lồng', 'bát ăn', 'bát uống', 'giường', 'quần áo', 'vòng cổ', 'dây dắt', 'cage', 'toy', 'bowl', 'leash', 'harness', 'bed', 'clothes', 'accessory'],
      service: ['dịch vụ', 'spa', 'grooming', 'cắt tỉa', 'tắm', 'chăm sóc', 'khám', 'tiêm', 'phẫu thuật', 'cắt móng', 'tắm gội', 'massage', 'service', 'care', 'health', 'medical', 'beauty']
    };
    
    this.priceKeywords = {
      cheap: ['rẻ', 'giá thấp', 'tiết kiệm', 'budget', 'kinh tế'],
      expensive: ['đắt', 'cao cấp', 'premium', 'luxury', 'chất lượng cao'],
      medium: ['vừa phải', 'trung bình', 'reasonable', 'hợp lý']
    };
    
    this.petTypes = ['chó', 'mèo', 'cún', 'cún cưng', 'mèo con', 'chó con', 'dog', 'cat', 'puppy', 'kitten'];
    
    this.ageKeywords = {
      young: ['con', 'nhỏ', 'baby', 'puppy', 'kitten', 'trẻ'],
      adult: ['trưởng thành', 'adult', 'lớn'],
      senior: ['già', 'senior', 'cao tuổi']
    };
  }

  // Analyze user input and extract intent
  analyzeIntent(userMessage) {
    const message = userMessage.toLowerCase();
    
    return {
      intent: this.getIntent(message),
      productType: this.getProductType(message),
      priceRange: this.getPriceRange(message),
      petType: this.getPetType(message),
      ageGroup: this.getAgeGroup(message),
      keywords: this.extractKeywords(message)
    };
  }

  // Get user intent
  getIntent(message) {
    // Check for greeting first
    if (this.containsKeywords(message, ['chào', 'hello', 'hi', 'xin chào', 'hey'])) {
      return 'greeting';
    }
    
    // Check for thanks
    if (this.containsKeywords(message, ['cảm ơn', 'thank', 'thanks', 'cảm ơn bạn'])) {
      return 'thanks';
    }
    
    // Check for price-related intent
    if (this.containsKeywords(message, ['giá', 'cost', 'price', 'rẻ', 'đắt', 'bao nhiêu', 'tiền', 'chi phí', 'budget', 'ngân sách'])) {
      return 'price';
    }
    
    // Check for rating/quality intent
    if (this.containsKeywords(message, ['đánh giá', 'review', 'tốt', 'chất lượng', 'rating', 'hay không', 'tốt nhất', 'xuất sắc'])) {
      return 'rating';
    }
    
    // Check for comparison intent
    if (this.containsKeywords(message, ['so sánh', 'compare', 'khác biệt', 'giống nhau', 'khác nhau'])) {
      return 'compare';
    }
    
    // Check for care/health intent
    if (this.containsKeywords(message, ['chăm sóc', 'care', 'sức khỏe', 'health', 'bệnh', 'khám', 'tiêm', 'y tế'])) {
      return 'care';
    }
    
    // Check for product-related keywords (more comprehensive)
    const allProductKeywords = [
      ...this.productKeywords.food,
      ...this.productKeywords.accessory,
      ...this.productKeywords.service,
      'chó', 'mèo', 'cún', 'cún cưng', 'mèo con', 'chó con', 'dog', 'cat', 'thú cưng', 'pet',
      'tìm', 'mua', 'cần', 'muốn', 'tìm kiếm', 'có gì', 'sản phẩm', 'món', 'item'
    ];
    
    if (this.containsKeywords(message, allProductKeywords)) {
      return 'search';
    }
    
    // Check for specific numbers (prices)
    if (this.containsKeywords(message, ['1000', '2000', '5000', '10000', '20000', '50000', '100000', '200000', '500000'])) {
      return 'search';
    }
    
    // Default to search for any meaningful message
    if (message.length > 2) {
      return 'search';
    }
    
    return 'general';
  }

  // Get product type from message
  getProductType(message) {
    for (const [type, keywords] of Object.entries(this.productKeywords)) {
      if (this.containsKeywords(message, keywords)) {
        return type;
      }
    }
    return null;
  }

  // Get price range from message
  getPriceRange(message) {
    for (const [range, keywords] of Object.entries(this.priceKeywords)) {
      if (this.containsKeywords(message, keywords)) {
        return range;
      }
    }
    return null;
  }

  // Get pet type from message
  getPetType(message) {
    if (this.containsKeywords(message, ['chó', 'cún', 'dog', 'puppy'])) {
      return 'dog';
    }
    if (this.containsKeywords(message, ['mèo', 'cat', 'kitten'])) {
      return 'cat';
    }
    return null;
  }

  // Get age group from message
  getAgeGroup(message) {
    for (const [age, keywords] of Object.entries(this.ageKeywords)) {
      if (this.containsKeywords(message, keywords)) {
        return age;
      }
    }
    return null;
  }

  // Extract keywords from message
  extractKeywords(message) {
    const words = message.split(/\s+/);
    return words.filter(word => word.length > 2);
  }

  // Check if message contains any of the keywords
  containsKeywords(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  // Generate natural response based on intent
  generateResponse(intent, context = {}) {
    const responses = {
      greeting: [
        'Xin chào! Tôi rất vui được giúp đỡ bạn tìm sản phẩm phù hợp cho thú cưng. Bạn đang quan tâm đến sản phẩm gì?',
        'Chào bạn! Tôi là trợ lý mua sắm của HaruShop. Tôi có thể giúp bạn tìm thức ăn, phụ kiện hoặc dịch vụ chăm sóc thú cưng. Bạn cần tôi giúp gì?',
        'Hello! Tôi ở đây để giúp bạn tìm những sản phẩm tốt nhất cho thú cưng của mình. Hãy cho tôi biết bạn đang tìm kiếm gì nhé!'
      ],
      search: [
        'Tôi sẽ giúp bạn tìm sản phẩm phù hợp. Hãy để tôi tìm kiếm những lựa chọn tốt nhất...',
        'Để tôi tìm kiếm sản phẩm theo yêu cầu của bạn...',
        'Tôi đang tìm những sản phẩm phù hợp với nhu cầu của bạn...'
      ],
      price: [
        'Tôi sẽ tìm những sản phẩm phù hợp với ngân sách của bạn...',
        'Để tôi tìm kiếm sản phẩm theo mức giá bạn mong muốn...',
        'Tôi sẽ sắp xếp sản phẩm theo giá để bạn dễ so sánh...'
      ],
      rating: [
        'Tôi sẽ tìm những sản phẩm được đánh giá cao nhất...',
        'Để tôi tìm kiếm sản phẩm chất lượng tốt nhất...',
        'Tôi sẽ giới thiệu những sản phẩm được khách hàng đánh giá cao...'
      ],
      care: [
        'Chăm sóc thú cưng rất quan trọng! Tôi sẽ tìm những sản phẩm chăm sóc tốt nhất cho bạn...',
        'Tôi hiểu bạn quan tâm đến sức khỏe thú cưng. Để tôi tìm những sản phẩm chăm sóc phù hợp...',
        'Sức khỏe thú cưng là ưu tiên hàng đầu. Tôi sẽ giới thiệu những sản phẩm chăm sóc chất lượng...'
      ],
      thanks: [
        'Không có gì! Tôi rất vui được giúp đỡ bạn. Nếu cần thêm thông tin gì, hãy cho tôi biết nhé!',
        'Rất vui được phục vụ bạn! Chúc bạn và thú cưng có những trải nghiệm tuyệt vời!',
        'Cảm ơn bạn! Tôi luôn sẵn sàng hỗ trợ khi bạn cần. Chúc bạn mua sắm vui vẻ!'
      ],
      general: [
        'Tôi hiểu bạn đang quan tâm đến sản phẩm cho thú cưng. Bạn có thể cho tôi biết cụ thể hơn về nhu cầu của mình không?',
        'Tôi có thể giúp bạn tìm thức ăn, phụ kiện hoặc dịch vụ chăm sóc. Bạn đang tìm kiếm gì?',
        'Hãy cho tôi biết thêm chi tiết về sản phẩm bạn cần, tôi sẽ tìm kiếm những lựa chọn tốt nhất cho bạn.'
      ]
    };

    const intentResponses = responses[intent] || responses.general;
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
  }

  // Generate search query based on analysis
  generateSearchQuery(analysis) {
    let query = analysis.keywords.join(' ');
    
    // Add product type if detected
    if (analysis.productType) {
      const typeKeywords = this.productKeywords[analysis.productType];
      query += ' ' + typeKeywords.join(' ');
    }
    
    // Add pet type if detected
    if (analysis.petType) {
      query += ' ' + analysis.petType;
    }
    
    // Add age group if detected
    if (analysis.ageGroup) {
      query += ' ' + analysis.ageGroup;
    }
    
    return query.trim();
  }

  // Generate follow-up questions
  generateFollowUpQuestions(analysis) {
    const questions = [];
    
    if (!analysis.productType) {
      questions.push('Bạn đang tìm thức ăn, phụ kiện hay dịch vụ chăm sóc?');
    }
    
    if (!analysis.petType) {
      questions.push('Sản phẩm này dành cho chó hay mèo?');
    }
    
    if (!analysis.priceRange && analysis.intent === 'search') {
      questions.push('Bạn có ngân sách cụ thể nào không?');
    }
    
    return questions;
  }

  // Format product information for display
  formatProductInfo(product) {
    const typeInfo = this.getTypeInfo(product.type);
    const price = product.price ? product.price.toLocaleString('vi-VN') + '₫' : 'Liên hệ';
    const rating = product.rating > 0 ? `⭐ ${product.rating}` : '';
    const sold = product.sold_count > 0 ? `Đã bán: ${product.sold_count}` : '';
    
    return {
      ...product,
      typeInfo,
      formattedPrice: price,
      formattedRating: rating,
      formattedSold: sold
    };
  }

  // Get type information
  getTypeInfo(type) {
    const types = {
      food: { icon: '🍽️', label: 'Đồ ăn', color: '#10b981' },
      accessory: { icon: '🎾', label: 'Phụ kiện', color: '#f59e0b' },
      service: { icon: '🛠️', label: 'Dịch vụ', color: '#8b5cf6' }
    };
    return types[type] || { icon: '📦', label: 'Sản phẩm', color: '#6b7280' };
  }

  // Smart product search based on analysis
  async searchProducts(analysis, userMessage) {
    try {
      let products = [];
      let searchQuery = this.generateSearchQuery(analysis);
      
      
      // If specific product type is detected, search that category
      if (analysis.productType) {
        
        switch (analysis.productType) {
          case 'food':
            products = await this.productService.searchFoods(searchQuery, 6);
            break;
          case 'accessory':
            products = await this.productService.searchAccessories(searchQuery, 6);
            break;
          case 'service':
            products = await this.productService.searchServices(searchQuery, 6);
            break;
        }
      } else {
        // Search all categories
        products = await this.productService.searchAll(searchQuery, 6);
      }
      
      // If no products found, try alternative searches
      if (products.length === 0) {
        
        // Try searching with individual keywords
        const keywords = analysis.keywords.filter(word => word.length > 2);
        for (const keyword of keywords) {
          
          if (analysis.productType) {
            switch (analysis.productType) {
              case 'food':
                products = await this.productService.searchFoods(keyword, 4);
                break;
              case 'accessory':
                products = await this.productService.searchAccessories(keyword, 4);
                break;
              case 'service':
                products = await this.productService.searchServices(keyword, 4);
                break;
            }
          } else {
            products = await this.productService.searchAll(keyword, 4);
          }
          
          if (products.length > 0) {
            break;
          }
        }
      }
      
      // If still no products, try broader search
      if (products.length === 0) {
        
        // Try searching with pet type only
        if (analysis.petType) {
          products = await this.productService.searchAll(analysis.petType, 4);
        }
        
        // If still no products, get popular products
        if (products.length === 0) {
          products = await this.productService.getPopularProducts(analysis.productType || 'all', 4);
        }
      }
      
      
      // Format products for display
      return products.map(product => this.productService.formatProduct(product));
    } catch (error) {
      console.error('Search products error:', error);
      return [];
    }
  }

  // Search products by price range
  async searchProductsByPrice(analysis, userMessage) {
    try {
      let minPrice = 0;
      let maxPrice = 1000000; // Default max price
      
      // Determine price range based on analysis
      if (analysis.priceRange === 'cheap') {
        maxPrice = 50000;
      } else if (analysis.priceRange === 'expensive') {
        minPrice = 200000;
        maxPrice = 1000000;
      } else if (analysis.priceRange === 'medium') {
        minPrice = 50000;
        maxPrice = 200000;
      }
      
      // Extract specific price numbers from message
      const priceMatches = userMessage.match(/(\d+)\s*(k|nghìn|triệu|tr|đ|₫)/gi);
      if (priceMatches) {
        const priceText = priceMatches[0].toLowerCase();
        if (priceText.includes('k') || priceText.includes('nghìn')) {
          const price = parseInt(priceText.match(/\d+/)[0]) * 1000;
          maxPrice = price;
        } else if (priceText.includes('triệu') || priceText.includes('tr')) {
          const price = parseInt(priceText.match(/\d+/)[0]) * 1000000;
          maxPrice = price;
        } else if (priceText.includes('đ') || priceText.includes('₫')) {
          const price = parseInt(priceText.match(/\d+/)[0]);
          maxPrice = price;
        }
      }
      
      
      const products = await this.productService.getProductsByPriceRange(
        minPrice, 
        maxPrice, 
        analysis.productType || 'all', 
        6
      );
      
      return products.map(product => this.productService.formatProduct(product));
    } catch (error) {
      console.error('Search products by price error:', error);
      return [];
    }
  }

  // Generate contextual response based on search results
  generateSearchResponse(analysis, products, userMessage) {
    if (products.length === 0) {
      return this.generateNoResultsResponse(analysis, userMessage);
    }
    
    let response = '';
    
    // Generate response based on intent
    if (analysis.intent === 'price') {
      response = `Tôi tìm thấy ${products.length} sản phẩm phù hợp với ngân sách của bạn:`;
    } else if (analysis.intent === 'rating') {
      response = `Đây là ${products.length} sản phẩm được đánh giá cao nhất:`;
    } else if (analysis.intent === 'care') {
      response = `Tôi giới thiệu ${products.length} sản phẩm chăm sóc tốt nhất cho thú cưng:`;
    } else if (analysis.productType) {
      const typeLabels = {
        food: 'thức ăn',
        accessory: 'phụ kiện',
        service: 'dịch vụ'
      };
      response = `Tôi tìm thấy ${products.length} ${typeLabels[analysis.productType]} phù hợp với yêu cầu của bạn:`;
    } else {
      response = `Tôi tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn:`;
    }
    
    // Add specific recommendations based on pet type
    if (analysis.petType) {
      const petLabels = {
        dog: 'chó',
        cat: 'mèo'
      };
      response += ` Đặc biệt phù hợp cho ${petLabels[analysis.petType]}.`;
    }
    
    return response;
  }

  // Generate response when no products found
  generateNoResultsResponse(analysis, userMessage) {
    let response = `Tôi không tìm thấy sản phẩm nào phù hợp với "${userMessage}". `;
    
    if (analysis.productType) {
      const typeLabels = {
        food: 'thức ăn',
        accessory: 'phụ kiện',
        service: 'dịch vụ'
      };
      response += `Bạn có thể thử tìm kiếm ${typeLabels[analysis.productType]} với từ khóa khác. `;
    }
    
    response += 'Tôi có thể giới thiệu một số sản phẩm phổ biến khác:';
    
    return response;
  }

  // Get product recommendations based on context
  async getContextualRecommendations(analysis) {
    try {
      let products = [];
      
      // Get recommendations based on pet type and age
      if (analysis.petType && analysis.ageGroup) {
        const query = `${analysis.petType} ${analysis.ageGroup}`;
        products = await this.productService.searchAll(query, 4);
      } else if (analysis.petType) {
        const query = analysis.petType;
        products = await this.productService.searchAll(query, 4);
      } else {
        products = await this.productService.getPopularProducts('all', 4);
      }
      
      return products.map(product => this.productService.formatProduct(product));
    } catch (error) {
      console.error('Get contextual recommendations error:', error);
      return [];
    }
  }
}

export default AIAssistant;
