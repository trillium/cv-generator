import * as React from "react";

interface SectionBadgeProps {
  section: string;
}

const SectionBadge: React.FC<SectionBadgeProps> = ({ section }) => (
  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
    {section}
  </span>
);

export default SectionBadge;
