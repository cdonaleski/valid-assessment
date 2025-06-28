/**
 * Team Management Module
 * Handles team creation, member management, invitations, and result sharing
 * Supports both demo mode and authenticated users
 */

import { logger } from './logger.js';

class TeamManagement {
    constructor() {
        this.currentUser = null;
        this.userTeams = [];
        this.currentTeam = null;
        this.teamMembers = [];
        this.isDemoMode = false;
        
        // Demo data for testing
        this.demoTeams = [
            {
                id: 'demo-team-1',
                name: 'Marketing Team',
                description: 'Core marketing team for product launches',
                organization_name: 'Demo Corp',
                is_external: false,
                user_role: 'manager',
                member_count: 8,
                assessment_count: 6,
                members: [
                    {
                        user_id: 'demo-user-1',
                        first_name: 'Sarah',
                        last_name: 'Johnson',
                        email: 'sarah.j@democorp.com',
                        role: 'member',
                        department: 'Marketing',
                        joined_at: '2024-01-15T10:00:00Z',
                        has_assessment: true,
                        last_assessment_date: '2024-01-20T14:30:00Z',
                        assessment_scores: {
                            verity: 75,
                            association: 60,
                            lived_experience: 85,
                            institutional: 70,
                            desire: 80
                        }
                    },
                    {
                        user_id: 'demo-user-2',
                        first_name: 'Mike',
                        last_name: 'Chen',
                        email: 'mike.chen@democorp.com',
                        role: 'member',
                        department: 'Marketing',
                        joined_at: '2024-01-16T09:00:00Z',
                        has_assessment: true,
                        last_assessment_date: '2024-01-21T11:15:00Z',
                        assessment_scores: {
                            verity: 65,
                            association: 80,
                            lived_experience: 70,
                            institutional: 85,
                            desire: 75
                        }
                    }
                ]
            },
            {
                id: 'demo-team-2',
                name: 'External Partners',
                description: 'Collaboration with external agencies',
                organization_name: 'Partner Agency',
                is_external: true,
                user_role: 'member',
                member_count: 5,
                assessment_count: 3,
                members: [
                    {
                        user_id: 'demo-user-3',
                        first_name: 'Alex',
                        last_name: 'Rodriguez',
                        email: 'alex@partneragency.com',
                        role: 'manager',
                        department: 'Strategy',
                        joined_at: '2024-01-10T08:00:00Z',
                        has_assessment: true,
                        last_assessment_date: '2024-01-18T16:45:00Z',
                        assessment_scores: {
                            verity: 90,
                            association: 75,
                            lived_experience: 80,
                            institutional: 85,
                            desire: 70
                        }
                    }
                ]
            }
        ];
    }

    async initialize() {
        try {
            logger.info('Initializing Team Management...');
            
            // Check if user is authenticated
            this.currentUser = await this.getCurrentUser();
            this.isDemoMode = !this.currentUser;
            
            if (this.isDemoMode) {
                logger.info('Running in demo mode');
                this.userTeams = this.demoTeams;
            } else {
                logger.info('Running in authenticated mode');
                await this.loadUserTeams();
            }
            
            this.setupEventListeners();
            logger.success('Team Management initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Team Management:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            if (window.supabase && window.supabase.auth) {
                const { data: { user } } = await supabase.auth.getUser();
                return user;
            }
            return null;
        } catch (error) {
            logger.error('Error getting current user:', error);
            return null;
        }
    }

    async loadUserTeams() {
        try {
            if (!this.currentUser) {
                this.userTeams = this.demoTeams;
                return;
            }

            // Load teams from Supabase
            const { data: teams, error } = await supabase
                .rpc('get_user_teams', { user_uuid: this.currentUser.id });

            if (error) {
                logger.error('Error loading user teams:', error);
                this.userTeams = [];
                return;
            }

            this.userTeams = teams || [];
            logger.info('Loaded user teams:', this.userTeams);
            
        } catch (error) {
            logger.error('Error loading user teams:', error);
            this.userTeams = [];
        }
    }

    async loadTeamMembers(teamId) {
        try {
            if (this.isDemoMode) {
                const team = this.demoTeams.find(t => t.id === teamId);
                this.teamMembers = team ? team.members : [];
                return;
            }

            const { data: members, error } = await supabase
                .rpc('get_team_members', { team_uuid: teamId });

            if (error) {
                logger.error('Error loading team members:', error);
                this.teamMembers = [];
                return;
            }

            this.teamMembers = members || [];
            logger.info('Loaded team members:', this.teamMembers);
            
        } catch (error) {
            logger.error('Error loading team members:', error);
            this.teamMembers = [];
        }
    }

    async createTeam(teamData) {
        try {
            const team = {
                name: teamData.name,
                description: teamData.description,
                organization_name: teamData.organization_name,
                is_external: teamData.is_external || false
            };

            if (this.isDemoMode) {
                // Create demo team
                const newTeam = {
                    id: `demo-team-${Date.now()}`,
                    ...team,
                    user_role: 'owner',
                    member_count: 1,
                    assessment_count: 0,
                    members: []
                };
                this.userTeams.push(newTeam);
                logger.info('Created demo team:', newTeam);
                return newTeam;
            }

            // Create team in Supabase
            const { data, error } = await supabase
                .from('teams')
                .insert([team])
                .select()
                .single();

            if (error) {
                logger.error('Error creating team:', error);
                throw error;
            }

            // Add user as owner
            await supabase
                .from('team_members')
                .insert([{
                    team_id: data.id,
                    user_id: this.currentUser.id,
                    role: 'owner'
                }]);

            logger.info('Created team:', data);
            await this.loadUserTeams();
            return data;
            
        } catch (error) {
            logger.error('Error creating team:', error);
            throw error;
        }
    }

    async inviteUserToTeam(teamId, email, role = 'member', message = null) {
        try {
            if (this.isDemoMode) {
                logger.info('Demo mode: Would invite user to team', { teamId, email, role });
                return { success: true, message: 'Demo invitation created' };
            }

            const { data, error } = await supabase
                .rpc('invite_user_to_team', {
                    team_uuid: teamId,
                    invite_email: email,
                    invite_role: role,
                    invite_message: message
                });

            if (error) {
                logger.error('Error inviting user to team:', error);
                throw error;
            }

            logger.info('Invited user to team:', { teamId, email, invitationId: data });
            return { success: true, invitationId: data };
            
        } catch (error) {
            logger.error('Error inviting user to team:', error);
            throw error;
        }
    }

    async acceptInvitation(token) {
        try {
            if (this.isDemoMode) {
                logger.info('Demo mode: Would accept invitation with token', token);
                return { success: true, message: 'Demo invitation accepted' };
            }

            const { data, error } = await supabase
                .rpc('accept_team_invitation', { invitation_token: token });

            if (error) {
                logger.error('Error accepting invitation:', error);
                throw error;
            }

            if (data) {
                logger.info('Accepted team invitation');
                await this.loadUserTeams();
                return { success: true };
            } else {
                return { success: false, message: 'Invalid or expired invitation' };
            }
            
        } catch (error) {
            logger.error('Error accepting invitation:', error);
            throw error;
        }
    }

    async shareResults(teamId, permissionLevel = 'view') {
        try {
            if (this.isDemoMode) {
                logger.info('Demo mode: Would share results with team', { teamId, permissionLevel });
                return { success: true, message: 'Demo results shared' };
            }

            const { error } = await supabase
                .from('result_sharing')
                .insert([{
                    user_id: this.currentUser.id,
                    shared_with_team_id: teamId,
                    sharing_type: 'team',
                    permission_level: permissionLevel
                }]);

            if (error) {
                logger.error('Error sharing results:', error);
                throw error;
            }

            logger.info('Shared results with team:', teamId);
            return { success: true };
            
        } catch (error) {
            logger.error('Error sharing results:', error);
            throw error;
        }
    }

    async createComparisonSession(teamId, name, description) {
        try {
            if (this.isDemoMode) {
                logger.info('Demo mode: Would create comparison session', { teamId, name });
                return { success: true, message: 'Demo comparison session created' };
            }

            const { data, error } = await supabase
                .from('comparison_sessions')
                .insert([{
                    team_id: teamId,
                    name: name,
                    description: description
                }])
                .select()
                .single();

            if (error) {
                logger.error('Error creating comparison session:', error);
                throw error;
            }

            logger.info('Created comparison session:', data);
            return { success: true, sessionId: data.id };
            
        } catch (error) {
            logger.error('Error creating comparison session:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Team creation form
        const createTeamForm = document.getElementById('createTeamForm');
        if (createTeamForm) {
            createTeamForm.addEventListener('submit', this.handleCreateTeam.bind(this));
        }

        // Invite user form
        const inviteUserForm = document.getElementById('inviteUserForm');
        if (inviteUserForm) {
            inviteUserForm.addEventListener('submit', this.handleInviteUser.bind(this));
        }

        // Team selection
        const teamSelect = document.getElementById('teamSelect');
        if (teamSelect) {
            teamSelect.addEventListener('change', this.handleTeamSelection.bind(this));
        }
    }

    async handleCreateTeam(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const teamData = {
                name: formData.get('teamName'),
                description: formData.get('teamDescription'),
                organization_name: formData.get('organizationName'),
                is_external: formData.get('isExternal') === 'true'
            };

            await this.createTeam(teamData);
            this.renderTeams();
            this.showMessage('Team created successfully!', 'success');
            
            // Close modal if exists
            const modal = document.getElementById('createTeamModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
        } catch (error) {
            logger.error('Error creating team:', error);
            this.showMessage('Error creating team', 'error');
        }
    }

    async handleInviteUser(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const inviteData = {
                email: formData.get('email'),
                role: formData.get('role'),
                message: formData.get('message')
            };

            await this.inviteUserToTeam(this.currentTeam.id, inviteData.email, inviteData.role, inviteData.message);
            this.showMessage('Invitation sent successfully!', 'success');
            
            // Close modal if exists
            const modal = document.getElementById('inviteUserModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
        } catch (error) {
            logger.error('Error inviting user:', error);
            this.showMessage('Error sending invitation', 'error');
        }
    }

    async handleTeamSelection(event) {
        const teamId = event.target.value;
        if (teamId) {
            this.currentTeam = this.userTeams.find(t => t.id === teamId);
            await this.loadTeamMembers(teamId);
            this.renderTeamMembers();
        }
    }

    renderTeams() {
        const teamGrid = document.getElementById('teamGrid');
        if (!teamGrid) return;

        if (!this.userTeams || this.userTeams.length === 0) {
            teamGrid.innerHTML = `
                <div class="team-empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Teams Yet</h3>
                    <p>Create your first team or join an existing one to get started.</p>
                    ${this.isDemoMode ? `
                        <button onclick="loadTeamDemoData()" class="btn primary" style="margin-top: 1rem;">
                            <i class="fas fa-database"></i> Load Demo Data
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        teamGrid.innerHTML = this.userTeams.map(team => `
            <div class="team-card ${team.is_external ? 'external-team' : ''}" onclick="teamManagement.selectTeam('${team.id}')">
                <div class="team-header">
                    <h4>${team.name}</h4>
                    ${team.is_external ? '<span class="external-badge">External</span>' : ''}
                    ${this.isDemoMode ? '<span class="demo-badge">Demo</span>' : ''}
                </div>
                <p class="team-description">${team.description || 'No description'}</p>
                <div class="team-stats">
                    <span><i class="fas fa-users"></i> ${team.member_count} members</span>
                    <span><i class="fas fa-chart-bar"></i> ${team.assessment_count} assessments</span>
                    <span><i class="fas fa-building"></i> ${team.organization_name}</span>
                </div>
                <div class="team-actions">
                    <button class="btn btn-primary">
                        View Team
                    </button>
                    ${team.user_role === 'owner' || team.user_role === 'manager' ? `
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); teamManagement.showInviteModal('${team.id}')">
                            <i class="fas fa-user-plus"></i> Invite
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderTeamMembers() {
        const memberGrid = document.getElementById('memberGrid');
        if (!memberGrid) return;

        memberGrid.innerHTML = this.teamMembers.map(member => `
            <div class="member-card">
                <div class="member-avatar">
                    <div class="avatar-initials">
                        ${member.first_name ? member.first_name.charAt(0) : ''}${member.last_name ? member.last_name.charAt(0) : ''}
                    </div>
                </div>
                <div class="member-info">
                    <h5>${member.first_name} ${member.last_name}</h5>
                    <p class="member-email">${member.email}</p>
                    <p class="member-role">${member.role} • ${member.department || 'No department'}</p>
                </div>
                <div class="member-assessment">
                    ${member.has_assessment ? `
                        <div class="assessment-status completed">
                            <i class="fas fa-check-circle"></i> Completed
                        </div>
                        <button onclick="teamManagement.viewMemberResults('${member.user_id}')" class="btn btn-small">
                            View Results
                        </button>
                    ` : `
                        <div class="assessment-status pending">
                            <i class="fas fa-clock"></i> Pending
                        </div>
                    `}
                </div>
            </div>
        `).join('');
    }

    selectTeam(teamId) {
        this.currentTeam = this.userTeams.find(t => t.id === teamId);
        this.loadTeamMembers(teamId);
        this.renderTeamMembers();
        
        // Update UI to show team details
        const teamDetailsSection = document.getElementById('teamDetailsSection');
        if (teamDetailsSection) {
            teamDetailsSection.style.display = 'block';
        }
    }

    showInviteModal(teamId) {
        // Implementation for invite modal
        logger.info('Show invite modal for team:', teamId);
    }

    viewMemberResults(userId) {
        // Implementation for viewing member results
        logger.info('View results for user:', userId);
    }

    showMessage(message, type) {
        // Implementation for showing messages
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Create and export singleton instance
const teamManagement = new TeamManagement();

// Make it globally available
window.teamManagement = teamManagement;

export default teamManagement; 