import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  findAvailableTable,
  calculateEndTime,
  getAvailability,
} from "@/lib/availability";
import {
  sendModificationEmail,
  sendCancellationEmail,
  sendRestaurantModificationNotification,
  sendRestaurantCancellationNotification,
} from "@/lib/email";

// Schéma de validation pour la modification
const modificationSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide")
    .optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide").optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  occasion: z.string().max(100).optional().nullable(),
  specialRequests: z.string().max(500).optional().nullable(),
});

// Schéma pour l'annulation
const cancellationSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { reference },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        table: {
          select: {
            name: true,
            zone: true,
          },
        },
        restaurant: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Formater la date pour la réponse
    const formattedReservation = {
      id: reservation.id,
      reference: reservation.reference,
      date: reservation.date.toISOString().split("T")[0],
      timeStart: reservation.timeStart,
      timeEnd: reservation.timeEnd,
      partySize: reservation.partySize,
      status: reservation.status,
      occasion: reservation.occasion,
      specialRequests: reservation.specialRequests,
      confirmedAt: reservation.confirmedAt,
      customer: reservation.customer,
      table: reservation.table,
      restaurant: reservation.restaurant,
    };

    return NextResponse.json(formattedReservation);
  } catch (error) {
    console.error("Erreur récupération réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la réservation" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();

    // Valider les données
    const validationResult = modificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { date, time, partySize, occasion, specialRequests } =
      validationResult.data;

    // Récupérer la réservation existante
    const existingReservation = await prisma.reservation.findUnique({
      where: { reference },
      include: {
        customer: true,
        table: true,
        restaurant: true,
      },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la réservation n'est pas annulée
    if (existingReservation.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Impossible de modifier une réservation annulée" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation n'est pas dans le passé
    const existingDate = new Date(existingReservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (existingDate < today) {
      return NextResponse.json(
        { error: "Impossible de modifier une réservation passée" },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    let newTableId = existingReservation.tableId;
    const newDate = date
      ? new Date(date + "T00:00:00")
      : existingReservation.date;
    const newTime = time || existingReservation.timeStart;
    const newPartySize = partySize || existingReservation.partySize;

    // Si date, heure ou nombre de personnes changent, vérifier la disponibilité
    if (date || time || partySize) {
      // Vérifier la disponibilité (en excluant la réservation actuelle)
      const availability = await getAvailability(newDate, newPartySize);
      const requestedSlot = availability.slots.find((s) => s.time === newTime);

      // Vérifier si le créneau est disponible
      // (on doit exclure la réservation actuelle du calcul)
      if (!requestedSlot) {
        return NextResponse.json(
          {
            error: "Ce créneau n'existe pas pour cette date",
            code: "INVALID_SLOT",
          },
          { status: 400 }
        );
      }

      // Trouver une nouvelle table si nécessaire
      if (date || time || partySize) {
        // Temporairement "libérer" la table actuelle pour vérifier la dispo
        const potentialTableId = await findAvailableTable(
          newDate,
          newTime,
          newPartySize
        );

        // Si aucune table et ce n'est pas le même créneau, erreur
        const sameSlot =
          newDate.toISOString().split("T")[0] ===
            existingReservation.date.toISOString().split("T")[0] &&
          newTime === existingReservation.timeStart;

        if (!potentialTableId && !sameSlot) {
          const alternativeSlots = availability.slots
            .filter((s) => s.available)
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

        if (potentialTableId) {
          newTableId = potentialTableId;
        }
      }

      // Mettre à jour les champs
      if (date) {
        updateData.date = newDate;
      }
      if (time) {
        updateData.timeStart = newTime;
        updateData.timeEnd = await calculateEndTime(newTime);
      }
      if (partySize) {
        updateData.partySize = newPartySize;
      }
      if (newTableId !== existingReservation.tableId) {
        updateData.tableId = newTableId;
      }
    }

    // Mettre à jour les champs optionnels
    if (occasion !== undefined) {
      updateData.occasion = occasion;
    }
    if (specialRequests !== undefined) {
      updateData.specialRequests = specialRequests;
    }

    // Vérifier qu'il y a des modifications
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune modification nécessaire",
        reservation: existingReservation,
      });
    }

    // Appliquer les modifications
    const updatedReservation = await prisma.reservation.update({
      where: { reference },
      data: updateData,
      include: {
        customer: true,
        table: true,
        restaurant: true,
      },
    });

    // Préparer les anciennes valeurs pour l'email
    const oldValues = {
      date: existingReservation.date,
      time: existingReservation.timeStart,
      partySize: existingReservation.partySize,
    };

    // Envoyer les emails de notification
    const emailData = {
      reference: updatedReservation.reference,
      customerName: `${updatedReservation.customer.firstName} ${updatedReservation.customer.lastName}`,
      email: updatedReservation.customer.email,
      date: new Date(updatedReservation.date),
      time: updatedReservation.timeStart,
      partySize: updatedReservation.partySize,
      tableName: updatedReservation.table?.name,
      occasion: updatedReservation.occasion,
      specialRequests: updatedReservation.specialRequests,
      oldDate: oldValues.date,
      oldTime: oldValues.time,
      oldPartySize: oldValues.partySize,
    };

    // Envoyer email au client
    await sendModificationEmail(emailData);

    // Envoyer notification au restaurant
    await sendRestaurantModificationNotification(emailData);

    return NextResponse.json({
      success: true,
      message: "Réservation modifiée avec succès",
      reservation: {
        id: updatedReservation.id,
        reference: updatedReservation.reference,
        date: updatedReservation.date.toISOString().split("T")[0],
        timeStart: updatedReservation.timeStart,
        timeEnd: updatedReservation.timeEnd,
        partySize: updatedReservation.partySize,
        status: updatedReservation.status,
        table: updatedReservation.table,
        customer: {
          firstName: updatedReservation.customer.firstName,
          lastName: updatedReservation.customer.lastName,
          email: updatedReservation.customer.email,
        },
      },
    });
  } catch (error) {
    console.error("Erreur modification réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la réservation" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    // Récupérer le body pour la raison (optionnel)
    let reason: string | undefined;
    try {
      const body = await request.json();
      const validationResult = cancellationSchema.safeParse(body);
      if (validationResult.success) {
        reason = validationResult.data.reason;
      }
    } catch {
      // Pas de body, c'est OK
    }

    // Récupérer la réservation
    const reservation = await prisma.reservation.findUnique({
      where: { reference },
      include: {
        customer: true,
        restaurant: true,
        table: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (reservation.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cette réservation est déjà annulée" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation n'est pas dans le passé
    const reservationDate = new Date(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return NextResponse.json(
        { error: "Impossible d'annuler une réservation passée" },
        { status: 400 }
      );
    }

    // Annuler la réservation
    const updatedReservation = await prisma.reservation.update({
      where: { reference },
      data: {
        status: "CANCELLED",
        specialRequests: reason
          ? `${reservation.specialRequests || ""}\n[Annulation] ${reason}`.trim()
          : reservation.specialRequests,
      },
      include: {
        customer: true,
        table: true,
      },
    });

    // Envoyer les emails
    const emailData = {
      reference: updatedReservation.reference,
      customerName: `${updatedReservation.customer.firstName} ${updatedReservation.customer.lastName}`,
      email: updatedReservation.customer.email,
      date: reservationDate,
      time: updatedReservation.timeStart,
      partySize: updatedReservation.partySize,
      reason,
    };

    // Email au client
    await sendCancellationEmail(emailData);

    // Notification au restaurant
    await sendRestaurantCancellationNotification(emailData);

    return NextResponse.json({
      success: true,
      message: "Réservation annulée avec succès",
    });
  } catch (error) {
    console.error("Erreur annulation réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la réservation" },
      { status: 500 }
    );
  }
}
