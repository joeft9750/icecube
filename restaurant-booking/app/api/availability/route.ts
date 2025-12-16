import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_TIME_SLOTS = [
  { time: "12:00", maxGuests: 20 },
  { time: "12:30", maxGuests: 20 },
  { time: "13:00", maxGuests: 20 },
  { time: "13:30", maxGuests: 20 },
  { time: "14:00", maxGuests: 20 },
  { time: "19:00", maxGuests: 30 },
  { time: "19:30", maxGuests: 30 },
  { time: "20:00", maxGuests: 30 },
  { time: "20:30", maxGuests: 30 },
  { time: "21:00", maxGuests: 30 },
  { time: "21:30", maxGuests: 20 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date requise" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Vérifier si la date est fermée
    const closedDate = await prisma.closedDate.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (closedDate) {
      return NextResponse.json({
        available: false,
        reason: closedDate.reason || "Restaurant fermé",
        slots: [],
      });
    }

    // Récupérer les réservations pour cette date
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: "CANCELLED",
        },
      },
    });

    // Calculer la disponibilité pour chaque créneau
    const timeSlots = await prisma.timeSlot.findMany({
      where: { isActive: true },
    });

    const slots = (timeSlots.length > 0 ? timeSlots : DEFAULT_TIME_SLOTS).map((slot) => {
      const slotReservations = reservations.filter((r) => r.time === slot.time);
      const totalGuests = slotReservations.reduce((sum, r) => sum + r.guests, 0);
      const remainingCapacity = slot.maxGuests - totalGuests;

      return {
        time: slot.time,
        maxGuests: slot.maxGuests,
        currentGuests: totalGuests,
        remainingCapacity: Math.max(0, remainingCapacity),
        available: remainingCapacity > 0,
      };
    });

    return NextResponse.json({
      available: true,
      date: dateStr,
      slots,
    });
  } catch (error) {
    console.error("Erreur disponibilité:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification de la disponibilité" },
      { status: 500 }
    );
  }
}
