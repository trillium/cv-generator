import Title from "../Title/Title";
import ProfileImage from "./ProfileImage/ProfileImage";
import ProfileLanguages from "./ProfileLanguages/ProfileLanguages";
import ProfileLink from "./ProfileLink/ProfileLink";
import EditableField from "../EditableField/EditableField";
import type { TechnicalCategory, Education, CVData } from "../../types";

type Data = Pick<CVData, "profile" | "technical" | "languages" | "education">;

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
          <EditableField
            key={index}
            yamlPath={`profile.lines.${index}`}
            value={line}
            fieldType="text"
          >
            <p
              key={index}
              className="text-base text-neutral-700 dark:text-neutral-300 m-0"
            >
              {line}
            </p>
          </EditableField>
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
  // Ensure technical is always an array, even if undefined/null
  const technicalData =
    Array.isArray(technical) && technical.length > 0
      ? technical
      : [{ category: "", bubbles: [] }];

  return (
    <div className="flex flex-col gap-2 w-full">
      <Title text="Technical Skills" />
      {technicalData.map((tech, index) => {
        return (
          <div
            key={`${tech.category || "default"}-${index}`}
            className="flex flex-col gap-1"
          >
            <EditableField
              yamlPath={`technical.${index}.category`}
              value={tech.category}
              fieldType="text"
            >
              <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                {tech.category}
              </span>
            </EditableField>
            <div className="flex flex-wrap gap-1">
              {tech.bubbles && tech.bubbles.length > 0 ? (
                tech.bubbles.map((bubble, bubbleIndex) => (
                  <EditableField
                    key={bubbleIndex}
                    yamlPath={`technical.${index}.bubbles.${bubbleIndex}`}
                    value={bubble}
                    fieldType="text"
                  >
                    <span className="inline-block px-3 py-0.5 rounded-full text-sm border border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {bubble}
                    </span>
                  </EditableField>
                ))
              ) : (
                <EditableField
                  yamlPath={`technical.${index}.bubbles.0`}
                  value=""
                  fieldType="text"
                >
                  <span className="inline-block px-3 py-0.5 rounded-full text-sm border border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 flex-shrink-0 opacity-50">
                    {""}
                  </span>
                </EditableField>
              )}
            </div>
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
              <EditableField
                yamlPath={`education.${index}.degree`}
                value={edu.degree}
                fieldType="text"
              >
                <span className="font-semibold text-sm">{edu.degree}</span>
              </EditableField>
              <EditableField
                yamlPath={`education.${index}.school`}
                value={edu.school}
                fieldType="text"
              >
                <span className="text-base">{edu.school}</span>
              </EditableField>
              <EditableField
                yamlPath={`education.${index}.location`}
                value={edu.location}
                fieldType="text"
              >
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {edu.location}
                </span>
              </EditableField>
              <EditableField
                yamlPath={`education.${index}.years`}
                value={edu.years}
                fieldType="text"
              >
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {edu.years}
                </span>
              </EditableField>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Profile = ({ data }: { data: Data }) => {
  // Use smart defaults for optional fields
  const technical = data.technical ?? [{ category: "", bubbles: [] }];
  const languages = data.languages ?? [];
  const education = data.education ?? [];
  return (
    <div className="flex flex-col gap-4 w-full">
      <ProfileHeader {...data.profile} />
      <ProfileSkills technical={technical} />
      <ProfileLanguages languages={languages} showAbbreviation={false} />
      <ProfileEducation education={education} />
    </div>
  );
};

export default Profile;
