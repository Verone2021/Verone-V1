'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  User,
  Calendar,
  Home,
  Phone,
  Mail
} from 'lucide-react';
import { getReservations } from '@/actions/reservations';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export function ReservationsTable() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    const result = await getReservations();
    if (result.success && result.data) {
      setReservations(result.data);
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmee: { label: 'Confirmée', className: 'bg-green-100 text-green-800 border-green-200' },
      en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      annulee: { label: 'Annulée', className: 'bg-red-100 text-red-800 border-red-200' },
      completee: { label: 'Complétée', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    };

    const config = statusConfig[status] || statusConfig.en_attente;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      airbnb: { label: 'Airbnb', className: 'bg-[#FF5A5F]/10 text-[#FF5A5F] border-[#FF5A5F]/20' },
      booking: { label: 'Booking', className: 'bg-[#003580]/10 text-[#003580] border-[#003580]/20' },
      direct: { label: 'Direct', className: 'bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20' },
      autre: { label: 'Autre', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };

    const config = sourceConfig[source] || sourceConfig.autre;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    setSelectedRows(
      selectedRows.length === reservations.length
        ? []
        : reservations.map(r => r.id)
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des réservations...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.length === reservations.length && reservations.length > 0}
                onCheckedChange={toggleAllRows}
              />
            </TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Voyageur</TableHead>
            <TableHead>Propriété/Unité</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Aucune réservation trouvée
              </TableCell>
            </TableRow>
          ) : (
            reservations.map((reservation) => (
              <TableRow key={reservation.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(reservation.id)}
                    onCheckedChange={() => toggleRowSelection(reservation.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {reservation.code_confirmation}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#D4841A]" />
                    </div>
                    <div>
                      <div className="font-medium">{reservation.voyageur_nom}</div>
                      {reservation.voyageur_telephone && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {reservation.voyageur_telephone}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Home className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {reservation.proprietes?.nom || reservation.unites?.nom || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.proprietes?.ville || '-'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm">
                        {formatDate(reservation.date_arrivee)} → {formatDate(reservation.date_depart)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.nombre_nuits} nuits
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(reservation.statut)}
                </TableCell>
                <TableCell>
                  {getSourceBadge(reservation.source_reservation)}
                </TableCell>
                <TableCell className="text-right">
                  <div>
                    <div className="font-medium">
                      {reservation.total_hote_net?.toFixed(2)}€
                    </div>
                    {reservation.commission_plateforme_total > 0 && (
                      <div className="text-xs text-gray-500">
                        Com: {reservation.commission_plateforme_total?.toFixed(2)}€
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/reservations/${reservation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/reservations/${reservation.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Annuler
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}