"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Download,
  ExternalLink,
  Edit,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ReservationData {
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
    zone: string | null;
  } | null;
  restaurant: {
    name: string;
    address: string;
    phone: string;
  };
}

// Adresse du restaurant pour Google Maps
const RESTAURANT_ADDRESS = "123 Rue de la Gastronomie, 75001 Paris";
const RESTAURANT_NAME = "Le Gourmet";

// Formater la date en français
function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Générer le lien Google Calendar
function generateGoogleCalendarLink(reservation: ReservationData): string {
  const date = reservation.date.replace(/-/g, "");
  const startTime = reservation.timeStart.replace(":", "") + "00";
  const endTime = reservation.timeEnd.replace(":", "") + "00";

  const title = encodeURIComponent(
    `Réservation ${RESTAURANT_NAME} - ${reservation.reference}`
  );
  const details = encodeURIComponent(
    `Réservation pour ${reservation.partySize} personne(s)\n` +
      `Référence: ${reservation.reference}\n` +
      `Nom: ${reservation.customer.firstName} ${reservation.customer.lastName}\n` +
      (reservation.occasion ? `Occasion: ${reservation.occasion}\n` : "") +
      (reservation.specialRequests
        ? `Demandes spéciales: ${reservation.specialRequests}`
        : "")
  );
  const location = encodeURIComponent(RESTAURANT_ADDRESS);

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}T${startTime}/${date}T${endTime}&details=${details}&location=${location}&sf=true&output=xml`;
}

// Générer le lien Google Maps
function generateGoogleMapsLink(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(RESTAURANT_ADDRESS)}`;
}

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = params.reference as string;
  const action = searchParams.get("action");

  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

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

        if (data.status === "CANCELLED") {
          setCancelled(true);
        }
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reference]);

  const handleCancel = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/reservations/${reference}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'annulation");
      }

      setCancelled(true);
    } catch {
      alert("Erreur lors de l'annulation. Veuillez réessayer.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Chargement de la réservation...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">{error}</h2>
                <p className="text-muted-foreground text-center">
                  Vérifiez le numéro de référence ou contactez le restaurant.
                </p>
                <Button asChild>
                  <Link href="/reservation">Faire une nouvelle réservation</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Page d'annulation confirmée
  if (cancelled) {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-destructive/10 rounded-full p-4 w-fit">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Réservation annulée</CardTitle>
              <CardDescription>
                Votre réservation {reference} a été annulée avec succès.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-muted rounded-lg p-6 mb-6">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>{formatDateFr(reservation.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>{reservation.timeStart}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {reservation.partySize} personne
                      {reservation.partySize > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-center text-muted-foreground mb-6">
                Nous espérons vous accueillir une prochaine fois !
              </p>

              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/reservation">Faire une nouvelle réservation</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Page de confirmation (action=cancel)
  if (action === "cancel") {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-amber-100 rounded-full p-4 w-fit">
                <AlertTriangle className="h-12 w-12 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Annuler ma réservation</CardTitle>
              <CardDescription>
                Êtes-vous sûr de vouloir annuler cette réservation ?
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-muted rounded-lg p-6 mb-6">
                <p className="font-semibold text-lg mb-4 text-center">
                  {reference}
                </p>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>{formatDateFr(reservation.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>{reservation.timeStart}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {reservation.partySize} personne
                      {reservation.partySize > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/reservation/confirmation/${reference}`)}
                >
                  Retour
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Annulation...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Confirmer l&apos;annulation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Page de confirmation principale
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-4 w-fit">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              Votre réservation est confirmée !
            </CardTitle>
            <CardDescription>
              Un email de confirmation vous a été envoyé à{" "}
              {reservation.customer.email}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Numéro de référence */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Numéro de référence
              </p>
              <p className="text-3xl font-bold tracking-wider text-primary">
                {reference}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Conservez ce numéro pour modifier ou annuler votre réservation
              </p>
            </div>

            {/* Récapitulatif */}
            <div className="bg-muted rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Détails de la réservation</h3>
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{formatDateFr(reservation.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {reservation.timeStart} - {reservation.timeEnd}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {reservation.partySize} personne
                      {reservation.partySize > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.customer.firstName}{" "}
                      {reservation.customer.lastName}
                    </p>
                  </div>
                </div>
                {reservation.table && (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center text-primary">
                      🪑
                    </div>
                    <div>
                      <p className="font-medium">{reservation.table.name}</p>
                      {reservation.table.zone && (
                        <p className="text-sm text-muted-foreground">
                          {reservation.table.zone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {reservation.occasion && (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center text-primary">
                      🎉
                    </div>
                    <p className="font-medium">{reservation.occasion}</p>
                  </div>
                )}
                {reservation.specialRequests && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Demandes spéciales:
                    </p>
                    <p className="text-sm">{reservation.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse du restaurant */}
            <div className="bg-muted rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{RESTAURANT_NAME}</p>
                  <p className="text-muted-foreground">{RESTAURANT_ADDRESS}</p>
                  <a
                    href={generateGoogleMapsLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline mt-2 text-sm"
                  >
                    Voir sur Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild variant="outline" className="w-full">
                <a
                  href={generateGoogleCalendarLink(reservation)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Ajouter à Google Calendar
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <a href={`/api/reservations/${reference}/calendar.ics`} download>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger .ics
                </a>
              </Button>

              <Button asChild variant="secondary" className="w-full">
                <Link href={`/reservation/manage/${reference}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier ma réservation
                </Link>
              </Button>

              <Button asChild variant="destructive" className="w-full">
                <Link href={`/reservation/confirmation/${reference}?action=cancel`}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler ma réservation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
