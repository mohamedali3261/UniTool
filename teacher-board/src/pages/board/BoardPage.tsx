import React, { useRef } from 'react';
import { BoardCanvasStage } from './BoardCanvasStage';
import { FloatingToolDock } from './FloatingToolDock';
import { GeometryToolsOverlay } from './GeometryToolsOverlay';
import { QuickClassWidgetOverlay } from './QuickClassWidgetOverlay';
import { SlidesStripSection } from './SlidesStripSection';
import { SpotlightAndCurtain } from './SpotlightAndCurtain';

export const BoardPage: React.FC = () => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <section className="tb-board-workspace" data-testid="tb-board-page">
      <SlidesStripSection mainCanvasRef={mainCanvasRef} />
      <BoardCanvasStage mainCanvasRef={mainCanvasRef} />
      <GeometryToolsOverlay />
      <SpotlightAndCurtain />
      <QuickClassWidgetOverlay />
      <FloatingToolDock />
    </section>
  );
};
