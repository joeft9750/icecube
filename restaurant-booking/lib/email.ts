import { resend } from "@/lib/resend";

// Configuration
const RESTAURANT_NAME = "Le Gourmet";
const RESTAURANT_EMAIL = process.env.RESTAURANT_EMAIL || "restaurant@legourmet.fr";
const RESTAURANT_ADDRESS = "123 Rue de la Gastronomie, 75001 Paris";
const RESTAURANT_PHONE = "01 23 45 67 89";
const FROM_EMAIL = `${RESTAURANT_NAME} <noreply@legourmet.fr>`;

interface ReservationEmailData {
  reference: string;
  customerName: string;
  email: string;
  date: Date;
  time: string;
  partySize: number;
  tableName?: string | null;
  occasion?: string | null;
  specialRequests?: string | null;
}

// Formater la date en français
function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Styles communs pour les emails
const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1a2e; }
    .info-box p { margin: 8px 0; }
    .info-box strong { color: #1a1a2e; }
    .reference { font-size: 24px; font-weight: bold; color: #1a1a2e; letter-spacing: 2px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
    .footer p { margin: 5px 0; font-size: 14px; color: #666; }
    .button { display: inline-block; background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button:hover { background: #16213e; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
`;

// Template email confirmation client
function getCustomerConfirmationTemplate(data: ReservationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍽️ ${RESTAURANT_NAME}</h1>
        </div>
        <div class="content">
          <h2 style="text-align: center; color: #28a745;">✓ Votre réservation est confirmée !</h2>

          <p>Bonjour ${data.customerName},</p>

          <p>Nous avons le plaisir de vous confirmer votre réservation.</p>

          <div style="text-align: center; margin: 25px 0;">
            <p style="margin: 0; color: #666;">Numéro de référence</p>
            <p class="reference">${data.reference}</p>
          </div>

          <div class="info-box">
            <p><strong>📅 Date :</strong> ${formatDateFr(data.date)}</p>
            <p><strong>🕐 Heure :</strong> ${data.time}</p>
            <p><strong>👥 Nombre de convives :</strong> ${data.partySize} personne${data.partySize > 1 ? "s" : ""}</p>
            ${data.tableName ? `<p><strong>🪑 Table :</strong> ${data.tableName}</p>` : ""}
            ${data.occasion ? `<p><strong>🎉 Occasion :</strong> ${data.occasion}</p>` : ""}
            ${data.specialRequests ? `<p><strong>📝 Demandes spéciales :</strong> ${data.specialRequests}</p>` : ""}
          </div>

          <div class="warning">
            <strong>⚠️ Important :</strong> En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.
          </div>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reservation/confirmation/${data.reference}" class="button">
              Voir ma réservation
            </a>
          </p>

          <p>Nous avons hâte de vous accueillir !</p>

          <p>Cordialement,<br>L'équipe ${RESTAURANT_NAME}</p>
        </div>
        <div class="footer">
          <p><strong>${RESTAURANT_NAME}</strong></p>
          <p>📍 ${RESTAURANT_ADDRESS}</p>
          <p>📞 ${RESTAURANT_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template email notification restaurant
function getRestaurantNotificationTemplate(data: ReservationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
          <h1>🔔 Nouvelle réservation</h1>
        </div>
        <div class="content">
          <h2 style="text-align: center; color: #dc3545;">Référence : ${data.reference}</h2>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #1a1a2e;">📋 Détails de la réservation</h3>
            <p><strong>📅 Date :</strong> ${formatDateFr(data.date)}</p>
            <p><strong>🕐 Heure :</strong> ${data.time}</p>
            <p><strong>👥 Nombre de convives :</strong> ${data.partySize} personne${data.partySize > 1 ? "s" : ""}</p>
            ${data.tableName ? `<p><strong>🪑 Table attribuée :</strong> ${data.tableName}</p>` : "<p><strong>🪑 Table :</strong> Non attribuée (à assigner)</p>"}
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #1a1a2e;">👤 Client</h3>
            <p><strong>Nom :</strong> ${data.customerName}</p>
            <p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            ${data.occasion ? `<p><strong>Occasion :</strong> ${data.occasion}</p>` : ""}
            ${data.specialRequests ? `<p><strong>Demandes spéciales :</strong> ${data.specialRequests}</p>` : ""}
          </div>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/reservations" class="button" style="background: #dc3545;">
              Voir dans l'administration
            </a>
          </p>
        </div>
        <div class="footer">
          <p>Email automatique - Ne pas répondre</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template email annulation
function getCancellationTemplate(data: ReservationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
          <h1>🍽️ ${RESTAURANT_NAME}</h1>
        </div>
        <div class="content">
          <h2 style="text-align: center; color: #dc3545;">❌ Réservation annulée</h2>

          <p>Bonjour ${data.customerName},</p>

          <p>Votre réservation a bien été annulée.</p>

          <div class="info-box" style="border-left-color: #6c757d;">
            <p><strong>Référence :</strong> ${data.reference}</p>
            <p><strong>Date :</strong> ${formatDateFr(data.date)}</p>
            <p><strong>Heure :</strong> ${data.time}</p>
            <p><strong>Nombre de convives :</strong> ${data.partySize}</p>
          </div>

          <p>Nous espérons avoir le plaisir de vous accueillir une prochaine fois.</p>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reservation" class="button">
              Faire une nouvelle réservation
            </a>
          </p>

          <p>Cordialement,<br>L'équipe ${RESTAURANT_NAME}</p>
        </div>
        <div class="footer">
          <p><strong>${RESTAURANT_NAME}</strong></p>
          <p>📍 ${RESTAURANT_ADDRESS}</p>
          <p>📞 ${RESTAURANT_PHONE}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Envoyer email de confirmation au client
export async function sendCustomerConfirmationEmail(
  data: ReservationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY non configuré - email non envoyé");
    return { success: false, error: "Email non configuré" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Confirmation de réservation ${data.reference} - ${RESTAURANT_NAME}`,
      html: getCustomerConfirmationTemplate(data),
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email client:", error);
    return { success: false, error: String(error) };
  }
}

// Envoyer notification au restaurant
export async function sendRestaurantNotificationEmail(
  data: ReservationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY non configuré - notification non envoyée");
    return { success: false, error: "Email non configuré" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: RESTAURANT_EMAIL,
      subject: `🔔 Nouvelle réservation ${data.reference} - ${data.customerName}`,
      html: getRestaurantNotificationTemplate(data),
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi notification restaurant:", error);
    return { success: false, error: String(error) };
  }
}

// Envoyer email d'annulation
export async function sendCancellationEmail(
  data: ReservationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY non configuré - email non envoyé");
    return { success: false, error: "Email non configuré" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Annulation de réservation ${data.reference} - ${RESTAURANT_NAME}`,
      html: getCancellationTemplate(data),
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email annulation:", error);
    return { success: false, error: String(error) };
  }
}
