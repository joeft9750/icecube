import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCancellationEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    // Récupérer la réservation
    const reservation = await prisma.reservation.findUnique({
      where: { reference },
      include: {
        customer: true,
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
      },
      include: {
        customer: true,
      },
    });

    // Envoyer email d'annulation
    const emailData = {
      reference: updatedReservation.reference,
      customerName: `${updatedReservation.customer.firstName} ${updatedReservation.customer.lastName}`,
      email: updatedReservation.customer.email,
      date: reservationDate,
      time: updatedReservation.timeStart,
      partySize: updatedReservation.partySize,
    };

    const emailResult = await sendCancellationEmail(emailData);

    return NextResponse.json({
      success: true,
      message: "Réservation annulée avec succès",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Erreur annulation réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la réservation" },
      { status: 500 }
    );
  }
}
