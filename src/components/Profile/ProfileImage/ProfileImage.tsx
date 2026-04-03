import clsx from 'clsx'
import Image from 'next/image'
import useProfilePicture from '@/hooks/useProfilePicture'

type ImageOptions = {
  circular?: boolean
  border?: boolean
}

const ProfileImage = (options: ImageOptions = {}) => {
  const profilePicture = useProfilePicture()

  const profilePictureClasses = clsx(
    'relative flex items-center justify-center w-24 h-24 overflow-hidden bg-white shadow-sm',
    { 'rounded-full': options.circular },
    { 'ring-2 ring-gray-300': options.border },
  )

  return (
    <>
      {profilePicture && (
        <div className={profilePictureClasses}>
          <Image src={profilePicture} alt="Profile" fill className="object-cover" />
        </div>
      )}
    </>
  )
}

export default ProfileImage
