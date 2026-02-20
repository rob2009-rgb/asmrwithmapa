
import { useState } from 'react';
import { EmailService, EmailOptions } from '../services/EmailService';

export const useEmail = () => {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendEmail = async (options: EmailOptions) => {
        setSending(true);
        setError(null);
        try {
            const success = await EmailService.sendEmail(options);
            if (!success) throw new Error('Failed to send email');
            return true;
        } catch (err: any) {
            setError(err.message);
            console.error('Email Error:', err);
            return false;
        } finally {
            setSending(false);
        }
    };

    const notifyTicketCreated = async (email: string, name: string, ticketId: string, subject: string) => {
        setSending(true);
        try {
            await EmailService.sendTicketCreated(email, name, ticketId, subject);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            setSending(false);
        }
    };

    const notifyTicketReply = async (email: string, name: string, ticketId: string, subject: string, message: string) => {
        setSending(true);
        try {
            await EmailService.sendTicketReply(email, name, ticketId, subject, message);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            setSending(false);
        }
    };

    const notifyTicketClosed = async (email: string, name: string, ticketId: string, subject: string) => {
        setSending(true);
        try {
            await EmailService.sendTicketClosed(email, name, ticketId, subject);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            setSending(false);
        }
    };

    return {
        sendEmail,
        notifyTicketCreated,
        notifyTicketReply,
        notifyTicketClosed,
        sending,
        error
    };
};
