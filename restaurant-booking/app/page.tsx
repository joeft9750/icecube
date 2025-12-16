import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Clock, Star, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Bienvenue au <span className="text-primary">Gourmet</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Une expérience culinaire exceptionnelle vous attend. Découvrez notre
            cuisine raffinée préparée avec passion par notre chef étoilé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/reservation">Réserver une table</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/menu">Découvrir le menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pourquoi nous choisir ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Star className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Cuisine Étoilée</CardTitle>
                <CardDescription>
                  Notre chef primé crée des plats exceptionnels avec les meilleurs
                  ingrédients locaux et de saison.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <UtensilsCrossed className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Menu Raffiné</CardTitle>
                <CardDescription>
                  Une carte variée qui évolue au fil des saisons pour vous offrir
                  toujours le meilleur de la gastronomie.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Service Attentionné</CardTitle>
                <CardDescription>
                  Notre équipe dévouée vous accompagne pour faire de votre repas
                  un moment inoubliable.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-8">Nos Horaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Déjeuner</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Lundi - Vendredi</p>
                  <p className="font-semibold">12h00 - 14h30</p>
                  <p className="text-muted-foreground mt-2">Samedi - Dimanche</p>
                  <p className="font-semibold">12h00 - 15h00</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dîner</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Lundi - Vendredi</p>
                  <p className="font-semibold">19h00 - 22h30</p>
                  <p className="text-muted-foreground mt-2">Samedi - Dimanche</p>
                  <p className="font-semibold">19h00 - 23h00</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à vivre une expérience unique ?</h2>
          <p className="text-muted-foreground mb-8">
            Réservez votre table dès maintenant et laissez-nous vous surprendre.
          </p>
          <Button asChild size="lg">
            <Link href="/reservation">Réserver maintenant</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
