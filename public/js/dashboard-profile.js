/**
 * Dashboard Profile Module
 * Handles user profile functionality
 */

export class DashboardProfile {
    constructor() {
        this.userProfile = null;
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile update buttons
        const updateProfileBtn = document.getElementById('updateProfileBtn');
        if (updateProfileBtn) {
            updateProfileBtn.addEventListener('click', () => {
                this.updateProfile();
            });
        }

        // Profile image upload
        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput) {
            profileImageInput.addEventListener('change', (e) => {
                this.handleProfileImageUpload(e);
            });
        }
    }

    async loadUserProfile() {
        try {
            // Get current user ID
            const currentUser = window.assessmentStateManager?.getCurrentUserId();
            if (!currentUser) {
                console.log('No user ID available for profile loading');
                return;
            }

            // Try to get profile from localStorage or API
            const profileKey = `user_profile_${currentUser}`;
            const storedProfile = localStorage.getItem(profileKey);
            
            if (storedProfile) {
                this.userProfile = JSON.parse(storedProfile);
                this.renderProfile();
            } else {
                // Create default profile
                this.userProfile = this.createDefaultProfile(currentUser);
                this.saveProfile();
                this.renderProfile();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    createDefaultProfile(userId) {
        return {
            id: userId,
            name: 'Demo User',
            email: 'demo@example.com',
            role: 'User',
            department: 'General',
            avatar: null,
            preferences: {
                notifications: true,
                emailUpdates: true,
                theme: 'light'
            },
            stats: {
                assessmentsCompleted: 0,
                lastAssessment: null,
                averageScore: 0
            }
        };
    }

    renderProfile() {
        if (!this.userProfile) return;

        // Update profile display elements
        const nameElement = document.getElementById('profileName');
        if (nameElement) {
            nameElement.textContent = this.userProfile.name;
        }

        const emailElement = document.getElementById('profileEmail');
        if (emailElement) {
            emailElement.textContent = this.userProfile.email;
        }

        const roleElement = document.getElementById('profileRole');
        if (roleElement) {
            roleElement.textContent = this.userProfile.role;
        }

        const departmentElement = document.getElementById('profileDepartment');
        if (departmentElement) {
            departmentElement.textContent = this.userProfile.department;
        }

        // Update avatar
        this.updateAvatar();

        // Update stats
        this.updateStats();
    }

    updateAvatar() {
        const avatarElement = document.getElementById('profileAvatar');
        if (!avatarElement) return;

        if (this.userProfile.avatar) {
            avatarElement.src = this.userProfile.avatar;
        } else {
            // Use initials as fallback
            const initials = this.userProfile.name.split(' ').map(n => n[0]).join('');
            avatarElement.textContent = initials;
            avatarElement.style.background = this.getRandomColor();
        }
    }

    updateStats() {
        // Update assessment stats
        const assessmentsCompleted = document.getElementById('assessmentsCompleted');
        if (assessmentsCompleted) {
            assessmentsCompleted.textContent = this.userProfile.stats.assessmentsCompleted;
        }

        const lastAssessment = document.getElementById('lastAssessment');
        if (lastAssessment) {
            lastAssessment.textContent = this.userProfile.stats.lastAssessment || 'Never';
        }

        const averageScore = document.getElementById('averageScore');
        if (averageScore) {
            averageScore.textContent = `${this.userProfile.stats.averageScore}%`;
        }
    }

    async updateProfile() {
        try {
            // Get form data
            const formData = this.getProfileFormData();
            
            // Validate form data
            if (!this.validateProfileData(formData)) {
                alert('Please fill in all required fields correctly.');
                return;
            }

            // Update profile
            this.userProfile = { ...this.userProfile, ...formData };
            
            // Save to storage
            await this.saveProfile();
            
            // Re-render profile
            this.renderProfile();
            
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile. Please try again.');
        }
    }

    getProfileFormData() {
        return {
            name: document.getElementById('profileNameInput')?.value || this.userProfile.name,
            email: document.getElementById('profileEmailInput')?.value || this.userProfile.email,
            role: document.getElementById('profileRoleInput')?.value || this.userProfile.role,
            department: document.getElementById('profileDepartmentInput')?.value || this.userProfile.department
        };
    }

    validateProfileData(data) {
        return data.name && data.email && data.role && data.department;
    }

    async handleProfileImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image file size must be less than 5MB.');
                return;
            }

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.userProfile.avatar = e.target.result;
                this.updateAvatar();
                this.saveProfile();
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Error uploading profile image:', error);
            alert('Error uploading image. Please try again.');
        }
    }

    async saveProfile() {
        try {
            const currentUser = window.assessmentStateManager?.getCurrentUserId();
            if (!currentUser) return;

            const profileKey = `user_profile_${currentUser}`;
            localStorage.setItem(profileKey, JSON.stringify(this.userProfile));
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    }

    getRandomColor() {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Public methods
    getUserProfile() {
        return this.userProfile;
    }

    updateStatsFromAssessment(assessmentData) {
        if (!this.userProfile) return;

        this.userProfile.stats.assessmentsCompleted++;
        this.userProfile.stats.lastAssessment = new Date().toLocaleDateString();
        
        // Calculate average score if assessment has scores
        if (assessmentData.scores) {
            const scores = Object.values(assessmentData.scores);
            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
            this.userProfile.stats.averageScore = Math.round(average);
        }

        this.saveProfile();
        this.updateStats();
    }
}

// Export for global use
window.DashboardProfile = DashboardProfile; 