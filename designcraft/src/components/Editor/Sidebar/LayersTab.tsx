import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Square,
  Image as ImageIcon,
  SmilePlus,
  Shapes
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  rawObject: any;
}

interface LayersTabProps {
  layers: LayerItem[];
  activeLayerId?: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onDeleteLayer: (id: string) => void;
}

export const LayersTab: React.FC<LayersTabProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveLayerUp,
  onMoveLayerDown,
  onDeleteLayer
}) => {
  const { t } = useDcLang();
  const getIcon = (type: string) => {
    switch (type) {
      case 'textbox':
      case 'text':
      case 'i-text':
        return <Type className="w-3.5 h-3.5 text-sky-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'group':
        return <SmilePlus className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Shapes className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-0.5">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.layersTitle}</span>
        </h3>
        <p className="text-[10px] text-slate-400">{t.layersDesc}</p>
      </div>

      {layers.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-[#0B132B] border border-dashed border-slate-800 space-y-1.5">
          <Layers className="w-6 h-6 text-slate-600 mx-auto" />
          <p className="text-[11px] text-slate-400">{t.layersEmpty}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {layers.map((layer, index) => {
            const isSelected = activeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`group flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C2541] border-sky-400 shadow-xs text-white'
                    : 'bg-[#0B132B] border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="shrink-0 p-1 bg-slate-800/80 rounded-md">
                    {getIcon(layer.type)}
                  </div>
                  <span className="text-[11px] font-medium truncate">{layer.name}</span>
                </div>

                {/* Layer Quick Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    title={layer.visible ? t.layersHide : t.layersShow}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    className={`p-1 rounded-md hover:bg-slate-800 transition ${
                      !layer.visible ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    title={layer.locked ? t.layersUnlock : t.layersLock}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id);
                    }}
                    className={`p-1 rounded-md hover:bg-slate-800 transition ${
                      layer.locked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    title={t.layersUp}
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerUp(layer.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    title={t.layersDown}
                    disabled={index === layers.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerDown(layer.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 transition"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    title={t.layersDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
