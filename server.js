const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Generate PDF
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { questions, level, lang, useArabic, includeAnswerSheet } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions array' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Math-Master-${new Date().toISOString().slice(0, 10)}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .text(lang === 'ar' ? 'اختبار الحساب' : 'Math Test', { align: 'center' });

    doc.fontSize(12)
      .text(lang === 'ar' ? `المستوى: ${level}` : `Level: ${level}`, { align: 'center' });

    doc.moveDown(0.5);

    // Questions
    questions.forEach((q, index) => {
      doc.fontSize(13)
        .font('Helvetica-Bold')
        .text(`${index + 1}) ${q.text}`);

      if (q.options && Array.isArray(q.options)) {
        doc.fontSize(11);
        q.options.forEach((opt, idx) => {
          doc.text(`  ${String.fromCharCode(65 + idx)}) ${opt}`);
        });
      }

      doc.moveDown(0.3);
    });

    doc.end();

  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

5. **اضغطي "Commit changes"** (الزر الأخضر بالأسفل)

---

## **كرري نفس الخطوات للملفات التالية:**

### **ملف 2: Procfile**
```
web: node server.js
```

---

### **ملف 3: .env**
```
PORT=3000
NODE_ENV=production
