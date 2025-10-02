import { ProfileLinkProps } from "../Profile/ProfileLink/ProfileLink";
import ProfileLink from "../Profile/ProfileLink/ProfileLink";

interface ProjectLinksProps {
  links?: ProfileLinkProps[];
  projectIndex: number;
}

const ProjectLinks = ({ links, projectIndex }: ProjectLinksProps) => {
  const linksToRender =
    !links || links.length === 0
      ? [
          {
            icon: "",
            link: "",
            name: "",
          },
        ]
      : links;
  return (
    <ul className="flex flex-row mt">
      {linksToRender.map((link, index) => (
        <li
          key={index}
          className="flex items-center leading-none  border-primary-500"
        >
          <ProfileLink
            className="px-1 underline"
            {...link}
            nameYamlPath={`projects.${projectIndex}.links.${index}.name`}
            linkYamlPath={`projects.${projectIndex}.links.${index}.link`}
          />
          {index !== linksToRender.length - 1 && (
            <span className="mx-1">·</span>
          )}
        </li>
      ))}
    </ul>
  );
};

export default ProjectLinks;
