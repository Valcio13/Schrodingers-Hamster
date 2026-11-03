import React, { useState, useEffect } from 'react';

interface SqueektoshiKineticRunnerProps {
  isRunning: boolean;
  rpm: number;
}

const SLEEP_FRAMES = [
  '/assets/squeektoshi_prototype/sleep_0.png',
  '/assets/squeektoshi_prototype/sleep_1.png',
  '/assets/squeektoshi_prototype/sleep_2.png',
  '/assets/squeektoshi_prototype/sleep_1.png'
];

export const SqueektoshiKineticRunner: React.FC<SqueektoshiKineticRunnerProps> = ({
  isRunning,
  rpm
}) => {
  const [sleepFrameIndex, setSleepFrameIndex] = useState(0);

  // Preload sleep frames and approved base sprite
  useEffect(() => {
    ['/assets/squeektoshi_prototype/original_approved.png', ...SLEEP_FRAMES].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Sleep breathing cycle (750ms inhale / exhale) when resting
  useEffect(() => {
    if (isRunning) return;

    const timer = setInterval(() => {
      setSleepFrameIndex(prev => (prev + 1) % SLEEP_FRAMES.length);
    }, 750);

    return () => clearInterval(timer);
  }, [isRunning]);

  // Compute natural stride gallop period strictly synchronized with wheel rotation
  // 1 full wheel rotation = 2 natural hamster strides
  const effectiveRpm = Math.max(15, Math.min(120, rpm));
  const wheelSeconds = 60 / effectiveRpm;
  const strideDurationSec = Math.max(0.22, Math.min(0.65, wheelSeconds * 0.45));

  return (
    <div className="relative w-full h-full select-none pointer-events-none">
      {isRunning ? (
        /* Running State: Approved pristine pixel-art sprite with smooth rhythmic gallop */
        <div
          className="w-full h-full anim-hamster-wheel-run"
          style={{
            animationDuration: `${strideDurationSec.toFixed(3)}s`,
            willChange: 'transform'
          }}
        >
          <img
            src="/assets/squeektoshi_prototype/original_approved.png"
            alt="Squeektoshi Sprinting in Wheel"
            className="w-full h-full object-contain pixel-art drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            style={{
              imageRendering: 'pixelated'
            }}
          />
        </div>
      ) : (
        /* Sleeping State: Peaceful breathing cycle in nest */
        <img
          src={SLEEP_FRAMES[sleepFrameIndex]}
          alt="Squeektoshi Sleeping in Nest"
          className="w-full h-full object-contain pixel-art drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          style={{
            imageRendering: 'pixelated'
          }}
        />
      )}
    </div>
  );
};
