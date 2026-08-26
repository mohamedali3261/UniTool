import { BookDocument } from '../types';

/**
 * Downloads a string content as a file in the browser
 */
function downloadFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports a book document to the specified format
 */
export function exportBook(book: BookDocument, format: 'txt' | 'md' | 'html' | 'json') {
  const sanitizeFilename = (title: string) => title.replace(/[/\\?%*:|"<>]/g, '-');
  const filename = `${sanitizeFilename(book.title)}.${format}`;

  switch (format) {
    case 'txt': {
      // 1. TXT: Standard plain text with clean separators
      let txtContent = `📚 ${book.title}\n`;
      if (book.author) txtContent += `✍️ ${book.author}\n`;
      txtContent += `📊 الكلمات: ${book.totalWords} | الصفحات: ${book.totalPages}\n`;
      txtContent += `=========================================\n\n`;

      book.pages.forEach((page) => {
        txtContent += `--- الصفحة ${page.pageNumber} ---\n\n`;
        txtContent += `${page.rawText.trim()}\n\n`;
      });

      downloadFile(txtContent, 'text/plain;charset=utf-8', filename);
      break;
    }

    case 'md': {
      // 2. Markdown: Perfect formatting for markdown readers
      let mdContent = `# 📚 ${book.title}\n\n`;
      if (book.author) mdContent += `**المؤلف:** ${book.author}\n\n`;
      mdContent += `- **عدد الكلمات:** ${book.totalWords}\n`;
      mdContent += `- **عدد الصفحات:** ${book.totalPages}\n\n`;
      mdContent += `---\n\n`;

      book.pages.forEach((page) => {
        mdContent += `## 📄 الصفحة ${page.pageNumber}\n\n`;
        mdContent += `${page.rawText.trim()}\n\n`;
        mdContent += `---\n\n`;
      });

      downloadFile(mdContent, 'text/markdown;charset=utf-8', filename);
      break;
    }

    case 'json': {
      // 3. JSON: Complete database structure for backup
      const jsonContent = JSON.stringify(book, null, 2);
      downloadFile(jsonContent, 'application/json;charset=utf-8', filename);
      break;
    }

    case 'html': {
      // 4. HTML: A breathtakingly gorgeous standalone responsive page with offline reader capability!
      const isArabic = book.detectedLanguage === 'ar' || book.detectedLanguage === 'mixed';
      const direction = isArabic ? 'rtl' : 'ltr';
      
      const htmlContent = `<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📚 ${book.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0f19;
      --card-bg: #151c2c;
      --text-color: #f1f5f9;
      --text-muted: #94a3b8;
      --accent-color: #6366f1;
      --accent-hover: #4f46e5;
      --border-color: #1e293b;
    }
    
    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      transition: all 0.3s ease;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    header {
      text-align: center;
      margin-bottom: 50px;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 30px;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      color: #ffffff;
      font-weight: 800;
    }

    .meta {
      color: var(--text-muted);
      font-size: 0.95rem;
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
    }

    .meta span {
      background: rgba(99, 102, 241, 0.1);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    /* Style Customization Drawer */
    .controls-panel {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 30px;
      background: var(--card-bg);
      padding: 15px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      flex-wrap: wrap;
    }

    .btn {
      background: var(--border-color);
      color: var(--text-color);
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--accent-color);
      color: white;
    }

    .theme-active {
      background: var(--accent-color) !important;
      color: white !important;
    }

    /* Reading Page Blocks */
    .page-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 35px;
      margin-bottom: 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .page-number {
      position: absolute;
      top: 20px;
      left: 25px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--accent-color);
      background: rgba(99, 102, 241, 0.1);
      padding: 2px 10px;
      border-radius: 8px;
    }
    
    html[dir="rtl"] .page-number {
      left: auto;
      right: 25px;
    }

    .page-title {
      font-size: 1.15rem;
      color: var(--text-muted);
      margin-bottom: 25px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 10px;
      font-weight: 600;
    }

    .page-content {
      font-size: 1.15rem;
      text-align: justify;
      white-space: pre-wrap;
    }

    /* Print styling */
    @media print {
      body {
        background: white;
        color: black;
      }
      .controls-panel {
        display: none;
      }
      .page-card {
        box-shadow: none;
        border: none;
        background: white;
        page-break-after: always;
        padding: 0;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📚 ${book.title}</h1>
      ${book.author ? `<p style="font-size: 1.2rem; color: var(--text-muted); margin: 5px 0 0 0;">المؤلف: <strong>${book.author}</strong></p>` : ''}
      <div class="meta">
        <span>📄 الصفحات: ${book.totalPages}</span>
        <span>✍️ الكلمات: ${book.totalWords}</span>
      </div>
    </header>

    <div class="controls-panel">
      <button class="btn theme-active" onclick="changeTheme('dark')">👁️ داكن</button>
      <button class="btn" onclick="changeTheme('sepia')">📜 ورقي</button>
      <button class="btn" onclick="changeTheme('light')">☀️ مضيء</button>
      <button class="btn" onclick="changeFontSize(1)">➕ تكبير الخط</button>
      <button class="btn" onclick="changeFontSize(-1)">➖ تصغير الخط</button>
    </div>

    <div id="book-pages">
      ${book.pages.map((page) => `
        <div class="page-card" id="page-${page.pageNumber}">
          <div class="page-number">الصحفة ${page.pageNumber}</div>
          <div class="page-title">${book.title} - جزء ${page.pageNumber}</div>
          <div class="page-content" id="content-${page.pageNumber}">${page.rawText.trim()}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    function changeTheme(theme) {
      const root = document.documentElement;
      const btns = document.querySelectorAll('.controls-panel .btn');
      
      // Update theme active class
      btns.forEach(btn => btn.classList.remove('theme-active'));
      
      if (theme === 'dark') {
        document.body.style.backgroundColor = '#0b0f19';
        document.body.style.color = '#f1f5f9';
        root.style.setProperty('--card-bg', '#151c2c');
        root.style.setProperty('--border-color', '#1e293b');
        event.target.classList.add('theme-active');
      } else if (theme === 'sepia') {
        document.body.style.backgroundColor = '#f7f2e8';
        document.body.style.color = '#433422';
        root.style.setProperty('--card-bg', '#fffdf9');
        root.style.setProperty('--border-color', '#e9dec4');
        event.target.classList.add('theme-active');
      } else if (theme === 'light') {
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.color = '#1e293b';
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--border-color', '#e2e8f0');
        event.target.classList.add('theme-active');
      }
    }

    let fontSize = 1.15;
    function changeFontSize(delta) {
      fontSize += delta * 0.1;
      if (fontSize < 0.8) fontSize = 0.8;
      if (fontSize > 2.0) fontSize = 2.0;
      
      const contents = document.querySelectorAll('.page-content');
      contents.forEach(el => {
        el.style.fontSize = fontSize + 'rem';
      });
    }
  </script>
</body>
</html>`;
      downloadFile(htmlContent, 'text/html;charset=utf-8', filename);
      break;
    }
  }
}
