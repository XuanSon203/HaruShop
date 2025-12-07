const Notification = require("../model/NotificationModel");
const systemConfig = require("../config/sysstem");

const ADMIN_PREFIX = systemConfig?.prefixAdmin || "/admin";

function buildOrderLink(orderId) {
  if (!orderId) return "/orders";
  return `/orders?highlight=${orderId}`;
}

function buildAdminOrderLink(orderId, isService) {
  if (!orderId) return `${ADMIN_PREFIX}/orders`;
  return isService
    ? `${ADMIN_PREFIX}/orderservices?orderId=${orderId}`
    : `${ADMIN_PREFIX}/orders?orderId=${orderId}`;
}

function shortOrderCode(id) {
  if (!id) return "";
  const str = String(id);
  return `#${str.slice(-6).toUpperCase()}`;
}

async function pushNotification(payload = {}) {
  try {
    return await Notification.create(payload);
  } catch (error) {
    console.error("pushNotification error:", error);
    return null;
  }
}

async function pushUserNotification({
  userId,
  title,
  message,
  type = "system",
  level = "info",
  orderId = null,
  serviceOrderId = null,
  actionUrl,
  meta = {},
}) {
  if (!userId) return null;

  return pushNotification({
    audience: "user",
    user_id: userId,
    title,
    message,
    type,
    level,
    order_id: orderId,
    service_order_id: serviceOrderId,
    action_url: actionUrl || buildOrderLink(orderId || serviceOrderId),
    meta: {
      orderCode: shortOrderCode(orderId || serviceOrderId),
      ...meta,
    },
  });
}

async function pushAdminNotification({
  accountId = null,
  title,
  message,
  type = "system",
  level = "info",
  orderId = null,
  serviceOrderId = null,
  meta = {},
}) {
  return pushNotification({
    audience: "admin",
    account_id: accountId,
    title,
    message,
    type,
    level,
    order_id: orderId,
    service_order_id: serviceOrderId,
    action_url: buildAdminOrderLink(orderId || serviceOrderId, !!serviceOrderId),
    meta: {
      orderCode: shortOrderCode(orderId || serviceOrderId),
      ...meta,
    },
  });
}

module.exports = {
  pushUserNotification,
  pushAdminNotification,
  shortOrderCode,
};
















