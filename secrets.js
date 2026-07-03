// Re-export the official secret contract via the sync locator.
import { loadSlackDistSync } from "./resolve-slack.js";
export const channelSecrets = loadSlackDistSync("secret-contract-api.js").channelSecrets;
