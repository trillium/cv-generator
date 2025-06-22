import useProfilePicture from "../../../hooks/useProfilePicture";
import clsx from "clsx";

type ImageOptions = {
  circular?: boolean;
  border?: boolean;
};

const ProfileImage = (options: ImageOptions = {}) => {
  const profilePicture = useProfilePicture();

  const profilePictureClasses = clsx(
    "flex items-center justify-center w-24 h-24 overflow-hidden bg-white shadow-sm",
    { "rounded-full": options.circular },
    { "ring-2 ring-gray-300": options.border },
  );

  return (
    <>
      {profilePicture && (
        <div className={profilePictureClasses}>
          <img src={profilePicture} alt="Profile" />
        </div>
      )}
    </>
  );
};

export default ProfileImage;
