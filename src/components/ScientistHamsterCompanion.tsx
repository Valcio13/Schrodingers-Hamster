import React, { useState, useEffect, useRef } from 'react';

const IDLE_FRAMES = [
  '/assets/scientist_prototype/idle_0.png', // 0: Baseline Rest (transparent overlay; pristine original bg hamster)
  '/assets/scientist_prototype/idle_1.png', // 1: Inquisitive Ear Perk
  '/assets/scientist_prototype/idle_2.png', // 2: Happy Curved Blink (^‿^)
  '/assets/scientist_prototype/idle_3.png'  // 3: Curious Ear Twitch & Snout Sniff
];

// Natural, expressive idle animation script
const IDLE_SCRIPT = [
  { frame: 0, duration: 1600 }, // Peaceful alert rest
  { frame: 1, duration: 350 },  // Inquisitive ear perk
  { frame: 0, duration: 1100 }, // Rest
  { frame: 2, duration: 160 },  // Eye blink
  { frame: 0, duration: 1400 }, // Rest
  { frame: 3, duration: 300 },  // Curious ear twitch & snout sniff
  { frame: 0, duration: 1200 }, // Rest
  { frame: 2, duration: 140 },  // Double-blink part 1
  { frame: 0, duration: 100 },  // Brief eye open
  { frame: 2, duration: 140 },  // Double-blink part 2
  { frame: 0, duration: 1800 }, // Peaceful rest
  { frame: 1, duration: 350 }   // Curious ear perk
];

export const ScientistHamsterCompanion: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload all frames for instant, flicker-free rendering
  useEffect(() => {
    IDLE_FRAMES.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Run dynamic sequencer
  useEffect(() => {
    const currentStep = IDLE_SCRIPT[stepIndex];
    timerRef.current = setTimeout(() => {
      setStepIndex(prev => (prev + 1) % IDLE_SCRIPT.length);
    }, currentStep.duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [stepIndex]);

  const frameIdx = IDLE_SCRIPT[stepIndex].frame;
  const currentSrc = IDLE_FRAMES[frameIdx];

  return (
    <div
      className="absolute inset-0 w-full h-full select-none pointer-events-none"
      data-testid="scientist-hamster-companion"
    >
      <img
        src={currentSrc}
        alt="Scientist Hamster Idle"
        className="w-full h-full object-fill pixel-art"
        style={{
          imageRendering: 'pixelated'
        }}
        data-frame={frameIdx}
      />
    </div>
  );
};
