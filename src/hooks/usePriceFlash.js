import { useState, useEffect, useRef } from 'react';

export function usePriceFlash(currentPrice) {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef(currentPrice);

  useEffect(() => {
    const prevPrice = prevPriceRef.current;
    if (currentPrice > prevPrice) {
      setFlashClass('flash-green');
    } else if (currentPrice < prevPrice) {
      setFlashClass('flash-red');
    }
    
    prevPriceRef.current = currentPrice;

    if (currentPrice !== prevPrice) {
      const timer = setTimeout(() => {
        setFlashClass('');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPrice]);

  return { flashClass };
}
