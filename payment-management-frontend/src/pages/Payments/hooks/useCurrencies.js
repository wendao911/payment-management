import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState([]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await apiClient.get('/currencies');
      if (response.success) {
        setCurrencies(response.data || []);
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
