var { randomBytes } = require("crypto");

function genCSRF(): string {
  return randomBytes(100).toString("base64");
}

export { genCSRF };
