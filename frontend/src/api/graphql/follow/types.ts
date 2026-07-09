// Follow feature types

export interface FollowUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
  coverPhoto?: string;
}

export interface FollowPayload {
  success: boolean;
  message: string;
  data?: FollowUser;
}

export interface FollowCount {
  followers: number;
  following: number;
}

export interface UserWithFollowStatus extends FollowUser {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}
