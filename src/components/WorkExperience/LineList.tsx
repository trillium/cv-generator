import clsx from "clsx";
import EditableField from "../EditableField";

type Line = { text: string; bulletPoint?: boolean };

function LineList({
  lines = [],
  className = "",
  yamlBasePath = "",
}: {
  lines?: Line[];
  className?: string;
  yamlBasePath?: string;
}) {
  const lines_ = lines.length > 0 ? lines : [{ text: "", bulletPoint: true }];
  return (
    <ul className={clsx("flex flex-col list-none p-0 m-0", className)}>
      {lines_.map((line, line_index) => {
        const showBullet = line.bulletPoint !== false;
        const yamlPath = yamlBasePath
          ? `${yamlBasePath}.lines.${line_index}.text`
          : "";

        return (
          <li
            key={line_index}
            className={clsx("text-base flex items-start", {
              "list-disc ml-4": showBullet,
            })}
          >
            {showBullet && <span className="text-gray-600 mr-2">•</span>}
            {yamlPath ? (
              <EditableField
                yamlPath={yamlPath}
                value={line.text}
                fieldType="textarea"
              >
                <div className="flex-1">{line.text}</div>
              </EditableField>
            ) : (
              <div className="flex-1">{line.text}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default LineList;
