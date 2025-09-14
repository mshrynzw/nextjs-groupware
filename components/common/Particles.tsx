'use client';

import { useState, useEffect } from 'react';

export default function Particles() {
  const particlesCount = Number(process.env.PARTICLES_COUNT) || 100;
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  useEffect(() => {
    const generatedParticles = Array.from({ length: particlesCount }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 6}s`,
      },
    }));
    setParticles(generatedParticles);
  }, [particlesCount]);

  return (
    <div className='absolute inset-0 pointer-events-none'>
      {particles.map((particle) => (
        <div key={particle.id} className='timeport-particle' style={particle.style} />
      ))}
    </div>
  );
}
