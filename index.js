const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// الاتصال بـ OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;  // ننصح باستخدام environment variable لحفظ API key بشكل آمن

app.post('/summarize', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'يرجى إرسال نص للتلخيص' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',  // يمكنك تعديل هذا حسب الموديل الذي تريده
        prompt: `اختصر لي هذا النص: ${text}`,
        max_tokens: 100,  // تحكم بطول التلخيص
        temperature: 0.7,  // تحكم في إبداع التلخيص
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
      }
    );

    // استرجاع التلخيص من الاستجابة
    const summarizedText = response.data.choices[0].text.trim();
    res.json({ summarized: summarizedText });

  } catch (error) {
    console.error('Error fetching from OpenAI:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بـ OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
