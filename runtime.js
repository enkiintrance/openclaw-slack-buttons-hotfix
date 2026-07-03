// Re-export the official runtime setter via the sync locator.
import { loadSlackDistSync } from "./resolve-slack.js";
export const setSlackRuntime = loadSlackDistSync("runtime-setter-api.js").setSlackRuntime;
