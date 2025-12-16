import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Supprimer les données existantes
  await prisma.blockedSlot.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.table.deleteMany();
  await prisma.restaurant.deleteMany();

  // Créer le restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Le Gourmet",
      address: "123 Rue de la Gastronomie, 75001 Paris",
      phone: "01 23 45 67 89",
      email: "contact@legourmet.fr",
      openingHours: {
        monday: null, // Fermé le lundi
        tuesday: {
          lunch: { start: "12:00", end: "14:30" },
          dinner: { start: "19:00", end: "22:30" },
        },
        wednesday: {
          lunch: { start: "12:00", end: "14:30" },
          dinner: { start: "19:00", end: "22:30" },
        },
        thursday: {
          lunch: { start: "12:00", end: "14:30" },
          dinner: { start: "19:00", end: "22:30" },
        },
        friday: {
          lunch: { start: "12:00", end: "14:30" },
          dinner: { start: "19:00", end: "22:30" },
        },
        saturday: {
          lunch: { start: "12:00", end: "15:00" },
          dinner: { start: "19:00", end: "23:00" },
        },
        sunday: {
          lunch: { start: "12:00", end: "15:00" },
          dinner: { start: "19:00", end: "22:00" },
        },
      },
      bookingConfig: {
        slotDuration: 30, // Durée d'un créneau en minutes
        mealDuration: 90, // Durée moyenne d'un repas en minutes
        bufferTime: 15, // Buffer entre réservations en minutes
        maxPartySize: 8, // Taille max d'un groupe
        minAdvanceBooking: 2, // Heures minimum avant réservation
        maxAdvanceBooking: 30, // Jours maximum à l'avance
      },
    },
  });

  console.log(`Restaurant créé: ${restaurant.name}`);

  // Créer les tables
  const tables = await Promise.all([
    // 2 tables de 2 personnes
    prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: "Table 1",
        minCapacity: 1,
        maxCapacity: 2,
        zone: "Salle principale",
        isActive: true,
      },
    }),
    prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: "Table 2",
        minCapacity: 1,
        maxCapacity: 2,
        zone: "Fenêtre",
        isActive: true,
      },
    }),
    // 2 tables de 4 personnes
    prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: "Table 3",
        minCapacity: 2,
        maxCapacity: 4,
        zone: "Salle principale",
        isActive: true,
      },
    }),
    prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: "Table 4",
        minCapacity: 2,
        maxCapacity: 4,
        zone: "Salle principale",
        isActive: true,
      },
    }),
    // 1 table de 6 personnes
    prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: "Table 5",
        minCapacity: 4,
        maxCapacity: 6,
        zone: "Salon privé",
        isActive: true,
      },
    }),
    // 1 table de 8 personnes
    prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: "Table 6",
        minCapacity: 6,
        maxCapacity: 8,
        zone: "Salon privé",
        isActive: true,
      },
    }),
  ]);

  console.log(`${tables.length} tables créées:`);
  tables.forEach((table) => {
    console.log(`  - ${table.name}: ${table.minCapacity}-${table.maxCapacity} pers. (${table.zone})`);
  });

  // Créer un client de test
  const customer = await prisma.customer.create({
    data: {
      email: "jean.dupont@example.com",
      phone: "06 12 34 56 78",
      firstName: "Jean",
      lastName: "Dupont",
      allergies: "Gluten",
      visitCount: 0,
    },
  });

  console.log(`Client test créé: ${customer.firstName} ${customer.lastName}`);

  // Créer une réservation de test
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const reservation = await prisma.reservation.create({
    data: {
      reference: `R${new Date().getFullYear()}-000001`,
      restaurantId: restaurant.id,
      tableId: tables[2].id, // Table 3 (4 pers)
      customerId: customer.id,
      date: tomorrow,
      timeStart: "20:00",
      timeEnd: "21:30",
      partySize: 3,
      status: "CONFIRMED",
      occasion: "Anniversaire",
      specialRequests: "Bougie pour le dessert",
      confirmedAt: new Date(),
    },
  });

  console.log(`Réservation test créée: ${reservation.reference}`);

  console.log("\nSeeding terminé avec succès!");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
