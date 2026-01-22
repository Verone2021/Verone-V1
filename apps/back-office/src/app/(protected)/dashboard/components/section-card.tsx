/**
 * Section Card Component
 * Reusable card displaying a section with KPIs
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KPICard } from './kpi-card';

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  kpis: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down';
    trendValue?: string;
  }>;
}

export function SectionCard({
  title,
  description,
  icon,
  href,
  kpis,
}: SectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          <Button variant="ghost" asChild>
            <Link href={href}>Voir tout →</Link>
          </Button>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
