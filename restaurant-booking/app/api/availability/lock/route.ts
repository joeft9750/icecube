import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createLock,
  isTableLocked,
  getLocksForSlot,
  LOCK_DURATION_SECONDS,
} from "@/lib/slotLock";
import { findAvailableTable, getAvailability } from "@/lib/availability";

// Schéma de validation
const lockRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  partySize: z.number().int().min(1).max(20),
  sessionId: z.string().min(1, "sessionId requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validationResult = lockRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { date, time, partySize, sessionId } = validationResult.data;
    const reservationDate = new Date(date + "T00:00:00");

    // Vérifier la disponibilité générale du créneau
    const availability = await getAvailability(reservationDate, partySize);
    const requestedSlot = availability.slots.find((s) => s.time === time);

    if (!requestedSlot || !requestedSlot.available) {
      // Créneau non disponible, retourner des alternatives
      const alternatives = availability.slots
        .filter((s) => s.available)
        .slice(0, 5)
        .map((s) => s.time);

      return NextResponse.json(
        {
          success: false,
          error: "Ce créneau n'est pas disponible",
          code: "SLOT_UNAVAILABLE",
          alternatives,
        },
        { status: 409 }
      );
    }

    // Trouver une table disponible
    const tableId = await findAvailableTable(reservationDate, time, partySize);

    if (!tableId) {
      const alternatives = availability.slots
        .filter((s) => s.available && s.time !== time)
        .slice(0, 5)
        .map((s) => s.time);

      return NextResponse.json(
        {
          success: false,
          error: "Aucune table disponible pour ce créneau",
          code: "NO_TABLE_AVAILABLE",
          alternatives,
        },
        { status: 409 }
      );
    }

    // Vérifier si la table est déjà verrouillée par un autre utilisateur
    if (isTableLocked(date, time, tableId, sessionId)) {
      // Chercher une autre table disponible qui n'est pas verrouillée
      const lockedTableIds = getLocksForSlot(date, time, sessionId).map(
        (l) => l.tableId
      );

      // On devrait chercher une autre table, mais pour simplifier on retourne les alternatives
      const alternatives = availability.slots
        .filter((s) => s.available && s.time !== time)
        .slice(0, 5)
        .map((s) => s.time);

      return NextResponse.json(
        {
          success: false,
          error: "Ce créneau est en cours de réservation par un autre utilisateur",
          code: "SLOT_LOCKED",
          alternatives,
          retryAfter: 30, // Suggérer de réessayer dans 30 secondes
        },
        { status: 409 }
      );
    }

    // Créer le verrou
    try {
      const lock = createLock(sessionId, date, time, partySize, tableId);

      return NextResponse.json({
        success: true,
        lockId: lock.lockId,
        tableId: lock.tableId,
        expiresAt: lock.expiresAt.toISOString(),
        expiresInSeconds: LOCK_DURATION_SECONDS,
        message: `Créneau réservé temporairement pour ${LOCK_DURATION_SECONDS / 60} minutes`,
      });
    } catch (error) {
      // Erreur lors de la création du verrou (probablement déjà verrouillé)
      const alternatives = availability.slots
        .filter((s) => s.available && s.time !== time)
        .slice(0, 5)
        .map((s) => s.time);

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Erreur lors du verrouillage",
          code: "LOCK_FAILED",
          alternatives,
        },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Erreur lors du verrouillage:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
