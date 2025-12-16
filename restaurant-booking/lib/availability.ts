import prisma from "@/lib/prisma";

// Types
export interface OpeningHours {
  [day: string]: {
    lunch?: { start: string; end: string };
    dinner?: { start: string; end: string };
  } | null;
}

export interface BookingConfig {
  slotDuration: number; // minutes
  mealDuration: number; // minutes
  bufferTime: number; // minutes
  maxPartySize: number;
  minAdvanceBooking: number; // hours
  maxAdvanceBooking: number; // days
}

export interface TimeSlot {
  time: string;
  available: boolean;
  tablesAvailable?: number;
}

export interface AvailabilityResult {
  date: string;
  partySize: number;
  dayName: string;
  isOpen: boolean;
  closedReason?: string;
  openingHours?: {
    lunch?: { start: string; end: string };
    dinner?: { start: string; end: string };
  };
  slots: TimeSlot[];
}

// Utilitaires de temps
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function getDayName(date: Date): string {
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

// Générer les créneaux horaires pour une période
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // On s'arrête avant la fin pour laisser le temps du repas
  let currentMinutes = startMinutes;
  while (currentMinutes < endMinutes - slotDuration) {
    slots.push(minutesToTime(currentMinutes));
    currentMinutes += slotDuration;
  }

  return slots;
}

// Générer tous les créneaux pour une journée selon les horaires d'ouverture
export function generateDaySlots(
  openingHours: OpeningHours[string],
  slotDuration: number
): string[] {
  if (!openingHours) return [];

  const allSlots: string[] = [];

  if (openingHours.lunch) {
    allSlots.push(
      ...generateTimeSlots(
        openingHours.lunch.start,
        openingHours.lunch.end,
        slotDuration
      )
    );
  }

  if (openingHours.dinner) {
    allSlots.push(
      ...generateTimeSlots(
        openingHours.dinner.start,
        openingHours.dinner.end,
        slotDuration
      )
    );
  }

  return allSlots;
}

// Vérifier si deux périodes de temps se chevauchent
export function periodsOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

// Vérifier si une table est disponible pour un créneau donné
export function isTableAvailableForSlot(
  slotStartMinutes: number,
  mealDuration: number,
  bufferTime: number,
  reservations: Array<{ timeStart: string; timeEnd: string }>,
  blockedSlots: Array<{ timeStart: string; timeEnd: string }>
): boolean {
  const slotEndMinutes = slotStartMinutes + mealDuration;

  // Vérifier les créneaux bloqués
  for (const blocked of blockedSlots) {
    const blockStart = timeToMinutes(blocked.timeStart);
    const blockEnd = timeToMinutes(blocked.timeEnd);
    if (periodsOverlap(slotStartMinutes, slotEndMinutes, blockStart, blockEnd)) {
      return false;
    }
  }

  // Vérifier les réservations existantes
  for (const reservation of reservations) {
    const resStart = timeToMinutes(reservation.timeStart);
    const resEnd = timeToMinutes(reservation.timeEnd) + bufferTime;
    if (periodsOverlap(slotStartMinutes, slotEndMinutes, resStart, resEnd)) {
      return false;
    }
  }

  return true;
}

// Fonction principale pour obtenir les disponibilités
export async function getAvailability(
  date: Date,
  partySize: number
): Promise<AvailabilityResult> {
  const dateStr = date.toISOString().split("T")[0];
  const dayName = getDayName(date);

  // Récupérer le restaurant et sa config
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error("Restaurant non configuré");
  }

  const openingHours = restaurant.openingHours as OpeningHours;
  const bookingConfig = restaurant.bookingConfig as BookingConfig;
  const dayHours = openingHours[dayName];

  // Vérifier si le restaurant est ouvert ce jour
  if (!dayHours) {
    return {
      date: dateStr,
      partySize,
      dayName,
      isOpen: false,
      closedReason: "Le restaurant est fermé ce jour",
      slots: [],
    };
  }

  // Vérifier s'il y a un blocage global pour cette date
  const globalBlock = await prisma.blockedSlot.findFirst({
    where: {
      restaurantId: restaurant.id,
      tableId: null, // Blocage restaurant entier
      date: date,
    },
  });

  if (globalBlock) {
    return {
      date: dateStr,
      partySize,
      dayName,
      isOpen: false,
      closedReason: globalBlock.reason || "Fermé exceptionnellement",
      slots: [],
    };
  }

  // Récupérer les tables adaptées à la taille du groupe
  const suitableTables = await prisma.table.findMany({
    where: {
      restaurantId: restaurant.id,
      isActive: true,
      minCapacity: { lte: partySize },
      maxCapacity: { gte: partySize },
    },
  });

  if (suitableTables.length === 0) {
    return {
      date: dateStr,
      partySize,
      dayName,
      isOpen: true,
      openingHours: dayHours,
      closedReason: `Aucune table disponible pour ${partySize} personnes`,
      slots: [],
    };
  }

  // Récupérer les réservations pour cette date (non annulées)
  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      date: date,
      status: { notIn: ["CANCELLED"] },
      tableId: { in: suitableTables.map((t) => t.id) },
    },
    select: {
      tableId: true,
      timeStart: true,
      timeEnd: true,
    },
  });

  // Récupérer les créneaux bloqués pour les tables concernées
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      restaurantId: restaurant.id,
      date: date,
      OR: [
        { tableId: { in: suitableTables.map((t) => t.id) } },
        { tableId: null }, // Blocages globaux
      ],
    },
    select: {
      tableId: true,
      timeStart: true,
      timeEnd: true,
    },
  });

  // Générer tous les créneaux de la journée
  const allTimeSlots = generateDaySlots(dayHours, bookingConfig.slotDuration);

  // Vérifier la disponibilité pour chaque créneau
  const slots: TimeSlot[] = allTimeSlots.map((time) => {
    const slotStartMinutes = timeToMinutes(time);
    let tablesAvailable = 0;

    for (const table of suitableTables) {
      // Réservations de cette table
      const tableReservations = reservations
        .filter((r) => r.tableId === table.id)
        .map((r) => ({ timeStart: r.timeStart, timeEnd: r.timeEnd }));

      // Blocages de cette table + blocages globaux
      const tableBlockedSlots = blockedSlots
        .filter((b) => b.tableId === table.id || b.tableId === null)
        .map((b) => ({ timeStart: b.timeStart, timeEnd: b.timeEnd }));

      const isAvailable = isTableAvailableForSlot(
        slotStartMinutes,
        bookingConfig.mealDuration,
        bookingConfig.bufferTime,
        tableReservations,
        tableBlockedSlots
      );

      if (isAvailable) {
        tablesAvailable++;
      }
    }

    return {
      time,
      available: tablesAvailable > 0,
      tablesAvailable,
    };
  });

  return {
    date: dateStr,
    partySize,
    dayName,
    isOpen: true,
    openingHours: dayHours,
    slots,
  };
}

// Trouver une table disponible pour un créneau spécifique
export async function findAvailableTable(
  date: Date,
  time: string,
  partySize: number
): Promise<string | null> {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) return null;

  const bookingConfig = restaurant.bookingConfig as BookingConfig;
  const slotStartMinutes = timeToMinutes(time);

  // Tables adaptées
  const suitableTables = await prisma.table.findMany({
    where: {
      restaurantId: restaurant.id,
      isActive: true,
      minCapacity: { lte: partySize },
      maxCapacity: { gte: partySize },
    },
    orderBy: { maxCapacity: "asc" }, // Préférer les petites tables
  });

  for (const table of suitableTables) {
    // Réservations de cette table
    const reservations = await prisma.reservation.findMany({
      where: {
        tableId: table.id,
        date: date,
        status: { notIn: ["CANCELLED"] },
      },
      select: { timeStart: true, timeEnd: true },
    });

    // Blocages de cette table
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        date: date,
        OR: [{ tableId: table.id }, { tableId: null }],
      },
      select: { timeStart: true, timeEnd: true },
    });

    const isAvailable = isTableAvailableForSlot(
      slotStartMinutes,
      bookingConfig.mealDuration,
      bookingConfig.bufferTime,
      reservations,
      blockedSlots
    );

    if (isAvailable) {
      return table.id;
    }
  }

  return null;
}

// Calculer l'heure de fin d'une réservation
export async function calculateEndTime(startTime: string): Promise<string> {
  const restaurant = await prisma.restaurant.findFirst();
  const bookingConfig = restaurant?.bookingConfig as BookingConfig | undefined;
  const mealDuration = bookingConfig?.mealDuration || 90;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + mealDuration;

  return minutesToTime(endMinutes);
}
