import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Configuration du restaurant
const RESTAURANT_NAME = "Le Gourmet";
const RESTAURANT_ADDRESS = "123 Rue de la Gastronomie, 75001 Paris";

// Formater une date pour le format iCalendar (YYYYMMDDTHHMMSS)
function formatDateTimeICS(dateStr: string, time: string): string {
  const date = dateStr.replace(/-/g, "");
  const timeFormatted = time.replace(":", "") + "00";
  return `${date}T${timeFormatted}`;
}

// Échapper les caractères spéciaux pour iCalendar
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Générer un UID unique pour l'événement
function generateUID(reference: string): string {
  return `${reference}@legourmet.fr`;
}

export async function GET(
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
        table: true,
        restaurant: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Préparer les données
    const dateStr = reservation.date.toISOString().split("T")[0];
    const dtStart = formatDateTimeICS(dateStr, reservation.timeStart);
    const dtEnd = formatDateTimeICS(dateStr, reservation.timeEnd);
    const uid = generateUID(reference);
    const now = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    // Description de l'événement
    const descriptionParts = [
      `Réservation pour ${reservation.partySize} personne${reservation.partySize > 1 ? "s" : ""}`,
      `Référence: ${reference}`,
      `Nom: ${reservation.customer.firstName} ${reservation.customer.lastName}`,
    ];

    if (reservation.table) {
      descriptionParts.push(`Table: ${reservation.table.name}`);
    }

    if (reservation.occasion) {
      descriptionParts.push(`Occasion: ${reservation.occasion}`);
    }

    if (reservation.specialRequests) {
      descriptionParts.push(`Demandes spéciales: ${reservation.specialRequests}`);
    }

    const description = escapeICS(descriptionParts.join("\n"));
    const summary = escapeICS(
      `Réservation ${RESTAURANT_NAME} - ${reference}`
    );
    const location = escapeICS(RESTAURANT_ADDRESS);

    // Générer le fichier iCalendar
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Le Gourmet//Reservation System//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Rappel: Votre réservation au restaurant Le Gourmet",
      "TRIGGER:-PT2H",
      "END:VALARM",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Rappel: Votre réservation au restaurant Le Gourmet dans 24h",
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    // Retourner le fichier .ics
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservation-${reference}.ics"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération fichier iCal:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du fichier calendrier" },
      { status: 500 }
    );
  }
}
