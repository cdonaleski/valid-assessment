/**
 * Mobile Assessment Supabase Integration
 * Handles database operations for the mobile VALID assessment
 */

class MobileSupabaseClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentAssessmentId = null;
        this.init();
    }

    async init() {
        try {
            // First, ensure configuration is loaded securely
            if (!window.APP_CONFIG) {
                console.log('🔒 Waiting for secure configuration...');
                // Wait for configuration to be loaded
                let attempts = 0;
                while (!window.APP_CONFIG && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.APP_CONFIG) {
                    throw new Error('Configuration not available after waiting');
                }
            }

            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, using offline mode');
                return;
            }

            // Validate configuration
            if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
                throw new Error('Supabase configuration not properly loaded');
            }

            // Create Supabase client with securely loaded configuration
            this.client = window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_ANON_KEY
            );

            // Test connection
            const { data, error } = await this.client
                .from('mobile_assessments')
                .select('count')
                .limit(1);

            if (error && error.code !== 'PGRST301') {
                throw error;
            }

            this.isConnected = true;
            console.log('🔒 Mobile Supabase client initialized securely');

        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            this.isConnected = false;
        }
    }

    async testConnection() {
        if (!this.client) throw new Error('Client not initialized');
        
        const { data, error } = await this.client
            .from('mobile_assessments')
            .select('count')
            .limit(1);
            
        if (error) throw error;
        return true;
    }

    async createAssessment(assessmentData) {
        try {
            if (!this.isConnected) {
                return this.saveOffline('create_assessment', assessmentData);
            }

            const { data, error } = await this.client
                .from('mobile_assessments')
                .insert([{
                    user_age: assessmentData.userAge,
                    job_role: assessmentData.jobTitle,
                    decision_maker: assessmentData.decisionMaker,
                    consultant_referral: assessmentData.consultantReferral,
                    status: 'started'
                }])
                .select()
                .single();

            if (error) throw error;
            
            this.currentAssessmentId = data.id;
            console.log('Assessment created with ID:', data.id);
            return data;
        } catch (error) {
            console.error('Failed to create assessment:', error);
            return this.saveOffline('create_assessment', assessmentData);
        }
    }

    async updateAssessment(updates) {
        try {
            if (!this.isConnected || !this.currentAssessmentId) {
                return this.saveOffline('update_assessment', { id: this.currentAssessmentId, ...updates });
            }

            const { data, error } = await this.client
                .from('mobile_assessments')
                .update(updates)
                .eq('id', this.currentAssessmentId)
                .select()
                .single();

            if (error) throw error;
            
            console.log('Assessment updated:', data.id);
            return data;
        } catch (error) {
            console.error('Failed to update assessment:', error);
            return this.saveOffline('update_assessment', { id: this.currentAssessmentId, ...updates });
        }
    }

    async saveAnswers(answers) {
        return this.updateAssessment({ answers });
    }

    async saveContactInfo(contactInfo) {
        return this.updateAssessment({ contact_info: contactInfo });
    }

    async completeAssessment(scores, persona) {
        return this.updateAssessment({
            scores,
            persona,
            status: 'completed',
            completed_at: new Date().toISOString()
        });
    }

    async saveInvolvementPreference(involvementType, contactData) {
        try {
            if (!this.isConnected) {
                return this.saveOffline('save_involvement', { involvementType, contactData, assessmentId: this.currentAssessmentId });
            }

            // First update the main assessment with involvement preference
            await this.updateAssessment({ involvement_preference: involvementType });

            // Then create a detailed involvement record
            const { data, error } = await this.client
                .from('mobile_user_involvement')
                .insert([{
                    mobile_assessment_id: this.currentAssessmentId,
                    involvement_type: involvementType,
                    contact_email: contactData.email,
                    contact_name: contactData.name,
                    additional_data: contactData
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('Involvement preference saved:', data.id);
            
            // Trigger webhook for automation
            await this.triggerInvolvementWebhook(data.id, involvementType, contactData);
            
            return data;
        } catch (error) {
            console.error('Failed to save involvement preference:', error);
            return this.saveOffline('save_involvement', { involvementType, contactData, assessmentId: this.currentAssessmentId });
        }
    }

    async triggerInvolvementWebhook(involvementId, involvementType, contactData) {
        try {
            // This would typically call a Supabase Edge Function or external webhook
            // For now, we'll use a simple function call that could be replaced with actual webhook
            
            const webhookData = {
                involvement_id: involvementId,
                assessment_id: this.currentAssessmentId,
                involvement_type: involvementType,
                contact_data: contactData,
                timestamp: new Date().toISOString()
            };

            // Call webhook endpoint (you'll need to implement this)
            const webhookUrl = window.WEBHOOK_BASE_URL ? 
                `${window.WEBHOOK_BASE_URL}/api/webhooks/involvement` : 
                '/api/webhooks/involvement';

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookData)
            });

            if (response.ok) {
                // Mark webhook as sent
                await this.client
                    .from('mobile_user_involvement')
                    .update({
                        webhook_sent: true,
                        webhook_sent_at: new Date().toISOString()
                    })
                    .eq('id', involvementId);
                    
                console.log('Webhook triggered successfully for involvement:', involvementType);
            } else {
                console.warn('Webhook failed, will retry later');
            }
        } catch (error) {
            console.error('Failed to trigger webhook:', error);
            // Don't throw here - assessment should still complete even if webhook fails
        }
    }

    saveOffline(action, data) {
        try {
            const offlineKey = `mobile_assessment_offline_${Date.now()}`;
            const offlineData = {
                action,
                data,
                timestamp: new Date().toISOString(),
                assessmentId: this.currentAssessmentId
            };
            
            localStorage.setItem(offlineKey, JSON.stringify(offlineData));
            console.log('Data saved offline:', action);
            
            return { offline: true, key: offlineKey };
        } catch (error) {
            console.error('Failed to save offline:', error);
            return null;
        }
    }

    async syncOfflineData() {
        try {
            if (!this.isConnected) return;

            const offlineKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('mobile_assessment_offline_')
            );

            for (const key of offlineKeys) {
                try {
                    const offlineData = JSON.parse(localStorage.getItem(key));
                    
                    switch (offlineData.action) {
                        case 'create_assessment':
                            await this.createAssessment(offlineData.data);
                            break;
                        case 'update_assessment':
                            await this.updateAssessment(offlineData.data);
                            break;
                        case 'save_involvement':
                            await this.saveInvolvementPreference(
                                offlineData.data.involvementType,
                                offlineData.data.contactData
                            );
                            break;
                    }
                    
                    localStorage.removeItem(key);
                    console.log('Synced offline data:', offlineData.action);
                } catch (error) {
                    console.error('Failed to sync offline data:', error);
                }
            }
        } catch (error) {
            console.error('Failed to sync offline data:', error);
        }
    }

    // Analytics helpers
    async getAssessmentStats() {
        try {
            if (!this.isConnected) return null;

            const { data, error } = await this.client
                .from('mobile_assessments')
                .select('status, created_at, involvement_preference')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to get assessment stats:', error);
            return null;
        }
    }
}

// Create global instance
window.mobileSupabase = new MobileSupabaseClient();

// Also make the class available globally for potential custom usage
window.MobileSupabaseClient = MobileSupabaseClient; 