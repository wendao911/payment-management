import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await apiClient.get('/supplier');
      if (response.success) {
        setSuppliers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, []);

  return {
    suppliers,
    fetchSuppliers
  };
};
