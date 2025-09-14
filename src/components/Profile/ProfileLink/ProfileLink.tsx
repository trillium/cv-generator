import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter, FaBluesky, FaPhone } from "react-icons/fa6";
import { BsGlobe } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import { clsx } from "clsx";
import EditableField from "../../EditableField";
import { useYamlPathUpdater } from "../../../hooks/useYamlPathUpdater";

export type ProfileLinkProps = {
  /** Only GitHub Twitter LinkedIn Website */
  icon: string;
  /** Please, use without https:// */
  link: string;
  /** Optional: custom display name for the link */
  name?: string;
  className?: string;
};

interface EditableProfileLinkProps extends ProfileLinkProps {
  /** YAML path for the link field - required for editing */
  linkYamlPath: string;
  /** YAML path for the name field - required for editing */
  nameYamlPath: string;
}

const ProfileLink = ({
  icon,
  link,
  name,
  className,
  linkYamlPath,
  nameYamlPath,
}: EditableProfileLinkProps) => {
  const { updateYamlPath } = useYamlPathUpdater();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "GitHub":
        return <FaGithub />;
      case "Twitter":
        return <FaSquareXTwitter />;
      case "LinkedIn":
        return <FaLinkedin />;
      case "Website":
        return <BsGlobe />;
      case "Bluesky":
        return <FaBluesky />;
      case "Email":
        return <MdEmail />;
      case "Phone":
        return <FaPhone />;
      case "None":
        return <></>;
      default:
        return null;
    }
  };

  const Icon = getIcon(icon);

  let href: string;
  const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    className: "font-semibold text-inherit flex items-center gap-2",
  };

  if (icon === "Email") {
    href = `mailto:${link}`;
  } else if (icon === "Phone") {
    href = `tel:${link}`;
  } else {
    href = `https://${link}`;
    anchorProps.rel = "noopener noreferrer";
    anchorProps.target = "_blank";
  }

  const handleSaveLink = async (text: string, url: string) => {
    try {
      // Update both text and URL fields
      await updateYamlPath(nameYamlPath, text);
      await updateYamlPath(linkYamlPath, url);
    } catch (error) {
      console.error("Failed to save link:", error);
    }
  };

  // Use the unified link editing approach
  return (
    <div className={clsx("text-inherit flex items-center gap-2", className)}>
      {Icon}
      <EditableField
        fieldType="link"
        value={name || icon}
        yamlPath={nameYamlPath}
        linkData={{
          text: name || icon,
          url: link,
          icon: Icon,
          textYamlPath: nameYamlPath,
          urlYamlPath: linkYamlPath,
          onSaveLink: handleSaveLink,
        }}
      >
        <>
          <a href={href} {...anchorProps} className="print:block hidden">
            <span className="text-sm font-bold">{name || icon}</span>
          </a>
          <div className="block print:hidden">
            <span className="text-sm font-bold">{name || icon}</span>
          </div>
        </>
      </EditableField>
    </div>
  );
};

export default ProfileLink;
