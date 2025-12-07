const Account = require("../model/AccountModel");

// Cache for user information to improve performance
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user information with caching
 * @param {String} accountId - Account ID
 * @returns {Object|null} - User information or null
 */
const getUserInfo = async (accountId) => {
  if (!accountId) return null;
  
  // Check cache first
  const cached = userCache.get(accountId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const user = await Account.findById(accountId).select('fullName userName email phone role_id status');
    const userInfo = user ? {
      id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      status: user.status
    } : null;
    
    // Cache the result
    userCache.set(accountId, {
      data: userInfo,
      timestamp: Date.now()
    });
    
    return userInfo;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

/**
 * Clear user cache (useful for testing or when user data changes)
 */
const clearUserCache = () => {
  userCache.clear();
};

/**
 * Populate user information for createdBy, updatedBy, and deletedBy fields
 * @param {Object} doc - The document to populate
 * @param {Array} fields - Array of field names to populate (e.g., ['createdBy', 'updatedBy', 'deletedBy'])
 * @returns {Object} - Document with populated user information
 */
const populateUserInfo = async (doc, fields = ['createdBy', 'updatedBy', 'deletedBy']) => {
  if (!doc) return doc;

  const populatedDoc = doc.toObject ? doc.toObject() : { ...doc };

  // Collect all unique account IDs to fetch in batch
  const accountIds = new Set();
  
  for (const field of fields) {
    if (populatedDoc[field]) {
      if (field === 'updatedBy' && Array.isArray(populatedDoc[field])) {
        populatedDoc[field].forEach(update => {
          if (update && update.account_id) {
            accountIds.add(update.account_id.toString());
          }
        });
      } else if (populatedDoc[field] && populatedDoc[field].account_id) {
        accountIds.add(populatedDoc[field].account_id.toString());
      }
    }
  }

  // Fetch all user information in batch
  const userInfoMap = new Map();
  if (accountIds.size > 0) {
    const userPromises = Array.from(accountIds).map(async (accountId) => {
      const userInfo = await getUserInfo(accountId);
      if (userInfo) {
        userInfoMap.set(accountId, userInfo);
      }
    });
    
    await Promise.all(userPromises);
  }

  // Populate the fields with user information
  for (const field of fields) {
    if (populatedDoc[field]) {
      if (field === 'updatedBy' && Array.isArray(populatedDoc[field])) {
        // Handle updatedBy array
        populatedDoc[field] = populatedDoc[field].map(update => {
          if (update && update.account_id) {
            const userInfo = userInfoMap.get(update.account_id.toString());
            return {
              ...update,
              user: userInfo || null
            };
          }
          return update;
        });
      } else if (populatedDoc[field] && populatedDoc[field].account_id) {
        // Handle single user fields (createdBy, deletedBy)
        const userInfo = userInfoMap.get(populatedDoc[field].account_id.toString());
        populatedDoc[field] = {
          ...populatedDoc[field],
          user: userInfo || null
        };
      }
    }
  }

  return populatedDoc;
};

/**
 * Populate user information for an array of documents
 * @param {Array} docs - Array of documents to populate
 * @param {Array} fields - Array of field names to populate
 * @returns {Array} - Array of documents with populated user information
 */
const populateUserInfoArray = async (docs, fields = ['createdBy', 'updatedBy', 'deletedBy']) => {
  if (!Array.isArray(docs)) return docs;
  
  // Collect all unique account IDs from all documents
  const accountIds = new Set();
  
  docs.forEach(doc => {
    const docObj = doc.toObject ? doc.toObject() : { ...doc };
    for (const field of fields) {
      if (docObj[field]) {
        if (field === 'updatedBy' && Array.isArray(docObj[field])) {
          docObj[field].forEach(update => {
            if (update && update.account_id) {
              accountIds.add(update.account_id.toString());
            }
          });
        } else if (docObj[field] && docObj[field].account_id) {
          accountIds.add(docObj[field].account_id.toString());
        }
      }
    }
  });

  // Fetch all user information in batch
  const userInfoMap = new Map();
  if (accountIds.size > 0) {
    const userPromises = Array.from(accountIds).map(async (accountId) => {
      const userInfo = await getUserInfo(accountId);
      if (userInfo) {
        userInfoMap.set(accountId, userInfo);
      }
    });
    
    await Promise.all(userPromises);
  }

  // Populate all documents
  return docs.map(doc => {
    const populatedDoc = doc.toObject ? doc.toObject() : { ...doc };
    
    for (const field of fields) {
      if (populatedDoc[field]) {
        if (field === 'updatedBy' && Array.isArray(populatedDoc[field])) {
          populatedDoc[field] = populatedDoc[field].map(update => {
            if (update && update.account_id) {
              const userInfo = userInfoMap.get(update.account_id.toString());
              return {
                ...update,
                user: userInfo || null
              };
            }
            return update;
          });
        } else if (populatedDoc[field] && populatedDoc[field].account_id) {
          const userInfo = userInfoMap.get(populatedDoc[field].account_id.toString());
          populatedDoc[field] = {
            ...populatedDoc[field],
            user: userInfo || null
          };
        }
      }
    }
    
    return populatedDoc;
  });
};

/**
 * Get user activity summary for a specific user
 * @param {String} accountId - Account ID
 * @returns {Object} - User activity summary
 */
const getUserActivitySummary = async (accountId) => {
  const userInfo = await getUserInfo(accountId);
  if (!userInfo) return null;
  
  return {
    user: userInfo,
    lastActivity: new Date(),
    totalActions: 0, // This could be calculated from audit logs
    status: userInfo.status
  };
};

module.exports = {
  populateUserInfo,
  populateUserInfoArray,
  getUserInfo,
  clearUserCache,
  getUserActivitySummary
};
