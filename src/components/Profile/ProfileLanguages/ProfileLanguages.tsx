import Title from "../../Title/Title";

export type Language = {
  language: string;
  abbreviation: string;
  level: string;
};

const ProfileLanguages = ({
  languages = [],
  showAbbreviation,
}: {
  languages?: Language[];
  showAbbreviation: boolean;
}) => {
  if (!languages || languages.length === 0) return <></>;
  {
    /* display: flex; flex-direction: column; align-items: flex-start; gap:
  0.25em; */
  }
  return (
    <div className="w-full flex flex-col gap-2">
      <Title text="Languages" />
      <div className="flex flex-col items-start gap-1">
        {languages.map((language, index) => {
          return (
            <div
              className="flex items-center gap-2 text-base leading-tight"
              key={index}
            >
              <span className="font-semibold text-gray-700">
                {showAbbreviation && language.abbreviation
                  ? language.abbreviation
                  : language.language}
              </span>
              <span className="text-xs text-gray-500">{language.level}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileLanguages;
