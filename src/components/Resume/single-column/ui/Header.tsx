import clsx from "clsx";
import { useEffect, useRef } from "react";
import ProfileLink from "../../../Profile/ProfileLink/ProfileLink";
import EditableField from "../../../EditableField/EditableField";
import type { CVData } from "../../../../types";

function isInfo(obj: Record<string, unknown>): obj is {
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
    typeof (obj as Record<string, unknown>).firstName === "string" &&
    typeof (obj as Record<string, unknown>).lastName === "string" &&
    typeof (obj as Record<string, unknown>).email === "string" &&
    typeof (obj as Record<string, unknown>).phone === "string" &&
    typeof (obj as Record<string, unknown>).website === "string"
  );
}

export default function Header({ data }: { data: CVData }) {
  const firstNameRef = useRef<HTMLSpanElement>(null);
  const lastNameRef = useRef<HTMLSpanElement>(null);

  // Always call hooks unconditionally
  const infoIsValid = isInfo(data.info as Record<string, unknown>);
  const firstName = infoIsValid ? String(data.info.firstName) : "";
  const lastName = infoIsValid ? String(data.info.lastName) : "";
  const role = infoIsValid ? String(data.info.role ?? "") : "";
  const email = infoIsValid ? String(data.info.email) : "";
  const phone = infoIsValid ? String(data.info.phone) : "";
  const website = infoIsValid ? String(data.info.website) : "";

  useEffect(() => {
    if (firstNameRef.current) {
      const computedStyle = window.getComputedStyle(firstNameRef.current);
      console.log("🚨 First name text color:", computedStyle.color);
    }
  }, [firstName]);

  useEffect(() => {
    if (lastNameRef.current) {
      const computedStyle = window.getComputedStyle(lastNameRef.current);
      console.log("🚨 Last name text color:", computedStyle.color);
    }
  }, [lastName]);

  if (!infoIsValid) return null;

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
              <span
                ref={firstNameRef}
                className=" font-semibold text-primary-500"
              >
                {firstName}
              </span>
            </EditableField>{" "}
            <EditableField
              yamlPath="info.lastName"
              value={lastName}
              fieldType="text"
            >
              <span ref={lastNameRef} className="font-normal dark:text-white">
                {lastName}
              </span>
            </EditableField>
          </h1>
        </div>
        <div
          className={clsx("flex justify-center", {
            "font-light border-l-2 border-black dark:border-white px-3 text-gray-700 dark:text-gray-300":
              singleLineNameAndRole,
            "text-2xl": !singleLineNameAndRole,
          })}
        >
          <EditableField
            yamlPath="info.role"
            value={role || ""}
            fieldType="text"
          >
            <h2 className="dark:text-gray-300">{role}</h2>
          </EditableField>
        </div>
      </div>
      <div className="flex justify-center">
        <ul>
          <li className="flex justify-center pt-2 gap-x-4">
            <EditableField yamlPath="info.email" value={email} fieldType="text">
              <ProfileLink
                icon="Email"
                link={email}
                name={email}
                linkYamlPath="info.email"
                nameYamlPath="info.email"
              />
            </EditableField>
            <EditableField yamlPath="info.phone" value={phone} fieldType="text">
              <ProfileLink
                icon="Phone"
                link={phone}
                name={phone}
                linkYamlPath="info.phone"
                nameYamlPath="info.phone"
              />
            </EditableField>
            <EditableField
              yamlPath="info.website"
              value={website}
              fieldType="text"
            >
              <ProfileLink
                icon="Website"
                link={website}
                name={website}
                linkYamlPath="info.website"
                nameYamlPath="info.website"
              />
            </EditableField>
          </li>
        </ul>
      </div>
    </header>
  );
}
