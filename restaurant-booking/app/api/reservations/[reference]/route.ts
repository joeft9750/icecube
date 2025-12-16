import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
