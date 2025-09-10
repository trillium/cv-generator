import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter, FaBluesky, FaPhone } from "react-icons/fa6";
import { BsGlobe } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import { ProfileLinkProps } from "../Profile/ProfileLink/ProfileLink";
import EditableField from "../EditableField";

interface ProjectLinksProps {
  links?: ProfileLinkProps[];
  projectIndex: number;
}

const ProjectLinks = ({ links, projectIndex }: ProjectLinksProps) => {
  if (!links || links.length === 0) return null;
  return (
    <ul className="flex flex-row mt">
      {links.map((link, index) => (
        <li
          key={index}
          className="flex items-center leading-none  border-primary-500"
        >
          <EditableLinkItem
            link={link}
            linkIndex={index}
            projectIndex={projectIndex}
          />
          {index !== links.length - 1 && <span className="mx-1">·</span>}
        </li>
      ))}
    </ul>
  );
};

interface EditableLinkItemProps {
  link: ProfileLinkProps;
  linkIndex: number;
  projectIndex: number;
}

function EditableLinkItem({
  link,
  linkIndex,
  projectIndex,
}: EditableLinkItemProps) {
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
      default:
        return null;
    }
  };

  return (
    <div className="px-1 underline font-semibold text-inherit flex items-center gap-2">
      {/* Icon */}
      {getIcon(link.icon)}

      {/* Editable link text - either custom name or icon name */}
      <EditableField
        yamlPath={`projects.${projectIndex}.links.${linkIndex}.${link.name ? "name" : "link"}`}
        value={link.name || link.link}
        fieldType="text"
      >
        <span className="text-sm">{link.name || link.icon}</span>
      </EditableField>
    </div>
  );
}

export default ProjectLinks;
