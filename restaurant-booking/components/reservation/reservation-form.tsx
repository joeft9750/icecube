"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const occasions = [
  "Aucune",
  "Anniversaire",
  "Saint-Valentin",
  "Affaires",
  "Fiançailles",
  "Autre occasion spéciale",
];

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimeSlot {
  time: string;
  available: boolean;
  tablesAvailable: number;
}

interface AvailabilityResponse {
  available: boolean;
  reason?: string;
  slots: TimeSlot[];
}

export function ReservationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [reservationRef, setReservationRef] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: undefined as Date | undefined,
    time: "",
    partySize: "",
    occasion: "",
    specialRequests: "",
    allergies: "",
  });

  // Charger les créneaux disponibles quand la date ou le nombre de convives change
  useEffect(() => {
    if (formData.date && formData.partySize) {
      loadAvailability();
    }
  }, [formData.date, formData.partySize]);

  const loadAvailability = async () => {
    if (!formData.date || !formData.partySize) return;

    setIsLoadingSlots(true);
    setFormData((prev) => ({ ...prev, time: "" }));

    try {
      const dateStr = format(formData.date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/availability?date=${dateStr}&partySize=${formData.partySize}`
      );
      const data: AvailabilityResponse = await response.json();

      if (!data.available) {
        toast({
          title: "Restaurant fermé",
          description: data.reason || "Pas de disponibilité ce jour.",
          variant: "destructive",
        });
        setAvailableSlots([]);
      } else {
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error("Erreur chargement disponibilité:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les créneaux disponibles.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.date ||
      !formData.time ||
      !formData.partySize
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: format(formData.date, "yyyy-MM-dd"),
          occasion: formData.occasion === "Aucune" ? null : formData.occasion,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la réservation");
      }

      setReservationRef(result.reference);
      setShowSuccess(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Désactiver les lundis (restaurant fermé) et les dates passées
  const disabledDays = [
    { before: new Date() },
    { dayOfWeek: [1] }, // Lundi
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Informations de réservation</CardTitle>
          <CardDescription>
            Les champs marqués d&apos;un * sont obligatoires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Jean"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            {/* Email et Téléphone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="jean@exemple.fr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            {/* Date, Heure, Convives */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                  onClick={() => setShowCalendar(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date
                    ? format(formData.date, "d MMM yyyy", { locale: fr })
                    : "Sélectionner"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Convives *</Label>
                <Select
                  value={formData.partySize}
                  onValueChange={(value) =>
                    setFormData({ ...formData, partySize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestOptions.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "personne" : "personnes"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heure *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) =>
                    setFormData({ ...formData, time: value })
                  }
                  disabled={!formData.date || !formData.partySize || isLoadingSlots}
                >
                  <SelectTrigger>
                    {isLoadingSlots ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </div>
                    ) : (
                      <SelectValue placeholder="Sélectionner" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        Aucun créneau disponible
                      </SelectItem>
                    ) : (
                      availableSlots.map((slot) => (
                        <SelectItem
                          key={slot.time}
                          value={slot.time}
                          disabled={!slot.available}
                        >
                          {slot.time}
                          {!slot.available && " (complet)"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Occasion */}
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select
                value={formData.occasion}
                onValueChange={(value) =>
                  setFormData({ ...formData, occasion: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une occasion (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map((occasion) => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies alimentaires</Label>
              <Input
                id="allergies"
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
                placeholder="Gluten, lactose, fruits à coque..."
              />
            </div>

            {/* Demandes spéciales */}
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Demandes spéciales</Label>
              <Input
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) =>
                  setFormData({ ...formData, specialRequests: e.target.value })
                }
                placeholder="Table près de la fenêtre, chaise haute..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réservation en cours...
                </>
              ) : (
                "Confirmer la réservation"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dialog Calendrier */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sélectionner une date</DialogTitle>
            <DialogDescription>
              Le restaurant est fermé le lundi
            </DialogDescription>
          </DialogHeader>
          <Calendar
            mode="single"
            selected={formData.date}
            onSelect={(date) => {
              setFormData({ ...formData, date });
              setShowCalendar(false);
            }}
            disabled={disabledDays}
            locale={fr}
            className="rounded-md border"
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Succès */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réservation enregistrée !</DialogTitle>
            <DialogDescription>
              Votre réservation a bien été enregistrée. Vous recevrez un email de
              confirmation à l&apos;adresse {formData.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold text-primary">
                Référence : {reservationRef}
              </p>
              <p>
                <strong>Date :</strong>{" "}
                {formData.date &&
                  format(formData.date, "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <p>
                <strong>Heure :</strong> {formData.time}
              </p>
              <p>
                <strong>Convives :</strong> {formData.partySize} personnes
              </p>
              {formData.occasion && formData.occasion !== "Aucune" && (
                <p>
                  <strong>Occasion :</strong> {formData.occasion}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Un email de confirmation vous sera envoyé prochainement par notre équipe.
            </p>
            <Button className="w-full" onClick={() => router.push("/")}>
              Retour à l&apos;accueil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
