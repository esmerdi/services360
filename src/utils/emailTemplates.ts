/**
 * Email Service - Welcome & Temp Password
 * Uses Supabase Email API + custom templates
 * 
 * Can be upgraded to SendGrid/Resend later if needed
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailTemplateData {
  to: string;
  userFirstName?: string;
  planName?: string;
  supportEmail?: string;
}

/**
 * Send Pro plan activation confirmation email
 */
export async function sendProActivationEmail(
  supabaseClient: SupabaseClient,
  data: EmailTemplateData
) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a Services 360 PRO!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        .notice { background: #eef4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenido a Services 360 PRO! 🎉</h1>
        </div>
        <div class="content">
          <p>Hola ${data.userFirstName || 'Proveedor'},</p>
          
          <p>Tu suscripción <strong>${data.planName || 'PRO'}</strong> se activó correctamente. Ya tienes acceso a <strong>solicitudes ilimitadas</strong>, <strong>prioridad en el sistema</strong> y <strong>visibilidad mejorada</strong>.</p>
          
          <div class="notice">
            <strong>Tu cuenta y contraseña siguen siendo las mismas.</strong><br>
            Solo se actualizó tu acceso para habilitar los beneficios del plan.
          </div>
          
          <p>
            <a href="https://services360.app/login" class="button">Ingresar a Services 360</a>
          </p>
          
          <h3>¿Qué sigue?</h3>
          <ol>
            <li>Ingresa con tu contraseña habitual</li>
            <li>Revisa tu panel de proveedor y beneficios activos</li>
            <li>Comienza a recibir solicitudes con prioridad</li>
          </ol>
          
          <p>Si tienes preguntas, contáctanos en <strong>${data.supportEmail || 'soporte@services360.app'}</strong></p>
          
          <div class="footer">
            <p>© 2026 Services 360. Todos los derechos reservados.</p>
            <p>Este correo fue enviado porque realizaste un pago en nuestro sistema.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
¡Bienvenido a Services 360 PRO!

Hola ${data.userFirstName || 'Proveedor'},

Tu suscripción ${data.planName || 'PRO'} se activó correctamente. Ya tienes acceso a solicitudes ilimitadas, prioridad en el sistema y visibilidad mejorada.

Tu cuenta y contraseña siguen siendo las mismas. Solo se actualizó tu acceso para habilitar los beneficios del plan.

Ingresa aquí: https://services360.app/login

¿Qué sigue?
1. Ingresa con tu contraseña habitual
2. Revisa tu panel de proveedor y beneficios activos
3. Comienza a recibir solicitudes con prioridad

Si tienes preguntas, contáctanos en ${data.supportEmail || 'soporte@services360.app'}

© 2026 Services 360. Todos los derechos reservados.
  `;

  // NOTE: Supabase email API is limited. Consider these alternatives:
  // - Resend (recommended, free tier)
  // - SendGrid
  // - Amazon SES
  // - Mailgun
  
  // For now, we'll use a Supabase Edge Function or trigger an event
  // that an external service picks up
  
  try {
    // If using Resend or SendGrid, update this accordingly
    // For Supabase Email (limited free tier):
    const { data: result, error } = await supabaseClient.rpc('send_email', {
      p_to: data.to,
      p_subject: 'Tu plan PRO ya está activo en Services 360',
      p_html_body: htmlTemplate,
      p_text_body: textTemplate,
    });

    if (error) {
      console.error('Email send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, result };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send password reset email (when user forgot password)
 */
export async function sendPasswordResetEmail(
  supabaseClient: SupabaseClient,
  email: string,
  resetLink: string
) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Recupera tu contraseña - Services 360</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Recupera tu contraseña</h2>
        </div>
        <div class="content">
          <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
          <p>Este enlace expira en 1 hora.</p>
          <a href="${resetLink}" class="button">Cambiar contraseña</a>
          <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await supabaseClient.rpc('send_email', {
      p_to: email,
      p_subject: 'Recupera tu contraseña - Services 360',
      p_html_body: htmlTemplate,
    });

    if (error) {
      console.error('Email send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
