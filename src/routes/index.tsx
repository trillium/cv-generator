import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { resumeComponentMap } from "./$resumeType.resume";
import { coverLetterComponentMap } from "./$resumeType.cover-letter";
import { allVariants } from "../lib/allVariants";

/**
 * For two or more objects, for their matching keys, put the values in an array.
 * Only includes keys present in more than one object.
 *
 * @template T - The type of the object values.
 * @param {Record<string, T>[]} objs - An array of objects to merge.
 * @returns {Record<string, T[]>} An object where each key is present in more than one input object, and the value is an array of all values for that key.
 *
 * @example
 * const a = { foo: 1, bar: 2 };
 * const b = { foo: 3, baz: 4 };
 * mergedObjectValuesInArray([a, b]); // { foo: [1, 3] }
 */
export function mergedObjectValuesInArray<T>(objs: Record<string, T>[]) {
  const result: Record<string, T[]> = {};

  // Collect all unique keys
  const keys = new Set<string>();
  objs.forEach((obj) => Object.keys(obj).forEach((key) => keys.add(key)));

  // For each key, collect values from all objects that have it
  keys.forEach((key) => {
    const values = objs
      .map((obj) => obj[key])
      .filter((val) => val !== undefined);
    if (values.length > 1) {
      // Only include keys present in more than one object
      result[key] = values;
    }
  });

  return result;
}

export const Route = createFileRoute("/")({
  component: ResumeTypeLayout,
});

// Build resumeTypes as a metadata object for rendering
const resumeTypes: Record<
  string,
  Record<string, { label: string; to: string; params: { resumeType: string } }>
> = {};

allVariants.forEach((variant) => {
  resumeTypes[variant] = {};
  if (resumeComponentMap[variant]) {
    resumeTypes[variant]["resume"] = {
      label: `Resume (${variant.replace("-", " ")})`,
      to: "/$resumeType/resume",
      params: { resumeType: variant },
    };
  }
  if (coverLetterComponentMap[variant]) {
    resumeTypes[variant]["cover-letter"] = {
      label: `Cover Letter (${variant.replace("-", " ")})`,
      to: "/$resumeType/cover-letter",
      params: { resumeType: variant },
    };
  }
});

function ResumeTypeLayout() {
  return (
    <div>
      <h2>Available Resume Types</h2>
      <ul>
        {Object.entries(resumeTypes).map(([variant, types]) =>
          Object.entries(types).map(([typeKey, type]) => (
            <li key={typeKey + variant} className="ml-4 underline even:mb-2">
              <Link to={type.to} params={type.params}>
                {type.label}
              </Link>
            </li>
          )),
        )}
      </ul>
      <pre>{JSON.stringify(resumeTypes, null, 2)}</pre>
    </div>
  );
}
