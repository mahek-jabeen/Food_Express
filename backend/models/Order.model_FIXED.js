import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // 🔥 CRITICAL: Explicit restaurantId for filtering and socket rooms
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true // Optimized for restaurant-specific queries
    },

    items: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: String,
        quantity: Number,
        price: Number,
        customizations: Array,
        specialInstructions: String,
      },
    ],

    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      instructions: String,
    },

    pricing: {
      subtotal: Number,
      deliveryFee: Number,
      tax: Number,
      total: Number,
    },

    payment: {
      method: {
        type: String,
        enum: ["upi", "cod"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "initiated", "paid", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: {
        type: String,
        default: null,
      },
      upiId: {
        type: String,
        default: null,
      },
      app: {
        type: String,
        default: null,
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },

    status: {
      type: String,
      enum: ["pending_payment", "paid", "preparing", "ready", "picked_up", "delivered", "cancelled", "rejected"],
      default: "pending_payment",
    },

    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
  },
  { timestamps: true }
);

// Pre-save middleware to track status changes
OrderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    // Only push if this is a new status (avoid duplicates)
    const lastStatus = this.statusHistory.length > 0 
      ? this.statusHistory[this.statusHistory.length - 1].status 
      : null;
    
    if (lastStatus !== this.status) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        updatedBy: this.deliveryPartner || this.restaurant,
      });
    }
  }
  next();
});

// Method to check if status transition is valid
OrderSchema.methods.canTransitionTo = function(newStatus, userRole) {
  const currentStatus = this.status;
  
  // Define valid transitions based on role (STRICT FLOW)
  const validTransitions = {
    customer: {
      pending_payment: ['cancelled'],
      paid: ['cancelled']
    },
    restaurant: {
      paid: ['preparing', 'rejected'],
      preparing: ['ready', 'cancelled']
    },
    delivery: {
      ready: ['picked_up'],
      picked_up: ['delivered']
    },
    admin: {
      // Admin can do any transition
      '*': ['pending_payment', 'paid', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled', 'rejected']
    }
  };
  
  if (userRole === 'admin') {
    return true;
  }
  
  const roleTransitions = validTransitions[userRole];
  if (!roleTransitions) return false;
  
  const allowedStatuses = roleTransitions[currentStatus];
  return allowedStatuses && allowedStatuses.includes(newStatus);
};

const Order = mongoose.model("Order", OrderSchema);
export default Order;
