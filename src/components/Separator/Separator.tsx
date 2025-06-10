import { clsx } from "clsx";

const Separator = ({ className = "my-2.5" }: { className?: string }) => {
  return <div className={clsx("h-px w-full bg-primary-500", className)}></div>;
};

export default Separator;
