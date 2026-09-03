import { useEffect } from 'react';

interface MetaProps {
  title: string;
  description?: string;
  path?: string;
}

export function useDocumentMeta(meta: string | MetaProps) {
  useEffect(() => {
    const title = typeof meta === 'string' ? meta : meta.title;
    document.title = title;
  }, [meta]);
}

export default useDocumentMeta;
