import { useState, useCallback } from 'react';
import type { AxiosResponse } from 'axios';

function triggerDownload(response: AxiosResponse<Blob>, filename: string) {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function useExport() {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async (
    apiCall: () => Promise<AxiosResponse<Blob>>,
    filename: string,
  ) => {
    setExporting(true);
    try {
      const response = await apiCall();
      triggerDownload(response, filename);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, exportData };
}
