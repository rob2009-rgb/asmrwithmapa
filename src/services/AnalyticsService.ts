import { supabase } from '../supabaseClient';

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export type EventType = 'view' | 'click' | 'error' | 'heartbeat' | 'conversion' | 'performance' | 'consent';

interface AnalyticsEventPayload {
    event_type: EventType;
    feature_name?: string;
    metadata?: Record<string, any>;
}

interface AnalyticsEvent extends AnalyticsEventPayload {
    id: string;
    session_id: string;
    created_at: string;
}

class AnalyticsServiceImpl {
    private sessionId: string | null = null;
    private userId: string | null = null;
    private sessionFingerprint: string;
    private eventBuffer: AnalyticsEvent[] = [];
    private flushInterval: number = 10000; // 10 seconds
    private timerId: ReturnType<typeof setInterval> | null = null;

    // Feature 1: Strict GDPR Consent
    private hasConsent: boolean = false;

    constructor() {
        // Feature 2: Pseudonymized User Tracking
        // We generate a fingerprint per browser profile so we don't need IP tracking
        let storedFingerprint = localStorage.getItem('analytics_fingerprint');
        if (!storedFingerprint) {
            storedFingerprint = generateUUID();
            localStorage.setItem('analytics_fingerprint', storedFingerprint);
        }
        this.sessionFingerprint = storedFingerprint;

        // Check if user has explicitly consented in the past
        const consent = localStorage.getItem('analytics_consent');
        if (consent === 'true') {
            this.hasConsent = true;
        }

        this.initSession();

        // Feature 4: Contextual Error Telemetry (Global unhandled errors)
        window.addEventListener('error', (event) => {
            this.trackError('unhandled_exception', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Feature 7: Performance & Web Vitals (Basic Load time)
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (window.performance) {
                    const perfData = window.performance.timing;
                    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                    this.trackEvent('performance', 'page_load', { load_time_ms: pageLoadTime });
                }
            }, 0);
        });
    }

    public setConsent(granted: boolean) {
        this.hasConsent = granted;
        localStorage.setItem('analytics_consent', granted ? 'true' : 'false');
        if (granted && !this.sessionId) {
            this.initSession();
        } else if (!granted) {
            this.eventBuffer = []; // Clear unsent events immediately
            if (this.timerId) clearInterval(this.timerId);
        }
    }

    public getConsentState() {
        return this.hasConsent;
    }

    private async initSession() {
        if (!this.hasConsent) return;

        // Get current user if logged in
        const { data: { session } } = await supabase.auth.getSession();
        this.userId = session?.user?.id || null;

        // Start a new session in DB
        // Feature 9: Device & Environment Insights
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const browser = navigator.userAgent; // Simplified for now, can use a parser library

        // Feature 10: Conversion Journey Attribution
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || document.referrer || 'direct';

        try {
            // Note: We're doing an insert into public.analytics_sessions.
            // Row Level Security allows this if policies are set correctly.
            const { data, error } = await (supabase as any)
                .from('analytics_sessions')
                .insert([{
                    user_id: this.userId,
                    session_fingerprint: this.sessionFingerprint,
                    device_type: isMobile ? 'mobile' : 'desktop',
                    browser: browser.substring(0, 100),
                    referrer: ref
                }])
                .select('id')
                .single();

            if (data && !error) {
                this.sessionId = data.id;
                this.startBuffering();
            }
        } catch (err) {
            console.error('Failed to init analytics session', err);
        }
    }

    private startBuffering() {
        // Periodically flush the event buffer to DB
        this.timerId = setInterval(() => {
            this.flush();
        }, this.flushInterval);

        // Feature 5: Heartbeat Engagement Metrics
        // Ping every 30 seconds to update session duration
        setInterval(() => {
            if (this.hasConsent && this.sessionId) {
                this.trackEvent('heartbeat', 'active_session');
                // We also update the `last_ping_at` on the session directly
                (supabase as any).from('analytics_sessions')
                    .update({ last_ping_at: new Date().toISOString() })
                    .eq('id', this.sessionId)
                    // Fire and forget
                    .then();
            }
        }, 30000);
    }

    public trackEvent(event_type: EventType, feature_name?: string, metadata: Record<string, any> = {}) {
        if (!this.hasConsent) return;

        // Ensure minimum metadata
        const enrichedMetadata = {
            ...metadata,
            path: window.location.pathname,
            // Feature 8: Cohort & A/B Experiment Tracking
            // Grab any active experiments from local storage or app state
            active_experiments: localStorage.getItem('active_experiments') || 'none'
        };

        const event: AnalyticsEvent = {
            id: generateUUID(),
            session_id: this.sessionId || 'pending', // Will be swapped on flush if pending
            event_type,
            feature_name,
            metadata: enrichedMetadata,
            created_at: new Date().toISOString()
        };

        this.eventBuffer.push(event);

        // Flush immediately if it's an error so we don't lose it on crash
        if (event_type === 'error') {
            this.flush();
        }
    }

    // Convenience Methods
    public trackView(page_name: string) {
        this.trackEvent('view', page_name);
    }

    public trackClick(feature_name: string, metadata?: Record<string, any>) {
        this.trackEvent('click', feature_name, metadata);
    }

    public trackError(feature_name: string, errorMetadata: Record<string, any>) {
        this.trackEvent('error', feature_name, errorMetadata);
    }

    public async flush() {
        if (!this.hasConsent || this.eventBuffer.length === 0) return;
        if (!this.sessionId) return; // Wait until session is initialized

        const eventsToSend = [...this.eventBuffer];
        this.eventBuffer = []; // Clear buffer

        // Map pending session IDs
        const payload = eventsToSend.map(e => ({
            ...e,
            session_id: this.sessionId
        }));

        try {
            await (supabase as any).from('analytics_events').insert(payload);
        } catch (err) {
            // Put them back in the buffer if it failed
            // (in a real app, maybe drop them after too many retries to prevent memory leaks)
            console.error('Failed to flush analytics events');
            this.eventBuffer = [...eventsToSend, ...this.eventBuffer].slice(0, 100); // cap at 100
        }
    }
}

export const AnalyticsService = new AnalyticsServiceImpl();
