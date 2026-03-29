interface AideStepProps {
  number: number;
  title: string;
  description: string;
}

/**
 * Étape numérotée pour les guides pas-à-pas.
 */
export function AideStep({
  number,
  title,
  description,
}: AideStepProps): JSX.Element {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-linkme-turquoise/10 text-linkme-turquoise font-bold text-sm">
        {number}
      </div>
      <div className="pt-1">
        <p className="font-medium text-linkme-marine">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}
