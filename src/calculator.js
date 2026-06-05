/**
 * Calculates Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor equation.
 * 
 * @param {number} age - Age in years.
 * @param {number} weight - Weight in kilograms.
 * @param {number} height - Height in centimeters.
 * @param {number} activityLevel - Multiplier for activity level (e.g. 1.2, 1.375).
 * @param {number} objective - Deficit or surplus calories (e.g. -500, 0, 500).
 * @param {boolean} isMale - True if male, false if female.
 * @returns {number|null} - Calculated daily calorie target or null if inputs are invalid.
 */
export function calculateTdee(age, weight, height, activityLevel, objective, isMale) {
  if (isNaN(age) || isNaN(weight) || isNaN(height)) {
    return null;
  }

  // Mifflin-St Jeor Equation BMR formula
  let bmr = 0;
  if (isMale) {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  return Math.round((bmr * activityLevel) + objective);
}
