
import { supabase } from '../supabaseClient';

export interface EmailOptions {
    to: string;
    subject: string;
    body: string; // HTML supported
    templateName?: string;
    variables?: Record<string, string>;
}

/**
 * Service to handle transactional emails via Resend.
 * Calls the `send-email` Supabase Edge Function, which reads the
 * Resend API key from system_settings (Admin → Settings → Resend API Key).
 */
export const EmailService = {
    sendEmail: async (options: EmailOptions): Promise<boolean> => {
        try {
            const { error, data } = await supabase.functions.invoke('send-email', {
                body: {
                    to: options.to,
                    subject: options.subject,
                    body: options.body,
                },
            });

            if (error) {
                console.error('EmailService error:', error);
                return false;
            }

            console.log('✅ Email sent:', data?.id ?? 'ok');
            return true;
        } catch (err) {
            console.error('EmailService exception:', err);
            return false;
        }
    },

    /** Send "Ticket Created" confirmation */
    sendTicketCreated: async (email: string, userName: string, ticketId: string, subject: string) => {
        return EmailService.sendEmail({
            to: email,
            subject: `Ticket #${ticketId.slice(0, 8)}: We received your request`,
            body: `
                <h1>Hi ${userName},</h1>
                <p>We have received your support request: <strong>${subject}</strong>.</p>
                <p>A member of our team will review it shortly.</p>
                <p>You can view your ticket status in the <a href="/support">Support Center</a>.</p>
            `,
        });
    },

    /** Send "New Reply" notification */
    sendTicketReply: async (email: string, userName: string, ticketId: string, subject: string, replyMessage: string) => {
        return EmailService.sendEmail({
            to: email,
            subject: `Update on Ticket #${ticketId.slice(0, 8)}`,
            body: `
                <h1>New Reply</h1>
                <p>Hi ${userName},</p>
                <p>Our support team has replied to your ticket: <strong>${subject}</strong>.</p>
                <blockquote>${replyMessage}</blockquote>
                <p>Please visit the <a href="/support">Support Center</a> to respond.</p>
            `,
        });
    },

    /** Send "Ticket Closed" notification */
    sendTicketClosed: async (email: string, userName: string, ticketId: string, subject: string) => {
        return EmailService.sendEmail({
            to: email,
            subject: `Ticket #${ticketId.slice(0, 8)} has been closed`,
            body: `
                <h1>Ticket Closed</h1>
                <p>Hi ${userName},</p>
                <p>Your support ticket <strong>${subject}</strong> has been marked as resolved.</p>
                <p>If you have further questions, please open a new ticket.</p>
                <p>Thank you for being part of our community.</p>
            `,
        });
    }
};
