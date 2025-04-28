const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

// أفضل النماذج للعربية (اختر واحدًا)
const ARABIC_MODELS = {
  MAREFA: "eslamxm/mt5-base-arabic", // متخصص في تلخيص العربية
  ARABART: "csebuetnlp/banglabart", // يدعم العربية أيضًا
  ARAT5: "UBC-NLP/AraT5-base-summarization" // خيار آخر
};

app.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'النص المطلوب تلخيصه مفقود' });
  }

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${ARABIC_MODELS.MAREFA}`,
      { 
        inputs: text,
        parameters: { max_length: 130 } // تحكم بطول الملخص
      },
      { 
        headers: { 
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json' 
        } 
      }
    );

    const summary = response.data[0]?.summary_text || response.data.generated_text || "لا يمكن تلخيص النص الآن";
    res.json({ summary });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'فشل في التلخيص',
      details: error.response?.data?.error || error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.send('خدمة تلخيص النصوص العربية تعمل!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});