const fs = require("node:fs");

fs.readFileSync("does-not-exist.txt", "utf8");
