const { join } = require("path");

// Keeps the downloaded Chrome inside the repo so it survives into the deployed
// container. The default cache lives in the home directory, which Render's build
// step discards, and the route then fails with "Could not find Chrome".
module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
