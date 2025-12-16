"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  allergies: string | null;
}

interface TableInfo {
  id: string;
  name: string;
  maxCapacity: number;
  zone: string | null;
}

interface Reservation {
  id: string;
  reference: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  partySize: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED";
  occasion: string | null;
  specialRequests: string | null;
  createdAt: string;
  customer: Customer;
  table: TableInfo | null;
}

const statusConfig = {
  PENDING: { label: "En attente", variant: "warning" as const, color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmée", variant: "success" as const, color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Annulée", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
  NO_SHOW: { label: "No-show", variant: "destructive" as const, color: "bg-gray-100 text-gray-800" },
  COMPLETED: { label: "Terminée", variant: "secondary" as const, color: "bg-blue-100 text-blue-800" },
};

export function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/reservations");
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: status as Reservation["status"] } : r
          )
        );
        toast({
          title: "Statut mis à jour",
          description: "La réservation a été mise à jour avec succès.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reservations?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReservations((prev) => prev.filter((r) => r.id !== id));
        toast({
          title: "Réservation supprimée",
          description: "La réservation a été supprimée avec succès.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réservation.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucune réservation pour le moment.</p>
        <p className="text-sm mt-2">
          Les nouvelles réservations apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Référence</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Date & Heure</TableHead>
          <TableHead>Table</TableHead>
          <TableHead>Convives</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell>
              <span className="font-mono text-sm">{reservation.reference}</span>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">
                  {reservation.customer.firstName} {reservation.customer.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reservation.customer.email}
                </p>
                {reservation.customer.phone && (
                  <p className="text-sm text-muted-foreground">
                    {reservation.customer.phone}
                  </p>
                )}
                {reservation.customer.allergies && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Allergies: {reservation.customer.allergies}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">
                  {format(new Date(reservation.date), "EEE d MMM", {
                    locale: fr,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reservation.timeStart} - {reservation.timeEnd}
                </p>
                {reservation.occasion && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {reservation.occasion}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              {reservation.table ? (
                <div>
                  <p className="font-medium">{reservation.table.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.table.zone}
                  </p>
                </div>
              ) : (
                <span className="text-muted-foreground">Non assignée</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{reservation.partySize} pers.</Badge>
            </TableCell>
            <TableCell>
              <Select
                value={reservation.status}
                onValueChange={(value) => updateStatus(reservation.id, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue>
                    <Badge
                      className={statusConfig[reservation.status].color}
                    >
                      {statusConfig[reservation.status].label}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                  <SelectItem value="NO_SHOW">No-show</SelectItem>
                  <SelectItem value="COMPLETED">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteReservation(reservation.id)}
                >
                  Supprimer
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
