'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@verone/ui';

export default function TestSimplePage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test Simple</h1>

      <Card>
        <CardHeader>
          <CardTitle>Page de test simple</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Si vous voyez ce message, la page fonctionne.</p>
        </CardContent>
      </Card>
    </div>
  );
}
