const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-agriculture';

const ReelSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  category: {
    type: String,
    enum: ['farming_tips', 'crop_care', 'irrigation', 'organic_farming', 'pest_control', 'harvesting', 'equipment', 'success_stories', 'weather', 'market'],
    default: 'farming_tips'
  },
  video: {
    url: { type: String, required: true },
    thumbnail: String,
    duration: Number
  },
  tags: [{ type: String }],
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const Reel = mongoose.model('Reel', ReelSchema);

const sampleReels = [
  {
    title: 'Modern Drip Irrigation Techniques',
    description: 'Learn how to set up an efficient drip irrigation system for your farm to save water and increase crop yield.',
    category: 'irrigation',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      duration: 60
    },
    tags: ['irrigation', 'water-saving', 'modern-farming'],
    isFeatured: true,
    order: 1
  },
  {
    title: 'Organic Pest Control Methods',
    description: 'Natural ways to protect your crops from pests without harmful chemicals.',
    category: 'pest_control',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=400',
      duration: 45
    },
    tags: ['organic', 'pest-control', 'natural'],
    isFeatured: true,
    order: 2
  },
  {
    title: 'Rice Cultivation Best Practices',
    description: 'Step-by-step guide to growing healthy rice crops with maximum yield.',
    category: 'crop_care',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400',
      duration: 90
    },
    tags: ['rice', 'paddy', 'cultivation'],
    isFeatured: true,
    order: 3
  },
  {
    title: 'Tractor Maintenance Tips',
    description: 'Keep your tractor running smoothly with these essential maintenance tips.',
    category: 'equipment',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
      duration: 75
    },
    tags: ['tractor', 'maintenance', 'equipment'],
    isFeatured: false,
    order: 4
  },
  {
    title: 'Composting for Organic Farming',
    description: 'How to create nutrient-rich compost from farm waste for healthier soil.',
    category: 'organic_farming',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      duration: 55
    },
    tags: ['compost', 'organic', 'soil-health'],
    isFeatured: false,
    order: 5
  },
  {
    title: 'Wheat Harvesting Techniques',
    description: 'Efficient methods for harvesting wheat to minimize losses.',
    category: 'harvesting',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
      duration: 80
    },
    tags: ['wheat', 'harvesting', 'grain'],
    isFeatured: false,
    order: 6
  },
  {
    title: 'Weather Prediction for Farmers',
    description: 'Understanding weather patterns and planning your farm activities accordingly.',
    category: 'weather',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400',
      duration: 65
    },
    tags: ['weather', 'planning', 'seasons'],
    isFeatured: false,
    order: 7
  },
  {
    title: 'Success Story: Small Farm to Big Profits',
    description: 'Inspiring story of a farmer who transformed a small plot into a profitable business.',
    category: 'success_stories',
    video: {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400',
      duration: 120
    },
    tags: ['success', 'inspiration', 'business'],
    isFeatured: true,
    order: 8
  }
];

async function seedReels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if reels already exist
    const existingCount = await Reel.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing reels. Deleting...`);
      await Reel.deleteMany({});
    }

    // Insert sample reels
    console.log('Inserting sample reels...');
    const result = await Reel.insertMany(sampleReels);
    console.log(`Successfully created ${result.length} reels!`);

    // List created reels
    console.log('\nCreated reels:');
    result.forEach((reel, i) => {
      console.log(`${i + 1}. ${reel.title} (${reel.category})`);
    });

    await mongoose.connection.close();
    console.log('\nDone! Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding reels:', error);
    process.exit(1);
  }
}

seedReels();
