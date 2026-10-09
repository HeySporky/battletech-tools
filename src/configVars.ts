export const CONST_SITE_TITLE = "Jeff's BattleTech Tools IIC"

export const CONST_HIGHLIGHT_COLOR = "#0000AA"

export const CONST_BATTLETECH_URL = "https://bg.battletech.com";

export const CONST_GITHUB_OWNER = "heysporky";

export const CONST_GITHUB_REPO = "battletech-tools";

// Custom MUL entries are proposed to this repo's shared list (src/data/mul/custom/custom-units.json).
export const CONST_CUSTOM_MUL_GITHUB_OWNER = "ngcfells";
export const CONST_CUSTOM_MUL_GITHUB_REPO = "battletech-tools";

// The Custom MUL Editor's "Submit PR" path asks for a GitHub personal access token in the page and opens a pull
// request with it. It stays off until that path has had a security review and the SSW custom-content submission
// is ready to ship beside it. While it is off, the editor saves entries in this browser only.
export const CONST_CUSTOM_MUL_SUBMISSION_ENABLED = false;

// The public MUL API (masterunitlist.azurewebsites.net) has been deprecated and is no longer reachable.
// Set to true once a working replacement API is available to resume live MUL search/import.
export const CONST_MUL_API_ENABLED = false;
