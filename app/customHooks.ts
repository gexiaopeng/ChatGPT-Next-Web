// customHooks.ts
import { useState } from "react";

export const useSettings = () => {
    const [openSettings, setOpenSettings] = useState(false);

    return {
        openSettings,
        setOpenSettings,
        // add any other necessary state or functions here
    };
};