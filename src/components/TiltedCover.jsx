import { useEffect, useRef } from 'react';
import { motion as Motion, useMotionValue, useSpring } from 'motion/react';

// Adapted from React Bits' TiltedCard — wraps arbitrary children (our
// canvas/tile-grid cover) instead of rendering its own <img>
const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export function TiltedCover({ enabled, rotateAmplitude = 12, scaleOnHover = 1.05, children }) {
  const ref = useRef(null);
  const pulseTimeout = useRef(null);

  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  function reset() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  useEffect(() => {
    if (!enabled) reset();
    return () => clearTimeout(pulseTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  function handlePointerMove(e) {
    if (!enabled || e.pointerType !== 'mouse' || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);
  }

  function handlePointerEnter(e) {
    if (!enabled || e.pointerType !== 'mouse') return;
    scale.set(scaleOnHover);
  }

  function handlePointerLeave(e) {
    if (e.pointerType !== 'mouse') return;
    reset();
  }

  // Touch devices get a quick tilt-and-settle pulse on tap instead of hover tracking
  function handlePointerUp(e) {
    if (!enabled || e.pointerType === 'mouse') return;
    rotateX.set(rotateAmplitude * 0.7);
    rotateY.set(-rotateAmplitude * 0.7);
    scale.set(scaleOnHover);
    clearTimeout(pulseTimeout.current);
    pulseTimeout.current = setTimeout(reset, 450);
  }

  return (
    <div
      ref={ref}
      style={{ perspective: '800px' }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
    >
      <Motion.div style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}>
        {children}
      </Motion.div>
    </div>
  );
}
