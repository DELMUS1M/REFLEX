import { useEffect, useState } from 'react';
import { connectionMonitor } from './connection';

export function useConnection() {
  const [online, setOnline] = useState(connectionMonitor.isOnline());

  useEffect(() => {
    const sync = () => setOnline(connectionMonitor.isOnline());
    connectionMonitor.addEventListener('change', sync);
    return () => connectionMonitor.removeEventListener('change', sync);
  }, []);

  return online;
}
