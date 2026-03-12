const fs = require("fs");
const path = require("path");

const deleteLocalFile = (relativeUrl = "") => {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) {
    return;
  }

  const absolutePath = path.join(__dirname, "..", relativeUrl);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

module.exports = {
  deleteLocalFile,
};
