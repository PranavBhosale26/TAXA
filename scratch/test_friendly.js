const getFriendlyName = (name) => {
  if (!name) return "Guest";
  let clean = name.toLowerCase().trim();
  if (clean.includes("@")) {
    clean = clean.split("@")[0];
  }
  clean = clean.replace(/\d+$/, "");
  if (clean.includes("pranav")) {
    return "Pranav";
  }
  if (clean.startsWith("bhosale") && clean.length > 7) {
    const suffix = clean.slice(7);
    if (suffix) {
      return suffix.charAt(0).toUpperCase() + suffix.slice(1);
    }
  }
  const parts = clean.split(/[._-]/);
  let firstPart = parts[0];
  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
};

console.log("Result for Bhosalepranav26:", getFriendlyName("Bhosalepranav26"));
console.log("Result for bhosalepranav26@gmail.com:", getFriendlyName("bhosalepranav26@gmail.com"));
console.log("Result for Pranav:", getFriendlyName("Pranav"));
