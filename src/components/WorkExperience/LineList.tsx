import clsx from "clsx";

type Line = { text: string; bulletPoint?: boolean };

function LineList({
  lines = [],
  className = "",
}: {
  lines?: Line[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col list-none p-0 m-0 ${className}`}>
      {lines.map((line, line_index) => {
        const showBullet = line.bulletPoint !== false;
        return (
          <li
            key={line_index}
            className={clsx("text-base", { "list-disc ml-4": showBullet })}
          >
            {line.text}
          </li>
        );
      })}
    </ul>
  );
}

export default LineList;
