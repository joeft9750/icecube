import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resend } from "@/lib/resend";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, date, time, guests, notes } = body;

    if (!name || !email || !phone || !date || !time || !guests) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        time,
        guests: parseInt(guests),
        notes: notes || null,
        status: "PENDING",
      },
    });

    // Envoyer email de confirmation
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Le Gourmet <noreply@legourmet.fr>",
          to: email,
          subject: "Confirmation de votre réservation - Le Gourmet",
          html: `
            <h1>Merci pour votre réservation !</h1>
            <p>Bonjour ${name},</p>
            <p>Votre réservation a bien été enregistrée avec les informations suivantes :</p>
            <ul>
              <li><strong>Date :</strong> ${new Date(date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</li>
              <li><strong>Heure :</strong> ${time}</li>
              <li><strong>Nombre de convives :</strong> ${guests}</li>
              ${notes ? `<li><strong>Notes :</strong> ${notes}</li>` : ""}
            </ul>
            <p>Nous avons hâte de vous accueillir !</p>
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID et statut requis" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(reservation);
  } catch (error) {
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
      return NextResponse.json(
        { error: "ID requis" },
        { status: 400 }
      );
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation" },
      { status: 500 }
    );
  }
}
