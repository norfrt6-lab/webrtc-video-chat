function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/`/g, "&#96;");
}

function validatePayload(data, requiredFields) {
  if (!data || typeof data !== "object") return false;
  return requiredFields.every((field) => {
    const val = data[field];
    return val !== undefined && val !== null;
  });
}

function validateString(value, maxLength = 255) {
  return (
    typeof value === "string" && value.length > 0 && value.length <= maxLength
  );
}

module.exports = { escapeHtml, validatePayload, validateString };
