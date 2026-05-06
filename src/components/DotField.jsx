import React, { useRef, useEffect } from 'react';

const DotField = ({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = false,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17"
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;
    
    let dots = [];
    let mouse = { x: -1000, y: -1000 };

    const initDots = () => {
      dots = [];
      for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
          dots.push({ x, y, bx: x, by: y });
        }
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background glow
      if (mouse.x > 0 && mouse.y > 0) {
        const radGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius);
        radGrad.addColorStop(0, glowColor);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw dots
      dots.forEach((dot) => {
        let dx = mouse.x - dot.bx;
        let dy = mouse.y - dot.by;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = dot.bx;
        let targetY = dot.by;

        if (dist < cursorRadius) {
          const force = (cursorRadius - dist) / cursorRadius;
          const push = force * bulgeStrength;
          
          if (bulgeOnly) {
            targetX -= (dx / dist) * push;
            targetY -= (dy / dist) * push;
          } else {
            targetX += (dx / dist) * push * cursorForce;
            targetY += (dy / dist) * push * cursorForce;
          }
        }

        dot.x += (targetX - dot.x) * 0.1;
        dot.y += (targetY - dot.y) * 0.1;

        // Determine color based on vertical position
        const yPercent = dot.y / height;
        ctx.fillStyle = yPercent > 0.5 ? gradientTo : gradientFrom;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, glowRadius, sparkle, waveAmplitude, gradientFrom, gradientTo, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
    />
  );
};

export default DotField;
