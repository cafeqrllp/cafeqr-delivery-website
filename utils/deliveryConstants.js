/**
 * deliveryConstants.js
 * Shared constants for CafeQR Delivery frontend.
 * Safe to import in both client and server components.
 */

export const ORDER_TYPES = {
  DELIVERY: 'DELIVERY',
  TAKEAWAY: 'TAKEAWAY',
};

export const ORDER_STATUS = {
  PENDING:   'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY:     'READY',
  ASSIGNED:  'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/** Human-readable labels for each status (for UI display) */
export const ORDER_STATUS_LABELS = {
  PENDING:   'Order Received',
  CONFIRMED: 'Confirmed by Restaurant',
  PREPARING: 'Being Prepared',
  READY:     'Ready for Pickup',
  ASSIGNED:  'Delivery Agent Assigned',
  PICKED_UP: 'Order Picked Up',
  DELIVERED: 'Delivered ✅',
  CANCELLED: 'Cancelled ❌',
};

/** Ordered steps for the progress tracker (excludes terminal states) */
export const ORDER_TRACKING_STEPS = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED',
];

export const PAYMENT_METHODS = {
  CASH:      'CASH',
  UPI:       'UPI',
  CARD:      'CARD',
  RAZORPAY:  'RAZORPAY',
};

export const PAYMENT_METHOD_LABELS = {
  CASH:     'Cash on Delivery',
  UPI:      'UPI',
  CARD:     'Card on Delivery',
  RAZORPAY: 'Pay Online',
};

export const FCM_ROLES = {
  CUSTOMER:   'customer',
  RESTAURANT: 'restaurant',
  AGENT:      'agent',
};

export const NOTIFICATION_EVENTS = {
  NEW_ORDER:       'NEW_ORDER',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  AGENT_ASSIGNED:  'AGENT_ASSIGNED',
  ORDER_PICKED_UP: 'ORDER_PICKED_UP',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
};

export const NOTIFICATION_CHANNELS = {
  PUSH:  'PUSH',
  EMAIL: 'EMAIL',
  SMS:   'SMS',
};

/** Default fee config (overridden per-restaurant from delivery_settings table) */
export const DEFAULT_DELIVERY_FEE    = 40;
export const FREE_DELIVERY_ABOVE     = 299;
export const DEFAULT_MIN_ORDER       = 0;
export const DEFAULT_ESTIMATE_MINS   = 30;
