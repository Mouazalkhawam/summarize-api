const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

const ARABIC_MODELS = {
  MAREFA: "eslamxm/AraT5-base-title-generation-finetune-ar-xlsum",
  ARABART: "csebuetnlp/banglabart",
  ARAT5: "UBC-NLP/AraT5-base-summarization"
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
        parameters: { 
          max_length: 100,
          min_length: 50,
          do_sample: true,
          temperature: 0.7
        }
      },
      { 
        headers: { 
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json' 
        } 
      }
    );

    let summary = response.data[0]?.summary_text || response.data.generated_text;
    
    if (!summary || summary.split(' ').length < 10) {
      summary = "تعذر إنشاء ملخّص مفيد. يرجى التأكد من أن النص المدخل يحتوي على معلومات كافية.";
    }

    res.json({ 
      original_length: text.length,
      summary_length: summary.length,
      summary 
    });

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