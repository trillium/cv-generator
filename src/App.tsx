import scriptData from "./script-data.json";
import fallbackData from "./data.json";
import "./App.css";

import Projects from "./components/Projects/Projects";
import WorkExperience from "./components/WorkExperience/WorkExperience";
import Header from "./components/Header/Header";
import Profile from "./components/Profile/Profile";

import defualtObject from "./lib/defualtObject";

import type { CVData } from "./types";

const data: CVData = defualtObject(scriptData, fallbackData);

function App() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center ">
      <div className="grid grid-cols-10 gap-10 w-full max-w-6xl mx-auto rounded-md bg-white">
        <div className="col-span-7 flex flex-col gap-2">
          <Header {...data.header} />
          <WorkExperience data={data.workExperience} />
          {Array.isArray(data.projects) && data.projects.length > 0 && (
            <Projects data={data.projects} />
          )}
        </div>
        <div className="col-span-3 flex flex-col border-primary-500 border-l px-4 bg-neutral-100 rounded-r-md max-w-xs w-full">
          <Profile data={data} />
        </div>
      </div>
    </div>
  );
}

export default App;
