import Title from "../Title/Title";
import ProfileImage from "./ProfileImage/ProfileImage";
import ProfileLanguages, {
  type Language,
} from "./ProfileLanguages/ProfileLanguages";
import ProfileLink, { ProfileLinkProps } from "./ProfileLink/ProfileLink";
import BubbleList from "../Bubble/BubbleList";

type TechnicalCategory = {
  category: string;
  bubbles: string[];
};

type Education = {
  degree: string;
  school: string;
  location: string;
  years: string;
};

type Data = {
  profile: {
    shouldDisplayProfileImage: boolean;
    lines: string[];
    links: ProfileLinkProps[];
  };
  technical: TechnicalCategory[];
  languages?: Language[];
  education?: Education[];
};

export const ProfileHeader = ({
  lines,
  links,
  shouldDisplayProfileImage,
}: Data["profile"]) => {
  return (
    <div className="flex flex-col items-startr ">
      {shouldDisplayProfileImage && (
        <ProfileImage circular={true} border={true} />
      )}
      <Title text="Contact" />
      <div className="flex flex-col items-start">
        {lines.map((line, index) => (
          <p key={index} className="text-base text-neutral-700 m-0">
            {line}
          </p>
        ))}
      </div>
      <div className="flex flex-row flex-wrap gap-2 mt-2">
        {links.map((link, index) => {
          return (
            <ProfileLink
              key={index}
              {...link}
              nameYamlPath={`profile.links.${index}.name`}
              linkYamlPath={`profile.links.${index}.link`}
            />
          );
        })}
      </div>
    </div>
  );
};

const ProfileSkills = ({ technical }: { technical: TechnicalCategory[] }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Title text="Technical Skills" />
      {technical &&
        technical.map((tech, index) => {
          return (
            <div key={`${tech}${index}`} className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-neutral-700 mb-1">
                {tech.category}
              </span>
              <BubbleList
                bubbles={tech.bubbles}
                className="flex-wrap gap-0.5 gap-y-1"
              />
            </div>
          );
        })}
    </div>
  );
};

const ProfileEducation = ({ education }: { education?: Education[] }) => {
  if (!education || education.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 w-full">
      <Title text="Education" />
      <div className="flex flex-col gap-2">
        {education.map((edu, index) => {
          return (
            <div className="flex flex-col gap-0.5" key={index}>
              <span className="font-semibold text-sm">{edu.degree}</span>
              <span className="text-base">{edu.school}</span>
              <span className="text-xs text-neutral-500">{edu.location}</span>
              <span className="text-xs text-neutral-500">{edu.years}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Profile = ({ data }: { data: Data }) => {
  // Use smart defaults for languages and education
  const languages = data.languages ?? [];
  const education = data.education ?? [];
  return (
    <div className="flex flex-col gap-4 w-full">
      <ProfileHeader {...data.profile} />
      <ProfileSkills technical={data.technical} />
      <ProfileLanguages languages={languages} showAbbreviation={false} />
      <ProfileEducation education={education} />
    </div>
  );
};

export default Profile;
