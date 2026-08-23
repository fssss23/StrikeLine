import React from 'react';
import { motion } from 'framer-motion';

export function DrawerOverlay({ onClick }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 cursor-pointer bg-slate-900/40 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    />
  );
}
