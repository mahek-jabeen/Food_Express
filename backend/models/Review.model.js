import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  foodRating: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false, // Comment is optional
    maxlength: [500, 'Review cannot be more than 500 characters']
  },
  images: [{
    type: String
  }],
  response: {
    message: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Prevent duplicate reviews for same order
reviewSchema.index({ user: 1, order: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRating = async function(restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { restaurant: restaurantId }
    },
    {
      $group: {
        _id: '$restaurant',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].numReviews
    });
  } else {
    await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
      rating: 0,
      totalReviews: 0
    });
  }
};

// Update restaurant rating after save
reviewSchema.post('save', function() {
  this.constructor.calcAverageRating(this.restaurant);
});

// Update restaurant rating after remove
reviewSchema.post('remove', function() {
  this.constructor.calcAverageRating(this.restaurant);
});

export default mongoose.model('Review', reviewSchema);
