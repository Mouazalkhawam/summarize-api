const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY; // احفظ التوكن في متغير البيئة

app.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'النص المطلوب تلخيصه مفقود' });
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      { inputs: text },
      { headers: { 'Authorization': `Bearer ${HF_API_KEY}` } }
    );

    const summary = response.data[0]?.summary_text || "لا يمكن تلخيص النص الآن";
    res.json({ summary });

  } catch (error) {
    console.error('Error from Hugging Face:', error.response?.data || error.message);
    res.status(500).json({ error: 'فشل في الاتصال بخدمة التلخيص' });
  }
});

app.get('/', (req, res) => {
  res.send('Hugging Face Summarization API is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});