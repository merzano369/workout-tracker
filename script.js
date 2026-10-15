"use strict";

console.log('script.js підключено');

const workouts = [
  { type: 'Біг', minutes: 25, calories: 240 },
  { type: 'Силове тренування', minutes: 50, calories: 550 },
  { type: 'Велосипед', minutes: 40, calories: 380 },
];
const longWorkoutMinutes = 30;

// Підсумовує спалені калорії всіх тренувань циклом for.
function calculateTotalCalories(items) {
  let totalCalories = 0;
  for (let i = 0; i < items.length; i++) {
    totalCalories += items[i].calories;
  }
  return totalCalories;
}

// Відносить тренування тривалістю від 30 хвилин до довгих.
function classifyWorkout(workout) {
  if (workout.minutes < longWorkoutMinutes) {
    return 'коротке';
  } else {
    return 'довге';
  }
}

// Повертає округлену кількість кілокалорій за хвилину тренування.
const caloriesPerMinute = w => Math.round(w.calories / w.minutes);

console.log(`Кількість тренувань: ${workouts.length}`);
console.log(`Загалом спалено: ${calculateTotalCalories(workouts)} ккал`);

for (const workout of workouts) {
  console.log(
    `${workout.type}: ${workout.minutes} хв, ${workout.calories} ккал; ` +
    `${classifyWorkout(workout)}; ${caloriesPerMinute(workout)} ккал/хв`
  );
}
