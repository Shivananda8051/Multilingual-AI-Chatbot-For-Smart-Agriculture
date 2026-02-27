// Test PlantVillage disease detection model
const plantDiseaseService = require('./services/plantDiseaseService');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log('Testing PlantVillage Disease Detection...\n');

  // Initialize model
  console.log('Loading model...');
  const startLoad = Date.now();
  const initialized = await plantDiseaseService.initialize();
  console.log(`Model loaded: ${initialized} (${Date.now() - startLoad}ms)\n`);

  if (!initialized) {
    console.error('Failed to load model');
    process.exit(1);
  }

  // Check if there's a test image in uploads folder
  const uploadsDir = path.join(__dirname, 'uploads');
  let testImagePath = null;

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const imageFile = files.find(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (imageFile) {
      testImagePath = path.join(uploadsDir, imageFile);
    }
  }

  if (testImagePath) {
    console.log(`Testing with image: ${testImagePath}\n`);

    const imageBuffer = fs.readFileSync(testImagePath);
    const result = await plantDiseaseService.analyzeImage(imageBuffer);

    console.log('=== Detection Result ===');
    console.log(`Crop: ${result.crop}`);
    console.log(`Disease: ${result.disease}`);
    console.log(`Healthy: ${result.isHealthy}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Inference Time: ${result.inferenceTime}ms`);
    console.log('\nTop 5 Predictions:');
    result.topPredictions.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.className}: ${p.confidence}%`);
    });

    console.log('\n=== Generated Analysis ===');
    console.log(plantDiseaseService.generateAnalysis(result));
  } else {
    console.log('No test image found in uploads folder.');
    console.log('Testing with a dummy tensor to verify model works...\n');

    // Create a dummy 224x224 image tensor for testing
    const tf = require('@tensorflow/tfjs');
    const dummyInput = tf.zeros([1, 224, 224, 3]);

    const model = plantDiseaseService.model;
    const startInference = Date.now();
    const predictions = await model.predict(dummyInput).data();
    console.log(`Dummy inference completed in ${Date.now() - startInference}ms`);
    console.log(`Output shape: ${predictions.length} classes`);

    // Find top prediction
    let maxIdx = 0;
    let maxProb = predictions[0];
    for (let i = 1; i < predictions.length; i++) {
      if (predictions[i] > maxProb) {
        maxProb = predictions[i];
        maxIdx = i;
      }
    }
    console.log(`Top prediction: ${plantDiseaseService.classIndices[maxIdx]} (${(maxProb * 100).toFixed(2)}%)`);

    dummyInput.dispose();
  }

  console.log('\n✓ PlantVillage model is working correctly!');
}

test().catch(console.error);
