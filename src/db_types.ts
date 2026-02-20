export type Database = {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    icon: string
                    color: string
                    description: string | null
                    is_premium: boolean
                    created_at: string
                    order_index: number
                }
                Insert: {
                    id?: string
                    name: string
                    icon: string
                    color: string
                    description?: string | null
                    is_premium?: boolean
                    created_at?: string
                    order_index?: number
                }
                Update: {
                    id?: string
                    name?: string
                    icon?: string
                    color?: string
                    description?: string | null
                    is_premium?: boolean
                    created_at?: string
                    order_index?: number
                }
                Relationships: []
            }
            sounds: {
                Row: {
                    id: string
                    category_id: string
                    name: string
                    url: string
                    created_at: string
                    is_premium: boolean
                }
                Insert: {
                    id?: string
                    category_id: string
                    name: string
                    url: string
                    created_at?: string
                    is_premium?: boolean
                }
                Update: {
                    id?: string
                    category_id?: string
                    name?: string
                    url?: string
                    created_at?: string
                    is_premium?: boolean
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    role: 'admin' | 'support' | 'user'
                    full_name: string | null
                    subscription_tier: string
                    last_sign_in_at: string | null
                    created_at: string
                    deleted_at: string | null
                    avatar_url: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    role?: 'admin' | 'support' | 'user'
                    full_name?: string | null
                    subscription_tier?: string
                    last_sign_in_at?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    avatar_url?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    role?: 'admin' | 'support' | 'user'
                    full_name?: string | null
                    subscription_tier?: string
                    last_sign_in_at?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    avatar_url?: string | null
                }
                Relationships: []
            }
            permissions: {
                Row: {
                    code: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    code: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    code?: string
                    description?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            help_articles: {
                Row: {
                    id: string
                    title: string
                    slug: string
                    content: string
                    category: string
                    is_published: boolean
                    tags: string[] | null
                    view_count: number
                    helpful_count: number
                    not_helpful_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    slug: string
                    content: string
                    category: string
                    is_published?: boolean
                    tags?: string[] | null
                    view_count?: number
                    helpful_count?: number
                    not_helpful_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    slug?: string
                    content?: string
                    category?: string
                    is_published?: boolean
                    tags?: string[] | null
                    view_count?: number
                    helpful_count?: number
                    not_helpful_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            system_status: {
                Row: {
                    id: number
                    is_active: boolean
                    severity: 'info' | 'warning' | 'critical'
                    message: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    is_active?: boolean
                    severity?: 'info' | 'warning' | 'critical'
                    message?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    is_active?: boolean
                    severity?: 'info' | 'warning' | 'critical'
                    message?: string
                    updated_at?: string
                }
                Relationships: []
            }
            role_permissions: {
                Row: {
                    role: string
                    permission_code: string
                }
                Insert: {
                    role: string
                    permission_code: string
                }
                Update: {
                    role?: string
                    permission_code?: string
                }
                Relationships: []
            }
            system_settings: {
                Row: {
                    key: string
                    value: string | null
                    description: string | null
                    updated_at: string
                    updated_by: string | null
                }
                Insert: {
                    key: string
                    value?: string | null
                    description?: string | null
                    updated_at?: string
                    updated_by?: string | null
                }
                Update: {
                    key?: string
                    value?: string | null
                    description?: string | null
                    updated_at?: string
                    updated_by?: string | null
                }
                Relationships: []
            }
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    stock_count: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price: number
                    image_url?: string | null
                    stock_count?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    image_url?: string | null
                    stock_count?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            audit_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    action: string
                    resource: string
                    details: any | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    action: string
                    resource: string
                    details?: any | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    action?: string
                    resource?: string
                    details?: any | null
                    created_at?: string
                }
                Relationships: []
            }
            subscribers: {
                Row: {
                    id: string
                    email: string
                    is_active: boolean
                    source: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    is_active?: boolean
                    source?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    is_active?: boolean
                    source?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            email_templates: {
                Row: {
                    id: string
                    name: string
                    category: string | null
                    subject_template: string
                    body_template: string
                    description: string | null
                    is_active: boolean
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category?: string | null
                    subject_template: string
                    body_template: string
                    description?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string | null
                    subject_template?: string
                    body_template?: string
                    description?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
                Relationships: []
            }
            tickets: {
                Row: {
                    id: string
                    user_id: string
                    subject: string
                    status: 'open' | 'in_progress' | 'resolved' | 'closed'
                    priority: 'low' | 'normal' | 'high' | 'urgent'
                    category: string | null
                    created_at: string
                    updated_at: string
                    csat_score: number | null
                    csat_comment: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject: string
                    status?: 'open' | 'in_progress' | 'resolved' | 'closed'
                    priority?: 'low' | 'normal' | 'high' | 'urgent'
                    category?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject?: string
                    status?: 'open' | 'in_progress' | 'resolved' | 'closed'
                    priority?: 'low' | 'normal' | 'high' | 'urgent'
                    category?: string | null
                    created_at?: string
                    updated_at?: string
                    csat_score?: number | null
                    csat_comment?: string | null
                }
                Relationships: []
            }
            ticket_messages: {
                Row: {
                    id: string
                    ticket_id: string
                    sender_id: string
                    message: string
                    is_staff_reply: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    sender_id: string
                    message: string
                    is_staff_reply?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    sender_id?: string
                    message?: string
                    is_staff_reply?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            campaigns: {
                Row: {
                    id: string
                    subject: string
                    content: string
                    status: 'draft' | 'scheduled' | 'sent'
                    target_audience: 'all' | 'premium' | 'free'
                    sent_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    subject: string
                    content: string
                    status?: 'draft' | 'scheduled' | 'sent'
                    target_audience?: 'all' | 'premium' | 'free'
                    sent_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    subject?: string
                    content?: string
                    status?: 'draft' | 'scheduled' | 'sent'
                    target_audience?: 'all' | 'premium' | 'free'
                    sent_at?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    link: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    link?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Relationships: []
            }

            user_preferences: {
                Row: {
                    user_id: string
                    email_marketing: boolean
                    email_security: boolean
                    push_new_content: boolean
                    push_app_updates: boolean
                    push_mentions: boolean
                    theme_preference: string
                    content_preferences: string[] | null
                    created_at: string
                    updated_at: string
                    streak_count: number
                    last_active: string | null
                    badges: string[] | null
                }
                Insert: {
                    user_id: string
                    email_marketing?: boolean
                    email_security?: boolean
                    push_new_content?: boolean
                    push_app_updates?: boolean
                    push_mentions?: boolean
                    theme_preference?: string
                    content_preferences?: string[] | null
                    created_at?: string
                    updated_at?: string
                    streak_count?: number
                    last_active?: string | null
                    badges?: string[] | null
                }
                Update: {
                    user_id?: string
                    email_marketing?: boolean
                    email_security?: boolean
                    push_new_content?: boolean
                    push_app_updates?: boolean
                    push_mentions?: boolean
                    theme_preference?: string
                    content_preferences?: string[] | null
                    created_at?: string
                    updated_at?: string
                    streak_count?: number
                    last_active?: string | null
                    badges?: string[] | null
                }
                Relationships: []
            }
            social_accounts: {
                Row: {
                    id: string
                    user_id: string
                    platform: 'instagram' | 'twitter' | 'youtube' | 'twitch' | 'tiktok' | 'website'
                    username: string
                    profile_url: string | null
                    is_public: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    platform: 'instagram' | 'twitter' | 'youtube' | 'twitch' | 'tiktok' | 'website'
                    username: string
                    profile_url?: string | null
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    platform?: 'instagram' | 'twitter' | 'youtube' | 'twitch' | 'tiktok' | 'website'
                    username?: string
                    profile_url?: string | null
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            user_secrets: {
                Row: {
                    id: string
                    mfa_secret: string | null
                    mfa_enabled: boolean
                    backup_codes: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    mfa_secret?: string | null
                    mfa_enabled?: boolean
                    backup_codes?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    mfa_secret?: string | null
                    mfa_enabled?: boolean
                    backup_codes?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            creators: {
                Row: {
                    id: string
                    profile_id: string | null
                    name: string
                    bio: string | null
                    avatar_url: string | null
                    support_link: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id?: string | null
                    name: string
                    bio?: string | null
                    avatar_url?: string | null
                    support_link?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string | null
                    name?: string
                    bio?: string | null
                    avatar_url?: string | null
                    support_link?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            tips: {
                Row: {
                    id: string
                    sender_id: string | null
                    creator_id: string
                    amount: number
                    message: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    sender_id?: string | null
                    creator_id: string
                    amount: number
                    message?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    sender_id?: string | null
                    creator_id?: string
                    amount?: number
                    message?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            challenges: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string
                    challenge_type: string
                    goal_value: number
                    start_date: string | null
                    end_date: string | null
                    points_reward: number
                    badge_reward: string | null
                    created_at: string
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    icon?: string
                    challenge_type: string
                    goal_value: number
                    start_date?: string | null
                    end_date?: string | null
                    points_reward?: number
                    badge_reward?: string | null
                    created_at?: string
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    icon?: string
                    challenge_type?: string
                    goal_value?: number
                    start_date?: string | null
                    end_date?: string | null
                    points_reward?: number
                    badge_reward?: string | null
                    created_at?: string
                    is_active?: boolean
                }
                Relationships: []
            }
            challenge_participants: {
                Row: {
                    id: string
                    user_id: string
                    challenge_id: string
                    joined_at: string
                    progress: number
                    completed: boolean
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    challenge_id: string
                    joined_at?: string
                    progress?: number
                    completed?: boolean
                    completed_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    challenge_id?: string
                    joined_at?: string
                    progress?: number
                    completed?: boolean
                    completed_at?: string | null
                }
                Relationships: []
            }
            listening_sessions: {
                Row: {
                    id: string
                    host_id: string
                    current_sound_id: string | null
                    variation_index: number
                    is_playing: boolean
                    playback_position: number
                    created_at: string
                    expires_at: string | null
                }
                Insert: {
                    id?: string
                    host_id: string
                    current_sound_id?: string | null
                    variation_index?: number
                    is_playing?: boolean
                    playback_position?: number
                    created_at?: string
                    expires_at?: string | null
                }
                Update: {
                    id?: string
                    host_id?: string
                    current_sound_id?: string | null
                    variation_index?: number
                    is_playing?: boolean
                    playback_position?: number
                    created_at?: string
                    expires_at?: string | null
                }
                Relationships: []
            }
            community_presets: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    layers: any
                    likes_count: number
                    downloads_count: number
                    is_premium: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    layers: any
                    likes_count?: number
                    downloads_count?: number
                    is_premium?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    layers?: any
                    likes_count?: number
                    downloads_count?: number
                    is_premium?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            preset_likes: {
                Row: {
                    id: string
                    user_id: string
                    preset_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    preset_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    preset_id?: string
                    created_at?: string
                }
                Relationships: []
            }
            error_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    error_message: string
                    stack_trace: string | null
                    severity: 'info' | 'warning' | 'error' | 'critical'
                    context: any | null
                    resolved: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    error_message: string
                    stack_trace?: string | null
                    severity?: 'info' | 'warning' | 'error' | 'critical'
                    context?: any | null
                    resolved?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    error_message?: string
                    stack_trace?: string | null
                    severity?: 'info' | 'warning' | 'error' | 'critical'
                    context?: any | null
                    resolved?: boolean
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            increment_downloads: {
                Args: {
                    row_id: string
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
