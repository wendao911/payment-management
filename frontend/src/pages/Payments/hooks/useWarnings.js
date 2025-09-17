import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useWarnings = () => {
  const [warnings, setWarnings] = useState([]);

  const fetchWarnings = useCallback(async () => {
    try {
      const response = await apiClient.get('/payment/overdue/list');
      if (response.success) {
        setWarnings(response.data || []);
      } else {
        setWarnings([]);
      }
    } catch (error) {
      console.error('Error fetching warnings:', error);
      setWarnings([]);
    }
  }, []);

  return {
    warnings,
    fetchWarnings
  };
};
