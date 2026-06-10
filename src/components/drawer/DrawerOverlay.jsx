import React from 'react';
import { motion } from 'framer-motion';

export function DrawerOverlay({ onClick }) {
  return (
    <motion.div
      className="fixed inset-0 bg-slate-900 z-40 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    />
  );
}
