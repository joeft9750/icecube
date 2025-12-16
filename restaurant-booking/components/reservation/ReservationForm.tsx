"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Users,
  Clock,
  User,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Schéma de validation Zod
const reservationSchema = z.object({
  date: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  partySize: z.number({
    required_error: "Veuillez sélectionner le nombre de personnes",
  }).min(1).max(8),
  time: z.string({
    required_error: "Veuillez sélectionner un créneau",
  }).min(1, "Veuillez sélectionner un créneau"),
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères"),
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  email: z.string()
    .email("Veuillez entrer une adresse email valide"),
  phone: z.string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      "Veuillez entrer un numéro de téléphone français valide"
    ),
  occasion: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  rgpdConsent: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la politique de confidentialité",
  }),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface TimeSlot {
  time: string;
  available: boolean;
}

const STEPS = [
  { id: 1, title: "Date", icon: CalendarIcon },
  { id: 2, title: "Personnes", icon: Users },
  { id: 3, title: "Horaire", icon: Clock },
  { id: 4, title: "Coordonnées", icon: User },
  { id: 5, title: "Confirmation", icon: CheckCircle },
];

const OCCASIONS = [
  { value: "anniversaire", label: "Anniversaire" },
  { value: "affaires", label: "Repas d'affaires" },
  { value: "romantique", label: "Dîner romantique" },
  { value: "autre", label: "Autre occasion" },
];

export function ReservationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [reservationRef, setReservationRef] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      partySize: undefined,
      time: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      occasion: "",
      specialRequests: "",
      rgpdConsent: false,
    },
    mode: "onChange",
  });

  const { watch, setValue, trigger, formState: { errors } } = form;
  const watchDate = watch("date");
  const watchPartySize = watch("partySize");
  const watchTime = watch("time");

  // Charger les créneaux quand date et partySize changent
  useEffect(() => {
    if (watchDate && watchPartySize && currentStep === 3) {
      loadAvailability();
    }
  }, [watchDate, watchPartySize, currentStep]);

  const loadAvailability = async () => {
    if (!watchDate || !watchPartySize) return;

    setIsLoadingSlots(true);
    setValue("time", "");

    try {
      const dateStr = format(watchDate, "yyyy-MM-dd");
      const response = await fetch(
        `/api/availability?date=${dateStr}&partySize=${watchPartySize}`
      );
      const data = await response.json();

      if (data.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
        setAvailableSlots([]);
      } else {
        setAvailableSlots(data.slots || []);
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

  // Désactiver les lundis et dates passées
  const disabledDays = [
    { before: new Date() },
    { dayOfWeek: [1] },
  ];

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!watchDate;
      case 2:
        return !!watchPartySize;
      case 3:
        return !!watchTime;
      case 4:
        return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !errors.rgpdConsent;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = await trigger("date");
        break;
      case 2:
        isValid = await trigger("partySize");
        break;
      case 3:
        isValid = await trigger("time");
        break;
      case 4:
        isValid = await trigger(["firstName", "lastName", "email", "phone", "rgpdConsent"]);
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: format(data.date, "yyyy-MM-dd"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la réservation");
      }

      setReservationRef(result.reference);
      setIsSuccess(true);
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
      setIsSubmitting(false);
    }
  };

  // Écran de succès
  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Réservation confirmée !</h2>
              <p className="text-muted-foreground mt-2">
                Votre réservation a bien été enregistrée
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg text-left space-y-3">
              <p className="text-lg font-semibold text-primary">
                Référence : {reservationRef}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">
                    {watchDate && format(watchDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Heure</span>
                  <p className="font-medium">{watchTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Personnes</span>
                  <p className="font-medium">{watchPartySize} {watchPartySize === 1 ? "personne" : "personnes"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nom</span>
                  <p className="font-medium">{form.getValues("firstName")} {form.getValues("lastName")}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Un email de confirmation a été envoyé à {form.getValues("email")}
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Retour à l&apos;accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center gap-2 flex-1",
                index !== STEPS.length - 1 && "relative"
              )}
            >
              {index !== STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary text-primary-foreground",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Choisissez votre date"}
            {currentStep === 2 && "Nombre de personnes"}
            {currentStep === 3 && "Sélectionnez un créneau"}
            {currentStep === 4 && "Vos coordonnées"}
            {currentStep === 5 && "Récapitulatif"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Le restaurant est fermé le lundi"}
            {currentStep === 2 && "Pour les groupes de plus de 8 personnes, contactez-nous"}
            {currentStep === 3 && "Choisissez l'heure de votre réservation"}
            {currentStep === 4 && "Renseignez vos informations de contact"}
            {currentStep === 5 && "Vérifiez les informations avant de confirmer"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* ÉTAPE 1: Date */}
            {currentStep === 1 && (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={watchDate}
                  onSelect={(date) => setValue("date", date as Date)}
                  disabled={disabledDays}
                  locale={fr}
                  className="rounded-md border"
                />
              </div>
            )}

            {/* ÉTAPE 2: Nombre de personnes */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={watchPartySize === num ? "default" : "outline"}
                      className="h-16 text-lg"
                      onClick={() => setValue("partySize", num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                {watchPartySize === 8 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Groupe de 8+ personnes ?</strong>
                      <br />
                      Pour les grands groupes, veuillez nous contacter directement au{" "}
                      <a href="tel:0123456789" className="underline">01 23 45 67 89</a>
                    </p>
                  </div>
                )}
                {errors.partySize && (
                  <p className="text-sm text-destructive">{errors.partySize.message}</p>
                )}
              </div>
            )}

            {/* ÉTAPE 3: Créneau horaire */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Chargement des disponibilités...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun créneau disponible pour cette date</p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setCurrentStep(1)}
                      className="mt-2"
                    >
                      Choisir une autre date
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Déjeuner */}
                    {availableSlots.some(s => parseInt(s.time.split(":")[0]) < 15) && (
                      <div>
                        <h4 className="font-medium mb-3">Déjeuner</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots
                            .filter(s => parseInt(s.time.split(":")[0]) < 15)
                            .map((slot) => (
                              <Button
                                key={slot.time}
                                type="button"
                                variant={watchTime === slot.time ? "default" : "outline"}
                                disabled={!slot.available}
                                className={cn(
                                  "h-12",
                                  !slot.available && "opacity-50 cursor-not-allowed",
                                  slot.available && watchTime !== slot.time && "hover:border-primary"
                                )}
                                onClick={() => slot.available && setValue("time", slot.time)}
                              >
                                <span>{slot.time}</span>
                                {!slot.available && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Complet
                                  </Badge>
                                )}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Dîner */}
                    {availableSlots.some(s => parseInt(s.time.split(":")[0]) >= 15) && (
                      <div>
                        <h4 className="font-medium mb-3">Dîner</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots
                            .filter(s => parseInt(s.time.split(":")[0]) >= 15)
                            .map((slot) => (
                              <Button
                                key={slot.time}
                                type="button"
                                variant={watchTime === slot.time ? "default" : "outline"}
                                disabled={!slot.available}
                                className={cn(
                                  "h-12",
                                  !slot.available && "opacity-50 cursor-not-allowed",
                                  slot.available && watchTime !== slot.time && "hover:border-primary"
                                )}
                                onClick={() => slot.available && setValue("time", slot.time)}
                              >
                                <span>{slot.time}</span>
                                {!slot.available && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Complet
                                  </Badge>
                                )}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {errors.time && (
                  <p className="text-sm text-destructive">{errors.time.message}</p>
                )}
              </div>
            )}

            {/* ÉTAPE 4: Informations client */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      placeholder="Jean"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      placeholder="Dupont"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="jean.dupont@exemple.fr"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="06 12 34 56 78"
                      className="pl-10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion (optionnel)</Label>
                  <Select
                    value={form.watch("occasion")}
                    onValueChange={(value) => setValue("occasion", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCASIONS.map((occasion) => (
                        <SelectItem key={occasion.value} value={occasion.value}>
                          {occasion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Demandes spéciales (optionnel)</Label>
                  <Textarea
                    id="specialRequests"
                    {...form.register("specialRequests")}
                    placeholder="Allergies, préférences de table, chaise haute..."
                    rows={3}
                  />
                </div>

                <div className="flex items-start space-x-3 pt-4 border-t">
                  <Checkbox
                    id="rgpdConsent"
                    checked={form.watch("rgpdConsent")}
                    onCheckedChange={(checked) => setValue("rgpdConsent", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="rgpdConsent"
                      className="text-sm font-normal leading-relaxed cursor-pointer"
                    >
                      J&apos;accepte que mes données soient utilisées pour gérer ma réservation
                      et recevoir des communications du restaurant. *
                    </Label>
                    {errors.rgpdConsent && (
                      <p className="text-sm text-destructive">{errors.rgpdConsent.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 5: Récapitulatif */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-muted rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Date</span>
                      <p className="font-medium">
                        {watchDate && format(watchDate, "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Heure</span>
                      <p className="font-medium">{watchTime}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Nombre de personnes</span>
                      <p className="font-medium">
                        {watchPartySize} {watchPartySize === 1 ? "personne" : "personnes"}
                      </p>
                    </div>
                    {form.watch("occasion") && (
                      <div>
                        <span className="text-sm text-muted-foreground">Occasion</span>
                        <p className="font-medium">
                          {OCCASIONS.find(o => o.value === form.watch("occasion"))?.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <span className="text-sm text-muted-foreground">Contact</span>
                    <p className="font-medium">
                      {form.watch("firstName")} {form.watch("lastName")}
                    </p>
                    <p className="text-sm">{form.watch("email")}</p>
                    <p className="text-sm">{form.watch("phone")}</p>
                  </div>

                  {form.watch("specialRequests") && (
                    <div className="border-t pt-4">
                      <span className="text-sm text-muted-foreground">Demandes spéciales</span>
                      <p className="text-sm">{form.watch("specialRequests")}</p>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  En confirmant, vous acceptez nos conditions générales et notre politique de confidentialité.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext()}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmer ma réservation
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
