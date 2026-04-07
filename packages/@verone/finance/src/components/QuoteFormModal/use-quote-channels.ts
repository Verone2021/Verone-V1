'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  useLinkMeAffiliates,
  useLinkMeSelectionsByAffiliate,
  useLinkMeSelection,
} from '@verone/orders/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type { QuoteChannelType, QuoteItemLocal, WizardStep } from './types';

interface UseQuoteChannelsOptions {
  open: boolean;
  setItems: React.Dispatch<React.SetStateAction<QuoteItemLocal[]>>;
  resetItems: () => void;
}

export interface UseQuoteChannelsReturn {
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  selectedChannel: QuoteChannelType | null;
  setSelectedChannel: (channel: QuoteChannelType | null) => void;
  channelId: string | null;
  setChannelId: (id: string | null) => void;
  channelLabel: string;
  isServiceMode: boolean;
  isLinkMeMode: boolean;

  // LinkMe
  selectedAffiliateId: string | null;
  setSelectedAffiliateId: (id: string | null) => void;
  selectedSelectionId: string | null;
  setSelectedSelectionId: (id: string | null) => void;
  affiliateSearch: string;
  setAffiliateSearch: (v: string) => void;
  linkmeAffiliates: ReturnType<typeof useLinkMeAffiliates>['data'];
  linkmeSelections: ReturnType<typeof useLinkMeSelectionsByAffiliate>['data'];
  linkmeSelectionDetails: ReturnType<typeof useLinkMeSelection>['data'];

  // Handlers
  handleChannelSelect: (channel: QuoteChannelType) => void;
  handleBackToChannelSelection: () => void;
  handleBackFromLinkmeSelection: () => void;
  handleBackFromForm: (selectedChannel: QuoteChannelType | null) => void;
  resetChannels: () => void;
}

export function useQuoteChannels({
  open,
  setItems,
  resetItems,
}: UseQuoteChannelsOptions): UseQuoteChannelsReturn {
  const supabase = createClient();

  const [wizardStep, setWizardStep] = useState<WizardStep>('channel-selection');
  const [selectedChannel, setSelectedChannel] =
    useState<QuoteChannelType | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);

  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(
    null
  );
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [affiliateSearch, setAffiliateSearch] = useState('');

  const { data: linkmeAffiliates } = useLinkMeAffiliates();
  const { data: linkmeSelections } =
    useLinkMeSelectionsByAffiliate(selectedAffiliateId);
  const { data: linkmeSelectionDetails } =
    useLinkMeSelection(selectedSelectionId);

  // Load sales channels when modal opens
  useEffect(() => {
    if (!open) return;

    const loadChannels = async () => {
      const { data, error } = await supabase
        .from('sales_channels')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error(
          '[QuoteFormModal] Failed to load channels:',
          error.message
        );
        return;
      }
      setAvailableChannels(data ?? []);
    };

    void loadChannels().catch((err: unknown) => {
      console.error('[QuoteFormModal] loadChannels error:', err);
    });
  }, [open, supabase]);

  const resetChannels = useCallback(() => {
    setWizardStep('channel-selection');
    setSelectedChannel(null);
    setChannelId(null);
    setSelectedAffiliateId(null);
    setSelectedSelectionId(null);
    setAffiliateSearch('');
  }, []);

  const handleChannelSelect = useCallback(
    (channel: QuoteChannelType) => {
      setSelectedChannel(channel);

      if (channel === 'manual') {
        const ch = availableChannels.find(
          c =>
            c.code === 'MANUEL' || c.code === 'manuel' || c.code === 'general'
        );
        if (ch) setChannelId(ch.id);
      } else if (channel === 'site-internet') {
        const ch = availableChannels.find(
          c => c.code === 'SITE_INTERNET' || c.code === 'site-internet'
        );
        if (ch) setChannelId(ch.id);
      } else if (channel === 'linkme') {
        const ch = availableChannels.find(
          c => c.code === 'LINKME' || c.code === 'linkme'
        );
        if (ch) setChannelId(ch.id);
      } else if (channel === 'service') {
        setChannelId(null);
      }

      if (channel === 'linkme') {
        setWizardStep('linkme-affiliate');
        return;
      }

      setWizardStep('form');

      if (channel === 'service') {
        setItems([
          {
            id: Math.random().toString(36).substring(2, 9),
            product_id: null,
            description: '',
            quantity: 1,
            unit_price_ht: 0,
            tva_rate: 20,
            discount_percentage: 0,
            eco_tax: 0,
            is_service: true,
          },
        ]);
      }
    },
    [availableChannels, setItems]
  );

  const handleBackToChannelSelection = useCallback(() => {
    setWizardStep('channel-selection');
    setSelectedChannel(null);
    setChannelId(null);
    setSelectedAffiliateId(null);
    setSelectedSelectionId(null);
    resetItems();
  }, [resetItems]);

  const handleBackFromLinkmeSelection = useCallback(() => {
    setWizardStep('linkme-affiliate');
    setSelectedSelectionId(null);
    resetItems();
    setAffiliateSearch('');
  }, [resetItems]);

  const handleBackFromForm = useCallback(
    (channel: QuoteChannelType | null) => {
      if (channel === 'linkme') {
        setWizardStep('linkme-selection');
        resetItems();
      } else {
        handleBackToChannelSelection();
      }
    },
    [handleBackToChannelSelection, resetItems]
  );

  const channelLabel = (() => {
    switch (selectedChannel) {
      case 'manual':
        return 'Manuel';
      case 'site-internet':
        return 'Site Internet';
      case 'linkme':
        return 'LinkMe';
      case 'service':
        return 'Service';
      default:
        return '';
    }
  })();

  return {
    wizardStep,
    setWizardStep,
    selectedChannel,
    setSelectedChannel,
    channelId,
    setChannelId,
    channelLabel,
    isServiceMode: selectedChannel === 'service',
    isLinkMeMode: selectedChannel === 'linkme',
    selectedAffiliateId,
    setSelectedAffiliateId,
    selectedSelectionId,
    setSelectedSelectionId,
    affiliateSearch,
    setAffiliateSearch,
    linkmeAffiliates,
    linkmeSelections,
    linkmeSelectionDetails,
    handleChannelSelect,
    handleBackToChannelSelection,
    handleBackFromLinkmeSelection,
    handleBackFromForm,
    resetChannels,
  };
}
