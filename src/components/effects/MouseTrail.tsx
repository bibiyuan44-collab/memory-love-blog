import React, { useEffect, useRef } from 'react';

type Point = {
  x: number;
  y: number;
  age: number;
  color: string;
};

export const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ffffff'];

    const handleMouseMove = (e: MouseEvent) => {
      points.current.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    resize();

    const drawStar = (x: number, y: number, radius: number, ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * radius + x,
                   -Math.sin((18 + i * 72) * Math.PI / 180) * radius + y);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (radius / 2.5) + x,
                   -Math.sin((54 + i * 72) * Math.PI / 180) * (radius / 2.5) + y);
      }
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < points.current.length; i++) {
        const p = points.current[i];
        p.age++;
        
        if (p.age > 40) {
          points.current.splice(i, 1);
          i--;
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - (p.age / 40);
        
        // Add some random scatter
        p.x += (Math.random() - 0.5) * 2;
        p.y += (Math.random() - 0.5) * 2 + 1; // Fall down slightly
        
        drawStar(p.x, p.y, 4, ctx);
      }
      
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
};