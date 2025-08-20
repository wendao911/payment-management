import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState([]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const result = await apiClient.get('/currencies');
      if (result.success) {
        setCurrencies(result.data || []);
      } else {
        setCurrencies([]);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setCurrencies([]);
    }
  }, []);

  return {
    currencies,
    fetchCurrencies
  };
};
