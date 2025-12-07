// Product Service for calling different APIs (foods, accessories, services)
class ProductService {
  constructor() {
    this.baseURL = 'http://localhost:8080';
  }

  // Search products across all categories
  async searchAll(query, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.results : [];
      }
      return [];
    } catch (error) {
      console.error('Search all error:', error);
      return [];
    }
  }

  // Search foods specifically
  async searchFoods(query, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/products/food?search=${encodeURIComponent(query)}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.foods) {
          return data.foods.map(food => ({
            ...food,
            type: 'food',
            name: food.name,
            price: food.price,
            thumbnail: food.thumbnail,
            rating: food.rating || 0,
            sold_count: food.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Search foods error:', error);
      return [];
    }
  }

  // Search accessories specifically
  async searchAccessories(query, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/products/accessory?search=${encodeURIComponent(query)}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessories) {
          return data.accessories.map(accessory => ({
            ...accessory,
            type: 'accessory',
            name: accessory.name,
            price: accessory.price,
            thumbnail: accessory.thumbnail,
            rating: accessory.rating || 0,
            sold_count: accessory.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Search accessories error:', error);
      return [];
    }
  }

  // Search services specifically
  async searchServices(query, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/services?search=${encodeURIComponent(query)}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.services) {
          return data.services.map(service => ({
            ...service,
            type: 'service',
            name: service.serviceName, // Map serviceName to name
            price: service.price,
            thumbnail: service.image, // Map image to thumbnail
            rating: service.rating || 0,
            sold_count: service.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Search services error:', error);
      return [];
    }
  }

  // Get popular products by category
  async getPopularProducts(category = 'all', limit = 4) {
    try {
      let products = [];
      
      if (category === 'all' || category === 'food') {
        const foods = await this.getPopularFoods(limit);
        products = [...products, ...foods];
      }
      
      if (category === 'all' || category === 'accessory') {
        const accessories = await this.getPopularAccessories(limit);
        products = [...products, ...accessories];
      }
      
      if (category === 'all' || category === 'service') {
        const services = await this.getPopularServices(limit);
        products = [...products, ...services];
      }
      
      // Shuffle and limit results
      return this.shuffleArray(products).slice(0, limit);
    } catch (error) {
      console.error('Get popular products error:', error);
      return [];
    }
  }

  // Get popular foods (best-selling)
  async getPopularFoods(limit = 4) {
    try {
      const response = await fetch(`${this.baseURL}/products/food?sortBy=sold_count&sortOrder=desc&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.foods) {
          // Filter only products with sold_count > 0 and sort by sold_count
          const bestSellingFoods = data.foods
            .filter(food => (food.sold_count || 0) > 0)
            .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
            .slice(0, limit);
          
          return bestSellingFoods.map(food => ({
            ...food,
            type: 'food',
            name: food.name,
            price: food.price,
            thumbnail: food.thumbnail,
            rating: food.rating || 0,
            sold_count: food.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get popular foods error:', error);
      return [];
    }
  }

  // Get popular accessories (best-selling)
  async getPopularAccessories(limit = 4) {
    try {
      const response = await fetch(`${this.baseURL}/products/accessory?sortBy=sold_count&sortOrder=desc&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessories) {
          // Filter only products with sold_count > 0 and sort by sold_count
          const bestSellingAccessories = data.accessories
            .filter(accessory => (accessory.sold_count || 0) > 0)
            .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
            .slice(0, limit);
          
          return bestSellingAccessories.map(accessory => ({
            ...accessory,
            type: 'accessory',
            name: accessory.name,
            price: accessory.price,
            thumbnail: accessory.thumbnail,
            rating: accessory.rating || 0,
            sold_count: accessory.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get popular accessories error:', error);
      return [];
    }
  }

  // Get popular services
  async getPopularServices(limit = 4) {
    try {
      const response = await fetch(`${this.baseURL}/services/popular?limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.services) {
          return data.services.map(service => ({
            ...service,
            type: 'service',
            name: service.serviceName, // Map serviceName to name
            price: service.price,
            thumbnail: service.image, // Map image to thumbnail
            rating: service.rating || 0,
            sold_count: service.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get popular services error:', error);
      return [];
    }
  }

  // Get products by price range
  async getProductsByPriceRange(minPrice, maxPrice, category = 'all', limit = 6) {
    try {
      let products = [];
      
      if (category === 'all' || category === 'food') {
        const foods = await this.getFoodsByPriceRange(minPrice, maxPrice, limit);
        products = [...products, ...foods];
      }
      
      if (category === 'all' || category === 'accessory') {
        const accessories = await this.getAccessoriesByPriceRange(minPrice, maxPrice, limit);
        products = [...products, ...accessories];
      }
      
      if (category === 'all' || category === 'service') {
        const services = await this.getServicesByPriceRange(minPrice, maxPrice, limit);
        products = [...products, ...services];
      }
      
      return products.slice(0, limit);
    } catch (error) {
      console.error('Get products by price range error:', error);
      return [];
    }
  }

  // Get foods by price range
  async getFoodsByPriceRange(minPrice, maxPrice, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/products/food?minPrice=${minPrice}&maxPrice=${maxPrice}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.foods) {
          return data.foods.map(food => ({
            ...food,
            type: 'food',
            name: food.name,
            price: food.price,
            thumbnail: food.thumbnail,
            rating: food.rating || 0,
            sold_count: food.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get foods by price range error:', error);
      return [];
    }
  }

  // Get accessories by price range
  async getAccessoriesByPriceRange(minPrice, maxPrice, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/products/accessory?minPrice=${minPrice}&maxPrice=${maxPrice}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessories) {
          return data.accessories.map(accessory => ({
            ...accessory,
            type: 'accessory',
            name: accessory.name,
            price: accessory.price,
            thumbnail: accessory.thumbnail,
            rating: accessory.rating || 0,
            sold_count: accessory.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get accessories by price range error:', error);
      return [];
    }
  }

  // Get services by price range
  async getServicesByPriceRange(minPrice, maxPrice, limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/services?minPrice=${minPrice}&maxPrice=${maxPrice}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.services) {
          return data.services.map(service => ({
            ...service,
            type: 'service',
            name: service.serviceName, // Map serviceName to name
            price: service.price,
            thumbnail: service.image, // Map image to thumbnail
            rating: service.rating || 0,
            sold_count: service.sold_count || 0
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get services by price range error:', error);
      return [];
    }
  }

  // Get product image URL
  getProductImageUrl(product) {
    if (!product.thumbnail) return null;
    
    // If thumbnail already has full URL, return it
    if (product.thumbnail.startsWith('http')) {
      return product.thumbnail;
    }
    
    // Handle different product types
    if (product.type === 'service') {
      return product.thumbnail.startsWith('/')
        ? `${this.baseURL}${product.thumbnail}`
        : `${this.baseURL}/uploads/services/${product.thumbnail}`;
    } else if (product.type === 'food') {
      return `${this.baseURL}/uploads/products/foods/${product.thumbnail}`;
    } else if (product.type === 'accessory') {
      return `${this.baseURL}/uploads/products/accessory/${product.thumbnail}`;
    }
    
    // Fallback for unknown types
    return product.thumbnail.startsWith('/')
      ? `${this.baseURL}${product.thumbnail}`
      : `${this.baseURL}/uploads/${product.thumbnail}`;
  }

  // Shuffle array utility
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get featured foods
  async getFeaturedFoods(limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/products/food?is_featured=true&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.foods) {
          return data.foods.map(food => ({
            ...food,
            type: 'food',
            name: food.name,
            price: food.price,
            thumbnail: food.thumbnail,
            rating: food.rating || 0,
            sold_count: food.sold_count || 0,
            is_featured: food.is_featured || false
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get featured foods error:', error);
      return [];
    }
  }

  // Get featured accessories
  async getFeaturedAccessories(limit = 6) {
    try {
      const response = await fetch(`${this.baseURL}/products/accessory?is_featured=true&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessories) {
          return data.accessories.map(accessory => ({
            ...accessory,
            type: 'accessory',
            name: accessory.name,
            price: accessory.price,
            thumbnail: accessory.thumbnail,
            rating: accessory.rating || 0,
            sold_count: accessory.sold_count || 0,
            is_featured: accessory.is_featured || false
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Get featured accessories error:', error);
      return [];
    }
  }

  // Format product for display
  formatProduct(product) {
    const basePrice = Number(product.price || 0);
    const rating = product.rating > 0 ? `⭐ ${product.rating}` : '';
    const sold = product.sold_count > 0 ? `Đã bán: ${product.sold_count}` : '';

    let finalPrice = basePrice;
    let discountPercent = 0;
    let discountLabel = '';
    let formattedOriginalPrice = '';
    const discount = product?.discount_id;

    if (
      discount &&
      (typeof discount === 'object') &&
      discount.status === 'active'
    ) {
      const discountValue = Number(discount.value || 0);
      if (discount.type === 'percent') {
        discountPercent = discountValue;
        finalPrice = Math.max(0, basePrice * (1 - discountValue / 100));
        discountLabel = `-${discountValue}%`;
      } else if (discount.type === 'amount') {
        finalPrice = Math.max(0, basePrice - discountValue);
        discountPercent =
          basePrice > 0 ? Math.round((discountValue / basePrice) * 100) : 0;
        discountLabel = `-${discountValue.toLocaleString('vi-VN')}₫`;
      }
      formattedOriginalPrice = basePrice.toLocaleString('vi-VN') + '₫';
    }

    const formattedPrice = finalPrice
      ? finalPrice.toLocaleString('vi-VN') + '₫'
      : basePrice
      ? basePrice.toLocaleString('vi-VN') + '₫'
      : 'Liên hệ';

    return {
      ...product,
      price: basePrice,
      final_price: finalPrice,
      original_price: basePrice,
      discount_percent: discountPercent,
      discount_label: discountLabel || null,
      has_discount: discountPercent > 0,
      formattedPrice,
      formattedOriginalPrice,
      formattedRating: rating,
      formattedSold: sold,
      imageUrl: this.getProductImageUrl(product),
    };
  }
}

export default ProductService;
