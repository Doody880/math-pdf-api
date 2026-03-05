const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ type: 'text/html', limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Generate PDF from HTML (الطريقة القديمة - تبقى)
app.post('/generate-pdf', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    const page = await browser.newPage();
    await page.setContent(req.body, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    await browser.close();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': 'attachment; filename="Math-Master-Test.pdf"'
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating PDF');
  }
});

// Generate PDF from JSON data (الطريقة الجديدة)
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { questions, level, lang, useArabic } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid questions' });
    }

    // بناء HTML من البيانات
    const html = buildPdfHtml(questions, level, lang, useArabic);

    // تحويل HTML إلى PDF
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="Math-Master-${new Date().toISOString().slice(0, 10)}.pdf"`
    });
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// دالة بناء HTML من الأسئلة
function buildPdfHtml(questions, level, lang, useArabic) {
  const isArabic = lang === 'ar';
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  
  const formatNumber = (n) => {
    if (!useArabic) return String(n);
    return String(n).replace(/[0-9]/g, d => arabicNumerals[parseInt(d, 10)]);
  };

  let questionsHtml = '';
  questions.forEach((q, index) => {
    const num = formatNumber(index + 1);
    questionsHtml += `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <p style="font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
          ${num}) ${q.text || ''}
        </p>
    `;

    if (q.options && Array.isArray(q.options)) {
      const optLetters = isArabic ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
      questionsHtml += '<div style="margin-right: 20px;">';
      q.options.forEach((opt, idx) => {
        questionsHtml += `<p style="font-size: 12px; margin: 4px 0;">${optLetters[idx]}) ${opt}</p>`;
      });
      questionsHtml += '</div>';
    }

    questionsHtml += '</div>';
  });

  return `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${isArabic ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Math Master Test</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          direction: ${isArabic ? 'rtl' : 'ltr'};
          padding: 20px;
          line-height: 1.6;
        }
        h1 {
          text-align: center;
          margin-bottom: 10px;
          color: #333;
        }
        .meta {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
          border-bottom: 2px solid #4a148c;
          padding-bottom: 10px;
        }
        .questions {
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>${isArabic ? 'اختبار الحساب' : 'Math Test'}</h1>
      <div class="meta">
        <p>${isArabic ? 'المستوى: ' : 'Level: '}${level}</p>
        <p>${isArabic ? 'التاريخ: ' : 'Date: '}${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</p>
      </div>
      <div class="questions">
        ${questionsHtml}
      </div>
    </body>
    </html>
  `;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: POST http://localhost:${PORT}/api/generate-pdf`);
});
