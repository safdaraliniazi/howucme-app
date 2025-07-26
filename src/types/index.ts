import { User } from 'firebase/auth';

export type PrivacyLevel = 'public' | 'relationships' | 'family' | 'private';

export interface PrivacySettings {
  profile: PrivacyLevel; // Who can view full profile
  posts: PrivacyLevel; // Who can see posts
  contact: PrivacyLevel; // Who can message/contact
  bio: PrivacyLevel; // Who can see bio
  relationships: PrivacyLevel; // Who can see relationship list
  family: PrivacyLevel; // Who can see family info
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  bio?: string;
  profilePicUrl?: string;
  coverPhotoUrl?: string;
  location?: string;
  website?: string;
  birthday?: Date;
  familyId?: string | null;
  relationships: string[];
  createdAt: Date;
  privacySettings?: PrivacySettings;
  isProfilePrivate?: boolean; // Quick privacy flag
  allowMessagesFromStrangers?: boolean;
  showOnlineStatus?: boolean;
}

export interface ProfileViewContext {
  viewerUid: string;
  targetUid: string;
  relationship?: Relationship;
  isFamily?: boolean;
  canViewProfile: boolean;
  canViewPosts: boolean;
  canMessage: boolean;
  canViewBio: boolean;
  canViewRelationships: boolean;
  canViewFamily: boolean;
}

export interface Post {
  id: string;
  fromUid: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  anonymous: boolean;
  type?: 'regular' | 'celebration' | 'recognition' | 'achievement';
  celebrationType?: 'birthday' | 'anniversary' | 'milestone' | 'achievement';
  recognitionType?: 'appreciation' | 'helper' | 'supporter' | 'motivator';
  targetUserId?: string; // For recognition posts
  achievementId?: string; // For achievement posts
  reactions: {
    heart: number;
    sparkles: number;
    clap: number;
    star: number;
    [key: string]: number;
  };
  userReactions: {
    [userId: string]: string; // userId -> reactionType
  };
  createdAt: Date;
}

export interface Relationship {
  id: string;
  from: string; // userId who sent the request
  to: string;   // userId who received the request
  label: string; // "Brother", "Sister", "Best Friend", etc.
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
  acceptedAt?: Date;
  fromUserName?: string; // Cache for display
  toUserName?: string;   // Cache for display
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  values?: string[];
  crestUrl?: string;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  inviteCode?: string;
  memberCount: number;
  maxMembers?: number;
  members: FamilyMember[];
  rituals: FamilyRitual[];
}

export interface Milestone {
  id: string;
  uid: string;
  achievements: {
    name: string;
    date: Date;
  }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'kindness' | 'relationships' | 'engagement' | 'milestones' | 'social';
  icon: string;
  criteria: {
    type: 'post_count' | 'reaction_count' | 'relationship_count' | 'days_active' | 'celebrations';
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'total';
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: number; // Current progress towards achievement
  isDisplayed: boolean; // Whether user wants to display this badge
}

export interface Celebration {
  id: string;
  type: 'birthday' | 'anniversary' | 'milestone' | 'achievement' | 'custom';
  title: string;
  description?: string;
  date: Date;
  userId: string; // Who the celebration is for
  createdBy: string; // Who created the celebration
  participants: string[]; // Users who are celebrating
  isPublic: boolean;
  reminderSet: boolean;
  createdAt: Date;
}

export interface Recognition {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'appreciation' | 'helper' | 'supporter' | 'motivator' | 'inspiration' | 'kindness';
  message: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
}

// Family System Types
export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: FamilyRole;
  customTitle?: string;
  joinedAt: Date;
  invitedBy: string;
  isActive: boolean;
  permissions: FamilyPermissions;
}

export interface FamilyRole {
  id: string;
  name: string;
  type: 'parent' | 'sibling' | 'extended' | 'custom';
  icon: string;
  description?: string;
  isDefault?: boolean;
}

export interface FamilyPermissions {
  canInviteMembers: boolean;
  canManageRoles: boolean;
  canCreateEvents: boolean;
  canModerateContent: boolean;
  canManageFamily: boolean;
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  familyName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toEmail?: string;
  proposedRole: FamilyRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface FamilyEvent {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  type: 'celebration' | 'gathering' | 'milestone' | 'tradition' | 'custom';
  date: Date;
  createdBy: string;
  participants: string[];
  isRecurring?: boolean;
  recurringPattern?: 'weekly' | 'monthly' | 'yearly';
  location?: string;
  isPrivate: boolean;
}

export interface FamilyRitual {
  id: string;
  familyId: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  frequency: string; // e.g., "Every Sunday", "Monthly"
  participants: string[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface FamilyPost {
  id: string;
  familyId: string;
  fromUid: string;
  content: string;
  type: 'update' | 'memory' | 'announcement' | 'question';
  attachments?: string[];
  reactions: {
    [reactionType: string]: number;
  };
  userReactions: {
    [userId: string]: string;
  };
  comments?: FamilyComment[];
  isPrivate: boolean;
  createdAt: Date;
}

export interface FamilyComment {
  id: string;
  postId: string;
  fromUid: string;
  content: string;
  createdAt: Date;
}

// Community and Discovery Types
export interface Community {
  id: string;
  name: string;
  description: string;
  category: CommunityCategory;
  tags: string[];
  coverImageUrl?: string;
  iconUrl?: string;
  createdBy: string;
  moderators: string[];
  memberCount: number;
  maxMembers?: number;
  isPublic: boolean;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rules: string[];
  welcomeMessage?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface CommunityCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: CommunityRole;
  joinedAt: Date;
  isActive: boolean;
  permissions: CommunityPermissions;
}

export interface CommunityRole {
  id: string;
  name: string;
  type: 'owner' | 'moderator' | 'member' | 'guest';
  icon: string;
  description: string;
  isDefault: boolean;
}

export interface CommunityPermissions {
  canInviteMembers: boolean;
  canModerateContent: boolean;
  canCreateEvents: boolean;
  canManageCommunity: boolean;
  canBanMembers: boolean;
}

export interface JoinRequest {
  id: string;
  targetType: 'family' | 'community';
  targetId: string;
  targetName: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  fromUid: string;
  content: string;
  type: 'discussion' | 'question' | 'announcement' | 'event' | 'resource';
  tags: string[];
  attachments?: string[];
  reactions: { [key: string]: number };
  userReactions: { [userId: string]: string };
  comments: CommunityComment[];
  isPinned: boolean;
  isModerated: boolean;
  createdAt: Date;
}

export interface CommunityComment {
  id: string;
  postId: string;
  communityId: string;
  fromUid: string;
  content: string;
  reactions: { [key: string]: number };
  userReactions: { [userId: string]: string };
  createdAt: Date;
}

export interface CommunityEvent {
  id: string;
  communityId?: string;
  familyId?: string;
  title: string;
  description: string;
  type: 'meetup' | 'workshop' | 'social' | 'support' | 'celebration' | 'activity';
  location: {
    type: 'online' | 'physical' | 'hybrid';
    address?: string;
    city?: string;
    state?: string;
    virtualLink?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dateTime: Date;
  endDateTime?: Date;
  maxAttendees?: number;
  attendees: string[];
  isPublic: boolean;
  requirements?: string[];
  tags: string[];
  createdBy: string;
  createdAt: Date;
  rsvpDeadline?: Date;
}

export interface DiscoveryPreferences {
  userId: string;
  interests: string[];
  preferredCommunityTypes: string[];
  locationRadius?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  familySize?: {
    min: number;
    max: number;
  };
  values: string[];
  dealBreakers: string[];
  isOpenToNewConnections: boolean;
  updatedAt: Date;
}

export interface UserConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  connectionType: 'friend' | 'family-member' | 'community-member' | 'mentor' | 'mentee';
  sharedCommunities: string[];
  sharedFamilies: string[];
  createdAt: Date;
  acceptedAt?: Date;
}

// Enhanced Event System Types
export interface EnhancedCommunityEvent {
  id: string;
  communityId: string;
  title: string;
  description: string;
  type: 'meeting' | 'workshop' | 'social' | 'virtual' | 'hybrid';
  dateTime: Date;
  endDateTime?: Date;
  location: {
    type: 'physical' | 'virtual' | 'hybrid';
    address?: string;
    virtualLink?: string;
    room?: string;
  };
  maxAttendees?: number;
  attendees: EventAttendee[];
  waitlist: EventWaitlist[];
  recurring?: {
    frequency: 'weekly' | 'monthly' | 'custom';
    endDate?: Date;
    customPattern?: string;
  };
  createdBy: string;
  tags: string[];
  isPublic: boolean;
  rsvpRequired: boolean;
  rsvpDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  userId: string;
  userName: string;
  userEmail: string;
  rsvpStatus: 'attending' | 'maybe' | 'not_attending';
  rsvpAt: Date;
  checkedIn?: boolean;
  checkedInAt?: Date;
}

export interface EventWaitlist {
  userId: string;
  userName: string;
  userEmail: string;
  joinedWaitlistAt: Date;
  position: number;
}

// Messaging System Types
export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage: {
    content: string;
    fromUserId: string;
    fromUserName: string;
    timestamp: Date;
    type: 'text' | 'image' | 'file' | 'system';
  };
  updatedAt: Date;
  isGroupChat: boolean;
  groupName?: string;
  groupAvatar?: string;
  communityContext?: {
    communityId: string;
    communityName: string;
  };
  createdAt: Date;
  createdBy: string;
}

export interface Message {
  id: string;
  conversationId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  readBy: MessageReadReceipt[];
  createdAt: Date;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    content: string;
    fromUserName: string;
  };
  reactions?: MessageReaction[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'video';
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface MessageReadReceipt {
  userId: string;
  readAt: Date;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

// Moderation System Types
export interface ModerationQueue {
  id: string;
  contentType: 'post' | 'comment' | 'message' | 'profile' | 'event';
  contentId: string;
  content: any;
  reportedBy: ModerationReport[];
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderatorNotes: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  autoFlagged: boolean;
  flagReason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

export interface ModerationReport {
  reporterId: string;
  reporterName: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'violence' | 'other';
  description: string;
  reportedAt: Date;
}

export interface MemberAction {
  id: string;
  communityId: string;
  targetUserId: string;
  targetUserName: string;
  actionType: 'warning' | 'mute' | 'suspend' | 'ban' | 'remove';
  duration?: number; // hours
  reason: string;
  moderatorId: string;
  moderatorName: string;
  appealable: boolean;
  expiresAt?: Date;
  createdAt: Date;
  status: 'active' | 'expired' | 'appealed' | 'reversed';
}

// Notification System Types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'event' | 'community' | 'moderation' | 'system' | 'achievement';
  title: string;
  content: string;
  data: any;
  channels: ('push' | 'email' | 'in-app')[];
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  imageUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Community Customization Types
export interface CommunityTheme {
  id: string;
  communityId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  faviconUrl?: string;
  customCSS?: string;
  layout: 'default' | 'modern' | 'minimal' | 'magazine';
  fonts: {
    heading: string;
    body: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

// Community Polls Types
export interface CommunityPoll {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  allowMultipleChoices: boolean;
  allowAddOptions: boolean;
  isAnonymous: boolean;
  expiresAt?: Date;
  status: 'active' | 'closed' | 'draft';
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  votes: PollVote[];
  voteCount: number;
}

export interface PollVote {
  userId: string;
  userName: string;
  votedAt: Date;
}

// Note: Achievement interface is defined earlier in the file

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
  communityId?: string;
  progress?: number;
  isVisible: boolean;
}
