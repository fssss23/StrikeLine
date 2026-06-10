import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDrawer } from '../../hooks/useDrawer';
import { DrawerOverlay } from './DrawerOverlay';
import { DrawerHeader } from './DrawerHeader';
import { ChartTimeToggle } from './ChartTimeToggle';
import { CandlestickChart } from './CandlestickChart';
import { AlertConfigForm } from './AlertConfigForm';

export function SecurityDrawer() {
  const { drawerOpen, closeDrawer } = useDrawer();
  const [activeTimeframe, setActiveTimeframe] = useState('1M');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeDrawer]);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Handle responsive layout manually with Tailwind classes + Framer motion variants,
  // or just use window.innerWidth for motion if needed.
  // Actually, framer motion allows different animations for different screen sizes if we use responsive variants, 
  // but for simplicity we can use standard variants and check window width on mount/resize.
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const variants = {
    hidden: isMobile ? { y: '100%' } : { x: '100%' },
    visible: isMobile ? { y: 0 } : { x: 0 },
    exit: isMobile ? { y: '100%' } : { x: '100%' }
  };

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <DrawerOverlay onClick={closeDrawer} />
          <motion.div
            className={`fixed bg-white z-50 flex flex-col overflow-hidden shadow-drawer
              ${isMobile 
                ? 'bottom-0 left-0 w-full h-[92vh] rounded-t-2xl' 
                : 'top-0 right-0 h-full w-[460px]'
              }`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (isMobile && info.offset.y > 100) {
                closeDrawer();
              }
            }}
          >
            {isMobile && (
              <div className="w-full flex justify-center mt-3 mb-2 shrink-0">
                <div className="w-9 h-1 bg-[#E4E7ED] rounded-full" />
              </div>
            )}
            
            <DrawerHeader />
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-surface-border">
                <ChartTimeToggle activeTimeframe={activeTimeframe} onChange={setActiveTimeframe} />
                <CandlestickChart activeTimeframe={activeTimeframe} />
              </div>
              <div className="p-6">
                <AlertConfigForm />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
