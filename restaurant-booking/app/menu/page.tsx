import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const menuCategories = [
  {
    name: "Entrées",
    items: [
      {
        name: "Foie Gras Maison",
        description: "Foie gras mi-cuit, chutney de figues et pain brioché toasté",
        price: "24€",
        tags: ["Signature"],
      },
      {
        name: "Carpaccio de Saint-Jacques",
        description: "Saint-Jacques marinées, agrumes et huile de truffe",
        price: "22€",
        tags: [],
      },
      {
        name: "Velouté de Saison",
        description: "Crème de légumes du moment, croutons à l'ail",
        price: "14€",
        tags: ["Végétarien"],
      },
      {
        name: "Tartare de Boeuf",
        description: "Boeuf français, câpres, cornichons et jaune d'oeuf",
        price: "18€",
        tags: [],
      },
    ],
  },
  {
    name: "Plats",
    items: [
      {
        name: "Filet de Boeuf Rossini",
        description: "Filet de boeuf, escalope de foie gras poêlée, sauce Périgueux",
        price: "48€",
        tags: ["Signature"],
      },
      {
        name: "Homard Bleu Rôti",
        description: "Demi-homard, beurre blanc au champagne, légumes grillés",
        price: "52€",
        tags: [],
      },
      {
        name: "Risotto aux Cèpes",
        description: "Riz Carnaroli crémeux, cèpes frais et copeaux de parmesan",
        price: "28€",
        tags: ["Végétarien"],
      },
      {
        name: "Canard Laqué",
        description: "Magret de canard, sauce au miel et épices, purée de patates douces",
        price: "36€",
        tags: [],
      },
      {
        name: "Bar de Ligne",
        description: "Bar entier, croûte de sel aux herbes, sauce vierge",
        price: "42€",
        tags: [],
      },
    ],
  },
  {
    name: "Desserts",
    items: [
      {
        name: "Soufflé au Chocolat",
        description: "Soufflé chaud au chocolat Valrhona, glace vanille bourbon",
        price: "16€",
        tags: ["Signature"],
      },
      {
        name: "Tarte Tatin",
        description: "Pommes caramélisées, pâte feuilletée maison, crème fraîche",
        price: "14€",
        tags: [],
      },
      {
        name: "Assiette de Fromages",
        description: "Sélection de fromages affinés, confiture de cerises noires",
        price: "18€",
        tags: [],
      },
      {
        name: "Crème Brûlée",
        description: "Crème vanille, caramel craquant aux éclats de pralin",
        price: "12€",
        tags: [],
      },
    ],
  },
];

export default function MenuPage() {
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Notre Menu</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez notre carte élaborée avec passion par notre chef. Tous nos
            plats sont préparés avec des produits frais et de saison.
          </p>
        </div>

        <div className="space-y-12">
          {menuCategories.map((category) => (
            <section key={category.name}>
              <h2 className="text-2xl font-bold mb-6 text-primary border-b pb-2">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.items.map((item) => (
                  <Card key={item.name} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {item.name}
                            {item.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant={tag === "Signature" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {item.price}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Menu Dégustation</CardTitle>
              <CardDescription>
                Laissez notre chef vous surprendre avec un menu dégustation de 7
                plats accompagnés de vins sélectionnés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">95€ / personne</p>
              <p className="text-sm text-muted-foreground mt-2">
                Accord mets et vins : +45€
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
