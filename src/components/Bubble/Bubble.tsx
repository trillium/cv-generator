const Bubble = ({ text }: { text: string }) => {
  return (
    <span className="border border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 px-3 py-0.5 rounded-full flex-shrink-0">
      {text || " "}
    </span>
  );
};

export default Bubble;
