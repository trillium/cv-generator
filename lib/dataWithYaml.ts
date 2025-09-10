import { getDefaultData, type DataWithYaml } from "./data";
import { getYamlData } from "./getYamlData";

export function getDefaultDataWithYaml(): DataWithYaml {
  const data = getDefaultData();
  const yamlContent = getYamlData();

  return {
    data,
    yamlContent,
  };
}
