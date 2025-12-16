import { NextRequest, NextResponse } from "next/server";
import { getLockById, releaseLock } from "@/lib/slotLock";

// GET - Récupérer les informations d'un verrou
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lockId: string }> }
) {
  try {
    const { lockId } = await params;

    const lock = getLockById(lockId);

    if (!lock) {
      return NextResponse.json(
        { success: false, error: "Verrou introuvable ou expiré" },
        { status: 404 }
      );
    }

    const now = new Date();
    const remainingMs = lock.expiresAt.getTime() - now.getTime();

    return NextResponse.json({
      success: true,
      lock: {
        lockId: lock.lockId,
        date: lock.date,
        time: lock.time,
        partySize: lock.partySize,
        tableId: lock.tableId,
        expiresAt: lock.expiresAt.toISOString(),
        remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du verrou:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Libérer un verrou
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lockId: string }> }
) {
  try {
    const { lockId } = await params;

    // Optionnel: vérifier le sessionId pour sécurité
    const sessionId = request.headers.get("x-session-id");

    const lock = getLockById(lockId);

    if (!lock) {
      // Verrou déjà expiré ou inexistant, considéré comme succès
      return NextResponse.json({
        success: true,
        message: "Verrou déjà libéré ou expiré",
      });
    }

    // Vérifier que c'est bien la même session (optionnel mais recommandé)
    if (sessionId && lock.sessionId !== sessionId) {
      return NextResponse.json(
        { success: false, error: "Ce verrou ne vous appartient pas" },
        { status: 403 }
      );
    }

    const released = releaseLock(lockId);

    return NextResponse.json({
      success: released,
      message: released ? "Verrou libéré avec succès" : "Verrou introuvable",
    });
  } catch (error) {
    console.error("Erreur lors de la libération du verrou:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
