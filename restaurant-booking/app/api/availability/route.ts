import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const partySizeStr = searchParams.get("partySize");

    // Validation des paramètres
    if (!dateStr) {
      return NextResponse.json(
        { error: "Le paramètre 'date' est requis (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Valider le format de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json(
        { error: "Format de date invalide. Utilisez YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr + "T00:00:00");
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Date invalide" },
        { status: 400 }
      );
    }

    const partySize = partySizeStr ? parseInt(partySizeStr, 10) : 2;
    if (isNaN(partySize) || partySize < 1 || partySize > 20) {
      return NextResponse.json(
        { error: "Nombre de personnes invalide (1-20)" },
        { status: 400 }
      );
    }

    // Obtenir les disponibilités
    const availability = await getAvailability(date, partySize);

    // Format de réponse simplifié selon la spec
    if (!availability.isOpen) {
      return NextResponse.json({
        date: availability.date,
        partySize: availability.partySize,
        available: false,
        reason: availability.closedReason,
        slots: [],
      });
    }

    // Formater les créneaux (sans tablesAvailable pour simplifier)
    const slots = availability.slots.map((slot) => ({
      time: slot.time,
      available: slot.available,
    }));

    return NextResponse.json({
      date: availability.date,
      partySize: availability.partySize,
      slots,
    });
  } catch (error) {
    console.error("Erreur disponibilité:", error);

    if (error instanceof Error && error.message === "Restaurant non configuré") {
      return NextResponse.json(
        { error: "Restaurant non configuré. Veuillez exécuter le seed." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la vérification de la disponibilité" },
      { status: 500 }
    );
  }
}
