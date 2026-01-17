'use client';

import { useState, Suspense } from 'react';

import { ClientOrEnseigneSelector } from '@verone/products';
import { Card, CardHeader, CardTitle, CardContent } from '@verone/ui';
import { Loader2 } from 'lucide-react';

function TestClientOrEnseigneSelectorContent() {
  const [enseigneId, setEnseigneId] = useState<string | null>(null);
  const [enseigneName, setEnseigneName] = useState<string | null>(null);
  const [parentOrgId, setParentOrgId] = useState<string | null>(null);

  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [organisationName, setOrganisationName] = useState<string | null>(null);

  const handleEnseigneChange = (
    id: string | null,
    name: string | null,
    parentId: string | null
  ) => {
    setEnseigneId(id);
    setEnseigneName(name);
    setParentOrgId(parentId);
  };

  const handleOrganisationChange = (id: string | null, name: string | null) => {
    setOrganisationId(id);
    setOrganisationName(name);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test ClientOrEnseigneSelector</h1>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Composant ClientOrEnseigneSelector</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientOrEnseigneSelector
              enseigneId={enseigneId}
              organisationId={organisationId}
              onEnseigneChange={handleEnseigneChange}
              onOrganisationChange={handleOrganisationChange}
              label="Sélectionner un client"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>État du composant (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Enseigne sélectionnée
                </h3>
                <pre className="bg-muted p-4 rounded-md text-sm">
                  {JSON.stringify(
                    {
                      enseigneId,
                      enseigneName,
                      parentOrgId,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Organisation sélectionnée
                </h3>
                <pre className="bg-muted p-4 rounded-md text-sm">
                  {JSON.stringify(
                    {
                      organisationId,
                      organisationName,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TestClientOrEnseigneSelectorPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-8 max-w-4xl flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TestClientOrEnseigneSelectorContent />
    </Suspense>
  );
}
