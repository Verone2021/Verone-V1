'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Menu, Search, ShoppingCart, X } from 'lucide-react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface INavItem {
  id: string;
  label: string;
  href: string;
}

interface ISelectionHeaderProps {
  selectionName: string;
  branding: IBranding;
  cartCount: number;
  onCartClick: () => void;
  onSearchClick: () => void;
  navItems: INavItem[];
  activeSection: string;
  onNavClick: (sectionId: string) => void;
  showPointsDeVente?: boolean;
}

export function SelectionHeader({
  selectionName,
  branding,
  cartCount,
  onCartClick,
  onSearchClick,
  navItems,
  activeSection,
  onNavClick,
  showPointsDeVente = false,
}: ISelectionHeaderProps): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter nav items based on showPointsDeVente
  const filteredNavItems = navItems.filter(
    item => item.id !== 'points-de-vente' || showPointsDeVente
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Selection Name */}
          <div className="flex items-center gap-3">
            {branding.logo_url ? (
              <Image
                src={branding.logo_url}
                alt={selectionName}
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: branding.primary_color }}
              >
                {selectionName.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="font-semibold text-lg hidden sm:block"
              style={{ color: branding.text_color }}
            >
              {selectionName}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: branding.primary_color }
                    : undefined
                }
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={onSearchClick}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative p-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: branding.primary_color }}
              aria-label={`Panier (${cartCount} articles)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {filteredNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavClick(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={
                    activeSection === item.id
                      ? { backgroundColor: branding.primary_color }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
