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

const form = document.querySelector('#workout-form');
const typeInput = document.querySelector('#workout-type');
const minutesInput = document.querySelector('#workout-minutes');
const caloriesInput = document.querySelector('#workout-calories');
const caloriesError = document.querySelector('#calories-error');
const intensityOutput = document.querySelector('#workout-intensity');
caloriesInput.setAttribute('aria-describedby', 'calories-error');

function validateCalories() {
  const value = Number(caloriesInput.value);
  const message = caloriesInput.value !== '' && (value < 1 || value > 2000)
    ? 'Кількість калорій має бути від 1 до 2000 ккал.' : '';
  caloriesInput.setCustomValidity(message);
  caloriesError.textContent = message;
  caloriesInput.setAttribute('aria-invalid', String(!caloriesInput.validity.valid));
}

function updateIntensity() {
  const minutes = Number(minutesInput.value);
  const calories = Number(caloriesInput.value);
  intensityOutput.textContent = minutesInput.value !== '' && caloriesInput.value !== ''
    && minutesInput.validity.valid && caloriesInput.validity.valid
    && Number.isFinite(minutes) && Number.isFinite(calories) && minutes > 0
    ? `${(calories / minutes).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ккал/хв`
    : 'Введіть коректні тривалість і калорії';
}

// Перевіряє калорії та оновлює інтенсивність під час введення.
caloriesInput.addEventListener('input', () => {
  validateCalories();
  updateIntensity();
});

// Перераховує ккал/хв одразу після зміни тривалості.
minutesInput.addEventListener('input', updateIntensity);

// Додає перевірений запис без перезавантаження сторінки.
form.addEventListener('submit', event => {
  event.preventDefault();
  validateCalories();
  if (!form.reportValidity()) return;
  workouts.push({ type: typeInput.value,
    minutes: Number(minutesInput.value), calories: Number(caloriesInput.value) });
  renderWorkouts(workouts);
  form.reset();
  caloriesInput.setCustomValidity('');
  caloriesInput.removeAttribute('aria-invalid');
  caloriesError.textContent = '';
  intensityOutput.textContent = 'Введіть тривалість і калорії';
});

console.log(`Кількість тренувань: ${workouts.length}`);
console.log(`Загалом спалено: ${calculateTotalCalories(workouts)} ккал`);

for (const workout of workouts) {
  console.log(
    `${workout.type}: ${workout.minutes} хв, ${workout.calories} ккал; ` +
    `${classifyWorkout(workout)}; ${caloriesPerMinute(workout)} ккал/хв`
  );
}
