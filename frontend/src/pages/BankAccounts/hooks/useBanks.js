import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useBanks = () => {
  const [banks, setBanks] = useState([]);

  const fetchBanks = useCallback(async () => {
    try {
      const result = await apiClient.get('/banks');
      if (result.success) {
        setBanks(result.data || []);
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      setBanks([]);
    }
  }, []);

  return {
    banks,
    fetchBanks
  };
};
