import { useRef, useEffect, useState } from 'react';
import type { GameMode } from '../types/spotify';

const COLS = 3;
const ROWS = 2;

interface BlurredImageProps {
  imageUrl: string;
  blurLevel: number;
  altText: string;
  mode: GameMode;
  tileOrder: number[];
  revealedTileCount: number;
}

function TileGrid({ imageUrl, tileOrder, revealedTileCount }: {
  imageUrl: string;
  tileOrder: number[];
  revealedTileCount: number;
}) {
  const prevent = (e: React.SyntheticEvent) => e.preventDefault();

  return (
    <div
      className="w-full h-full"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
      onContextMenu={prevent}
      onDragStart={prevent}
    >
      {Array.from({ length: COLS * ROWS }).map((_, tileIndex) => {
        const col = tileIndex % COLS;
        const row = Math.floor(tileIndex / COLS);
        const isRevealed = tileOrder.indexOf(tileIndex) < revealedTileCount;

        // background-position for this tile within a COLS×ROWS grid
        const bgPosX = COLS === 1 ? '0%' : `${(col / (COLS - 1)) * 100}%`;
        const bgPosY = ROWS === 1 ? '0%' : `${(row / (ROWS - 1)) * 100}%`;

        return (
          <div
            key={tileIndex}
            style={{
              backgroundImage: isRevealed ? `url(${imageUrl})` : 'none',
              backgroundColor: isRevealed ? 'transparent' : '#111',
              backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
              backgroundPosition: `${bgPosX} ${bgPosY}`,
              transition: 'background-color 0.4s ease',
            }}
          />
        );
      })}
    </div>
  );
}

export function BlurredImage({ imageUrl, blurLevel, altText, mode, tileOrder, revealedTileCount }: BlurredImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCssFallback, setUseCssFallback] = useState(false);

  useEffect(() => {
    if (mode === 'tile' || useCssFallback) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);

      if (blurLevel > 0) {
        ctx.filter = `blur(${blurLevel}px)`;
        const pad = blurLevel * 3;
        ctx.drawImage(img, -pad, -pad, size + pad * 2, size + pad * 2);
      } else {
        ctx.filter = 'none';
        ctx.drawImage(img, 0, 0, size, size);
      }
    };

    img.onerror = () => setUseCssFallback(true);
    img.src = imageUrl;
  }, [imageUrl, blurLevel, mode, useCssFallback]);

  const prevent = (e: React.SyntheticEvent) => e.preventDefault();

  const wrapperClass = 'relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10';
  const wrapperStyle = {
    boxShadow: '0 0 40px rgba(29,185,84,0.15), 0 20px 60px rgba(0,0,0,0.6)',
    userSelect: 'none' as const,
  };

  if (mode === 'tile') {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <TileGrid imageUrl={imageUrl} tileOrder={tileOrder} revealedTileCount={revealedTileCount} />
      </div>
    );
  }

  if (useCssFallback) {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <img
          src={imageUrl}
          alt={altText}
          draggable={false}
          onContextMenu={prevent}
          onDragStart={prevent}
          className="w-full h-full object-cover transition-all duration-700"
          style={{ filter: `blur(${blurLevel}px)`, pointerEvents: 'none' }}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        aria-label={altText}
        onContextMenu={prevent}
        onDragStart={prevent}
        className="w-full h-full block transition-all duration-700"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
