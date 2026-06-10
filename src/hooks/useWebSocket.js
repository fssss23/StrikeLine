import { useEffect, useRef } from 'react';
import useWatchlistStore from '../store/useWatchlistStore';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
  const ws = useRef(null);
  const updatePrices = useWatchlistStore((state) => state.updatePrices);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'}/${user.id}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'price_update') {
          // message.data should be array of price objects
          updatePrices(message.data);
        }
      } catch (error) {
        console.error('WebSocket message parsing error', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user, updatePrices]);

  return ws.current;
};
