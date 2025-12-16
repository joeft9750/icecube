import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  findAvailableTable,
  calculateEndTime,
  getAvailability,
} from "@/lib/availability";
import {
  sendCustomerConfirmationEmail,
  sendRestaurantNotificationEmail,
} from "@/lib/email";
import {
  validateLockForReservation,
  getLockById,
  releaseLock,
} from "@/lib/slotLock";

// Schéma de validation Zod
const reservationSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
  partySize: z
    .number()
    .int()
    .min(1, "Au moins 1 personne")
    .max(20, "Maximum 20 personnes"),
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      "Numéro de téléphone français invalide"
    ),
  occasion: z.string().max(100).optional(),
  specialRequests: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  // Champs pour le système de verrouillage
  lockId: z.string().optional(),
  sessionId: z.string().optional(),
});

// Générer une référence unique au format R2024-000001
async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const lastReservation = await prisma.reservation.findFirst({
    where: {
      reference: {
        startsWith: `R${year}-`,
      },
    },
    orderBy: {
      reference: "desc",
    },
  });

  let nextNumber = 1;
  if (lastReservation) {
    const lastNumber = parseInt(lastReservation.reference.split("-")[1]);
    nextNumber = lastNumber + 1;
  }

  return `R${year}-${nextNumber.toString().padStart(6, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (dateStr) {
      where.date = new Date(dateStr + "T00:00:00");
    }

    if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: true,
        table: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { timeStart: "asc" }],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Erreur récupération réservations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation avec Zod
    const validationResult = reservationSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json(
        { error: "Données invalides", details: errors },
        { status: 400 }
      );
    }

    const {
      date,
      time,
      partySize,
      firstName,
      lastName,
      email,
      phone,
      occasion,
      specialRequests,
      allergies,
      lockId,
      sessionId,
    } = validationResult.data;

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant non configuré" },
        { status: 500 }
      );
    }

    const reservationDate = new Date(date + "T00:00:00");
    let tableId: string | null = null;

    // 2. Vérifier le verrou si fourni
    if (lockId && sessionId) {
      const lockValidation = validateLockForReservation(
        lockId,
        sessionId,
        date,
        time
      );

      if (!lockValidation.valid) {
        // Le verrou n'est plus valide, récupérer les alternatives
        const availability = await getAvailability(reservationDate, partySize);
        const alternativeSlots = availability.slots
          .filter((s) => s.available)
          .slice(0, 5)
          .map((s) => s.time);

        return NextResponse.json(
          {
            error: lockValidation.error || "Verrou invalide",
            code: "LOCK_INVALID",
            alternatives: alternativeSlots,
          },
          { status: 409 }
        );
      }

      // Utiliser la table du verrou
      const lock = getLockById(lockId);
      if (lock) {
        tableId = lock.tableId;
      }
    }

    // 3. Si pas de verrou ou pas de table, vérifier disponibilité classique
    if (!tableId) {
      const availability = await getAvailability(reservationDate, partySize);

      // Vérifier si le créneau demandé est disponible
      const requestedSlot = availability.slots.find((s) => s.time === time);
      if (!requestedSlot || !requestedSlot.available) {
        const alternativeSlots = availability.slots
          .filter((s) => s.available)
          .slice(0, 5)
          .map((s) => s.time);

        return NextResponse.json(
          {
            error: "Ce créneau n'est plus disponible",
            code: "SLOT_UNAVAILABLE",
            alternatives: alternativeSlots,
            message:
              alternativeSlots.length > 0
                ? `Le créneau de ${time} n'est plus disponible. Créneaux alternatifs : ${alternativeSlots.join(", ")}`
                : `Aucun créneau disponible pour ${partySize} personnes le ${date}`,
          },
          { status: 409 }
        );
      }

      // 4. Trouver une table disponible
      tableId = await findAvailableTable(reservationDate, time, partySize);

      if (!tableId) {
        const alternativeSlots = availability.slots
          .filter((s) => s.available && s.time !== time)
          .slice(0, 5)
          .map((s) => s.time);

        return NextResponse.json(
          {
            error: "Aucune table disponible pour ce créneau",
            code: "NO_TABLE_AVAILABLE",
            alternatives: alternativeSlots,
          },
          { status: 409 }
        );
      }
    }

    // 5. Créer ou récupérer le client (par email)
    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (customer) {
      // Mettre à jour les informations du client existant
      customer = await prisma.customer.update({
        where: { email },
        data: {
          phone: phone,
          firstName,
          lastName,
          allergies: allergies || customer.allergies,
          visitCount: { increment: 1 },
        },
      });
    } else {
      // Créer un nouveau client
      customer = await prisma.customer.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          allergies: allergies || null,
          visitCount: 1,
        },
      });
    }

    // 6. Générer une référence unique
    const reference = await generateReference();

    // Calculer l'heure de fin
    const timeEnd = await calculateEndTime(time);

    // 7. Créer la réservation avec status CONFIRMED
    const reservation = await prisma.reservation.create({
      data: {
        reference,
        restaurantId: restaurant.id,
        tableId,
        customerId: customer.id,
        date: reservationDate,
        timeStart: time,
        timeEnd,
        partySize,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        occasion: occasion || null,
        specialRequests: specialRequests || null,
      },
      include: {
        customer: true,
        table: true,
        restaurant: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    // Données pour les emails
    const emailData = {
      reference: reservation.reference,
      customerName: `${firstName} ${lastName}`,
      email,
      date: reservationDate,
      time,
      partySize,
      tableName: reservation.table?.name,
      occasion,
      specialRequests,
    };

    // 8. Libérer le verrou après création réussie
    if (lockId) {
      releaseLock(lockId);
    }

    // 9. Envoyer email de confirmation au client
    const customerEmailResult = await sendCustomerConfirmationEmail(emailData);
    if (!customerEmailResult.success) {
      console.warn(
        "Email confirmation client non envoyé:",
        customerEmailResult.error
      );
    }

    // 10. Envoyer email de notification au restaurant
    const restaurantEmailResult =
      await sendRestaurantNotificationEmail(emailData);
    if (!restaurantEmailResult.success) {
      console.warn(
        "Email notification restaurant non envoyé:",
        restaurantEmailResult.error
      );
    }

    // 11. Retourner la réservation créée avec sa référence
    return NextResponse.json(
      {
        success: true,
        reservation: {
          id: reservation.id,
          reference: reservation.reference,
          date: date,
          time: reservation.timeStart,
          timeEnd: reservation.timeEnd,
          partySize: reservation.partySize,
          status: reservation.status,
          table: reservation.table
            ? {
                id: reservation.table.id,
                name: reservation.table.name,
                zone: reservation.table.zone,
              }
            : null,
          customer: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
          },
          occasion: reservation.occasion,
          specialRequests: reservation.specialRequests,
          restaurant: {
            name: reservation.restaurant.name,
            address: reservation.restaurant.address,
            phone: reservation.restaurant.phone,
          },
          confirmedAt: reservation.confirmedAt,
        },
        emailsSent: {
          customer: customerEmailResult.success,
          restaurant: restaurantEmailResult.success,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la réservation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, tableId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "CONFIRMED") {
        updateData.confirmedAt = new Date();
      }
    }

    if (tableId !== undefined) {
      updateData.tableId = tableId;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        table: true,
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Erreur mise à jour réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la réservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation" },
      { status: 500 }
    );
  }
}
