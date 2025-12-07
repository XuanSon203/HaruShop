const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const Service = require("../../model/ServiceModel");

// GET /search?q=...&limit=...&type=...
module.exports.searchAll = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const limit = parseInt(req.query.limit) || 6;
    const type = req.query.type || "all"; // all, food, accessory, service

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Thiếu từ khóa tìm kiếm"
      });
    }

    const results = [];

    // Search foods
    if (type === "all" || type === "food") {
      const foods = await Food.find({
        deleted: false,
        status: "active",
        name: { $regex: query, $options: "i" }
      })
        .populate("category_id", "name")
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);

      const formattedFoods = foods.map(food => ({
        ...food.toObject(),
        type: "food",
        name: food.name,
        price: food.price,
        thumbnail: food.thumbnail,
        rating: food.rating || 0,
        sold_count: food.sold_count || 0
      }));

      results.push(...formattedFoods);
    }

    // Search accessories
    if (type === "all" || type === "accessory") {
      const accessories = await Accessory.find({
        deleted: false,
        status: "active",
        name: { $regex: query, $options: "i" }
      })
        .populate("category_id", "name")
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);

      const formattedAccessories = accessories.map(accessory => ({
        ...accessory.toObject(),
        type: "accessory",
        name: accessory.name,
        price: accessory.price,
        thumbnail: accessory.thumbnail,
        rating: accessory.rating || 0,
        sold_count: accessory.sold_count || 0
      }));

      results.push(...formattedAccessories);
    }

    // Search services
    if (type === "all" || type === "service") {
      const services = await Service.find({
        deleted: false,
        status: "active",
        serviceName: { $regex: query, $options: "i" }
      })
        .populate("category_id", "name")
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);

      const formattedServices = services.map(service => ({
        ...service.toObject(),
        type: "service",
        name: service.serviceName,
        price: service.price,
        thumbnail: service.image,
        rating: service.rating || 0,
        sold_count: service.sold_count || 0
      }));

      results.push(...formattedServices);
    }

    // Shuffle results to mix different types
    const shuffledResults = shuffleArray(results).slice(0, limit);

    return res.status(200).json({
      success: true,
      results: shuffledResults,
      total: shuffledResults.length,
      query: query
    });

  } catch (error) {
    console.error("Search all error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server"
    });
  }
};

// GET /search/suggestions?q=...
module.exports.getSuggestions = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const limit = parseInt(req.query.limit) || 5;

    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = [];

    // Get food suggestions
    const foodSuggestions = await Food.find({
      deleted: false,
      status: "active",
      name: { $regex: query, $options: "i" }
    })
      .select("name")
      .limit(limit);

    foodSuggestions.forEach(food => {
      suggestions.push({
        text: food.name,
        type: "food",
        category: "Thức ăn"
      });
    });

    // Get accessory suggestions
    const accessorySuggestions = await Accessory.find({
      deleted: false,
      status: "active",
      name: { $regex: query, $options: "i" }
    })
      .select("name")
      .limit(limit);

    accessorySuggestions.forEach(accessory => {
      suggestions.push({
        text: accessory.name,
        type: "accessory",
        category: "Phụ kiện"
      });
    });

    // Get service suggestions
    const serviceSuggestions = await Service.find({
      deleted: false,
      status: "active",
      serviceName: { $regex: query, $options: "i" }
    })
      .select("serviceName")
      .limit(limit);

    serviceSuggestions.forEach(service => {
      suggestions.push({
        text: service.serviceName,
        type: "service",
        category: "Dịch vụ"
      });
    });

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, limit);

    return res.status(200).json({
      success: true,
      suggestions: uniqueSuggestions
    });

  } catch (error) {
    console.error("Get suggestions error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server"
    });
  }
};

// GET /search/popular?category=...&limit=...
module.exports.getPopular = async (req, res) => {
  try {
    const category = req.query.category || "all";
    const limit = parseInt(req.query.limit) || 6;

    const results = [];

    // Get popular foods
    if (category === "all" || category === "food") {
      const foods = await Food.find({
        deleted: false,
        status: "active"
      })
        .populate("category_id", "name")
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);

      const formattedFoods = foods.map(food => ({
        ...food.toObject(),
        type: "food",
        name: food.name,
        price: food.price,
        thumbnail: food.thumbnail,
        rating: food.rating || 0,
        sold_count: food.sold_count || 0
      }));

      results.push(...formattedFoods);
    }

    // Get popular accessories
    if (category === "all" || category === "accessory") {
      const accessories = await Accessory.find({
        deleted: false,
        status: "active"
      })
        .populate("category_id", "name")
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);

      const formattedAccessories = accessories.map(accessory => ({
        ...accessory.toObject(),
        type: "accessory",
        name: accessory.name,
        price: accessory.price,
        thumbnail: accessory.thumbnail,
        rating: accessory.rating || 0,
        sold_count: accessory.sold_count || 0
      }));

      results.push(...formattedAccessories);
    }

    // Get popular services
    if (category === "all" || category === "service") {
      const services = await Service.find({
        deleted: false,
        status: "active"
      })
        .populate("category_id", "name")
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);

      const formattedServices = services.map(service => ({
        ...service.toObject(),
        type: "service",
        name: service.serviceName,
        price: service.price,
        thumbnail: service.image,
        rating: service.rating || 0,
        sold_count: service.sold_count || 0
      }));

      results.push(...formattedServices);
    }

    // Shuffle and limit results
    const shuffledResults = shuffleArray(results).slice(0, limit);

    return res.status(200).json({
      success: true,
      results: shuffledResults,
      total: shuffledResults.length
    });

  } catch (error) {
    console.error("Get popular error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server"
    });
  }
};

// Utility function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}