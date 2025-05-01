const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configuration
const HF_API_KEY = process.env.HF_API_KEY || 'your_default_api_key_here';
const ARABIC_MODELS = {
  MAREFA: "eslamxm/AraT5-base-title-generation-finetune-ar-xlsum",
  ARABART: "csebuetnlp/banglabart",
  ARAT5: "UBC-NLP/AraT5-base-summarization"
};

// Helper Functions
const validateInput = (text) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, message: 'النص المطلوب تلخيصه غير صالح' };
  }
  if (text.split(' ').length < 15) {
    return { valid: false, message: 'النص قصير جدًا للتلخيص (يجب أن يحتوي على 15 كلمة على الأقل)' };
  }
  return { valid: true };
};

const processSummary = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    return data[0].summary_text || data[0].generated_text;
  }
  return data.generated_text || null;
};

// Routes
app.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Input Validation
    const validation = validateInput(text);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    // API Call
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${ARABIC_MODELS.MAREFA}`,
      {
        inputs: text,
        parameters: {
          max_length: 100,
          min_length: 50,
          do_sample: true,
          temperature: 0.7,
          top_k: 50,
          top_p: 0.95
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    // Process Response
    let summary = processSummary(response.data);
    
    if (!summary || summary.split(' ').length < 10) {
      summary = "تعذر إنشاء ملخص مفيد. قد يكون النص غير واضح أو قصير جدًا.";
    }

    // Success Response
    res.json({
      success: true,
      original_length: text.length,
      summary_length: summary.length,
      summary: summary,
      model: ARABIC_MODELS.MAREFA
    });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    // Enhanced Error Handling
    let errorMessage = 'فشل في عملية التلخيص';
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
    } else if (error.request) {
      errorMessage = 'لا يوجد استجابة من خدمة التلخيص';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data?.error || error.message
    });
  }
});

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'Arabic Text Summarization',
    available_models: Object.keys(ARABIC_MODELS),
    instructions: 'Send POST request to /summarize with { "text": "your_text_here" }'
  });
});

// Server Start
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Available models: ${Object.values(ARABIC_MODELS).join(', ')}`);
});

module.exports = app; // For testing purposes