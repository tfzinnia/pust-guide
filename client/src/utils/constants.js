const currentYear = new Date().getFullYear();
export const SESSIONS = Array.from(
  { length: Math.max(8, currentYear - 2018) },
  (_, index) => `${2020 + index}-${2021 + index}`,
);

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const SEMESTERS = ["1st Semester", "2nd Semester"];

export const DEPT_COLORS = {
  CSE: "bg-blue-100 text-blue-600",
  EEE: "bg-green-100 text-green-600",
  CE: "bg-orange-100 text-orange-600",
  BBA: "bg-purple-100 text-purple-600",
  ENG: "bg-pink-100 text-pink-600",
  MATH: "bg-indigo-100 text-indigo-600",
  PHY: "bg-teal-100 text-teal-600",
  CHEM: "bg-yellow-100 text-yellow-600",
};
