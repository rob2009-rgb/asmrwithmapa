
import { supabase } from '../supabaseClient';

export interface EmailOptions {
    to: string;
    subject: string;
    body: string; // HTML supported
    templateName?: string;
    variables?: Record<string, string>;
}

/**
 * Service to handle transactional emails.
 * Currently simulates sending by logging to console.
 * Future integration: Replace console.log with Resend/SendGrid API call.
 */
export const EmailService = {
    /**
     * Send a generic email
     */
    sendEmail: async (options: EmailOptions): Promise<boolean> => {
        console.group('📧 Sending Email (Simulation)');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.body);
        if (options.templateName) {
            console.log('Template:', options.templateName);
            console.log('Variables:', options.variables);
        }
        console.groupEnd();

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // TODO: Integrate with real provider (e.g., Supabase Edge Function -> Resend)
        // const { error } = await supabase.functions.invoke('send-email', { body: options });
        // if (error) return false;

        return true;
    },

    /**
     * Send "Ticket Created" confirmation
     */
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
            templateName: 'Ticket Received',
            variables: { name: userName, ticket_id: ticketId, subject }
        });
    },

    /**
     * Send "New Reply" notification
     */
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
            templateName: 'New Support Reply',
            variables: { name: userName, ticket_id: ticketId, subject, latest_reply: replyMessage }
        });
    },

    /**
     * Send "Ticket Closed" notification
     */
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
            templateName: 'Ticket Closed',
            variables: { name: userName, ticket_id: ticketId, subject }
        });
    }
};
