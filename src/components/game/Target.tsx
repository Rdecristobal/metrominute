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

  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.left = `${target.x}px`;
      targetRef.current.style.top = `${target.y}px`;
    }
  }, [target.x, target.y]);

  const getStyles = () => {
    switch (target.type) {
      case 'golden':
        return {
          background: '#FFD700',
          border: '3px solid #FFD700',
          boxShadow: '0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.3)',
          animation: 'targetSpawn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), goldenGlow 1.5s ease-in-out infinite'
        };
      case 'decoy':
        return {
          background: '#10B981',
          border: '2px solid rgba(255,255,255,0.3)',
          animation: 'decoyPulse 2s ease-in-out infinite'
        };
      default:
        return {
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
          50% { opacity: 0.6; transform: scale(0.95); }
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
        animate={{ scale: 1, opacity: 1 }}
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
