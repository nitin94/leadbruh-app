import { useState, useEffect, useCallback } from 'react';
import { leadsDB } from '../lib/db';

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load leads on mount
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await leadsDB.getAll();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLead = useCallback(async (leadData) => {
    try {
      const newLead = await leadsDB.add(leadData);
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    } catch (err) {
      console.error('Failed to add lead:', err);
      throw err;
    }
  }, []);

  const updateLead = useCallback(async (id, updates) => {
    try {
      const updatedLead = await leadsDB.update(id, updates);
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
      return updatedLead;
    } catch (err) {
      console.error('Failed to update lead:', err);
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id) => {
    try {
      await leadsDB.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete lead:', err);
      throw err;
    }
  }, []);

  const deleteAllLeads = useCallback(async () => {
    try {
      await leadsDB.deleteAll();
      setLeads([]);
    } catch (err) {
      console.error('Failed to delete all leads:', err);
      throw err;
    }
  }, []);

  const searchLeads = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      return leads;
    }

    try {
      return await leadsDB.search(query);
    } catch (err) {
      console.error('Failed to search leads:', err);
      return leads.filter(l => 
        l.name?.toLowerCase().includes(query.toLowerCase()) ||
        l.company?.toLowerCase().includes(query.toLowerCase()) ||
        l.email?.toLowerCase().includes(query.toLowerCase())
      );
    }
  }, [leads]);

  return {
    leads,
    isLoading,
    error,
    addLead,
    updateLead,
    deleteLead,
    deleteAllLeads,
    searchLeads,
    refresh: loadLeads,
    count: leads.length
  };
}

export default useLeads;
