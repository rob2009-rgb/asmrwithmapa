import { supabase } from '../supabaseClient';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface LogErrorParams {
    message: string;
    error?: any;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
}

export const logError = async ({ message, error, severity = 'error', context = {} }: LogErrorParams) => {
    try {
        // Use getSession for immediate check, then attempt getUser if possible
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        const stackTrace = error?.stack || (typeof error === 'object' ? JSON.stringify(error) : String(error));

        const { error: dbError } = await supabase.from('error_logs').insert([{
            user_id: userId,
            error_message: message,
            stack_trace: stackTrace,
            severity,
            context,
            resolved: false
        }]);

        if (dbError) {
            console.error('Failed to log error to database:', dbError);
        }
    } catch (e) {
        console.error('Failed to log error (internal):', e);
    }
};
