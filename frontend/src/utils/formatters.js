export const formatSalary = (salary = {}) => {
  if (!salary.min && !salary.max) {
    return "Salary on request";
  }

  const min = salary.min ? `₹${salary.min.toLocaleString("en-IN")}` : "";
  const max = salary.max ? ` - ₹${salary.max.toLocaleString("en-IN")}` : "";
  return `${min}${max}${salary.currency ? ` / ${salary.currency}` : ""}`;
};

export const formatSkills = (skills = []) => skills.filter(Boolean).join(", ");
