import { useEffect, useRef } from 'react';
import inkgarden from '../ascii/inkgarden.js';

const { InkGarden, InkGardenDefaults } = inkgarden;

/** Live "Electric Gaze" ASCII-art render, powered by the Ink Garden Canvas2D engine. */
export default function AsciiCanvas({
  maxOut = 720,
  className = 'ascii-canvas',
}: {
  maxOut?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const params = JSON.parse(JSON.stringify(InkGardenDefaults));
    const ig = new InkGarden(canvas, { params, maxOut });

    const img = new Image();
    img.onload = () => ig.setImage(img);
    img.onerror = () => ig.generateSampleScene(7);
    img.src = '/assets/images/about/about.png';

    ig.start();
    return () => ig.stop();
  }, [maxOut]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Live ASCII-art render of the studio"
    />
  );
}
