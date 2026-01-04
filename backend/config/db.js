import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Mongoose 6+ no longer requires useNewUrlParser and useUnifiedTopology
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/foodxpress'
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
