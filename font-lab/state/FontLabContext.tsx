/**
 * Studio context: owns the loaded font, the reducer state and the live preview
 * font used by every sample text on the page.
 *
 * The preview is a real exported font registered through the FontFace API, so
 * "text preview" is never a mock — it is the font the user is editing, with its
 * own kerning and Arabic shaping still intact.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PREVIEW_FAMILY, loadFont, type LoadedFont } from '../core/fontEngine';
import { buildIndex, type GlyphEntry } from '../core/glyphIndex';
import { createDocument, readStoredProjects, type ProjectDocument } from '../core/project';
import { exportFont } from '../core/exporter';
import { LIBRARY, loadLibraryFont, loadUserFont } from '../core/library';
import { initialState, reduce, type LabAction, type LabState } from './labStore';

interface FontLabValue {
  state: LabState;
  dispatch: (action: LabAction) => void;
  font: LoadedFont | null;
  index: GlyphEntry[];
  loading: boolean;
  error: string | null;
  loadFontById: (id: string) => Promise<void>;
  loadFontFile: (file: File) => Promise<void>;
  refreshPreview: () => void;
  previewRevision: number;
  ar: boolean;
  t: (ar: string, en: string) => string;
}

const FontLabContext = createContext<FontLabValue | null>(null);

export function FontLabProvider({ children }: { children: ReactNode }) {
  const [state, dispatchBase] = useReducer(reduce, initialState(createDocument({ summary: { family: 'Font Lab', subfamily: 'Regular', designer: '', unitsPerEm: 1000 } } as any)));
  const [font, setFont] = useState<LoadedFont | null>(null);
  const [index, setIndex] = useState<GlyphEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const faceRef = useRef<FontFace | null>(null);
  const initialised = useRef(false);

  const dispatch = useCallback((action: LabAction) => dispatchBase(action), []);

  const applyFont = useCallback(
    (loaded: LoadedFont, doc?: ProjectDocument) => {
      const entries = buildIndex(loaded);
      setFont(loaded);
      setIndex(entries);
      const document = doc ?? createDocument(loaded);
      // Arabic first: the demo font is Arabic-first, Latin fonts still resolve a letter
      const firstGlyph =
        pickStarterGlyph(entries) ?? entries.find((entry) => entry.category === 'letter') ?? entries[0];
      dispatchBase({ type: 'document', doc: document, labelAr: 'تم تحميل الخط', labelEn: 'Font loaded', edited: [] });
      dispatchBase({ type: 'select', glyph: firstGlyph?.name ?? null });
    },
    [],
  );

  const loadFontById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await loadLibraryFont(id);
        applyFont(loaded);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setLoading(false);
      }
    },
    [applyFont],
  );

  const loadFontFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await loadUserFont(file);
        applyFont(loaded);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        throw cause;
      } finally {
        setLoading(false);
      }
    },
    [applyFont],
  );

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    void loadFontById(LIBRARY[0].id);
    dispatchBase({ type: 'saved', count: readStoredProjects().length });
  }, [loadFontById]);

  /**
   * Re-registers the preview font whenever the document changes. Exporting is
   * cheap (patch of a few tables), and it means the sample text below the stage
   * is always the *edited* font, including Arabic joining.
   */
  const refreshPreview = useCallback(() => setPreviewRevision((value) => value + 1), []);

  useEffect(() => {
    if (!font) return;
    let cancelled = false;
    try {
      const result = exportFont(font, state.doc);
      const blob = new Blob([result.buffer], { type: 'font/ttf' });
      const url = URL.createObjectURL(blob);
      const face = new FontFace(PREVIEW_FAMILY, `url(${url})`);
      face
        .load()
        .then((loadedFace) => {
          if (cancelled) return;
          if (faceRef.current) document.fonts.delete(faceRef.current);
          document.fonts.add(loadedFace);
          faceRef.current = loadedFace;
          setPreviewRevision((value) => value + 1);
          document.fonts.ready.then(() => !cancelled && setPreviewRevision((value) => value + 1));
        })
        .catch(() => {
          /* preview falls back to the browser font; editing still works */
        })
        .finally(() => URL.revokeObjectURL(url));
    } catch {
      /* export failures are surfaced in the export panel instead */
    }
    return () => {
      cancelled = true;
    };
  }, [font, state.doc]);

  const ar = state.lang === 'ar';
  const value = useMemo<FontLabValue>(
    () => ({
      state,
      dispatch,
      font,
      index,
      loading,
      error,
      loadFontById,
      loadFontFile,
      refreshPreview,
      previewRevision,
      ar,
      t: (arText: string, enText: string) => (state.lang === 'ar' ? arText : enText),
    }),
    [state, dispatch, font, index, loading, error, loadFontById, loadFontFile, refreshPreview, previewRevision],
  );

  return <FontLabContext.Provider value={value}>{children}</FontLabContext.Provider>;
}

/**
 * The glyph the studio opens on: a common Arabic letter that has positional
 * forms (ب/ت/ن…), so a first-time user immediately sees joining behaviour.
 */
function pickStarterGlyph(entries: GlyphEntry[]) {
  const common = entries
    .filter((entry) => entry.unicode != null && entry.unicode >= 0x0628 && entry.unicode <= 0x064a && entry.forms.initial)
    .sort((a, b) => (a.unicode ?? 0) - (b.unicode ?? 0));
  return common[0] ?? entries.find((entry) => entry.script === 'arabic' && entry.forms.initial);
}

export function useFontLab() {
  const value = useContext(FontLabContext);
  if (!value) throw new Error('useFontLab must be used inside FontLabProvider');
  return value;
}

/** Shared preview style helper: returns the CSS font shorthand for samples. */
export function previewFontStyle(size: number, weight = 400) {
  return {
    fontFamily: `'${PREVIEW_FAMILY}', system-ui, sans-serif`,
    fontSize: `${size}px`,
    fontWeight: weight,
    lineHeight: 1.4,
  } as const;
}
