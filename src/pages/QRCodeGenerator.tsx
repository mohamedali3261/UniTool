import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Link, Type, Wifi, Mail, Phone, MessageSquare, Copy, Check, Palette, Eye, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

type QRType = 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'sms';

export function QRCodeGenerator({ t, lang }: Props) {
  const [qrType, setQRType] = useState<QRType>('url');
  const [inputValue, setInputValue] = useState('');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phone, setPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');

  const getQRValue = (): string => {
    switch (qrType) {
      case 'text':
      case 'url':
        return inputValue;
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};;`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'phone':
        return `tel:${phone}`;
      case 'sms':
        return `sms:${phone}?body=${encodeURIComponent(smsMessage)}`;
      default:
        return inputValue;
    }
  };

  useEffect(() => {
    const value = getQRValue();
    if (!value || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: qrSize,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H',
    }).then(() => {
      canvasRef.current?.toBlob(blob => {
        if (blob) setGeneratedUrl(URL.createObjectURL(blob));
      });
    }).catch(() => {});
  }, [inputValue, wifiSSID, wifiPassword, wifiEncryption, emailTo, emailSubject, emailBody, phone, smsMessage, fgColor, bgColor, qrSize, qrType]);

  const createCanvasWithCredit = (): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const creditLine1 = 'Developed by Mohamed Ali';
    const creditLine2 = 'www.unitool1.vercel.app';
    const padding = 16;
    const creditGap = 4;
    const line1Height = 10;
    const line2Height = 9;
    const totalCreditHeight = line1Height + line2Height + creditGap;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width + padding * 2;
    newCanvas.height = canvas.height + padding * 2 + totalCreditHeight;
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

    ctx.drawImage(canvas, padding, padding);

    const centerX = newCanvas.width / 2;
    const textY = canvas.height + padding + 6;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(creditLine1, centerX, textY);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(creditLine2, centerX, textY + line1Height + creditGap);

    return newCanvas;
  };

  const downloadQR = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const merged = createCanvasWithCredit();
      if (!merged) return;
      const url = merged.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const value = getQRValue();
      QRCode.toString(value, {
        type: 'svg',
        width: qrSize,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: 'H',
      }).then(svgStr => {
        const creditLine1 = 'Developed by Mohamed Ali';
        const creditLine2 = 'www.unitool1.vercel.app';
        const svgWidth = qrSize + 32;
        const creditY = qrSize + 32;

        const wrappedSvg = svgStr.replace(
          /<svg([^>]*)>/,
          `<svg$1><rect width="100%" height="100%" fill="white"/>`
        );

        const creditSvg = `
          <text x="${svgWidth / 2}" y="${creditY}" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#4b5563">${creditLine1}</text>
          <text x="${svgWidth / 2}" y="${creditY + 12}" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b7280">${creditLine2}</text>
        </svg>`;

        const finalSvg = wrappedSvg.replace('</svg>', creditSvg);

        const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcode_${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  };

  const copyToClipboard = async () => {
    const merged = createCanvasWithCredit();
    if (!merged) return;
    try {
      const blob = await new Promise<Blob>((resolve) => merged.toBlob(b => resolve(b!)));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const url = merged.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode_${Date.now()}.png`;
      a.click();
    }
  };

  const hasValue = getQRValue().length > 0;

  const qrTypes: { id: QRType; label: string; icon: any }[] = [
    { id: 'text', label: lang === 'ar' ? 'نص' : 'Text', icon: Type },
    { id: 'url', label: lang === 'ar' ? 'رابط' : 'URL', icon: Link },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'email', label: lang === 'ar' ? 'بريد' : 'Email', icon: Mail },
    { id: 'phone', label: lang === 'ar' ? 'هاتف' : 'Phone', icon: Phone },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
  ];

  const renderInput = () => {
    switch (qrType) {
      case 'text':
        return (
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={lang === 'ar' ? 'أدخل النص...' : 'Enter text...'}
            className="w-full h-28 px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono resize-none focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
        );
      case 'url':
        return (
          <input
            type="url"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
        );
      case 'wifi':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={wifiSSID}
              onChange={e => setWifiSSID(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم الشبكة (SSID)' : 'Network name (SSID)'}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <input
              type="password"
              value={wifiPassword}
              onChange={e => setWifiPassword(e.target.value)}
              placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <div className="flex gap-1">
              {(['WPA', 'WEP', 'nopass'] as const).map(enc => (
                <button
                  key={enc}
                  onClick={() => setWifiEncryption(enc)}
                  className={cn(
                    "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider rounded-md border transition-all",
                    wifiEncryption === enc
                      ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-400"
                      : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                  )}
                >
                  {enc === 'nopass' ? (lang === 'ar' ? 'بدون' : 'None') : enc}
                </button>
              ))}
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-2">
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <input
              type="text"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder={lang === 'ar' ? 'الموضوع' : 'Subject'}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              placeholder={lang === 'ar' ? 'الرسالة' : 'Body'}
              className="w-full h-20 px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono resize-none focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
          </div>
        );
      case 'phone':
        return (
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
        );
      case 'sms':
        return (
          <div className="space-y-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Phone number'}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <textarea
              value={smsMessage}
              onChange={e => setSmsMessage(e.target.value)}
              placeholder={lang === 'ar' ? 'الرسالة' : 'Message'}
              className="w-full h-20 px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono resize-none focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
          </div>
        );
    }
  };

  const renderSettingsContent = () => (
    <>
      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
          {lang === 'ar' ? 'نوع المحتوى' : 'Content Type'}
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {qrTypes.map(item => (
            <button
              key={item.id}
              onClick={() => { setQRType(item.id); setInputValue(''); }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-all text-[8px] font-mono",
                qrType === item.id
                  ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-400"
                  : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
          {lang === 'ar' ? 'المحتوى' : 'Content'}
        </h3>
        {renderInput()}
      </div>

      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 sm:text-[10px]">
          <Palette size={11} className="text-cyan-500" />
          {lang === 'ar' ? 'الألوان والحجم' : 'Colors & Size'}
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                {lang === 'ar' ? 'لون النقاط' : 'Foreground'}
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[9px] font-mono text-gray-400 uppercase">{fgColor}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                {lang === 'ar' ? 'لون الخلفية' : 'Background'}
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[9px] font-mono text-gray-400 uppercase">{bgColor}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
              {lang === 'ar' ? 'الحجم' : 'Size'}: {qrSize}px
            </label>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={qrSize}
              onChange={e => setQrSize(parseInt(e.target.value))}
              className="w-full mt-1.5 accent-cyan-500"
            />
            <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
              <span>128px</span>
              <span>512px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="p-3 mt-auto space-y-2 sm:p-4">
        <button
          onClick={() => downloadQR('png')}
          disabled={!hasValue}
          className={cn(
            "w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
            hasValue
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
              : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
          )}
        >
          <Download size={12} />
          {lang === 'ar' ? 'تحميل PNG' : 'Download PNG'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => downloadQR('svg')}
            disabled={!hasValue}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[8px] font-mono uppercase tracking-wider rounded-lg border transition-all",
              hasValue
                ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10"
                : "border-[#2D3139] text-gray-600 cursor-not-allowed"
            )}
          >
            <Download size={10} />
            SVG
          </button>
          <button
            onClick={copyToClipboard}
            disabled={!hasValue}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[8px] font-mono uppercase tracking-wider rounded-lg border transition-all",
              hasValue
                ? copied
                  ? "border-green-500/40 text-green-400 bg-green-600/10"
                  : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10"
                : "border-[#2D3139] text-gray-600 cursor-not-allowed"
            )}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? (lang === 'ar' ? 'تم النسخ' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy')}
          </button>
        </div>
      </div>
    </>
  );

  const renderPreviewContent = () => (
    <section className="flex-1 flex items-center justify-center bg-[#0A0C0F] p-6 overflow-y-auto">
      {!hasValue ? (
        <div className="text-center max-w-xs">
          <svg viewBox="0 0 24 24" className="w-16 h-16 text-gray-700 mx-auto mb-3 fill-current">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" rx="0.5" />
            <rect x="18" y="14" width="3" height="3" rx="0.5" />
            <rect x="14" y="18" width="3" height="3" rx="0.5" />
            <rect x="18" y="18" width="3" height="3" rx="0.5" />
          </svg>
          <p className="text-[10px] font-mono text-gray-600">
            {lang === 'ar' ? 'أدخل البيانات لإنشاء QR Code' : 'Enter content to generate QR code'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-white p-4 rounded-xl shadow-2xl shadow-black/40">
            <canvas ref={canvasRef} />
          </div>
          <div className="text-center space-y-px">
            <p className="text-[8px] font-mono text-gray-300">
              Developed by <span className="text-cyan-400 font-bold">Mohamed Ali</span>
            </p>
            <p className="text-[7px] font-mono text-gray-400">www.unitool1.vercel.app</p>
          </div>
          <p className="text-[8px] font-mono text-gray-600 text-center max-w-[280px] truncate">
            {getQRValue()}
          </p>
        </div>
      )}
    </section>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 sm:w-8 sm:h-8">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" rx="0.5" />
            <rect x="18" y="14" width="3" height="3" rx="0.5" />
            <rect x="14" y="18" width="3" height="3" rx="0.5" />
            <rect x="18" y="18" width="3" height="3" rx="0.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'مولّد QR Code' : 'QR Code Generator'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'إنشاء أكواد QR مخصصة' : 'Create custom QR codes'}</p>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'settings', label: lang === 'ar' ? 'إعدادات' : 'Settings', icon: Settings2 },
          { id: 'preview', label: lang === 'ar' ? 'معاينة' : 'Preview', icon: Eye },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-cyan-500 bg-[#1A1D23]" : "text-gray-500")}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
        {/* Settings Panel */}
        <aside className={cn(
          "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
          mobileTab === 'settings' ? "flex" : "hidden sm:flex"
        )}>
          {renderSettingsContent()}
        </aside>

        {/* QR Preview */}
        <div className={cn(
          "flex flex-col",
          mobileTab === 'preview' ? "flex" : "hidden sm:flex"
        )}>
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}
