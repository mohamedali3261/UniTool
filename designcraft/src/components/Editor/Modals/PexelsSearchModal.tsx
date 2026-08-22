import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Sparkles,
  Download,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Languages,
  CheckCircle2
} from 'lucide-react';
import {
  searchPexelsPhotos,
  fetchCuratedPexelsPhotos,
  PexelsPhoto
} from '../../../services/pexelsService';

interface PexelsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, photoTitle?: string) => void;
}

const POPULAR_SEARCH_SUGGESTIONS = [
  { ar: 'طبيعة خلابة', en: 'nature landscape' },
  { ar: 'تقنية وذكاء اصطناعي', en: 'artificial intelligence tech' },
  { ar: 'خلفيات داكنة فخمة', en: 'dark luxury minimal background' },
  { ar: 'أعمال ومكاتب', en: 'modern office business' },
  { ar: 'تجريدي ونيون', en: 'abstract neon 3d geometric' },
  { ar: 'أطعمة ومشروبات', en: 'delicious gourmet food' },
  { ar: 'قهوة وكافيهات', en: 'specialty coffee cafe' },
  { ar: 'سيارات رياضية', en: 'luxury sports cars' },
  { ar: 'أشخاص وفريق عمل', en: 'people teamwork lifestyle' },
  { ar: 'موضة وأزياء', en: 'fashion style aesthetic' },
  { ar: 'مدن وناطحات سحاب', en: 'city skyline night architecture' },
  { ar: 'ألعاب وجيمنج', en: 'gaming setup esports' },
  { ar: 'سفر وسياحة', en: 'travel tropical beach vacation' },
  { ar: 'تخفيضات وتسوق', en: 'shopping store discount' }
];

export const PexelsSearchModal: React.FC<PexelsSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectImage
}) => {
  const [query, setQuery] = useState('');
  const [translatedQuery, setTranslatedQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);

  // Load curated photos initially
  useEffect(() => {
    if (isOpen) {
      loadInitialPhotos();
    }
  }, [isOpen]);

  const loadInitialPhotos = async () => {
    setIsLoading(true);
    try {
      const res = await fetchCuratedPexelsPhotos(1, 30);
      setPhotos(res.photos);
      setTotalResults(res.totalResults);
      setTranslatedQuery('الصور المختارة الأكثر رواجاً (Curated)');
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      loadInitialPhotos();
      return;
    }

    setIsLoading(true);
    try {
      const res = await searchPexelsPhotos(searchTerm, 1, 30);
      setPhotos(res.photos);
      setTranslatedQuery(res.englishQuery);
      setTotalResults(res.totalResults);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading) return;
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      let res;
      if (query.trim()) {
        res = await searchPexelsPhotos(query, nextPage, 30);
      } else {
        res = await fetchCuratedPexelsPhotos(nextPage, 30);
      }
      setPhotos((prev) => [...prev, ...res.photos]);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPhoto = (photo: PexelsPhoto) => {
    setSelectedPhotoId(photo.id);
    const bestUrl = photo.src.large2x || photo.src.large || photo.src.original;
    onSelectImage(bestUrl, photo.alt || 'Pexels Photo');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#070D1E] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>مكتبة صور</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-normal border border-sky-500/40">
                  4K
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Auto-translate Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 bg-[#0A1024] space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن صور عالية الدقة (مثال: طبيعة، تقنية، سيارة، قهوة، خلفية سوداء)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#070D1E] border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    loadInitialPhotos();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>بحث</span>
            </button>
          </form>

          {/* Translation Status & Suggestion Pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {translatedQuery && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Languages className="w-3 h-3" /> تم ترجمة البحث إلى:
                </span>
                <span className="bg-[#0B132B] px-2 py-0.5 rounded border border-slate-700 text-sky-300 font-mono text-[10px]">
                  {translatedQuery}
                </span>
                {totalResults > 0 && (
                  <span className="text-slate-500">({totalResults} نتيجة)</span>
                )}
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {POPULAR_SEARCH_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(item.ar);
                  handleSearch(item.ar);
                }}
                className="px-3 py-1 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition"
              >
                {item.ar}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading && photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400 py-16">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm">جارٍ تحميل أجمل الصور من Pexels بدقة عالية...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400 py-16">
              <ImageIcon className="w-12 h-12 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">لم يتم العثور على صور تطابق بحثك</p>
              <p className="text-xs text-slate-500">جرب كلمات بحث أخرى مثل: طبيعة، مكتب، سيارات، فواكه</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {photos.map((photo) => {
                  const isSelected = selectedPhotoId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => handleSelectPhoto(photo)}
                      className={`group relative rounded-xl overflow-hidden bg-slate-900 border cursor-pointer transition shadow-md ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-400/50'
                          : 'border-slate-800 hover:border-sky-400 hover:scale-[1.02]'
                      }`}
                      style={{ aspectRatio: photo.width / photo.height || '4/3' }}
                    >
                      <img
                        src={photo.src.medium || photo.src.large}
                        alt={photo.alt || 'Stock Photo'}
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2.5">
                        <div className="flex justify-end">
                          <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> تم الإدراج!
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" /> إدراج في اللوحة
                              </>
                            )}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] text-white font-medium line-clamp-1">
                            {photo.alt || 'Pexels Photo'}
                          </p>
                          <p className="text-[9px] text-slate-300 truncate">
                            تصوير: {photo.photographer}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              <div className="text-center pt-2 pb-4">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#0B132B] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />}
                  <span>تحميل المزيد من الصور</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
