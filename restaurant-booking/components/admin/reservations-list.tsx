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

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
}

const statusLabels = {
  PENDING: { label: "En attente", variant: "warning" as const },
  CONFIRMED: { label: "Confirmée", variant: "success" as const },
  CANCELLED: { label: "Annulée", variant: "destructive" as const },
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
      <div className="text-center py-8 text-muted-foreground">
        Chargement des réservations...
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
          <TableHead>Client</TableHead>
          <TableHead>Date & Heure</TableHead>
          <TableHead>Convives</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell>
              <div>
                <p className="font-medium">{reservation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {reservation.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reservation.phone}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">
                  {format(new Date(reservation.date), "d MMM yyyy", {
                    locale: fr,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reservation.time}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{reservation.guests} pers.</Badge>
            </TableCell>
            <TableCell>
              <Select
                value={reservation.status}
                onValueChange={(value) => updateStatus(reservation.id, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue>
                    <Badge variant={statusLabels[reservation.status].variant}>
                      {statusLabels[reservation.status].label}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => deleteReservation(reservation.id)}
              >
                Supprimer
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
