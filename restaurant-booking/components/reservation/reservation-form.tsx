"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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

const timeSlots = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
];

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8];

export function ReservationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: undefined as Date | undefined,
    time: "",
    guests: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time || !formData.guests) {
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
          date: formData.date.toISOString(),
          guests: parseInt(formData.guests),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la réservation");
      }

      setShowSuccess(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disabledDays = [
    { before: new Date() },
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@exemple.fr"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="06 12 34 56 78"
                required
              />
            </div>

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
                    ? format(formData.date, "d MMMM yyyy", { locale: fr })
                    : "Sélectionner"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Heure *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData({ ...formData, time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Convives *</Label>
                <Select
                  value={formData.guests}
                  onValueChange={(value) => setFormData({ ...formData, guests: value })}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (allergies, occasions spéciales...)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Réservation en cours..." : "Confirmer la réservation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sélectionner une date</DialogTitle>
            <DialogDescription>
              Choisissez la date de votre réservation
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

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réservation confirmée !</DialogTitle>
            <DialogDescription>
              Votre réservation a bien été enregistrée. Vous recevrez un email de
              confirmation à l&apos;adresse {formData.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>Date :</strong> {formData.date && format(formData.date, "EEEE d MMMM yyyy", { locale: fr })}</p>
              <p><strong>Heure :</strong> {formData.time}</p>
              <p><strong>Convives :</strong> {formData.guests} personnes</p>
            </div>
            <Button className="w-full" onClick={() => router.push("/")}>
              Retour à l&apos;accueil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
