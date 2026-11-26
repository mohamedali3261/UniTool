/**
 * القسم ١١ — سجل التعديلات.
 * كل خطوة مقترنة بوسم ثنائي اللغة، مع الانتقال المباشر لأي حالة، ومسح السجل.
 */
import { History, RotateCcw, CornerUpLeft, ShieldCheck } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { listHistory, canUndo, canRedo, clearHistory, current } from '../../core/history';
import { ActionButton, PanelCard } from '../../ui/controls';

export function HistoryPanel() {
  const { state, dispatch, ar } = useFontLab();
  const entries = listHistory(state.history);

  return (
    <PanelCard
      title={ar ? 'سجل التعديلات' : 'Edit history'}
      subtitle={ar ? `${entries.length} خطوة · ${state.history.pointer + 1} نشطة` : `${entries.length} steps · ${state.history.pointer + 1} active`}
      icon={<History size={15} />}
      actions={
        <div className="fl-op-row">
          <ActionButton onClick={() => dispatch({ type: 'undo' })} disabled={!canUndo(state.history)} icon={<CornerUpLeft size={13} />}>{ar ? 'تراجع' : 'Undo'}</ActionButton>
          <ActionButton
            tone="quiet"
            onClick={() => dispatch({ type: 'document', doc: current(clearHistory(state.history, state.doc)), labelAr: 'مسح السجل', labelEn: 'History cleared' })}
            icon={<RotateCcw size={13} />}
          >
            {ar ? 'مسح' : 'Clear'}
          </ActionButton>
          <ActionButton onClick={() => dispatch({ type: 'redo' })} disabled={!canRedo(state.history)} icon={<ShieldCheck size={13} />}>{ar ? 'إعادة' : 'Redo'}</ActionButton>
        </div>
      }
    >
      <ol className="fl-history-list">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.active ? 'is-active' : entry.future ? 'is-future' : ''}>
            <button
              type="button"
              onClick={() => dispatch({ type: 'document', doc: state.history.entries[entry.index].state, labelAr: entry.labelAr, labelEn: entry.labelEn })}
              title={new Date(entry.at).toLocaleTimeString(ar ? 'ar-EG' : 'en-GB')}
            >
              <span className="fl-history-dot" />
              <span className="fl-history-label">{ar ? entry.labelAr : entry.labelEn}</span>
              <em>{entry.index + 1}</em>
            </button>
          </li>
        ))}
      </ol>
      <p className="fl-hint-note">
        {ar ? 'التراجع يغطي كل تعديل على المنحنيات، المقاييس، والكرننغ.' : 'Undo covers every outline, metric and kerning change.'}
      </p>
    </PanelCard>
  );
}
