import ProfileLink, {
  ProfileLinkProps,
} from "../Profile/ProfileLink/ProfileLink";

interface ProjectLinksProps {
  links?: ProfileLinkProps[];
}

const ProjectLinks = ({ links }: ProjectLinksProps) => {
  if (!links || links.length === 0) return null;
  return (
    <ul className="flex flex-row mt">
      {links.map((link, index) => (
        <li
          key={index}
          className="flex items-center leading-none  border-primary-500"
        >
          <ProfileLink className="px-1 underline" {...link} />
          {index !== links.length - 1 && <span className="mx-1">·</span>}
        </li>
      ))}
    </ul>
  );
};

export default ProjectLinks;
