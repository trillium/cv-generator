import Separator from "../../Separator/Separator";
import ProfileLink from "../../Profile/ProfileLink/ProfileLink";
import type { CVData } from "../../../types";

export default function Footer({ data }: { data: CVData }) {
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
