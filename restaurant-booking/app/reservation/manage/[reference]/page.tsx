"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  Edit3,
  X,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Reservation {
  id: string;
  reference: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  partySize: number;
  status: string;
  occasion: string | null;
  specialRequests: string | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  table: {
    name: string;
    zone: string;
  } | null;
  restaurant: {
    name: string;
    address: string;
    phone: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilityData {
  slots: TimeSlot[];
  isOpen: boolean;
  closedReason?: string;
}

export default function ManageReservationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = params.reference as string;
  const action = searchParams.get("action");

  // State
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode (view, edit, cancel)
  const [mode, setMode] = useState<"view" | "edit" | "cancel">(
    action === "cancel" ? "cancel" : "view"
  );

  // Edit form state
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editTime, setEditTime] = useState<string>("");
  const [editPartySize, setEditPartySize] = useState<number>(2);
  const [editOccasion, setEditOccasion] = useState<string>("");
  const [editSpecialRequests, setEditSpecialRequests] = useState<string>("");

  // Availability state
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Cancel state
  const [cancelReason, setCancelReason] = useState<string>("");

  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch reservation
  useEffect(() => {
    async function fetchReservation() {
      try {
        const response = await fetch(`/api/reservations/${reference}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Réservation introuvable");
          } else {
            setError("Erreur lors du chargement de la réservation");
          }
          return;
        }
        const data = await response.json();
        setReservation(data);

        // Initialize edit form with current values
        setEditDate(parseISO(data.date));
        setEditTime(data.timeStart);
        setEditPartySize(data.partySize);
        setEditOccasion(data.occasion || "");
        setEditSpecialRequests(data.specialRequests || "");
      } catch (err) {
        setError("Erreur de connexion");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reference]);

  // Fetch availability when date or party size changes in edit mode
  const fetchAvailability = useCallback(async (date: Date, partySize: number) => {
    setLoadingAvailability(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/availability?date=${dateStr}&partySize=${partySize}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (err) {
      console.error("Erreur chargement disponibilités:", err);
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "edit" && editDate) {
      fetchAvailability(editDate, editPartySize);
    }
  }, [mode, editDate, editPartySize, fetchAvailability]);

  // Handle modification
  const handleModification = async () => {
    if (!reservation || !editDate) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};

      const newDateStr = format(editDate, "yyyy-MM-dd");
      if (newDateStr !== reservation.date) {
        payload.date = newDateStr;
      }
      if (editTime !== reservation.timeStart) {
        payload.time = editTime;
      }
      if (editPartySize !== reservation.partySize) {
        payload.partySize = editPartySize;
      }
      if (editOccasion !== (reservation.occasion || "")) {
        payload.occasion = editOccasion || null;
      }
      if (editSpecialRequests !== (reservation.specialRequests || "")) {
        payload.specialRequests = editSpecialRequests || null;
      }

      const response = await fetch(`/api/reservations/${reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alternatives && data.alternatives.length > 0) {
          setError(
            `${data.error}. Créneaux alternatifs disponibles : ${data.alternatives.join(", ")}`
          );
        } else {
          setError(data.error || "Erreur lors de la modification");
        }
        return;
      }

      setSuccessMessage("Votre réservation a été modifiée avec succès.");
      setReservation({
        ...reservation,
        ...data.reservation,
      });
      setMode("view");
      setShowConfirmDialog(false);
    } catch (err) {
      setError("Erreur de connexion");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancellation
  const handleCancellation = async () => {
    if (!reservation) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/${reference}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'annulation");
        return;
      }

      setSuccessMessage(
        "Votre réservation a été annulée. Un email de confirmation vous a été envoyé."
      );
      setReservation({
        ...reservation,
        status: "CANCELLED",
      });
      setMode("view");
      setShowConfirmDialog(false);
    } catch (err) {
      setError("Erreur de connexion");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if reservation is in the past
  const isPastReservation =
    reservation && isBefore(parseISO(reservation.date), startOfDay(new Date()));

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmée";
      case "PENDING":
        return "En attente";
      case "CANCELLED":
        return "Annulée";
      case "COMPLETED":
        return "Terminée";
      case "NO_SHOW":
        return "Non présenté";
      default:
        return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/")}>
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!reservation) return null;

  const reservationDate = parseISO(reservation.date);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Button>
          <Badge className={getStatusColor(reservation.status)}>
            {getStatusLabel(reservation.status)}
          </Badge>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {mode === "edit"
                    ? "Modifier la réservation"
                    : mode === "cancel"
                      ? "Annuler la réservation"
                      : "Ma réservation"}
                </CardTitle>
                <CardDescription className="mt-1">
                  Référence : {reservation.reference}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* VIEW MODE */}
            {mode === "view" && (
              <>
                {/* Restaurant Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    {reservation.restaurant.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{reservation.restaurant.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                    <Phone className="w-4 h-4" />
                    <span>{reservation.restaurant.phone}</span>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {format(reservationDate, "EEEE d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Heure</p>
                      <p className="font-medium">
                        {reservation.timeStart} - {reservation.timeEnd}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Personnes</p>
                      <p className="font-medium">
                        {reservation.partySize} personne
                        {reservation.partySize > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {reservation.table && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Table</p>
                        <p className="font-medium">
                          {reservation.table.name} ({reservation.table.zone})
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Informations client</h4>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      {reservation.customer.firstName}{" "}
                      {reservation.customer.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{reservation.customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{reservation.customer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Occasion & Special Requests */}
                {(reservation.occasion || reservation.specialRequests) && (
                  <div className="border-t pt-4">
                    {reservation.occasion && (
                      <div className="mb-3">
                        <h4 className="font-medium mb-1">Occasion</h4>
                        <p className="text-gray-600">{reservation.occasion}</p>
                      </div>
                    )}
                    {reservation.specialRequests && (
                      <div>
                        <h4 className="font-medium mb-1">Demandes spéciales</h4>
                        <p className="text-gray-600">
                          {reservation.specialRequests}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* EDIT MODE */}
            {mode === "edit" && (
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label className="mb-2 block">Date</Label>
                  <div className="border rounded-lg p-4">
                    <CalendarComponent
                      mode="single"
                      selected={editDate}
                      onSelect={(date) => {
                        setEditDate(date);
                        setEditTime(""); // Reset time when date changes
                      }}
                      locale={fr}
                      disabled={(date) =>
                        isBefore(date, startOfDay(new Date())) ||
                        isBefore(date, addDays(new Date(), -1))
                      }
                      className="mx-auto"
                    />
                  </div>
                </div>

                {/* Party Size */}
                <div>
                  <Label htmlFor="partySize" className="mb-2 block">
                    Nombre de personnes
                  </Label>
                  <Select
                    value={editPartySize.toString()}
                    onValueChange={(v) => {
                      setEditPartySize(parseInt(v));
                      setEditTime(""); // Reset time when party size changes
                    }}
                  >
                    <SelectTrigger id="partySize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} personne{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                <div>
                  <Label className="mb-2 block">Heure</Label>
                  {loadingAvailability ? (
                    <div className="flex items-center gap-2 text-gray-500 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Chargement des disponibilités...</span>
                    </div>
                  ) : availability?.isOpen === false ? (
                    <p className="text-amber-600 py-2">
                      {availability.closedReason || "Fermé ce jour"}
                    </p>
                  ) : availability?.slots && availability.slots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availability.slots.map((slot) => (
                        <Button
                          key={slot.time}
                          type="button"
                          variant={editTime === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setEditTime(slot.time)}
                          className={
                            !slot.available ? "opacity-50 cursor-not-allowed" : ""
                          }
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 py-2">
                      Sélectionnez une date pour voir les disponibilités
                    </p>
                  )}
                </div>

                {/* Occasion */}
                <div>
                  <Label htmlFor="occasion" className="mb-2 block">
                    Occasion (optionnel)
                  </Label>
                  <Select
                    value={editOccasion}
                    onValueChange={setEditOccasion}
                  >
                    <SelectTrigger id="occasion">
                      <SelectValue placeholder="Sélectionnez une occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune occasion</SelectItem>
                      <SelectItem value="Anniversaire">Anniversaire</SelectItem>
                      <SelectItem value="Saint-Valentin">Saint-Valentin</SelectItem>
                      <SelectItem value="Repas d'affaires">
                        Repas d&apos;affaires
                      </SelectItem>
                      <SelectItem value="Célébration">Célébration</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Special Requests */}
                <div>
                  <Label htmlFor="specialRequests" className="mb-2 block">
                    Demandes spéciales (optionnel)
                  </Label>
                  <Textarea
                    id="specialRequests"
                    value={editSpecialRequests}
                    onChange={(e) => setEditSpecialRequests(e.target.value)}
                    placeholder="Allergies, préférences de placement, etc."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* CANCEL MODE */}
            {mode === "cancel" && (
              <div className="space-y-6">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">
                        Êtes-vous sûr de vouloir annuler cette réservation ?
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        Cette action est irréversible. Vous recevrez un email de
                        confirmation de l&apos;annulation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Récapitulatif</h4>
                  <p className="text-gray-600">
                    {format(reservationDate, "EEEE d MMMM yyyy", { locale: fr })}{" "}
                    à {reservation.timeStart}
                  </p>
                  <p className="text-gray-600">
                    {reservation.partySize} personne
                    {reservation.partySize > 1 ? "s" : ""}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="cancelReason" className="mb-2 block">
                    Raison de l&apos;annulation (optionnel)
                  </Label>
                  <Textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Dites-nous pourquoi vous annulez..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            {mode === "view" ? (
              <>
                {reservation.status !== "CANCELLED" && !isPastReservation && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setMode("edit")}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setMode("cancel")}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                )}
                {(reservation.status === "CANCELLED" || isPastReservation) && (
                  <p className="text-gray-500 text-sm">
                    {reservation.status === "CANCELLED"
                      ? "Cette réservation a été annulée"
                      : "Cette réservation est passée"}
                  </p>
                )}
              </>
            ) : mode === "edit" ? (
              <>
                <Button variant="ghost" onClick={() => setMode("view")}>
                  Annuler les modifications
                </Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!editDate || !editTime}
                >
                  Enregistrer les modifications
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setMode("view")}>
                  Retour
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmDialog(true)}
                >
                  Confirmer l&apos;annulation
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {mode === "edit"
                  ? "Confirmer les modifications"
                  : "Confirmer l'annulation"}
              </DialogTitle>
              <DialogDescription>
                {mode === "edit"
                  ? "Voulez-vous enregistrer les modifications de votre réservation ?"
                  : "Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."}
              </DialogDescription>
            </DialogHeader>

            {mode === "edit" && editDate && (
              <div className="py-4 space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">Nouvelle date :</span>{" "}
                  {format(editDate, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Nouvelle heure :</span>{" "}
                  {editTime}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Nombre de personnes :</span>{" "}
                  {editPartySize}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                variant={mode === "cancel" ? "destructive" : "default"}
                onClick={mode === "edit" ? handleModification : handleCancellation}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Traitement...
                  </>
                ) : mode === "edit" ? (
                  "Confirmer"
                ) : (
                  "Annuler la réservation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
