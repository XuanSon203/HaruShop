const Cart = require("../../model/CartModel");
const Food = require("../../model/FoodModel");
const Accessory = require("../../model/AccessoriesModel");
const User = require("../../model/UserModel");
const Category = require("../../model/CategoryModel");

const PRODUCT_SELECT_FIELDS =
  "name price category_id quantity remainingStock sold_count soldQuantity";

async function findProductWithModel(productId) {
  if (!productId) return null;
  let doc = await Food.findById(productId).select(PRODUCT_SELECT_FIELDS);
  if (doc) return { doc, Model: Food, type: "food" };
  doc = await Accessory.findById(productId).select(PRODUCT_SELECT_FIELDS);
  if (doc) return { doc, Model: Accessory, type: "accessory" };
  return null;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function reserveStock(productInfo, qty) {
  if (!productInfo || qty <= 0) return { success: false, available: 0 };
  const { doc } = productInfo;
  const baseQuantity = toNumber(doc.quantity);
  const soldCount = toNumber(
    doc.sold_count ?? doc.soldQuantity ?? doc.sold ?? 0
  );
  const computedAvailable = Math.max(0, baseQuantity - soldCount);

  if (computedAvailable <= 0) {
    return { success: false, available: 0 };
  }
  if (qty > computedAvailable) {
    return { success: false, available: computedAvailable };
  }

  // Không cập nhật trực tiếp quantity, chỉ đồng ý cho đặt
  return { success: true, available: computedAvailable };
}

async function releaseStock(productInfo, qty) {
  // Không hoàn kho vì quantity không bị trừ khi giữ hàng
  return;
}

module.exports.index = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.tokenUser;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });
    const user = await User.findOne({ tokenUser: token, deleted: false });
    if (!user)
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });

    const cart = await Cart.findOne({ user_id: String(user._id) });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { user_id: String(user._id), products: [], cart_id: null },
      });
    }

    const productIds = cart.products.map((p) => p.product_id).filter(Boolean);

    // Fetch both Food and Accessory products with complete data including category_id
  const foods = await Food.find({ _id: { $in: productIds } }).select(
      "name thumbnail price _id description brand category_id quantity remainingStock sold_count shipping_id"
    );
    const accessories = await Accessory.find({
      _id: { $in: productIds },
    }).select(
      "name thumbnail price _id description brand slug category_id quantity remainingStock sold_count shipping_id"
    );

    const idToFood = new Map(foods.map((f) => [String(f._id), f]));
    const idToAccessory = new Map(accessories.map((a) => [String(a._id), a]));

    const products = cart.products.map((p) => {
      // Try both collections to find the product
      const food = idToFood.get(String(p.product_id));
      const accessory = idToAccessory.get(String(p.product_id));
      const product = food || accessory;
      const productShippingId = product?.shipping_id
        ? String(product.shipping_id)
        : null;
      const numericQuantity =
        typeof product?.quantity === "number"
          ? product.quantity
          : Number(product?.quantity || 0);
      const numericRemaining =
        typeof product?.remainingStock === "number"
          ? product.remainingStock
          : Number(product?.remainingStock || 0);
      const availableStock =
        Number.isFinite(numericQuantity) && numericQuantity >= 0
          ? numericQuantity
          : Number.isFinite(numericRemaining) && numericRemaining >= 0
          ? numericRemaining
          : 0;

      return {
        product_id: p.product_id,
        category_id: p.category_id, // Include the category_id field
        shipping_id: productShippingId,
        quantity: p.quantity,
        price_original: p.price_original,
        discount_percent: p.discount_percent,
        price_after_discount: p.price_after_discount,
        selected: p.selected,
        product: product
          ? {
              _id: String(product._id),
              name: product.name,
              thumbnail: product.thumbnail,
              price: product.price,
              description: product.description,
              brand: product.brand,
              slug: product.slug, // This will be undefined for foods, which is correct
              category_id: product.category_id, // Include category_id in product data
              shipping_id: productShippingId,
              quantity:
                typeof product.quantity === "number"
                  ? product.quantity
                  : undefined,
              remainingStock:
                typeof product.remainingStock === "number"
                  ? product.remainingStock
                  : undefined,
              sold_count:
                typeof product.sold_count === "number"
                  ? product.sold_count
                  : undefined,
              availableStock,
            }
          : null,
      };
    });

    // Ensure cartId cookie is present for downstream flows if needed
    try {
      res.cookie("cartId", cart._id, {
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      cart: { user_id: String(user._id), products, cart_id: String(cart._id) },
    });
  } catch (error) {
    console.error("Cart index error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports.add = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.tokenUser;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });
    const user = await User.findOne({ tokenUser: token, deleted: false });
    if (!user)
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });

    const body = req.body || {};
    const product_id = body.product_id;
    const quantity = body.quantity;
    const applied_discount = body.applied_discount;
    const discount_percent = body.discount_percent;
    const price_after_discount = body.price_after_discount;
    const category_id = body.category_id;

    if (!product_id) {
      return res.status(400).json({ message: "Thiếu product_id" });
    }

    const qty = Math.max(1, Number(quantity || 1));

    const productInfo = await findProductWithModel(product_id);
    if (!productInfo) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const reserveResult = await reserveStock(productInfo, qty);
    if (!reserveResult.success) {
      return res.status(400).json({
        success: false,
        message:
          reserveResult.available > 0
            ? `Sản phẩm chỉ còn ${reserveResult.available} sản phẩm`
            : "Sản phẩm đã hết hàng",
      });
    }

    const productDoc = productInfo.doc;
    const priceOriginal = Number(productDoc.price || 0);
    const finalPercent = !!applied_discount ? Number(discount_percent || 0) : 0;
    const computedPriceAfter = Math.max(
      0,
      Math.round(priceOriginal * (1 - finalPercent / 100))
    );
    const finalPriceAfter = !!applied_discount
      ? Number(price_after_discount || computedPriceAfter)
      : 0;

    let cart = await Cart.findOne({ user_id: String(user._id) });
    if (!cart) {
      cart = new Cart({ user_id: String(user._id), products: [] });
    }

    const idx = cart.products.findIndex(
      (p) => p.product_id === String(product_id)
    );

    // Use category_id from frontend if provided, otherwise use from database
    const finalCategoryId = category_id || String(productDoc.category_id);

    if (idx >= 0) {
      cart.products[idx].quantity += qty;
      cart.products[idx].price_original = priceOriginal;
      cart.products[idx].discount_percent = finalPercent;
      cart.products[idx].price_after_discount = finalPriceAfter;
      cart.products[idx].selected = true;
      cart.products[idx].category_id = finalCategoryId; // Update category_id
    } else {
      cart.products.push({
        product_id: String(product_id),
        category_id: finalCategoryId, // Add category_id field
        quantity: qty,
        price_original: priceOriginal,
        discount_percent: finalPercent,
        price_after_discount: finalPriceAfter,
        selected: true,
      });
    }

    try {
      await cart.save();
    } catch (error) {
      await releaseStock(productInfo, qty);
      throw error;
    }
    res.cookie("cartId", cart._id, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false, // đặt true nếu dùng HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: "/",
    });
    return res
      .status(200)
      .json({ success: true, message: "Đã thêm vào giỏ hàng", cart });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
module.exports.deleteItem = async (req, res) => {
  try {
    const productId = req.params.productId;
    const categoryId = req.body?.category_id;
    const tokenUser = req.cookies.tokenUser;

    const user = await User.findOne({ tokenUser: tokenUser });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cart = await Cart.findOne({ user_id: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    }

    const targetIndex = cart.products.findIndex(
      (p) =>
        p.product_id === String(productId) &&
        (!categoryId || p.category_id === String(categoryId))
    );

    if (targetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng",
      });
    }

    const removedItem = cart.products[targetIndex];
    cart.products.splice(targetIndex, 1);
    await cart.save();

    const productInfo = await findProductWithModel(removedItem.product_id);
    if (productInfo) {
      await releaseStock(productInfo, removedItem.quantity);
    }

    const updatedCart = await Cart.findOne({ user_id: user._id });

    return res.status(200).json({
      success: true,
      message: "Sản phẩm đã được xóa khỏi giỏ hàng",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa sản phẩm" });
  }
};

module.exports.updateQuantity = async (req, res) => {
  try {
    const { productId, newQuantity } = req.params;
    const categoryId = req.body?.category_id; // optional: support matching by category_id

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu productId" });
    }

    const qty = Math.max(1, Number(newQuantity || 1));

    const token = req.cookies && req.cookies.tokenUser;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });

    const user = await User.findOne({ tokenUser: token, deleted: false });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Phiên đăng nhập không hợp lệ" });
    }

    const cart = await Cart.findOne({ user_id: String(user._id) });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Giỏ hàng không tồn tại" });
    }

    const index = cart.products.findIndex(
      (p) =>
        p.product_id === String(productId) &&
        (categoryId ? p.category_id === String(categoryId) : true)
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng",
      });
    }

    const currentQty = Number(cart.products[index].quantity || 0);
    const diff = qty - currentQty;
    if (diff === 0) {
      return res.status(200).json({
        success: true,
        message: "Số lượng không thay đổi",
        cart,
      });
    }

    const productInfo = await findProductWithModel(productId);
    if (!productInfo) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    if (diff > 0) {
      const reserveResult = await reserveStock(productInfo, diff);
      if (!reserveResult.success) {
        return res.status(400).json({
          success: false,
          message:
            reserveResult.available > 0
              ? `Sản phẩm chỉ còn ${reserveResult.available} sản phẩm`
              : "Sản phẩm đã hết hàng",
        });
      }
    }

    cart.products[index].quantity = qty;

    try {
      await cart.save();
    } catch (error) {
      if (diff > 0) {
        await releaseStock(productInfo, diff);
      }
      throw error;
    }

    if (diff < 0) {
      await releaseStock(productInfo, Math.abs(diff));
    }

    return res
      .status(200)
      .json({ success: true, message: "Đã cập nhật số lượng", cart });
  } catch (error) {
    console.error("Update Quantity Error:", error);
    res.status(500).send("Internal server error");
  }
};

// Xóa toàn bộ giỏ hàng
module.exports.clear = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.tokenUser;
    if (!token) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findOne({ tokenUser: token, deleted: false });
    if (!user) {
      return res.status(401).json({ success: false, message: "Phiên đăng nhập không hợp lệ" });
    }

    const cart = await Cart.findOne({ user_id: String(user._id) });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng đã trống hoặc không tồn tại"
      });
    }

    const items = [...cart.products];
    await Cart.deleteOne({ _id: cart._id });

    for (const item of items) {
      const productInfo = await findProductWithModel(item.product_id);
      if (productInfo) {
        await releaseStock(productInfo, item.quantity);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa toàn bộ giỏ hàng"
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi server khi xóa giỏ hàng" 
    });
  }
};
