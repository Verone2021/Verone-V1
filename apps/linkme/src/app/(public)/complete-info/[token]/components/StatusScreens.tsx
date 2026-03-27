import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@verone/ui';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function InvalidScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-red-700">Lien invalide</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function ExpiredScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Clock className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-orange-700">Lien expire</CardTitle>
          <CardDescription>
            Ce lien n&apos;est plus valide. Veuillez contacter l&apos;equipe
            Verone pour obtenir un nouveau lien.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function CompletedScreen({ completedBy }: { completedBy?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-green-700">
            Informations deja soumises
          </CardTitle>
          <CardDescription>
            Ces informations ont deja ete completees
            {completedBy ? ` par ${completedBy}` : ''}.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function CancelledScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-green-700">Deja complete</CardTitle>
          <CardDescription>
            Ces informations ont deja ete fournies par quelqu&apos;un
            d&apos;autre. Aucune action n&apos;est necessaire de votre part.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function SuccessScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-green-700">
            Informations enregistrees
          </CardTitle>
          <CardDescription>
            Merci ! Vos informations ont ete transmises a notre equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-green-800">
              Votre commande va etre traitee dans les meilleurs delais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
