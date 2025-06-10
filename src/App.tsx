import scriptData from "./script-data.json";
import fallbackData from "./data.json";
import "./App.css";

import Category from "./components/Category/Category";
import Header from "./components/Header/Header";
import Profile from "./components/Profile/Profile";

import type { CVData } from "./types";

function isValidData(data: any): data is CVData {
  return !!(
    data &&
    typeof data === "object" &&
    "header" in data &&
    "workExperience" in data &&
    "profile" in data &&
    "technical" in data &&
    "languages" in data &&
    "education" in data
  );
}

const data: CVData = isValidData(scriptData) ? scriptData : fallbackData;

function App() {
  return (
    <div className="app__container">
      <Header name={data.header.name} resume={data.header.resume} />
      <div className="app__body">
        <div
          className="app__body-left"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <Category data={data.workExperience} />
          {Array.isArray(data.projects) && data.projects.length > 0 && (
            <Category data={data.projects} />
          )}
        </div>
        <div className="app__body-right">
          <Profile data={data} />
        </div>
      </div>
    </div>
  );
}

export default App;
