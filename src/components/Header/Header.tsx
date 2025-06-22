export type HeaderProps = {
  name: string;
  title: string[];
  resume: string[];
  omitTitle?: boolean;
  omitBlurb?: boolean;
};

const Header = ({
  name,
  title,
  resume,
  omitTitle = false,
  omitBlurb = false,
}: HeaderProps) => {
  const [first, last] = name.split(" ");
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-sans font-bold leading-tight m-0 text-4xl">
          <span className="text-primary-500">{first}</span>{" "}
          <span className="font-normal">{last}</span>
        </h1>
        {!omitTitle && (
          <div className="my-1">
            {title.map((line, index) => (
              <p key={index} className="m-0 text-xl leading-1.5">
                {line}
              </p>
            ))}
          </div>
        )}
        {!omitBlurb && (
          <div className="mt-2">
            {resume.map((line, index) => (
              <p key={index} className="m-0 text-md leading-[1.3]">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
