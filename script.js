"use strict";
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
