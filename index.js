const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// مفتاح API لـ DeepSeek (يجب تخزينه في متغيرات البيئة)
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

app.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'يرجى إرسال نص للتلخيص' });
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions', // نهاية نقطة DeepSeek API
      {
        model: 'deepseek-chat', // موديل DeepSeek
        messages: [
          { role: 'system', content: 'أنت مساعد مفيد يقوم بتلخيص النصوص.' },
          { role: 'user', content: `اختصر لي هذا النص: ${text}` }
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // استرجاع التلخيص من الاستجابة
    const summarizedText = response.data.choices[0].message.content.trim();
    res.json({ summarized: summarizedText });

  } catch (error) {
    console.error('Error fetching from DeepSeek:', error.response?.data || error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بـ DeepSeek API' });
  }
});

app.get('/', (req, res) => {
  res.send('Summarization API is running with DeepSeek.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});