import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface OpeningHours {
  [key: string]: {
    lunch?: { start: string; end: string };
    dinner?: { start: string; end: string };
  } | null;
}

interface BookingConfig {
  slotDuration: number;
  mealDuration: number;
  bufferTime: number;
  maxPartySize: number;
}

// Générer les créneaux horaires pour une période donnée
function generateTimeSlots(
  start: string,
  end: string,
  slotDuration: number
): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes < endMinutes - slotDuration) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    );
    currentMinutes += slotDuration;
  }

  return slots;
}

// Obtenir le nom du jour en anglais
function getDayName(date: Date): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const partySizeStr = searchParams.get("partySize");

    if (!dateStr) {
      return NextResponse.json({ error: "Date requise" }, { status: 400 });
    }

    const date = new Date(dateStr);
    const partySize = partySizeStr ? parseInt(partySizeStr) : 2;
    const dayName = getDayName(date);

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant non configuré" },
        { status: 500 }
      );
    }

    const openingHours = restaurant.openingHours as OpeningHours;
    const bookingConfig = restaurant.bookingConfig as BookingConfig;
    const dayHours = openingHours[dayName];

    // Restaurant fermé ce jour
    if (!dayHours) {
      return NextResponse.json({
        available: false,
        reason: "Le restaurant est fermé ce jour",
        date: dateStr,
        slots: [],
      });
    }

    // Vérifier si la date est bloquée
    const blockedSlot = await prisma.blockedSlot.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableId: null,
        date: date,
      },
    });

    if (blockedSlot) {
      return NextResponse.json({
        available: false,
        reason: blockedSlot.reason || "Restaurant fermé exceptionnellement",
        date: dateStr,
        slots: [],
      });
    }

    // Générer tous les créneaux possibles
    const allSlots: string[] = [];
    if (dayHours.lunch) {
      allSlots.push(
        ...generateTimeSlots(
          dayHours.lunch.start,
          dayHours.lunch.end,
          bookingConfig.slotDuration
        )
      );
    }
    if (dayHours.dinner) {
      allSlots.push(
        ...generateTimeSlots(
          dayHours.dinner.start,
          dayHours.dinner.end,
          bookingConfig.slotDuration
        )
      );
    }

    // Récupérer les tables disponibles pour cette taille de groupe
    const availableTables = await prisma.table.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
        maxCapacity: { gte: partySize },
      },
      include: {
        reservations: {
          where: {
            date: date,
            status: { notIn: ["CANCELLED"] },
          },
        },
        blockedSlots: {
          where: {
            date: date,
          },
        },
      },
    });

    // Calculer la disponibilité pour chaque créneau
    const mealDuration = bookingConfig.mealDuration;
    const bufferTime = bookingConfig.bufferTime;

    const slots = allSlots.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const slotStart = hours * 60 + minutes;
      const slotEnd = slotStart + mealDuration + bufferTime;

      // Compter les tables disponibles pour ce créneau
      let tablesAvailable = 0;

      for (const table of availableTables) {
        // Vérifier si la table est bloquée
        const isBlocked = table.blockedSlots.some((blocked) => {
          const [bStartH, bStartM] = blocked.timeStart.split(":").map(Number);
          const [bEndH, bEndM] = blocked.timeEnd.split(":").map(Number);
          const blockStart = bStartH * 60 + bStartM;
          const blockEnd = bEndH * 60 + bEndM;
          return slotStart < blockEnd && slotEnd > blockStart;
        });

        if (isBlocked) continue;

        // Vérifier les réservations existantes
        const hasConflict = table.reservations.some((res) => {
          const [rStartH, rStartM] = res.timeStart.split(":").map(Number);
          const [rEndH, rEndM] = res.timeEnd.split(":").map(Number);
          const resStart = rStartH * 60 + rStartM;
          const resEnd = rEndH * 60 + rEndM + bufferTime;
          return slotStart < resEnd && slotEnd > resStart;
        });

        if (!hasConflict) {
          tablesAvailable++;
        }
      }

      return {
        time,
        available: tablesAvailable > 0,
        tablesAvailable,
      };
    });

    return NextResponse.json({
      available: true,
      date: dateStr,
      partySize,
      restaurant: {
        name: restaurant.name,
        maxPartySize: bookingConfig.maxPartySize,
      },
      openingHours: dayHours,
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
