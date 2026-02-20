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
        const { data: { user } } = await supabase.auth.getUser();

        const stackTrace = error?.stack || (typeof error === 'object' ? JSON.stringify(error) : String(error));

        const { error: dbError } = await supabase.from('error_logs').insert([{
            user_id: user?.id || null,
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
