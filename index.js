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
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',  // استخدم الموديل الصحيح الآن
        messages: [
          { role: 'user', content: `اختصر لي هذا النص: ${text}` }
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // استرجاع التلخيص من الاستجابة
    const summarizedText = response.data.choices[0].message.content.trim();
    res.json({ summarized: summarizedText });

  } catch (error) {
    console.error('Error fetching from OpenAI:', error.response?.data || error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بـ OpenAI' });
  }
});

app.get('/', (req, res) => {
  res.send('Summarization API is running.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
