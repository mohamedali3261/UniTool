import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { readLogo, drawLogo, qrSvg, type QRLogo } from "./logo";
import {
  Download,
  Link,
  Type,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Palette,
  Eye,
  Settings2,
  ScanQrCode,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  t: any;
  lang: "ar" | "en";
  onNavigate?: (page: string) => void;
}

type QRType = "text" | "url" | "wifi" | "email" | "phone" | "sms";

export function QRCodeGenerator({ t, lang, onNavigate }: Props) {
  const [qrType, setQRType] = useState<QRType>("url");
  const [inputValue, setInputValue] = useState("");
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<
    "WPA" | "WEP" | "nopass"
  >("WPA");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phone, setPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logo, setLogo] = useState<QRLogo | null>(null);
  const [logoSize, setLogoSize] = useState(16);
  const [logoError, setLogoError] = useState("");
  const [renderError, setRenderError] = useState("");
  const [readyKey, setReadyKey] = useState("");
  const uploadVersion = useRef(0);
  useEffect(
    () => () => {
      uploadVersion.current++;
    },
    [],
  );
  const [mobileTab, setMobileTab] = useState<"settings" | "preview">(
    "settings",
  );

  // Prefill from QR Scanner: scanned codes land here ready to edit & regenerate
  useEffect(() => {
    let pre: string | null = null;
    try {
      pre = sessionStorage.getItem("unitool-qr-prefill");
      if (pre) sessionStorage.removeItem("unitool-qr-prefill");
    } catch {
      return;
    }
    if (!pre) return;
    const v = pre.trim();
    const dec = (x: string) => {
      try {
        return decodeURIComponent(x);
      } catch {
        return x;
      }
    };
    if (/^wifi:/i.test(v)) {
      setQRType("wifi");
      setWifiSSID(dec(v.match(/S:([^;]*)/)?.[1] || ""));
      setWifiPassword(dec(v.match(/P:([^;]*)/)?.[1] || ""));
      const enc = (v.match(/T:([^;]*)/)?.[1] || "").toUpperCase();
      setWifiEncryption(
        enc === "NOPASS" ? "nopass" : enc === "WEP" ? "WEP" : "WPA",
      );
    } else if (/^mailto:/i.test(v)) {
      try {
        const u = new URL(v);
        setQRType("email");
        setEmailTo(decodeURIComponent(u.pathname || ""));
        setEmailSubject(u.searchParams.get("subject") || "");
        setEmailBody(u.searchParams.get("body") || "");
      } catch {
        setQRType("text");
        setInputValue(v);
      }
    } else if (/^smsto?:/i.test(v)) {
      const m = /^smsto?:([^:?;]+)/i.exec(v);
      setQRType("sms");
      setPhone(dec(m?.[1] || ""));
      const body = v.split(/[?&]body=/)[1];
      if (body) setSmsMessage(dec(body));
    } else if (/^tel[:=]/i.test(v)) {
      setQRType("phone");
      setPhone(dec(v.replace(/^tel[:=]/i, "")));
    } else if (/^https?:\/\//i.test(v)) {
      setQRType("url");
      setInputValue(v);
    } else {
      setQRType("text");
      setInputValue(v);
    }
  }, []);

  const getQRValue = (): string => {
    switch (qrType) {
      case "text":
      case "url":
        return inputValue;
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "phone":
        return `tel:${phone}`;
      case "sms":
        return `sms:${phone}?body=${encodeURIComponent(smsMessage)}`;
      default:
        return inputValue;
    }
  };

  const renderKey = JSON.stringify([
    getQRValue(),
    qrSize,
    fgColor,
    bgColor,
    logo?.src,
    logoSize,
  ]);
  const canExport = !!getQRValue() && readyKey === renderKey;
  useEffect(() => {
    let cancelled = false;
    const value = getQRValue();
    setReadyKey("");
    setRenderError("");
    const visible = canvasRef.current;
    if (visible) {
      const ctx = visible.getContext("2d");
      ctx?.clearRect(0, 0, visible.width, visible.height);
    }
    if (!value || !visible) return;
    (async () => {
      const output = document.createElement("canvas");
      await QRCode.toCanvas(output, value, {
        width: qrSize,
        margin: 4,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: "H",
      });
      await drawLogo(output, logo, logoSize);
      if (cancelled) return;
      visible.width = output.width;
      visible.height = output.height;
      visible.getContext("2d")?.drawImage(output, 0, 0);
      setReadyKey(renderKey);
    })().catch(() => {
      if (!cancelled)
        setRenderError(
          lang === "ar"
            ? "تعذر إنشاء الكود. قلل حجم البيانات أو راجع الألوان والصورة."
            : "Could not generate QR. Reduce the content or check colors and image.",
        );
    });
    return () => {
      cancelled = true;
    };
  }, [renderKey]);

  const createCanvasWithCredit = (): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const creditLine1 = "Developed by Mohamed Ali";
    const creditLine2 = "www.unitool1.vercel.app";
    const padding = 16;
    const creditGap = 4;
    const line1Height = 10;
    const line2Height = 9;
    const totalCreditHeight = line1Height + line2Height + creditGap;

    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvas.width + padding * 2;
    newCanvas.height = canvas.height + padding * 2 + totalCreditHeight;
    const ctx = newCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

    ctx.drawImage(canvas, padding, padding);

    const centerX = newCanvas.width / 2;
    const textY = canvas.height + padding + 6;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "#4b5563";
    ctx.fillText(creditLine1, centerX, textY);

    ctx.font = "8px monospace";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(creditLine2, centerX, textY + line1Height + creditGap);

    return newCanvas;
  };

  const downloadQR = (format: "png" | "svg") => {
    const canvas = canvasRef.current;
    if (!canvas || !canExport) return;

    if (format === "png") {
      const merged = createCanvasWithCredit();
      if (!merged) return;
      const url = merged.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const value = getQRValue();
      qrSvg(value, qrSize, fgColor, bgColor, logo, logoSize)
        .then((finalSvg) => {
          const url = URL.createObjectURL(
              new Blob([finalSvg], { type: "image/svg+xml" }),
            ),
            a = document.createElement("a");
          a.href = url;
          a.download = `qrcode_${Date.now()}.svg`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        })
        .catch(() =>
          setRenderError(
            lang === "ar" ? "تعذر تصدير SVG" : "SVG export failed",
          ),
        );
    }
  };

  const copyToClipboard = async () => {
    if (!canExport) return;
    const merged = createCanvasWithCredit();
    if (!merged) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        merged.toBlob((b) => resolve(b!)),
      );
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const url = merged.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode_${Date.now()}.png`;
      a.click();
    }
  };

  const hasValue = getQRValue().length > 0;

  const qrTypes: { id: QRType; label: string; icon: any }[] = [
    { id: "text", label: lang === "ar" ? "نص" : "Text", icon: Type },
    { id: "url", label: lang === "ar" ? "رابط" : "URL", icon: Link },
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "email", label: lang === "ar" ? "بريد" : "Email", icon: Mail },
    { id: "phone", label: lang === "ar" ? "هاتف" : "Phone", icon: Phone },
    { id: "sms", label: "SMS", icon: MessageSquare },
  ];

  const renderInput = () => {
    switch (qrType) {
      case "text":
        return (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={lang === "ar" ? "أدخل النص..." : "Enter text..."}
            className="w-full h-28 px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono resize-none focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
        );
      case "url":
        return (
          <input
            type="url"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
        );
      case "wifi":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={wifiSSID}
              onChange={(e) => setWifiSSID(e.target.value)}
              placeholder={
                lang === "ar" ? "اسم الشبكة (SSID)" : "Network name (SSID)"
              }
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <input
              type="password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder={lang === "ar" ? "كلمة المرور" : "Password"}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <div className="flex gap-1">
              {(["WPA", "WEP", "nopass"] as const).map((enc) => (
                <button
                  key={enc}
                  onClick={() => setWifiEncryption(enc)}
                  className={cn(
                    "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider rounded-md border transition-all",
                    wifiEncryption === enc
                      ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-400"
                      : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500",
                  )}
                >
                  {enc === "nopass" ? (lang === "ar" ? "بدون" : "None") : enc}
                </button>
              ))}
            </div>
          </div>
        );
      case "email":
        return (
          <div className="space-y-2">
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder={
                lang === "ar" ? "البريد الإلكتروني" : "Email address"
              }
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={lang === "ar" ? "الموضوع" : "Subject"}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={lang === "ar" ? "الرسالة" : "Body"}
              className="w-full h-20 px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono resize-none focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
          </div>
        );
      case "phone":
        return (
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
        );
      case "sms":
        return (
          <div className="space-y-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"}
              className="w-full px-3 py-2.5 bg-[#0F1115] border border-[#2D3139] rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
            />
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder={lang === "ar" ? "الرسالة" : "Message"}
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
          {lang === "ar" ? "نوع المحتوى" : "Content Type"}
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {qrTypes.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setQRType(item.id);
                setInputValue("");
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-all text-[8px] font-mono",
                qrType === item.id
                  ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-400"
                  : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500",
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
          {lang === "ar" ? "المحتوى" : "Content"}
        </h3>
        {renderInput()}
      </div>

      <div className="p-3 border-b border-[#2D3139] sm:p-4">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 sm:text-[10px]">
          <Palette size={11} className="text-cyan-500" />
          {lang === "ar" ? "الألوان والحجم" : "Colors & Size"}
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                {lang === "ar" ? "لون النقاط" : "Foreground"}
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[9px] font-mono text-gray-400 uppercase">
                  {fgColor}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                {lang === "ar" ? "لون الخلفية" : "Background"}
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[9px] font-mono text-gray-400 uppercase">
                  {bgColor}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
              {lang === "ar" ? "الحجم" : "Size"}: {qrSize}px
            </label>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              className="w-full mt-1.5 accent-cyan-500"
            />
            <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
              <span>128px</span>
              <span>512px</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 border-t border-[#2D3139] sm:p-4">
        <label className="block text-xs text-gray-300">
          {lang === "ar" ? "لوجو في منتصف QR" : "Center logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full mt-2 text-xs text-gray-300"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const version = ++uploadVersion.current;
              setLogoError("");
              try {
                const next = await readLogo(file);
                if (version === uploadVersion.current) setLogo(next);
              } catch {
                if (version === uploadVersion.current)
                  setLogoError(
                    lang === "ar"
                      ? "اختر صورة PNG أو JPG أو WebP صالحة، حتى 5 MB و16 مليون بكسل."
                      : "Choose a valid PNG, JPG or WebP, up to 5 MB and 16 megapixels.",
                  );
              }
            }}
          />
        </label>
        {logo && (
          <>
            <div className="flex items-center gap-3">
              <img
                src={logo.src}
                alt={lang === "ar" ? "اللوجو المختار" : "Selected logo"}
                className="w-12 h-12 object-contain bg-white rounded"
              />
              <button
                type="button"
                className="text-xs text-red-300"
                onClick={() => {
                  uploadVersion.current++;
                  setLogo(null);
                  setLogoError("");
                }}
              >
                {lang === "ar" ? "إزالة اللوجو" : "Remove logo"}
              </button>
            </div>
            <label className="block text-xs text-gray-300">
              {lang === "ar" ? "حجم اللوجو" : "Logo size"}: {logoSize}%
              <input
                type="range"
                min="10"
                max="30"
                step="1"
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
                className="block w-full mt-2 accent-cyan-500"
              />
            </label>
          </>
        )}
        {logo && (
          <p className="text-[10px] leading-relaxed text-gray-400">
            {lang === "ar"
              ? "بدون خلفية أو إطار مضاف. التكبير يغيّر حجم اللوجو الفعلي بعد قص الهوامش الشفافة. الخلفية الموجودة داخل الصورة لا تُحذف؛ استخدم PNG شفافًا."
              : "No added background or frame. Size scales the actual logo after trimming transparent margins. Background baked into your image stays: use a transparent PNG."}
          </p>
        )}
        {logo && logoSize > 20 && (
          <p role="status" className="text-xs text-amber-300">
            {lang === "ar"
              ? "تنبيه: اللوجو الكبير قد يمنع قراءة الكود. جرّب المسح أو قلّل الحجم."
              : "Warning: a large logo may prevent scanning. Test it or reduce the size."}
          </p>
        )}
        <p className="text-[10px] leading-relaxed text-gray-400">
          {lang === "ar"
            ? "الصورة تُعالج محليًا وتظهر في PNG وSVG والنسخ. تصحيح الأخطاء H لا يضمن القراءة بعد تغطية الوسط؛ جرّب المسح قبل الاستخدام والطباعة، واستخدم ألوانًا عالية التباين."
            : "Processed locally; included in PNG, SVG and copied images. H error correction does not guarantee scanning with a covered center: test before use or printing and choose high-contrast colors."}
        </p>
        {logoError && (
          <p role="alert" className="text-xs text-red-300">
            {logoError}
          </p>
        )}
        {renderError && (
          <p role="alert" className="text-xs text-red-300">
            {renderError}
          </p>
        )}
      </div>
      {/* Download Buttons */}
      <div className="p-3 mt-auto space-y-2 sm:p-4">
        <button
          onClick={() => downloadQR("png")}
          disabled={!canExport}
          className={cn(
            "w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
            hasValue
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
              : "bg-[#2D3139] text-gray-600 cursor-not-allowed",
          )}
        >
          <Download size={12} />
          {lang === "ar" ? "تحميل PNG" : "Download PNG"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => downloadQR("svg")}
            disabled={!canExport}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[8px] font-mono uppercase tracking-wider rounded-lg border transition-all",
              hasValue
                ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10"
                : "border-[#2D3139] text-gray-600 cursor-not-allowed",
            )}
          >
            <Download size={10} />
            SVG
          </button>
          <button
            onClick={copyToClipboard}
            disabled={!canExport}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[8px] font-mono uppercase tracking-wider rounded-lg border transition-all",
              hasValue
                ? copied
                  ? "border-green-500/40 text-green-400 bg-green-600/10"
                  : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10"
                : "border-[#2D3139] text-gray-600 cursor-not-allowed",
            )}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied
              ? lang === "ar"
                ? "تم النسخ"
                : "Copied!"
              : lang === "ar"
                ? "نسخ"
                : "Copy"}
          </button>
        </div>
      </div>
    </>
  );

  const renderPreviewContent = () => (
    <section className="flex-1 flex items-center justify-center bg-[#0A0C0F] p-6 overflow-y-auto">
      {!hasValue ? (
        <div className="text-center max-w-xs">
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16 text-gray-700 mx-auto mb-3 fill-current"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" rx="0.5" />
            <rect x="18" y="14" width="3" height="3" rx="0.5" />
            <rect x="14" y="18" width="3" height="3" rx="0.5" />
            <rect x="18" y="18" width="3" height="3" rx="0.5" />
          </svg>
          <p className="text-[10px] font-mono text-gray-600">
            {lang === "ar"
              ? "أدخل البيانات لإنشاء QR Code"
              : "Enter content to generate QR code"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-white p-4 rounded-xl shadow-2xl shadow-black/40">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto"
              aria-label={lang === "ar" ? "معاينة كود QR" : "QR code preview"}
            />
            {!canExport && (
              <p role="status" className="text-xs text-red-400 mt-2">
                {renderError ||
                  (lang === "ar" ? "جار تجهيز الكود…" : "Rendering QR…")}
              </p>
            )}
          </div>
          <div className="text-center space-y-px">
            <p className="text-[8px] font-mono text-gray-300">
              Developed by{" "}
              <span className="text-cyan-400 font-bold">Mohamed Ali</span>
            </p>
            <p className="text-[7px] font-mono text-gray-400">
              www.unitool1.vercel.app
            </p>
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
          <h1 className="text-xs font-bold text-white sm:text-sm">
            {lang === "ar" ? "مولّد QR Code" : "QR Code Generator"}
          </h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">
            {lang === "ar" ? "إنشاء أكواد QR مخصصة" : "Create custom QR codes"}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate("qrScanner")}
            title={lang === "ar" ? "قارئ QR" : "QR Scanner"}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-blue-600/15 border border-white/[0.06] hover:border-blue-500/30 transition-colors"
          >
            <ScanQrCode size={10} className="text-blue-400" />
            <span className="text-[9px] font-mono text-gray-400 hover:text-blue-300">
              {lang === "ar" ? "قارئ QR" : "QR Scanner"}
            </span>
          </button>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          {
            id: "settings",
            label: lang === "ar" ? "إعدادات" : "Settings",
            icon: Settings2,
          },
          {
            id: "preview",
            label: lang === "ar" ? "معاينة" : "Preview",
            icon: Eye,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as any)}
            className={cn(
              "flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors",
              mobileTab === tab.id
                ? "text-cyan-500 bg-[#1A1D23]"
                : "text-gray-500",
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
        {/* Settings Panel */}
        <aside
          className={cn(
            "w-full sm:w-80 max-h-[55vh] sm:max-h-none bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto settings-scroll",
            mobileTab === "settings" ? "flex" : "hidden sm:flex",
          )}
        >
          {renderSettingsContent()}
        </aside>

        {/* QR Preview */}
        <div
          className={cn(
            "flex flex-col",
            mobileTab === "preview" ? "flex" : "hidden sm:flex",
          )}
        >
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
}
