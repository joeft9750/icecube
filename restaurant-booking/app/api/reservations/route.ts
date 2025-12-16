import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { findAvailableTable, calculateEndTime } from "@/lib/availability";

// Générer une référence unique au format R2024-000001
async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const lastReservation = await prisma.reservation.findFirst({
    where: {
      reference: {
        startsWith: `R${year}-`,
      },
    },
    orderBy: {
      reference: "desc",
    },
  });

  let nextNumber = 1;
  if (lastReservation) {
    const lastNumber = parseInt(lastReservation.reference.split("-")[1]);
    nextNumber = lastNumber + 1;
  }

  return `R${year}-${nextNumber.toString().padStart(6, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (dateStr) {
      where.date = new Date(dateStr + "T00:00:00");
    }

    if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: true,
        table: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { timeStart: "asc" }],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Erreur récupération réservations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      date,
      time,
      partySize,
      occasion,
      specialRequests,
      allergies,
    } = body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !date || !time || !partySize) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Récupérer le restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant non configuré" },
        { status: 500 }
      );
    }

    // Trouver ou créer le client
    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { email },
        data: {
          phone: phone || customer.phone,
          firstName,
          lastName,
          allergies: allergies || customer.allergies,
          visitCount: { increment: 1 },
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          allergies,
          visitCount: 1,
        },
      });
    }

    // Générer la référence et calculer l'heure de fin
    const reference = await generateReference();
    const reservationDate = new Date(date + "T00:00:00");
    const timeEnd = await calculateEndTime(time);

    // Trouver une table disponible via la lib availability
    const tableId = await findAvailableTable(
      reservationDate,
      time,
      parseInt(partySize)
    );

    // Créer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        reference,
        restaurantId: restaurant.id,
        tableId,
        customerId: customer.id,
        date: reservationDate,
        timeStart: time,
        timeEnd,
        partySize: parseInt(partySize),
        status: "PENDING",
        occasion: occasion || null,
        specialRequests: specialRequests || null,
      },
      include: {
        customer: true,
        table: true,
      },
    });

    // Envoyer email de confirmation
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Le Gourmet <noreply@legourmet.fr>",
          to: email,
          subject: `Confirmation de réservation ${reference} - Le Gourmet`,
          html: `
            <h1>Merci pour votre réservation !</h1>
            <p>Bonjour ${firstName},</p>
            <p>Votre réservation <strong>${reference}</strong> a bien été enregistrée.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Date :</strong> ${reservationDate.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p><strong>Heure :</strong> ${time}</p>
              <p><strong>Nombre de convives :</strong> ${partySize}</p>
              ${occasion ? `<p><strong>Occasion :</strong> ${occasion}</p>` : ""}
              ${reservation.table ? `<p><strong>Table :</strong> ${reservation.table.name}</p>` : ""}
            </div>
            <p>Nous vous confirmerons votre réservation par email sous peu.</p>
            <p>À très bientôt !</p>
            <p>L'équipe Le Gourmet</p>
          `,
        });
      } catch (emailError) {
        console.error("Erreur envoi email:", emailError);
      }
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Erreur création réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la réservation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, tableId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "CONFIRMED") {
        updateData.confirmedAt = new Date();
      }
    }

    if (tableId !== undefined) {
      updateData.tableId = tableId;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        table: true,
      },
    });

    // Envoyer email de confirmation si le statut passe à CONFIRMED
    if (status === "CONFIRMED" && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Le Gourmet <noreply@legourmet.fr>",
          to: reservation.customer.email,
          subject: `Réservation ${reservation.reference} confirmée - Le Gourmet`,
          html: `
            <h1>Votre réservation est confirmée !</h1>
            <p>Bonjour ${reservation.customer.firstName},</p>
            <p>Nous avons le plaisir de vous confirmer votre réservation.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Référence :</strong> ${reservation.reference}</p>
              <p><strong>Date :</strong> ${reservation.date.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p><strong>Heure :</strong> ${reservation.timeStart}</p>
              <p><strong>Nombre de convives :</strong> ${reservation.partySize}</p>
              ${reservation.table ? `<p><strong>Table :</strong> ${reservation.table.name}</p>` : ""}
            </div>
            <p>Nous avons hâte de vous accueillir !</p>
            <p>L'équipe Le Gourmet</p>
          `,
        });
      } catch (emailError) {
        console.error("Erreur envoi email:", emailError);
      }
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Erreur mise à jour réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la réservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression réservation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation" },
      { status: 500 }
    );
  }
}
