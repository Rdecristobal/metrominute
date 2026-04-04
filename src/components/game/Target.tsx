"use client";

import { Target as TargetType } from "@/lib/game/types";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TargetProps {
  target: TargetType;
  onClick: (e: React.MouseEvent) => void;
}

export default function Target({ target, onClick }: TargetProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  // Actualizar posición con transición CSS suave
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.left = `${target.x}px`;
      targetRef.current.style.top = `${target.y}px`;
    }
  }, [target.x, target.y]);

  const getStyles = () => {
    const baseStyle = {
      transition: 'left 0.5s ease, top 0.5s ease', // Transición suave para movimiento
    };

    switch (target.type) {
      case 'golden':
        return {
          ...baseStyle,
          background: '#FFD700',
          border: '3px solid #FFD700',
          boxShadow: '0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.3)',
          animation: 'targetSpawn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), goldenGlow 1.5s ease-in-out infinite'
        };
      case 'decoy':
        return {
          ...baseStyle,
          background: 'radial-gradient(circle at 30% 30%, #22C55E, #16A34A)',
          border: '3px solid #4ADE80',
          boxShadow: '0 0 20px rgba(74, 222, 128, 0.6), 0 0 40px rgba(74, 222, 128, 0.3), inset 0 0 15px rgba(74, 222, 128, 0.2)',
          animation: 'decoyPulse 2s ease-in-out infinite'
        };
      default:
        return {
          ...baseStyle,
          background: '#00D4FF',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
          animation: 'targetSpawn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes targetSpawn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes goldenGlow {
          0%, 100% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.3); }
          50% { box-shadow: 0 0 35px rgba(255, 215, 0, 0.8), 0 0 70px rgba(255, 215, 0, 0.5); }
        }
        @keyframes decoyPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
      `}</style>
      <motion.div
        ref={targetRef}
        className="absolute rounded-full cursor-pointer"
        style={{
          width: `${target.size}px`,
          height: `${target.size}px`,
          ...getStyles(),
          zIndex: target.type === 'decoy' ? 100 : 1
        }}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.85 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: target.type === 'decoy' ? (target.opacity ?? 1) : 1
        }}
        exit={{ scale: 0, opacity: 0 }}
      >
        {target.type === 'golden' && (
          <div className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 text-[#FFD700] font-bold text-sm whitespace-nowrap"
               style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}>
            Special
          </div>
        )}
      </motion.div>
    </>
  );
}
