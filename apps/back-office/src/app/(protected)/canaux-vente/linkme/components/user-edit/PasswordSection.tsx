'use client';

import { cn } from '@verone/utils';
import { Key, Eye, EyeOff } from 'lucide-react';

interface PasswordSectionProps {
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  errors: Record<string, string>;
  onNewPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
}

export function PasswordSection({
  newPassword,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  errors,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
}: PasswordSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
        <Key className="h-4 w-4" />
        Mot de passe
        <span className="text-xs font-normal text-gray-500">(optionnel)</span>
      </h3>
      <p className="text-xs text-gray-500">
        Laissez vide pour ne pas modifier le mot de passe.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => onNewPasswordChange(e.target.value)}
              placeholder="Min. 8 caracteres"
              className={cn(
                'w-full px-4 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2',
                errors.newPassword
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
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => onConfirmPasswordChange(e.target.value)}
              placeholder="Confirmer"
              className={cn(
                'w-full px-4 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2',
                errors.confirmPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              )}
            />
            <button
              type="button"
              onClick={onToggleShowConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>
      {newPassword && (
        <div className="text-xs space-y-1">
          <div
            className={`flex items-center space-x-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <span>Au moins 8 caracteres</span>
          </div>
          {confirmPassword && (
            <div
              className={`flex items-center space-x-2 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${newPassword === confirmPassword ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span>Les mots de passe correspondent</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
