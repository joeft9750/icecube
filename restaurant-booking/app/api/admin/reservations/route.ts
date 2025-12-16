import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Couleurs selon le statut pour FullCalendar
const STATUS_COLORS: Record<string, { backgroundColor: string; borderColor: string; textColor: string }> = {
  CONFIRMED: {
    backgroundColor: "#22c55e",
    borderColor: "#16a34a",
    textColor: "#ffffff",
  },
  PENDING: {
    backgroundColor: "#eab308",
    borderColor: "#ca8a04",
    textColor: "#000000",
  },
  CANCELLED: {
    backgroundColor: "#ef4444",
    borderColor: "#dc2626",
    textColor: "#ffffff",
  },
  NO_SHOW: {
    backgroundColor: "#6b7280",
    borderColor: "#4b5563",
    textColor: "#ffffff",
  },
  COMPLETED: {
    backgroundColor: "#3b82f6",
    borderColor: "#2563eb",
    textColor: "#ffffff",
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    if (!startStr || !endStr) {
      return NextResponse.json(
        { error: "Les paramètres start et end sont requis" },
        { status: 400 }
      );
    }

    // Parser les dates
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // Récupérer les réservations dans la plage de dates
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            allergies: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            zone: true,
            maxCapacity: true,
          },
        },
        restaurant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { timeStart: "asc" }],
    });

    // Formater pour FullCalendar
    const events = reservations.map((reservation) => {
      const dateStr = reservation.date.toISOString().split("T")[0];
      const colors = STATUS_COLORS[reservation.status] || STATUS_COLORS.PENDING;

      return {
        id: reservation.id,
        title: `${reservation.customer.lastName} - ${reservation.partySize} pers`,
        start: `${dateStr}T${reservation.timeStart}:00`,
        end: `${dateStr}T${reservation.timeEnd}:00`,
        ...colors,
        extendedProps: {
          reference: reservation.reference,
          status: reservation.status,
          partySize: reservation.partySize,
          occasion: reservation.occasion,
          specialRequests: reservation.specialRequests,
          confirmedAt: reservation.confirmedAt,
          customer: {
            firstName: reservation.customer.firstName,
            lastName: reservation.customer.lastName,
            email: reservation.customer.email,
            phone: reservation.customer.phone,
            allergies: reservation.customer.allergies,
          },
          table: reservation.table
            ? {
                id: reservation.table.id,
                name: reservation.table.name,
                zone: reservation.table.zone,
                maxCapacity: reservation.table.maxCapacity,
              }
            : null,
        },
      };
    });

    // Compter les réservations du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.reservation.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          notIn: ["CANCELLED"],
        },
      },
    });

    return NextResponse.json({
      events,
      meta: {
        total: events.length,
        todayCount,
        start: startStr,
        end: endStr,
      },
    });
  } catch (error) {
    console.error("Erreur récupération réservations admin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    );
  }
}
