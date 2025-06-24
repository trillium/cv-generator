import clsx from "clsx";
import type { CVData } from "../../../types";
import ProfileLink from "../../Profile/ProfileLink/ProfileLink";
import ProjectsList from "../../Projects/ProjectsList";
import Separator from "../../Separator/Separator";
import Title from "../../Title/Title";
import WorkExperience from "../../WorkExperience/WorkExperience";

function TwoColumnResume({ data }: { data: CVData }) {
  const showBubbles = true;
  return (
    <>
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-between">
        <div className="w-full max-w-6xl mx-auto rounded-md bg-white">
          <Header data={data} />
          <CareerSummary data={data} />
          <WorkExperience
            data={data.workExperience}
            showBubbles={showBubbles}
          />
          <ProjectsList projects={data.projects} showBubbles={showBubbles} />
        </div>

        <div className="w-full">
          <Footer data={data} />
        </div>
      </div>
    </>
  );
}

export default TwoColumnResume;

function isInfo(obj: any): obj is {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  website: string;
  bluesky?: string;
  role?: string;
} {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.firstName === "string" &&
    typeof obj.lastName === "string" &&
    typeof obj.email === "string" &&
    typeof obj.phone === "string" &&
    typeof obj.website === "string"
  );
}

function Header({ data }: { data: CVData }) {
  if (!isInfo(data.info)) return null;
  const { firstName, lastName, role, email, phone, website } = data.info;
  const singleLineNameAndRole = false;
  return (
    <header>
      <div
        className={clsx({
          "flex flex-row justify-center items-baseline gap-x-3 text-4xl":
            singleLineNameAndRole,
        })}
      >
        <div className="flex justify-center">
          <h1 className="text-4xl">
            <span className=" font-semibold text-primary-500">{firstName}</span>{" "}
            <span className="font-normal">{lastName}</span>
          </h1>
        </div>
        <div
          className={clsx("flex justify-center", {
            "font-light border-l-2 border-black px-3 text-gray-700":
              singleLineNameAndRole,
            "text-2xl": !singleLineNameAndRole,
          })}
        >
          <h2 className="">{role}</h2>
        </div>
      </div>
      <div className="flex justify-center">
        <ul>
          <li className="flex justify-center pt-2 gap-x-4">
            <ProfileLink icon="Email" link={email} name={email} />
            <ProfileLink icon="Phone" link={phone} name={phone} />
            <ProfileLink icon="Website" link={website} name={website} />
          </li>
        </ul>
      </div>
    </header>
  );
}

function CareerSummary({ data }: { data: CVData }) {
  const { careerSummary } = data;

  return (
    <section>
      <Title text="Career Summary" />
      <div className="grid grid-cols-10 gap-2">
        {careerSummary.map(({ title, text }, idx) => (
          <>
            <div className="col-span-2 list-none" key={idx}>
              <span className="font-semibold">{title}</span>
            </div>
            <div className="col-span-8 list-none" key={idx}>
              {text}
            </div>
          </>
        ))}
      </div>
    </section>
  );
}

function Footer({ data }: { data: CVData }) {
  const { links } = data.profile;
  const iconOrder = ["GitHub", "LinkedIn", "Bluesky"];
  const footerLinks = iconOrder
    .map((icon) => links.find((link) => link.icon === icon))
    .filter((link): link is { icon: string; link: string; name: string } =>
      Boolean(link && link.icon && link.link && link.name),
    );
  return (
    <>
      <Separator className="" />
      <footer className="flex justify-center pt-2 gap-x-4">
        {footerLinks.map((link, index) => {
          return <ProfileLink key={index} {...link} />;
        })}
      </footer>
    </>
  );
}
