# Team Management System Guide

## Overview

The Team Management System is a comprehensive solution for managing teams, members, invitations, and result sharing within The Validated Mind assessment platform. It supports both internal teams (within an organization) and external teams (collaboration with partners), with role-based permissions and result sharing capabilities.

## Key Features

### 1. Team Creation and Management
- **Create Teams**: Users can create teams with names, descriptions, and organization details
- **Internal vs External**: Distinguish between internal teams and external partner teams
- **Team Roles**: Owner, Manager, Member, and Viewer roles with different permissions
- **Team Statistics**: Track member count, assessment completion rates, and team activity

### 2. Member Management
- **Invite Members**: Send email invitations with custom roles and personal messages
- **Role Assignment**: Assign different permission levels to team members
- **Member Profiles**: View member information, assessment status, and VALID scores
- **Member Removal**: Remove members from teams (for managers and owners)

### 3. Result Sharing
- **Share Results**: Share individual VALID assessment results with teams
- **Permission Levels**: View, Compare, and Analyze permission levels
- **External Sharing**: Share results with external teams while maintaining privacy
- **Sharing Controls**: Set expiration dates and manage active sharing permissions

### 4. Team Comparison
- **Comparison Sessions**: Create sessions to compare VALID profiles across team members
- **Collaborative Analysis**: Enable teams to analyze patterns and opportunities together
- **Session Management**: Manage active comparison sessions and participant access

### 5. Invitation System
- **Email Invitations**: Send secure invitation tokens via email
- **Token-based Access**: Secure team joining through invitation tokens
- **Expiration Management**: Automatic expiration of invitations after 7 days
- **Invitation Tracking**: Track invitation status (pending, accepted, expired, declined)

## Database Schema

### Core Tables

#### `teams`
```sql
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id VARCHAR(255),
    organization_name VARCHAR(255),
    is_external BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `team_members`
```sql
CREATE TABLE team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(team_id, user_id)
);
```

#### `team_invitations`
```sql
CREATE TABLE team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    status VARCHAR(20) DEFAULT 'pending',
    token VARCHAR(255) UNIQUE NOT NULL,
    organization_name VARCHAR(255),
    message TEXT
);
```

#### `result_sharing`
```sql
CREATE TABLE result_sharing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sharing_type VARCHAR(20) NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'view',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Row Level Security (RLS)

The system implements comprehensive RLS policies to ensure data security:

- **Teams**: Users can only see teams they're members of or created
- **Team Members**: Users can see members of teams they belong to
- **Invitations**: Managers can manage invitations, users can see their own invitations
- **Result Sharing**: Users control their own sharing permissions

## User Roles and Permissions

### Role Hierarchy

1. **Owner**
   - Full control over team settings
   - Can add/remove members
   - Can delete the team
   - Can manage all team features

2. **Manager**
   - Can invite new members
   - Can remove members
   - Can create comparison sessions
   - Cannot delete the team

3. **Member**
   - Can view team information
   - Can share their results
   - Can participate in comparisons
   - Cannot invite or remove members

4. **Viewer**
   - Read-only access to team information
   - Cannot share results or participate in comparisons
   - Limited to viewing shared content

### Permission Matrix

| Action | Owner | Manager | Member | Viewer |
|--------|-------|---------|--------|--------|
| View Team | ✅ | ✅ | ✅ | ✅ |
| Edit Team | ✅ | ❌ | ❌ | ❌ |
| Delete Team | ✅ | ❌ | ❌ | ❌ |
| Invite Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ |
| Share Results | ✅ | ✅ | ✅ | ❌ |
| Create Comparisons | ✅ | ✅ | ❌ | ❌ |
| Join Comparisons | ✅ | ✅ | ✅ | ❌ |

## Implementation Details

### Frontend Components

#### Team Management Module (`js/team-management.js`)
- Handles all team-related operations
- Supports both demo mode and authenticated users
- Manages team state and UI updates
- Handles form submissions and API calls

#### UI Components
- **Team Cards**: Display team information and statistics
- **Member Grid**: Show team members with assessment status
- **Modals**: Create team, invite members, join team
- **Filters**: Filter teams by type (internal/external)

### Demo Mode

The system includes comprehensive demo functionality for testing:

- **Demo Teams**: Pre-populated with sample data
- **Demo Members**: Sample team members with VALID scores
- **Demo Invitations**: Simulated invitation process
- **Demo Sharing**: Mock result sharing functionality

### API Integration

#### Supabase Functions
- `get_user_teams()`: Retrieve user's teams with statistics
- `get_team_members()`: Get team members with assessment data
- `invite_user_to_team()`: Create team invitations
- `accept_team_invitation()`: Accept invitation tokens

#### REST Endpoints
- Team CRUD operations
- Member management
- Invitation handling
- Result sharing

## Usage Examples

### Creating a Team
```javascript
const teamData = {
    name: "Marketing Team",
    description: "Core marketing team for product launches",
    organization_name: "Demo Corp",
    is_external: false
};

await teamManagement.createTeam(teamData);
```

### Inviting a Member
```javascript
await teamManagement.inviteUserToTeam(
    teamId,
    "user@example.com",
    "member",
    "Welcome to our team!"
);
```

### Sharing Results
```javascript
await teamManagement.shareResults(teamId, "view");
```

### Accepting an Invitation
```javascript
const result = await teamManagement.acceptInvitation("invitation-token");
if (result.success) {
    console.log("Successfully joined team!");
}
```

## Security Considerations

### Data Protection
- All sensitive data is encrypted in transit and at rest
- Row Level Security ensures users only access authorized data
- Invitation tokens are cryptographically secure
- Result sharing respects user privacy preferences

### Access Control
- Role-based permissions prevent unauthorized access
- Team boundaries prevent cross-team data leakage
- External team indicators clearly show data sharing scope
- Audit trails track all team management activities

### Privacy Features
- Users control their own result sharing
- External team indicators warn about cross-organization sharing
- Expiration dates on invitations and sharing permissions
- Ability to revoke sharing permissions at any time

## Testing

### Test Page
Use `test-team-management.html` to test the complete functionality:

1. **Load Demo Data**: Click "Load Demo Data" to populate sample teams
2. **Create Teams**: Test team creation with various configurations
3. **Invite Members**: Test the invitation system
4. **Join Teams**: Test joining with invitation tokens
5. **Share Results**: Test result sharing functionality

### Demo Credentials
- **Invitation Token**: `demo-token-123`
- **Demo Teams**: Pre-populated with Marketing Team and External Partners
- **Demo Members**: Sample users with VALID assessment data

## Future Enhancements

### Planned Features
1. **Team Analytics**: Advanced team performance metrics
2. **Bulk Operations**: Invite multiple members at once
3. **Team Templates**: Pre-configured team structures
4. **Integration APIs**: Connect with external HR systems
5. **Advanced Permissions**: Granular permission controls
6. **Team Hierarchies**: Support for nested team structures

### Scalability Considerations
- Database indexing for large team datasets
- Caching for frequently accessed team data
- Pagination for team member lists
- Background processing for bulk operations

## Support and Maintenance

### Monitoring
- Track team creation and member activity
- Monitor invitation acceptance rates
- Alert on unusual team management patterns
- Performance metrics for team operations

### Maintenance
- Regular cleanup of expired invitations
- Archive inactive teams and members
- Database optimization for large datasets
- Security audit reviews

---

This team management system provides a robust foundation for collaborative VALID assessment work while maintaining security, privacy, and user control over their data. 