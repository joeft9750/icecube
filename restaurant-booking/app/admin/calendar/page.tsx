"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface ReservationEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    reference: string;
    status: string;
    partySize: number;
    occasion: string | null;
    specialRequests: string | null;
    confirmedAt: string | null;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      allergies: string | null;
    };
    table: {
      id: string;
      name: string;
      zone: string | null;
      maxCapacity: number;
    } | null;
  };
}

// Traduction des statuts
const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CONFIRMED: { label: "Confirmée", variant: "default" },
  PENDING: { label: "En attente", variant: "secondary" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
  NO_SHOW: { label: "No-show", variant: "outline" },
  COMPLETED: { label: "Terminée", variant: "default" },
};

// Formater la date en français
function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Formater l'heure
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ReservationEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Charger les réservations
  const fetchReservations = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reservations?start=${start}&end=${end}`
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setTodayCount(data.meta.todayCount);
      }
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Quand les dates du calendrier changent
  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      const start = dateInfo.startStr.split("T")[0];
      const end = dateInfo.endStr.split("T")[0];
      fetchReservations(start, end);
    },
    [fetchReservations]
  );

  // Clic sur un événement
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps as ReservationEvent["extendedProps"],
    });
    setDialogOpen(true);
  }, []);

  // Charger les données initiales
  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    fetchReservations(
      startOfMonth.toISOString().split("T")[0],
      endOfMonth.toISOString().split("T")[0]
    );
  }, [fetchReservations]);

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Calendrier des réservations</h1>
              <p className="text-muted-foreground">
                Visualisez et gérez toutes les réservations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Calendar className="h-4 w-4 mr-2" />
              {todayCount} réservation{todayCount !== 1 ? "s" : ""} aujourd&apos;hui
            </Badge>
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Légende des couleurs */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm">Confirmée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm">Annulée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-sm">No-show</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm">Terminée</span>
          </div>
        </div>

        {/* Calendrier FullCalendar */}
        <div className="bg-background border rounded-lg p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale="fr"
            firstDay={1}
            slotMinTime="11:00:00"
            slotMaxTime="23:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            allDaySlot={false}
            nowIndicator={true}
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            expandRows={true}
            stickyHeaderDates={true}
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
            dayHeaderFormat={{
              weekday: "short",
              day: "numeric",
              month: "short",
            }}
            eventDisplay="block"
            eventContent={(eventInfo) => (
              <div className="p-1 overflow-hidden text-xs">
                <div className="font-semibold truncate">{eventInfo.event.title}</div>
                <div className="truncate opacity-80">
                  {formatTime(eventInfo.event.startStr)} - {formatTime(eventInfo.event.endStr)}
                </div>
              </div>
            )}
          />
        </div>

        {/* Dialog détails réservation */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedEvent.extendedProps.status === "CONFIRMED" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {selectedEvent.extendedProps.status === "PENDING" && (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    {selectedEvent.extendedProps.status === "CANCELLED" && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Réservation {selectedEvent.extendedProps.reference}
                  </DialogTitle>
                  <DialogDescription>
                    <Badge
                      variant={
                        STATUS_LABELS[selectedEvent.extendedProps.status]?.variant ||
                        "secondary"
                      }
                    >
                      {STATUS_LABELS[selectedEvent.extendedProps.status]?.label ||
                        selectedEvent.extendedProps.status}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Informations de la réservation */}
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDateFr(selectedEvent.start)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedEvent.extendedProps.partySize} personne
                        {selectedEvent.extendedProps.partySize > 1 ? "s" : ""}
                      </span>
                    </div>
                    {selectedEvent.extendedProps.table && (
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">🪑</span>
                        <span>
                          {selectedEvent.extendedProps.table.name}
                          {selectedEvent.extendedProps.table.zone &&
                            ` (${selectedEvent.extendedProps.table.zone})`}
                        </span>
                      </div>
                    )}
                    {selectedEvent.extendedProps.occasion && (
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">🎉</span>
                        <span>{selectedEvent.extendedProps.occasion}</span>
                      </div>
                    )}
                  </div>

                  {/* Informations du client */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Client</h4>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <p className="font-medium">
                        {selectedEvent.extendedProps.customer.firstName}{" "}
                        {selectedEvent.extendedProps.customer.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${selectedEvent.extendedProps.customer.email}`}
                          className="text-primary hover:underline"
                        >
                          {selectedEvent.extendedProps.customer.email}
                        </a>
                      </div>
                      {selectedEvent.extendedProps.customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${selectedEvent.extendedProps.customer.phone}`}
                            className="text-primary hover:underline"
                          >
                            {selectedEvent.extendedProps.customer.phone}
                          </a>
                        </div>
                      )}
                      {selectedEvent.extendedProps.customer.allergies && (
                        <div className="flex items-start gap-2 text-sm mt-2 p-2 bg-red-50 rounded border border-red-200">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <span className="font-medium text-red-700">Allergies : </span>
                            <span className="text-red-600">
                              {selectedEvent.extendedProps.customer.allergies}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Demandes spéciales */}
                  {selectedEvent.extendedProps.specialRequests && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Demandes spéciales</h4>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm">
                          {selectedEvent.extendedProps.specialRequests}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" asChild>
                      <Link
                        href={`/reservation/confirmation/${selectedEvent.extendedProps.reference}`}
                        target="_blank"
                      >
                        Voir la page client
                      </Link>
                    </Button>
                    <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
