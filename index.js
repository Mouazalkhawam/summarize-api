const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();
const port = process.env.PORT || 3000;

// تحسينات الأمان والأداء
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// معدل الحد للطلبات (100 طلب في 15 دقيقة)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً'
});
app.use('/summarize', limiter);

// تكوين النماذج والبيئة
const HF_API_KEY = process.env.HF_API_KEY || 'your_fallback_api_key';
const ARABIC_MODELS = {
  MAREFA: "eslamxm/AraT5-base-title-generation-finetune-ar-xlsum",
  ARAT5: "UBC-NLP/AraT5-base-summarization",
  ARABART: "csebuetnlp/banglabart"
};

// Middleware للتحقق من النص
const validateText = (req, res, next) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'النص المطلوب تلخيصه غير صالح' });
  }
  
  if (text.length > 10000) {
    return res.status(413).json({ error: 'النص طويل جداً (الحد الأقصى 10,000 حرف)' });
  }
  
  next();
};

// تحسين دالة التلخيص
const summarizeText = async (text) => {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${ARABIC_MODELS.MAREFA}`,
      {
        inputs: `لخّص النص التالي بدقة مع الحفاظ على الأفكار الرئيسية:\n${text}`,
        parameters: {
          max_length: 150,
          min_length: 50,
          do_sample: true,
          temperature: 0.7,
          top_k: 50,
          top_p: 0.95,
          repetition_penalty: 1.2
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 ثانية كحد أقصى
      }
    );

    return response.data[0]?.summary_text || response.data.generated_text;
  } catch (error) {
    console.error('Summarization Error:', error.message);
    throw new Error('فشل في عملية التلخيص');
  }
};

// نقطة النهاية المحسنة
app.post('/summarize', validateText, async (req, res) => {
  try {
    const { text } = req.body;
    
    // التحقق من جودة النص
    if (text.split(' ').length < 10) {
      return res.status(400).json({ 
        error: 'النص قصير جداً للتلخيص (يحتاج 10 كلمات على الأقل)',
        suggestion: 'أضف المزيد من التفاصيل للنص للحصول على ملخص أفضل'
      });
    }

    const startTime = process.hrtime();
    const summary = await summarizeText(text);
    const elapsedTime = process.hrtime(startTime);
    
    // تحسين النتيجة النهائية
    const cleanedSummary = summary
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .trim();

    res.json({
      success: true,
      summary: cleanedSummary,
      performance: {
        processing_time: `${(elapsedTime[0] * 1000 + elapsedTime[1] / 1e6).toFixed(2)} ms`,
        original_length: text.length,
        summary_length: cleanedSummary.length,
        compression_ratio: `${((1 - (cleanedSummary.length / text.length)) * 100}%`
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error.message,
      details: 'قد يكون الخادم مشغولاً، يرجى المحاولة لاحقاً',
      recovery_suggestion: 'جرب تقليل طول النص أو التحقق من اتصال الإنترنت'
    });
  }
});

// نقطة فحص صحة الخدمة
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'Arabic Text Summarization API',
    version: '2.1.0',
    available_models: Object.keys(ARABIC_MODELS),
    endpoints: {
      summarize: {
        method: 'POST',
        path: '/summarize',
        parameters: {
          text: 'required',
          max_length: 'optional (default: 150)',
          min_length: 'optional (default: 50)'
        }
      }
    }
  });
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({
    error: 'حدث خطأ غير متوقع',
    incident_id: Date.now()
  });
});

// تشغيل الخادم
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
  console.log(`📚 Available Models: ${Object.values(ARABIC_MODELS).join(', ')}`);
  console.log(`🔒 API Key: ${HF_API_KEY ? '*****' + HF_API_KEY.slice(-4) : 'Not Set'}`);
});

module.exports = app; // لأغراض الاختبار