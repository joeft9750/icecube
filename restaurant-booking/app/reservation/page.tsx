import { ReservationForm } from "@/components/reservation/reservation-form";

export default function ReservationPage() {
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Réserver une table</h1>
          <p className="text-muted-foreground">
            Complétez le formulaire ci-dessous pour réserver votre table.
            Vous recevrez une confirmation par email.
          </p>
        </div>
        <ReservationForm />
      </div>
    </div>
  );
}
