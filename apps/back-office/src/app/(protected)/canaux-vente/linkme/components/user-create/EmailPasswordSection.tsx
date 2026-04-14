'use client';

import { cn } from '@verone/utils';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface EmailPasswordSectionProps {
  email: string;
  password: string;
  showPassword: boolean;
  errors: Record<string, string>;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
}

export function EmailPasswordSection({
  email,
  password,
  showPassword,
  errors,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
}: EmailPasswordSectionProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="utilisateur@exemple.com"
            className={cn(
              'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
              errors.email
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            )}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => onPasswordChange(e.target.value)}
            placeholder="Minimum 8 caracteres"
            className={cn(
              'w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
              errors.password
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            )}
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.password}
          </p>
        )}
      </div>
    </>
  );
}
