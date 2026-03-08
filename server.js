const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Generate PDF from JSON data
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { questions, level, lang, useArabic, includeAnswerSheet } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty questions array' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Math-Master-${new Date().toISOString().slice(0, 10)}.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margins = 40;
    const isArabic = lang === 'ar';

    const toArabicNumeral = (n) => {
      const ar = '٠١٢٣٤٥٦٧٨٩';
      return String(n).replace(/[0-9]/g, d => ar[parseInt(d)]);
    };
    const fmt = (n) => useArabic ? toArabicNumeral(n) : String(n);

    // Header
    doc.fontSize(22).font('Helvetica-Bold')
      .text(isArabic ? 'اختبار الحساب' : 'Math Test', { align: 'center' });

    doc.fontSize(12).font('Helvetica')
      .text(`${isArabic ? 'المستوى' : 'Level'}: ${level || 'A'}   |   ${isArabic ? 'التاريخ' : 'Date'}: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.moveTo(margins, doc.y).lineTo(pageWidth - margins, doc.y).stroke();
    doc.moveDown(0.5);

    // Name field
    doc.fontSize(11).font('Helvetica')
      .text(isArabic ? 'الاسم: _______________________    الصف: ________    الدرجة: ______ / 100' : 'Name: _______________________    Class: ________    Score: ______ / 100',
        { align: isArabic ? 'right' : 'left' });
    doc.moveDown(0.5);

    // Questions
    const optAr = ['أ', 'ب', 'ج', 'د'];
    const optEn = ['A', 'B', 'C', 'D'];

    questions.forEach((q, i) => {
      if (doc.y > pageHeight - 120) doc.addPage();

      const num = fmt(i + 1);
      doc.fontSize(13).font('Helvetica-Bold')
        .text(`(${num})  ${q.text || ''}`, { align: isArabic ? 'right' : 'left' });

      if (q.options && Array.isArray(q.options)) {
        doc.fontSize(11).font('Helvetica');
        q.options.forEach((opt, j) => {
          const letter = isArabic ? optAr[j] : optEn[j];
          doc.text(`    ${letter})  ${opt}`, { align: isArabic ? 'right' : 'left' });
        });
      }
      doc.moveDown(0.4);
    });

    // Answer sheet
    if (includeAnswerSheet) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold')
        .text(isArabic ? 'ورقة الإجابات' : 'Answer Sheet', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(margins, doc.y).lineTo(pageWidth - margins, doc.y).stroke();
      doc.moveDown(0.5);

      questions.forEach((q, i) => {
        const num = fmt(i + 1);
        doc.fontSize(12).font('Helvetica')
          .text(`${num}.  ${q.answer || '___'}`, { continued: i % 4 !== 3, align: 'left' });
        if (i % 4 === 3) doc.moveDown(0.3);
      });
    }

    doc.end();

  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Generate PDF from raw HTML (legacy)
app.post('/generate-pdf', async (req, res) => {
  res.status(400).json({ error: 'Use /api/generate-pdf instead' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
