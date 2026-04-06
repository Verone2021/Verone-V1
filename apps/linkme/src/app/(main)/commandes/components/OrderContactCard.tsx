'use client';

import { PhoneIcon } from 'lucide-react';

interface ContactCardProps {
  label: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  position?: string | null;
}

export function ContactCard({
  label,
  name,
  email,
  phone,
  position,
}: ContactCardProps) {
  if (!name && !email && !phone) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {name && <p className="font-medium text-[#183559] text-sm">{name}</p>}
      {position && <p className="text-xs text-gray-500">{position}</p>}
      {email && <p className="text-sm text-gray-600">{email}</p>}
      {phone && (
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <PhoneIcon className="h-3 w-3" />
          {phone}
        </p>
      )}
    </div>
  );
}
