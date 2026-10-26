"use strict";
<<<<<<< HEAD
// Обрав Vue 3: шаблони й computed працюють через CDN без етапу збірки.
// Ручний renderWorkouts замінено WorkoutRow та декларативними циклами.
const WorkoutRow = {
  name: "WorkoutRow",
  props: { type: { type: String, required: true }, minutes: { type: Number, required: true }, calories: { type: Number, required: true } },
  emits: ["increase"],
  computed: {
    caloriesPerMinute() {
      return this.minutes > 0 && Number.isFinite(this.minutes) && Number.isFinite(this.calories)
        ? (this.calories / this.minutes).toLocaleString("uk-UA", { maximumFractionDigits: 2 }) : "Немає даних";
    },
  },
  template: `<article class="workout-card" :class="minutes < 30 ? 'short' : 'long'" :data-calories="calories">
    <h3 class="workout-title">{{ type }}</h3>
    <p class="workout-metrics">{{ minutes }} хв, {{ calories }} ккал</p>
    <p class="workout-rate">{{ caloriesPerMinute }} ккал/хв</p>
    <button class="btn" type="button" @click="$emit('increase')">Додати 5 хв</button>
  </article>`,
};
Vue.createApp({
  name: "WorkoutApp",
  components: { WorkoutRow },
  data() {
    return {
      workouts: [
        { id: 1, type: "Біг", minutes: 25, calories: 240 },
        { id: 2, type: "Силове тренування", minutes: 50, calories: 550 },
        { id: 3, type: "Велосипед", minutes: 40, calories: 380 },
      ],
      nextId: 4, form: { type: "", minutes: "", calories: "", date: "" },
      apiItems: [], loading: false, apiError: "", stale: false,
    };
  },
  computed: {
    totalCalories() { return this.workouts.reduce((sum, w) => sum + w.calories, 0); },
    totalMinutes() { return this.workouts.reduce((sum, w) => sum + w.minutes, 0); },
    caloriesError() {
      const value = Number(this.form.calories);
      return this.form.calories !== "" && (!Number.isFinite(value) || value < 1 || value > 2000)
        ? "Кількість калорій має бути від 1 до 2000 ккал." : "";
    },
    intensity() {
      const m = Number(this.form.minutes), c = Number(this.form.calories);
      return Number.isInteger(m) && m > 0 && Number.isInteger(c) && c >= 1 && !this.caloriesError
        ? `${(c / m).toLocaleString("uk-UA", { maximumFractionDigits: 2 })} ккал/хв` : "Введіть коректні тривалість і калорії";
    },
    apiSummary() {
      if (this.stale) return "Показано раніше завантажені дані. Оновлення не виконано.";
      return this.apiItems.length ? `Отримано вправ: ${this.apiItems.length}. Виконано: ${this.apiItems.filter(i => i.completed).length}.` : "Журнал поки що порожній.";
    },
  },
  methods: {
    addWorkout() {
      const minutes = Number(this.form.minutes), calories = Number(this.form.calories);
      if (!this.form.type || !Number.isInteger(minutes) || minutes < 1 || !Number.isInteger(calories) || calories < 1 || this.caloriesError) return;
      this.workouts.push({ id: this.nextId++, type: this.form.type, minutes, calories, date: this.form.date });
      this.form = { type: "", minutes: "", calories: "", date: "" };
    },
    increaseMinutes(id) {
      const item = this.workouts.find(w => w.id === id);
      if (item) item.minutes += 5;
    },
    async loadWorkouts() {
      if (this.loading) return;
      this.loading = true; this.apiError = ""; this.stale = false;
      try {
        const response = await fetch("https://jsonplaceholder.typicode.com/todos?userId=4");
        if (!response.ok) throw Object.assign(new Error("HTTP"), { httpStatus: response.status });
        const data = await response.json();
        if (!Array.isArray(data) || !data.every(i => i && Number.isInteger(i.id) && typeof i.title === "string" && typeof i.completed === "boolean") || new Set(data.map(i => i.id)).size !== data.length) throw new SyntaxError("Невідповідна структура відповіді API");
        this.apiItems = data;
      } catch (error) {
        this.apiError = error.httpStatus ? "Не вдалося завантажити журнал із сервера. Спробуйте пізніше."
          : error instanceof SyntaxError ? "Сервер повернув некоректні дані. Спробуйте пізніше." : "Журнал тренувань недоступний офлайн";
        this.stale = this.apiItems.length > 0;
      } finally { this.loading = false; }
    },
  },
  mounted() { this.loadWorkouts(); },
}).mount("#app");
=======

console.log("script.js підключено");

const workouts = [
  { type: "Біг", minutes: 25, calories: 240 },
  { type: "Силове тренування", minutes: 50, calories: 550 },
  { type: "Велосипед", minutes: 40, calories: 380 },
];
const listContainer = document.querySelector("#workouts-list");
const placeholder = document.querySelector("#workouts-list .workout-card");
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
    return "коротке";
  } else {
    return "довге";
  }
}

// Повертає округлену кількість кілокалорій за хвилину тренування.
const caloriesPerMinute = (w) => Math.round(w.calories / w.minutes);

// Перебудовує список із масиву без дублювання карток та оновлює підсумок.
function renderWorkouts(items, container = listContainer, fromApi = false) {
  container.replaceChildren();
  for (const workout of items) {
    const card = document.createElement("article");
    card.classList.add("workout-card");
    if (!fromApi) {
      card.classList.add(
        classifyWorkout(workout) === "коротке" ? "short" : "long",
      );
      card.dataset.calories = workout.calories;
    }

    const title = document.createElement("h3");
    title.classList.add("workout-title");
    title.textContent = fromApi ? workout.title : workout.type;

    const details = document.createElement("p");
    details.classList.add("workout-metrics");
    details.textContent = fromApi
      ? workout.completed
        ? "Виконано"
        : "Не виконано"
      : `${workout.minutes} хв, ${workout.calories} ккал`;

    card.append(title, details);
    container.append(card);
  }
  if (!fromApi) {
    document.querySelector("#total-calories").textContent =
      `${calculateTotalCalories(items)} ккал`;
  }
}

renderWorkouts(workouts);

const API_URL = "https://jsonplaceholder.typicode.com/todos?userId=4";
const apiList = document.querySelector("#api-workouts-list");
const refreshButton = document.querySelector("#refresh-workouts");
const loadingMessage = document.querySelector("#api-loading");
const errorMessage = document.querySelector("#api-error");
const apiSummary = document.querySelector("#api-summary");

// Отримує навчальні вправи з https://jsonplaceholder.typicode.com/todos?userId=4.
async function loadWorkouts() {
  if (refreshButton.disabled) return;
  refreshButton.disabled = true;
  loadingMessage.hidden = false;
  errorMessage.hidden = true;
  errorMessage.textContent = "";
  apiList.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const error = new Error(`Сервер відповів кодом ${response.status}`);
      error.httpStatus = response.status;
      throw error;
    }
    const data = await response.json();
    if (
      !Array.isArray(data) ||
      !data.every(
        (item) =>
          item &&
          typeof item.title === "string" &&
          typeof item.completed === "boolean",
      )
    ) {
      throw new SyntaxError("Невідповідна структура відповіді API");
    }
    console.log("Відповідь API:", data);
    renderWorkouts(data, apiList, true);
    apiSummary.textContent = data.length
      ? `Отримано вправ: ${data.length}. Виконано: ${data.filter((item) => item.completed).length}.`
      : "Журнал поки що порожній.";
  } catch (error) {
    errorMessage.textContent = error.httpStatus
      ? "Не вдалося завантажити журнал із сервера. Спробуйте пізніше."
      : error instanceof SyntaxError
        ? "Сервер повернув некоректні дані. Спробуйте пізніше."
        : "Журнал тренувань недоступний офлайн";
    errorMessage.hidden = false;
    if (apiList.childElementCount) {
      apiSummary.textContent =
        "Показано раніше завантажені дані. Оновлення не виконано.";
    }
    console.error("Помилка завантаження журналу:", error);
  } finally {
    refreshButton.disabled = false;
    loadingMessage.hidden = true;
    apiList.setAttribute("aria-busy", "false");
  }
}

refreshButton.addEventListener("click", loadWorkouts);
loadWorkouts();

const form = document.querySelector("#workout-form");
const typeInput = document.querySelector("#workout-type");
const minutesInput = document.querySelector("#workout-minutes");
const caloriesInput = document.querySelector("#workout-calories");
const caloriesError = document.querySelector("#calories-error");
const intensityOutput = document.querySelector("#workout-intensity");
caloriesInput.setAttribute("aria-describedby", "calories-error");

function validateCalories() {
  const value = Number(caloriesInput.value);
  const message =
    caloriesInput.value !== "" && (value < 1 || value > 2000)
      ? "Кількість калорій має бути від 1 до 2000 ккал."
      : "";
  caloriesInput.setCustomValidity(message);
  caloriesError.textContent = message;
  caloriesInput.setAttribute(
    "aria-invalid",
    String(!caloriesInput.validity.valid),
  );
}

function updateIntensity() {
  const minutes = Number(minutesInput.value);
  const calories = Number(caloriesInput.value);
  intensityOutput.textContent =
    minutesInput.value !== "" &&
    caloriesInput.value !== "" &&
    minutesInput.validity.valid &&
    caloriesInput.validity.valid &&
    Number.isFinite(minutes) &&
    Number.isFinite(calories) &&
    minutes > 0
      ? `${(calories / minutes).toLocaleString("uk-UA", { maximumFractionDigits: 2 })} ккал/хв`
      : "Введіть коректні тривалість і калорії";
}

// Перевіряє калорії та оновлює інтенсивність під час введення.
caloriesInput.addEventListener("input", () => {
  validateCalories();
  updateIntensity();
});

// Перераховує ккал/хв одразу після зміни тривалості.
minutesInput.addEventListener("input", updateIntensity);

// Додає перевірений запис без перезавантаження сторінки.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  validateCalories();
  if (!form.reportValidity()) return;
  workouts.push({
    type: typeInput.value,
    minutes: Number(minutesInput.value),
    calories: Number(caloriesInput.value),
  });
  renderWorkouts(workouts);
  form.reset();
  caloriesInput.setCustomValidity("");
  caloriesInput.removeAttribute("aria-invalid");
  caloriesError.textContent = "";
  intensityOutput.textContent = "Введіть тривалість і калорії";
});

console.log(`Кількість тренувань: ${workouts.length}`);
console.log(`Загалом спалено: ${calculateTotalCalories(workouts)} ккал`);

for (const workout of workouts) {
  console.log(
    `${workout.type}: ${workout.minutes} хв, ${workout.calories} ккал; ` +
      `${classifyWorkout(workout)}; ${caloriesPerMinute(workout)} ккал/хв`,
  );
}
>>>>>>> be0801a3a60cbc7b662a95e23508c0b10e6a3a6e
