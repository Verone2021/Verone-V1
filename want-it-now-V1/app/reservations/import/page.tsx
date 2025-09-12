'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  X,
  Download,
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { importAirbnbCSV } from '@/actions/reservations';
import { useRouter } from 'next/navigation';

export default function ImportReservationsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [contratId, setContratId] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Results

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Veuillez sélectionner un fichier CSV');
      return;
    }

    setFile(selectedFile);
    
    // Lire le contenu du fichier
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parsePreview(content);
      setStep(2);
    };
    reader.readAsText(selectedFile);
  };

  const parsePreview = (content: string) => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const previewData = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/"/g, '');
      });
      
      previewData.push(row);
    }
    
    setPreview(previewData);
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleImport = async () => {
    if (!csvContent || !contratId) {
      alert('Veuillez sélectionner un contrat');
      return;
    }

    setImporting(true);
    
    try {
      const result = await importAirbnbCSV(csvContent, contratId);
      
      if (result.success) {
        setImportResult(result.results);
        setStep(3);
      } else {
        alert(`Erreur lors de l'import: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      alert('Une erreur est survenue lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setCsvContent('');
    setPreview([]);
    setImportResult(null);
    setStep(1);
    setContratId('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Airbnb CSV</h1>
          <p className="text-gray-600 mt-1">
            Importez vos réservations depuis Airbnb
          </p>
        </div>
        
        <Button variant="outline" size="sm" asChild>
          <Link href="/reservations">
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Link>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-[#D4841A]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-[#D4841A] text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <span className="font-medium">Upload</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-[#D4841A]' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-[#D4841A]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-[#D4841A] text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="font-medium">Vérification</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-[#D4841A]' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-[#2D5A27]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-[#2D5A27] text-white' : 'bg-gray-200'
          }`}>
            3
          </div>
          <span className="font-medium">Résultats</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-[#D4841A]" />
              <span>Sélectionner le fichier CSV</span>
            </CardTitle>
            <CardDescription>
              Utilisez le template d'export Airbnb pour importer vos réservations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Box */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Format attendu</AlertTitle>
              <AlertDescription className="text-blue-700">
                Le fichier CSV doit contenir les colonnes : Code de confirmation, Statut, 
                Nom du voyageur, Contact, Dates, Nuits, Annonce, Revenus
              </AlertDescription>
            </Alert>

            {/* Contrat Selection */}
            <div className="space-y-2">
              <Label htmlFor="contrat">Contrat associé *</Label>
              <Select value={contratId} onValueChange={setContratId}>
                <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                  <SelectValue placeholder="Sélectionner un contrat actif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrat-1">Contrat Villa Nice - Airbnb</SelectItem>
                  <SelectItem value="contrat-2">Contrat Apt Paris - Multi-plateformes</SelectItem>
                  <SelectItem value="contrat-3">Contrat Chalet Chamonix - Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Fichier CSV</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="bg-white"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>

            {file && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-[#D4841A]" />
              <span>Vérification des données</span>
            </CardTitle>
            <CardDescription>
              Aperçu des {preview.length} premières lignes sur {csvContent.split('\n').length - 1} total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Voyageur</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Nuits</TableHead>
                    <TableHead>Revenus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {row["Code de confirmation"]}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {row["Statut"]}
                        </Badge>
                      </TableCell>
                      <TableCell>{row["Nom du voyageur"]}</TableCell>
                      <TableCell>
                        {row["Date de début"]} → {row["Date de fin"]}
                      </TableCell>
                      <TableCell>{row["# des nuits"]}</TableCell>
                      <TableCell className="font-medium">{row["Revenus"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button variant="outline" onClick={reset}>
                Changer de fichier
              </Button>
              <Button 
                onClick={handleImport}
                disabled={importing || !contratId}
                className="bg-[#D4841A] hover:bg-[#B8741A]"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer {csvContent.split('\n').length - 1} réservations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#2D5A27]" />
              <span>Import terminé</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-800">
                    {importResult.success}
                  </div>
                  <p className="text-sm text-green-600">Réservations importées</p>
                </CardContent>
              </Card>
              
              {importResult.errors?.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-800">
                      {importResult.errors.length}
                    </div>
                    <p className="text-sm text-red-600">Erreurs</p>
                  </CardContent>
                </Card>
              )}
              
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-800">
                    {importResult.total}
                  </div>
                  <p className="text-sm text-blue-600">Total traité</p>
                </CardContent>
              </Card>
            </div>

            {importResult.errors?.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Erreurs détectées</AlertTitle>
                <AlertDescription className="text-red-700">
                  <ul className="mt-2 space-y-1">
                    {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                      <li key={index}>
                        Ligne {error.line}: {error.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <Button variant="outline" onClick={reset}>
                Nouvel import
              </Button>
              <Button 
                onClick={() => router.push('/reservations')}
                className="bg-[#2D5A27] hover:bg-[#1F3F1C]"
              >
                Voir les réservations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}