"use strict";

console.log('script.js підключено');

const workouts = [
  { type: 'Біг', minutes: 25, calories: 240 },
  { type: 'Силове тренування', minutes: 50, calories: 550 },
  { type: 'Велосипед', minutes: 40, calories: 380 },
];
const listContainer = document.querySelector('#workouts-list');
const placeholder = document.querySelector('#workouts-list .workout-card');
if (placeholder) placeholder.remove();

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

// Перебудовує список із масиву без дублювання карток та оновлює підсумок.
function renderWorkouts(items) {
  listContainer.replaceChildren();
  for (const workout of items) {
    const card = document.createElement('article');
    card.classList.add('workout-card');
    card.classList.add(classifyWorkout(workout) === 'коротке' ? 'short' : 'long');
    card.dataset.calories = workout.calories;

    const title = document.createElement('h3');
    title.classList.add('workout-title');
    title.textContent = workout.type;

    const details = document.createElement('p');
    details.classList.add('workout-metrics');
    details.textContent = `${workout.minutes} хв, ${workout.calories} ккал`;

    card.append(title, details);
    listContainer.append(card);
  }
  document.querySelector('#total-calories').textContent =
    `${calculateTotalCalories(items)} ккал`;
}

renderWorkouts(workouts);

console.log(`Кількість тренувань: ${workouts.length}`);
console.log(`Загалом спалено: ${calculateTotalCalories(workouts)} ккал`);

for (const workout of workouts) {
  console.log(
    `${workout.type}: ${workout.minutes} хв, ${workout.calories} ккал; ` +
    `${classifyWorkout(workout)}; ${caloriesPerMinute(workout)} ккал/хв`
  );
}
