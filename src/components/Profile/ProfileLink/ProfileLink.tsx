import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter, FaBluesky } from "react-icons/fa6";
import { BsGlobe } from "react-icons/bs";
import { clsx } from "clsx";

export type ProfileLinkProps = {
  /** Only GitHub Twitter LinkedIn Website */
  icon: string;
  /** Please, use without https:// */
  link: string;
  /** Optional: custom display name for the link */
  name?: string;
  className?: string;
};

const ProfileLink = ({ icon, link, name, className }: ProfileLinkProps) => {
  let Icon;

  switch (icon) {
    case "GitHub":
      Icon = <FaGithub />;
      break;
    case "Twitter":
      Icon = <FaSquareXTwitter />;
      break;
    case "LinkedIn":
      Icon = <FaLinkedin />;
      break;
    case "Website":
      Icon = <BsGlobe />;
      break;
    case "Bluesky":
      Icon = <FaBluesky />;
      break;
    case "None":
      Icon = <></>;
      break;
  }

  return (
    <div className={clsx("text-inherit flex items-center gap-2", className)}>
      <a
        href={`https://${link}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-inherit flex items-center gap-2"
      >
        {Icon}
        <span className="text-sm">{name || icon}</span>
      </a>
    </div>
  );
};

export default ProfileLink;
