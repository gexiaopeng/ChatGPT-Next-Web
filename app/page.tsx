
import { Home } from "./components/home";

import { getServerSideConfig } from "./config/server";

const serverConfig = getServerSideConfig();

export default async function App() {
    //console.log("--serverConfig--",serverConfig);
  return (
    <>
      <Home />
    </>
  );
}
