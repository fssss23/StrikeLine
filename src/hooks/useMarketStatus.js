import { useState, useEffect } from 'react';
import { format, set, isBefore, isAfter, isWeekend } from 'date-fns';

export function useMarketStatus() {
  const [statusInfo, setStatusInfo] = useState({
    status: 'closed', // 'open' | 'closed' | 'pre-open'
    label: 'PSX Closed',
    nextEvent: 'Opens',
    nextEventTime: '09:15 PKT'
  });

  useEffect(() => {
    // A simplified mock implementation. In a real app, we'd use robust timezone handling.
    const checkStatus = () => {
      const now = new Date();
      // Assume local time is PKT for the sake of this mock, or just hardcode some logic
      // to demonstrate the UI states. Let's make it return 'open' generally for Phase 1.
      
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isWeekEnd = now.getDay() === 0 || now.getDay() === 6;

      if (isWeekEnd) {
        setStatusInfo({ status: 'closed', label: 'PSX Closed', nextEvent: 'Opens Mon', nextEventTime: '09:15 PKT' });
        return;
      }

      const timeInMinutes = hour * 60 + minute;
      const preOpenStart = 9 * 60; // 09:00
      const openStart = 9 * 60 + 15; // 09:15
      const closeTime = 15 * 60 + 30; // 15:30

      if (timeInMinutes >= preOpenStart && timeInMinutes < openStart) {
        setStatusInfo({ status: 'pre-open', label: 'Pre-Open', nextEvent: 'Opens', nextEventTime: '09:15 PKT' });
      } else if (timeInMinutes >= openStart && timeInMinutes < closeTime) {
        setStatusInfo({ status: 'open', label: 'PSX Open', nextEvent: 'Closes', nextEventTime: '15:30 PKT' });
      } else {
        setStatusInfo({ status: 'closed', label: 'PSX Closed', nextEvent: 'Opens', nextEventTime: '09:15 PKT' });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return statusInfo;
}
