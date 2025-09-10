import clsx from "clsx";
import ProfileLink from "../../../Profile/ProfileLink/ProfileLink";
import EditableField from "../../../EditableField/EditableField";
import type { CVData } from "../../../../types";

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

export default function Header({ data }: { data: CVData }) {
  if (!isInfo(data.info)) return null;
  const { firstName, lastName, role, email, phone, website } = data.info;
  const singleLineNameAndRole = true;
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
            <EditableField
              yamlPath="info.firstName"
              value={firstName}
              fieldType="text"
            >
              <span className=" font-semibold text-primary-500">
                {firstName}
              </span>
            </EditableField>{" "}
            <EditableField
              yamlPath="info.lastName"
              value={lastName}
              fieldType="text"
            >
              <span className="font-normal">{lastName}</span>
            </EditableField>
          </h1>
        </div>
        <div
          className={clsx("flex justify-center", {
            "font-light border-l-2 border-black px-3 text-gray-700":
              singleLineNameAndRole,
            "text-2xl": !singleLineNameAndRole,
          })}
        >
          <EditableField
            yamlPath="info.role"
            value={role || ""}
            fieldType="text"
          >
            <h2 className="">{role}</h2>
          </EditableField>
        </div>
      </div>
      <div className="flex justify-center">
        <ul>
          <li className="flex justify-center pt-2 gap-x-4">
            <EditableField yamlPath="info.email" value={email} fieldType="text">
              <ProfileLink icon="Email" link={email} name={email} />
            </EditableField>
            <EditableField yamlPath="info.phone" value={phone} fieldType="text">
              <ProfileLink icon="Phone" link={phone} name={phone} />
            </EditableField>
            <EditableField
              yamlPath="info.website"
              value={website}
              fieldType="text"
            >
              <ProfileLink icon="Website" link={website} name={website} />
            </EditableField>
          </li>
        </ul>
      </div>
    </header>
  );
}
