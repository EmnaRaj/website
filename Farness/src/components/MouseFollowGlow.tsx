import { useEffect, useState } from 'react';

export default function MouseFollowGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 transition-none"
      style={{
        background: `radial-gradient(
          300px at ${mousePosition.x}px ${mousePosition.y}px,
          rgba(59, 130, 246, 0.15),
          transparent 70%
        )`,
      }}
    />
  );
}
