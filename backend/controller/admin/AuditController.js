const { populateUserInfo, populateUserInfoArray, getUserActivitySummary } = require("../../helpers/populateUserInfo");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const Service = require("../../model/ServiceModel");
const Category = require("../../model/CategoryModel");
const Discount = require("../../model/DiscountModel");
const Order = require("../../model/OrderModel");
const User = require("../../model/UserModel");
const Account = require("../../model/AccountModel");
const Customer = require("../../model/CustomerModel");
const Role = require("../../model/RoleModel");

/**
 * Get audit trail for all entities with user information
 * GET /admin/audit?entity=&action=&user_id=&from=&to=&page=&limit=
 */
module.exports.getAuditTrail = async (req, res) => {
  try {
    const { 
      entity, 
      action, 
      user_id, 
      from, 
      to, 
      page = 1, 
      limit = 20 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Date range filters
    let startDate, endDate;
    if (from || to) {
      const parseDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };
      
      const parsedFrom = parseDate(from);
      const parsedTo = parseDate(to);
      if (parsedFrom) startDate = new Date(parsedFrom.setHours(0, 0, 0, 0));
      if (parsedTo) {
        const t = new Date(parsedTo);
        endDate = new Date(t.setHours(23, 59, 59, 999));
      }
    }

    // Build query based on entity type
    let query = {};
    let model = null;
    let entityName = '';

    switch (entity) {
      case 'food':
        model = Food;
        entityName = 'Món ăn';
        break;
      case 'accessory':
        model = Accessory;
        entityName = 'Phụ kiện';
        break;
      case 'service':
        model = Service;
        entityName = 'Dịch vụ';
        break;
      case 'category':
        model = Category;
        entityName = 'Danh mục';
        break;
      case 'discount':
        model = Discount;
        entityName = 'Mã giảm giá';
        break;
      case 'order':
        model = Order;
        entityName = 'Đơn hàng';
        break;
      case 'user':
        model = User;
        entityName = 'Người dùng';
        break;
      case 'account':
        model = Account;
        entityName = 'Tài khoản';
        break;
      case 'customer':
        model = Customer;
        entityName = 'Khách hàng';
        break;
      case 'role':
        model = Role;
        entityName = 'Vai trò';
        break;
      default:
        // If no specific entity, get from all models
        return await getAllEntitiesAudit(req, res);
    }

    if (!model) {
      return res.status(400).json({ 
        success: false, 
        message: "Entity không hợp lệ" 
      });
    }

    // Build date range query
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Get total count
    const totalCount = await model.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get documents with user information
    const documents = await model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const documentsWithUserInfo = await populateUserInfoArray(documents);

    // Format audit entries
    const auditEntries = documentsWithUserInfo.map(doc => {
      const entries = [];
      
      // Created entry
      if (doc.createdBy) {
        entries.push({
          action: 'created',
          actionName: 'Tạo mới',
          entity: entityName,
          entityId: doc._id,
          entityName: doc.name || doc.serviceName || doc.fullName || doc.userName || doc.code || 'N/A',
          user: doc.createdBy.user,
          timestamp: doc.createdBy.createdAt,
          details: {
            type: 'create',
            description: `Tạo mới ${entityName.toLowerCase()}`
          }
        });
      }

      // Updated entries
      if (doc.updatedBy && Array.isArray(doc.updatedBy)) {
        doc.updatedBy.forEach(update => {
          entries.push({
            action: 'updated',
            actionName: 'Cập nhật',
            entity: entityName,
            entityId: doc._id,
            entityName: doc.name || doc.serviceName || doc.fullName || doc.userName || doc.code || 'N/A',
            user: update.user,
            timestamp: update.updatedAt,
            details: {
              type: 'update',
              description: `Cập nhật ${entityName.toLowerCase()}`
            }
          });
        });
      }

      // Deleted entry
      if (doc.deletedBy) {
        entries.push({
          action: 'deleted',
          actionName: 'Xóa',
          entity: entityName,
          entityId: doc._id,
          entityName: doc.name || doc.serviceName || doc.fullName || doc.userName || doc.code || 'N/A',
          user: doc.deletedBy.user,
          timestamp: doc.deletedBy.deletedAt,
          details: {
            type: 'delete',
            description: `Xóa ${entityName.toLowerCase()}`
          }
        });
      }

      return entries;
    }).flat();

    // Sort by timestamp
    auditEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter by action if specified
    let filteredEntries = auditEntries;
    if (action) {
      filteredEntries = auditEntries.filter(entry => entry.action === action);
    }

    // Filter by user_id if specified
    if (user_id) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.user && entry.user.id === user_id
      );
    }

    return res.json({
      success: true,
      auditEntries: filteredEntries,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: filteredEntries.length,
        limit: limitNum
      },
      filters: {
        entity: entity || 'all',
        action: action || 'all',
        user_id: user_id || null,
        from: from || null,
        to: to || null
      }
    });

  } catch (error) {
    console.error("Audit trail error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi lấy audit trail" 
    });
  }
};

/**
 * Get audit trail from all entities
 */
const getAllEntitiesAudit = async (req, res) => {
  try {
    const { action, user_id, from, to, page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    
    // Get audit entries from all models
    const models = [
      { model: Food, name: 'Món ăn', field: 'name' },
      { model: Accessory, name: 'Phụ kiện', field: 'name' },
      { model: Service, name: 'Dịch vụ', field: 'serviceName' },
      { model: Category, name: 'Danh mục', field: 'name' },
      { model: Discount, name: 'Mã giảm giá', field: 'code' },
      { model: Order, name: 'Đơn hàng', field: '_id' },
      { model: User, name: 'Người dùng', field: 'fullName' },
      { model: Account, name: 'Tài khoản', field: 'userName' },
      { model: Customer, name: 'Khách hàng', field: 'fullName' },
      { model: Role, name: 'Vai trò', field: 'name' }
    ];

    const allAuditEntries = [];

    for (const { model, name, field } of models) {
      const documents = await model.find({}).sort({ createdAt: -1 }).limit(50);
      const documentsWithUserInfo = await populateUserInfoArray(documents);

      documentsWithUserInfo.forEach(doc => {
        // Created entry
        if (doc.createdBy) {
          allAuditEntries.push({
            action: 'created',
            actionName: 'Tạo mới',
            entity: name,
            entityId: doc._id,
            entityName: doc[field] || 'N/A',
            user: doc.createdBy.user,
            timestamp: doc.createdBy.createdAt,
            details: {
              type: 'create',
              description: `Tạo mới ${name.toLowerCase()}`
            }
          });
        }

        // Updated entries
        if (doc.updatedBy && Array.isArray(doc.updatedBy)) {
          doc.updatedBy.forEach(update => {
            allAuditEntries.push({
              action: 'updated',
              actionName: 'Cập nhật',
              entity: name,
              entityId: doc._id,
              entityName: doc[field] || 'N/A',
              user: update.user,
              timestamp: update.updatedAt,
              details: {
                type: 'update',
                description: `Cập nhật ${name.toLowerCase()}`
              }
            });
          });
        }

        // Deleted entry
        if (doc.deletedBy) {
          allAuditEntries.push({
            action: 'deleted',
            actionName: 'Xóa',
            entity: name,
            entityId: doc._id,
            entityName: doc[field] || 'N/A',
            user: doc.deletedBy.user,
            timestamp: doc.deletedBy.deletedAt,
            details: {
              type: 'delete',
              description: `Xóa ${name.toLowerCase()}`
            }
          });
        }
      });
    }

    // Sort by timestamp
    allAuditEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply filters
    let filteredEntries = allAuditEntries;
    if (action) {
      filteredEntries = filteredEntries.filter(entry => entry.action === action);
    }
    if (user_id) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.user && entry.user.id === user_id
      );
    }

    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    return res.json({
      success: true,
      auditEntries: paginatedEntries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(filteredEntries.length / limitNum),
        totalCount: filteredEntries.length,
        limit: limitNum
      },
      filters: {
        entity: 'all',
        action: action || 'all',
        user_id: user_id || null,
        from: from || null,
        to: to || null
      }
    });

  } catch (error) {
    console.error("All entities audit error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi lấy audit trail" 
    });
  }
};

/**
 * Get user activity summary
 * GET /admin/audit/user-activity/:user_id
 */
module.exports.getUserActivity = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu user_id" 
      });
    }

    const activitySummary = await getUserActivitySummary(user_id);
    
    if (!activitySummary) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông tin người dùng" 
      });
    }

    return res.json({
      success: true,
      activity: activitySummary
    });

  } catch (error) {
    console.error("User activity error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi lấy thông tin hoạt động người dùng" 
    });
  }
};

/**
 * Get audit statistics
 * GET /admin/audit/stats?from=&to=
 */
module.exports.getAuditStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    // Date range filters
    let startDate, endDate;
    if (from || to) {
      const parseDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };
      
      const parsedFrom = parseDate(from);
      const parsedTo = parseDate(to);
      if (parsedFrom) startDate = new Date(parsedFrom.setHours(0, 0, 0, 0));
      if (parsedTo) {
        const t = new Date(parsedTo);
        endDate = new Date(t.setHours(23, 59, 59, 999));
      }
    }

    // Get counts for each action type across all models
    const models = [Food, Accessory, Service, Category, Discount, Order, User, Account, Customer, Role];
    
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    const entityStats = {};

    for (const model of models) {
      const modelName = model.modelName || model.collection.name;
      
      // Count created
      let createdQuery = { createdBy: { $exists: true } };
      if (startDate || endDate) {
        createdQuery['createdBy.createdAt'] = {};
        if (startDate) createdQuery['createdBy.createdAt'].$gte = startDate;
        if (endDate) createdQuery['createdBy.createdAt'].$lte = endDate;
      }
      const createdCount = await model.countDocuments(createdQuery);
      
      // Count updated
      let updatedQuery = { updatedBy: { $exists: true, $ne: [] } };
      if (startDate || endDate) {
        updatedQuery['updatedBy.updatedAt'] = {};
        if (startDate) updatedQuery['updatedBy.updatedAt'].$gte = startDate;
        if (endDate) updatedQuery['updatedBy.updatedAt'].$lte = endDate;
      }
      const updatedCount = await model.countDocuments(updatedQuery);
      
      // Count deleted
      let deletedQuery = { deletedBy: { $exists: true } };
      if (startDate || endDate) {
        deletedQuery['deletedBy.deletedAt'] = {};
        if (startDate) deletedQuery['deletedBy.deletedAt'].$gte = startDate;
        if (endDate) deletedQuery['deletedBy.deletedAt'].$lte = endDate;
      }
      const deletedCount = await model.countDocuments(deletedQuery);
      
      totalCreated += createdCount;
      totalUpdated += updatedCount;
      totalDeleted += deletedCount;
      
      entityStats[modelName] = {
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
        total: createdCount + updatedCount + deletedCount
      };
    }

    return res.json({
      success: true,
      stats: {
        total: {
          created: totalCreated,
          updated: totalUpdated,
          deleted: totalDeleted,
          total: totalCreated + totalUpdated + totalDeleted
        },
        byEntity: entityStats
      },
      period: {
        from: startDate || null,
        to: endDate || null
      }
    });

  } catch (error) {
    console.error("Audit stats error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi lấy thống kê audit" 
    });
  }
};



