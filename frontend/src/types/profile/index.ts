import type { User as UserType } from '../user';
import type { Post as PostType } from '../post';

// Re-export types for convenience
export type { UserType as User };
export type { PostType as Post };

// Form data interfaces
export interface EditFormData {
  firstName: string
  lastName: string
  birthday: string
}

// Component Props Interfaces
export interface CoverPhotoSectionProps {
  profile: UserType | undefined
  coverImgError: boolean
  setCoverImgError: (value: boolean) => void
  uploadingCover: boolean
  onCoverPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isViewOnly?: boolean
}

export interface ProfileInfoSectionProps {
  profile: UserType | undefined
  uploadingProfile: boolean
  postsCount: number
  onProfilePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEditClick: () => void
  isViewOnly?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  followLoading?: boolean
}

export interface PostsSectionProps {
  posts: PostType[]
  postsLoading: boolean
  profilePhoto?: string
}

export interface EditProfileModalProps {
  isOpen: boolean
  editForm: EditFormData
  updating: boolean
  onClose: () => void
  onSave: () => void
  onChange: (form: EditFormData) => void
}

export interface PostAuthorAvatarProps {
  profilePhoto?: string
  authorName: string
}

export interface PostItemProps {
  post: PostType
  profilePhoto?: string
}

export interface ProfileLoadingStateProps {
  message?: string
}
