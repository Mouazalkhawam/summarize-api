const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// هذا الراوت الأساسي
app.get('/', (req, res) => {
  res.send('✅ API شغالة!');
});

// هذا الراوت يلي لاحقًا رح نحط فيه التلخيص
app.post('/summarize', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'يرجى إرسال نص للتلخيص' });
  }

  // حالياً رجع نفس النص (لاحقاً نضيف تلخيص)
  res.json({ summarized: text });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
