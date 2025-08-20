import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useCountries = () => {
  const [countries, setCountries] = useState([]);

  const fetchCountries = useCallback(async () => {
    try {
      const result = await apiClient.get('/countries');
      if (result.success) {
        setCountries(result.data || []);
      } else {
        setCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  }, []);

  return {
    countries,
    fetchCountries
  };
};
