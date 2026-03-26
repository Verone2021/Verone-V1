'use client';

import { useState } from 'react';

export function useExpeditionsFilters() {
  const [activeTab, setActiveTab] = useState<string>('to-ship');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');

  return {
    activeTab,
    searchTerm,
    statusFilter,
    urgencyFilter,
    historySearchTerm,
    historyStatusFilter,
    setActiveTab,
    setSearchTerm,
    setStatusFilter,
    setUrgencyFilter,
    setHistorySearchTerm,
    setHistoryStatusFilter,
  };
}
