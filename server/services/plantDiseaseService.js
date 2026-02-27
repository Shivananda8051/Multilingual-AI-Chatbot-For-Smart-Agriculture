const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Custom IOHandler for loading models from filesystem in pure JS TensorFlow
class FileSystemIOHandler {
  constructor(modelPath) {
    this.modelPath = modelPath;
  }

  async load() {
    const modelJsonPath = path.join(this.modelPath, 'model.json');
    const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));

    // Load weight files
    const weightsManifest = modelJson.weightsManifest;
    const weightSpecs = [];
    const weightData = [];

    for (const group of weightsManifest) {
      for (const weight of group.weights) {
        weightSpecs.push(weight);
      }

      for (const weightPath of group.paths) {
        const fullPath = path.join(this.modelPath, weightPath);
        const buffer = fs.readFileSync(fullPath);
        weightData.push(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      }
    }

    // Concatenate all weight buffers
    const totalSize = weightData.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combinedBuffer = new ArrayBuffer(totalSize);
    const combinedView = new Uint8Array(combinedBuffer);
    let offset = 0;
    for (const buf of weightData) {
      combinedView.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    return {
      modelTopology: modelJson.modelTopology,
      weightSpecs: weightSpecs,
      weightData: combinedBuffer,
      format: modelJson.format,
      generatedBy: modelJson.generatedBy,
      convertedBy: modelJson.convertedBy
    };
  }
}

class PlantDiseaseService {
  constructor() {
    this.model = null;
    this.classIndices = null;
    this.isLoading = false;
    this.modelPath = path.join(__dirname, '..', 'models', 'plant-disease');
    this.inputSize = 224;
  }

  async initialize() {
    if (this.model) return true;
    if (this.isLoading) {
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(r => setTimeout(r, 100));
      }
      return !!this.model;
    }

    this.isLoading = true;
    try {
      console.log('Loading PlantVillage disease detection model...');

      // Load class indices
      const classPath = path.join(this.modelPath, 'class_indices.json');
      this.classIndices = JSON.parse(fs.readFileSync(classPath, 'utf8'));

      // Load TensorFlow.js model using custom file system handler
      console.log('Loading model from:', this.modelPath);
      const ioHandler = new FileSystemIOHandler(this.modelPath);
      this.model = await tf.loadLayersModel(ioHandler);

      console.log('PlantVillage model loaded successfully');
      console.log(`Classes: ${Object.keys(this.classIndices).length}`);
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to load PlantVillage model:', error.message);
      this.isLoading = false;
      return false;
    }
  }

  isAvailable() {
    return !!this.model;
  }

  async preprocessImage(imageBuffer) {
    // Resize image to 224x224 and convert to RGB tensor
    const resizedBuffer = await sharp(imageBuffer)
      .resize(this.inputSize, this.inputSize, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    // Convert to tensor and normalize to [0, 1]
    const tensor = tf.tensor3d(
      new Uint8Array(resizedBuffer),
      [this.inputSize, this.inputSize, 3],
      'float32'
    ).div(255.0);

    // Add batch dimension [1, 224, 224, 3]
    return tensor.expandDims(0);
  }

  async analyzeImage(imageBase64OrBuffer) {
    if (!this.model) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('PlantVillage model not available');
      }
    }

    const startTime = Date.now();

    // Handle base64 or buffer input
    let imageBuffer;
    if (typeof imageBase64OrBuffer === 'string') {
      imageBuffer = Buffer.from(imageBase64OrBuffer, 'base64');
    } else {
      imageBuffer = imageBase64OrBuffer;
    }

    // Preprocess image
    const inputTensor = await this.preprocessImage(imageBuffer);

    // Run inference
    const predictions = await this.model.predict(inputTensor);
    const probabilities = await predictions.data();

    // Get top predictions
    const results = [];
    for (let i = 0; i < probabilities.length; i++) {
      results.push({
        classIndex: i,
        className: this.classIndices[i],
        probability: probabilities[i]
      });
    }

    // Sort by probability descending
    results.sort((a, b) => b.probability - a.probability);

    // Get top prediction
    const topResult = results[0];
    const confidence = (topResult.probability * 100).toFixed(2);

    // Parse class name (format: "Crop___Disease" or "Crop___healthy")
    const [crop, condition] = topResult.className.split('___');
    const cropName = crop.replace(/_/g, ' ').replace(/,/g, ',');
    const isHealthy = condition.toLowerCase() === 'healthy';
    const diseaseName = isHealthy ? 'Healthy' : condition.replace(/_/g, ' ');

    // Clean up tensors
    inputTensor.dispose();
    predictions.dispose();

    const inferenceTime = Date.now() - startTime;
    console.log(`PlantVillage inference completed in ${inferenceTime}ms`);

    return {
      success: true,
      crop: cropName,
      disease: diseaseName,
      isHealthy,
      confidence: parseFloat(confidence),
      rawClassName: topResult.className,
      topPredictions: results.slice(0, 5).map(r => ({
        className: r.className,
        confidence: (r.probability * 100).toFixed(2)
      })),
      inferenceTime,
      model: 'PlantVillage-MobileNet'
    };
  }

  // Generate detailed analysis text based on prediction
  generateAnalysis(result) {
    const { crop, disease, isHealthy, confidence, topPredictions } = result;

    if (isHealthy) {
      return `**Diagnosis:** Your ${crop} plant appears to be **healthy**!

**Confidence:** ${confidence}%

**Symptoms Observed:** No visible signs of disease or pest damage detected.

**Recommendation:** Continue with your current care routine:
- Maintain proper watering schedule
- Ensure adequate sunlight
- Monitor regularly for any changes

**Prevention Tips:**
- Keep good air circulation around plants
- Avoid overwatering
- Remove dead leaves promptly
- Rotate crops if applicable`;
    }

    // Disease detected
    const diseaseInfo = this.getDiseaseInfo(crop, disease);

    return `**Diagnosis:** ${disease} detected on ${crop}

**Confidence:** ${confidence}%

**Severity:** ${confidence > 80 ? 'High' : confidence > 50 ? 'Moderate' : 'Low'} confidence detection

**Symptoms Observed:** ${diseaseInfo.symptoms}

**Likely Causes:** ${diseaseInfo.causes}

**Treatment Recommendations:**
${diseaseInfo.treatment}

**Prevention Tips:**
${diseaseInfo.prevention}

**Other Possibilities:**
${topPredictions.slice(1, 4).map(p => `- ${p.className.replace('___', ' - ').replace(/_/g, ' ')}: ${p.confidence}%`).join('\n')}

**Expert Consultation:** If symptoms persist or worsen, consult a local agricultural extension office.`;
  }

  getDiseaseInfo(crop, disease) {
    // Disease-specific information database
    const diseaseDatabase = {
      'Apple scab': {
        symptoms: 'Dark, scaly lesions on leaves and fruit. Leaves may yellow and drop early.',
        causes: 'Fungal infection (Venturia inaequalis), spreads in cool, wet weather.',
        treatment: `- Remove and destroy infected leaves
- Apply fungicide (sulfur or copper-based)
- Prune to improve air circulation
- Apply in early spring before symptoms appear`,
        prevention: `- Plant resistant varieties
- Clean up fallen leaves in autumn
- Avoid overhead watering
- Maintain good tree spacing`
      },
      'Black rot': {
        symptoms: 'Dark brown to black spots on leaves, fruit, and bark. Fruit mummifies.',
        causes: 'Fungal infection, favored by warm, humid conditions.',
        treatment: `- Remove infected fruit and branches
- Apply copper-based fungicide
- Prune during dormant season
- Sanitize pruning tools`,
        prevention: `- Remove mummified fruits
- Maintain good canopy airflow
- Avoid wounding plants
- Apply protective fungicides`
      },
      'Early blight': {
        symptoms: 'Dark spots with concentric rings (target-like) on lower leaves first.',
        causes: 'Fungal pathogen (Alternaria solani), spreads in warm, humid weather.',
        treatment: `- Remove infected lower leaves
- Apply copper or chlorothalonil fungicide
- Improve air circulation
- Mulch around base to prevent soil splash`,
        prevention: `- Rotate crops (3-4 year cycle)
- Use disease-free seeds
- Space plants properly
- Water at base, not overhead`
      },
      'Late blight': {
        symptoms: 'Water-soaked spots that turn brown, white fuzzy growth underneath leaves.',
        causes: 'Oomycete pathogen (Phytophthora infestans), spreads rapidly in cool, wet conditions.',
        treatment: `- Remove and destroy infected plants immediately
- Apply copper-based or specific fungicides
- Do NOT compost infected material
- Act fast - spreads quickly`,
        prevention: `- Plant resistant varieties
- Ensure good drainage
- Avoid overhead irrigation
- Monitor weather conditions`
      },
      'Bacterial spot': {
        symptoms: 'Small, dark, water-soaked spots on leaves and fruit. Leaves may yellow.',
        causes: 'Bacterial infection, spreads through rain splash and contaminated tools.',
        treatment: `- Remove heavily infected plants
- Apply copper-based bactericides
- Avoid working with wet plants
- Sanitize all tools`,
        prevention: `- Use certified disease-free seeds
- Rotate crops
- Avoid overhead watering
- Space plants for air circulation`
      },
      'Powdery mildew': {
        symptoms: 'White powdery coating on leaves, stems, and sometimes fruit.',
        causes: 'Fungal infection, thrives in warm days and cool nights with high humidity.',
        treatment: `- Apply sulfur or potassium bicarbonate spray
- Neem oil can help
- Remove severely infected parts
- Improve air circulation`,
        prevention: `- Plant resistant varieties
- Avoid overcrowding
- Water at base of plants
- Ensure good sunlight exposure`
      },
      'Leaf Mold': {
        symptoms: 'Pale spots on upper leaf surface, olive-green mold underneath.',
        causes: 'Fungal infection (Passalora fulva), favored by high humidity.',
        treatment: `- Improve ventilation
- Reduce humidity
- Apply fungicides if severe
- Remove affected leaves`,
        prevention: `- Use resistant varieties
- Maintain good air flow
- Avoid leaf wetness
- Stake plants properly`
      },
      'Septoria leaf spot': {
        symptoms: 'Many small circular spots with dark borders and gray centers.',
        causes: 'Fungal infection (Septoria lycopersici), spreads in wet conditions.',
        treatment: `- Remove infected lower leaves
- Apply chlorothalonil or copper fungicide
- Mulch to prevent soil splash
- Stake plants off ground`,
        prevention: `- Rotate crops yearly
- Use drip irrigation
- Space plants adequately
- Clean up debris in fall`
      }
    };

    // Default info for diseases not in database
    const defaultInfo = {
      symptoms: 'Visible abnormalities detected on plant tissue.',
      causes: 'May be caused by fungal, bacterial, or environmental factors.',
      treatment: `- Remove affected plant parts
- Apply appropriate fungicide or treatment
- Improve growing conditions
- Consult local agricultural expert`,
      prevention: `- Practice crop rotation
- Maintain plant hygiene
- Use disease-resistant varieties
- Monitor plants regularly`
    };

    return diseaseDatabase[disease] || defaultInfo;
  }
}

module.exports = new PlantDiseaseService();
