/**
 * Dashboard Team Management Module
 * Handles team management functionality
 */

export class DashboardTeam {
    constructor() {
        this.teamMembers = [
            { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'Executive', role: 'CEO', assessments: 3, lastAssessment: '2024-01-15', status: 'active' },
            { id: 2, name: 'Michael Chen', email: 'michael.chen@company.com', department: 'IT', role: 'CTO', assessments: 2, lastAssessment: '2024-01-10', status: 'active' },
            { id: 3, name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com', department: 'HR', role: 'HR Director', assessments: 4, lastAssessment: '2024-01-12', status: 'active' },
            { id: 4, name: 'David Kim', email: 'david.kim@company.com', department: 'Finance', role: 'CFO', assessments: 2, lastAssessment: '2024-01-08', status: 'active' },
            { id: 5, name: 'Lisa Thompson', email: 'lisa.thompson@company.com', department: 'Marketing', role: 'Marketing Manager', assessments: 1, lastAssessment: '2024-01-05', status: 'pending' }
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTeamMembers();
    }

    setupEventListeners() {
        // Team creation and management buttons
        if (document.getElementById('createTeamBtn')) {
            document.getElementById('createTeamBtn').addEventListener('click', () => {
                this.showCreateTeamModal();
            });
        }

        if (document.getElementById('joinTeamBtn')) {
            document.getElementById('joinTeamBtn').addEventListener('click', () => {
                this.showJoinTeamModal();
            });
        }

        if (document.getElementById('loadDemoDataBtn')) {
            document.getElementById('loadDemoDataBtn').addEventListener('click', () => {
                this.loadTeamDemoData();
            });
        }

        if (document.getElementById('clearDemoDataBtn')) {
            document.getElementById('clearDemoDataBtn').addEventListener('click', () => {
                this.clearTeamDemoData();
            });
        }

        // Team filters
        if (document.getElementById('teamTypeFilter')) {
            document.getElementById('teamTypeFilter').addEventListener('change', () => {
                this.filterTeams();
            });
        }
    }

    renderTeamMembers(members = this.teamMembers) {
        const teamGrid = document.getElementById('teamGrid');
        if (!teamGrid) return;

        teamGrid.innerHTML = members.map(member => `
            <div class="team-member">
                <div class="team-member-header">
                    <div class="member-avatar">${member.name.split(' ').map(n => n[0]).join('')}</div>
                    <div class="member-info">
                        <h4>${member.name}</h4>
                        <p>${member.role}</p>
                        <div class="member-department">${member.department}</div>
                    </div>
                </div>
                <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem;">
                    ${member.assessments} assessments • Last: ${member.lastAssessment}
                </div>
                <div class="member-actions">
                    <div class="left-actions">
                        <button class="btn btn-tiny btn-secondary" title="View" onclick="dashboardTeam.viewMemberProfile('${member.name}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-tiny btn-secondary" title="Edit" onclick="dashboardTeam.editMemberInfo('${member.name}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="right-actions">
                        <button class="btn btn-tiny btn-secondary" title="Compare" onclick="dashboardTeam.compareResults('${member.name}')">
                            <i class="fas fa-balance-scale"></i> <span style="margin-left: 0.3em;">Compare</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterTeams() {
        const filter = document.getElementById('teamTypeFilter')?.value;
        const filtered = filter ? this.teamMembers.filter(m => m.department === filter) : this.teamMembers;
        this.renderTeamMembers(filtered);
    }

    // Modal functions
    showCreateTeamModal() {
        alert('Create Team Modal - This would open a modal for creating a new team');
    }

    showJoinTeamModal() {
        alert('Join Team Modal - This would open a modal for joining an existing team');
    }

    showInviteMemberModal() {
        alert('Invite Member Modal - This would open a modal for inviting new members');
    }

    // Demo data functions
    loadTeamDemoData() {
        console.log('Loading team demo data...');
        // Implementation for loading demo team data
        alert('Demo team data loaded successfully!');
    }

    clearTeamDemoData() {
        console.log('Clearing team demo data...');
        // Implementation for clearing demo team data
        alert('Demo team data cleared successfully!');
    }

    // Member action functions
    viewMemberProfile(memberName) {
        alert(`Viewing profile for ${memberName}`);
    }

    editMemberInfo(memberName) {
        alert(`Edit ${memberName}'s information`);
    }

    compareResults(memberName) {
        alert(`Compare results with ${memberName}`);
    }

    shareResultsWithTeam() {
        alert('Sharing results with team...');
    }

    // Public methods
    getTeamMembers() {
        return this.teamMembers;
    }

    addTeamMember(member) {
        this.teamMembers.push(member);
        this.renderTeamMembers();
    }

    removeTeamMember(memberId) {
        this.teamMembers = this.teamMembers.filter(m => m.id !== memberId);
        this.renderTeamMembers();
    }
}

// Export for global use
window.DashboardTeam = DashboardTeam; 