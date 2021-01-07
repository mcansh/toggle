var { randomBytes } = require("crypto");

function genCSRF() {
  return randomBytes(100).toString("base64");
}

export { genCSRF };
