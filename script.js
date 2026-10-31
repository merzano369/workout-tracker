"use strict";

// Обрав Vue 3: CDN-збірка підтримує шаблони й computed без окремого етапу збірки.
// Ручний renderWorkouts замінено компонентом WorkoutRow та декларативними циклами.

const API_URL = "https://jsonplaceholder.typicode.com/todos?userId=4";
const WORKOUT_TYPES = ["Біг", "Силове тренування", "Велосипед", "Плавання", "HIIT / Кардіо"];

const WorkoutRow = {
  name: "WorkoutRow",
  props: {
    type: { type: String, required: true },
    minutes: { type: Number, required: true },
    calories: { type: Number, required: true },
    date: { type: String, default: "" },
    busy: { type: Boolean, default: false },
  },
  emits: ["increase", "remove"],
  computed: {
    caloriesPerMinute() {
      return this.minutes > 0 && Number.isFinite(this.minutes) && Number.isFinite(this.calories)
        ? (this.calories / this.minutes).toLocaleString("uk-UA", { maximumFractionDigits: 2 })
        : "Немає даних";
    },
    formattedDate() {
      return new Date(`${this.date}T00:00:00`).toLocaleDateString("uk-UA");
    },
  },
  template: `
    <article class="workout-card" :class="minutes < 30 ? 'short' : 'long'" :data-calories="calories">
      <h3 class="workout-title">{{ type }}</h3>
      <time v-if="date" class="workout-date" :datetime="date">{{ formattedDate }}</time>
      <p class="workout-metrics">{{ minutes }} хв, {{ calories }} ккал</p>
      <p class="workout-rate">{{ caloriesPerMinute }} ккал/хв</p>
      <button class="btn" type="button" :disabled="busy" @click="$emit('increase')">Додати 5 хв</button>
      <button class="btn" type="button" :disabled="busy" @click="$emit('remove')">Видалити</button>
    </article>`,
};

Vue.createApp({
  name: "WorkoutApp",
  components: { WorkoutRow },
  data() {
    return {
      workouts: [],
      storageBusy: false,
      storageReady: false,
      storageError: "",
      storageStatus: "Відкриття IndexedDB…",
      form: { type: "", minutes: "", calories: "", date: "" },
      apiItems: [],
      loading: false,
      apiError: "",
      stale: false,
    };
  },
  computed: {
    totalCalories() {
      return this.workouts.reduce((sum, workout) => sum + workout.calories, 0);
    },
    totalMinutes() {
      return this.workouts.reduce((sum, workout) => sum + workout.duration, 0);
    },
    weeklyWorkouts() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (start.getDay() + 6) % 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return this.workouts.filter(workout => {
        if (!workout.date) return false;
        const date = new Date(`${workout.date}T00:00:00`);
        return date >= start && date < end;
      });
    },
    weeklyCount() {
      return this.weeklyWorkouts.length;
    },
    weeklyDuration() {
      return this.weeklyWorkouts.reduce((sum, item) => sum + item.duration, 0);
    },
    caloriesError() {
      const value = Number(this.form.calories);
      return this.form.calories !== "" && (!Number.isInteger(value) || value < 1 || value > 2000)
        ? "Кількість калорій має бути цілим числом від 1 до 2000 ккал."
        : "";
    },
    intensity() {
      const minutes = Number(this.form.minutes);
      const calories = Number(this.form.calories);
      return Number.isSafeInteger(minutes) && minutes > 0 && calories >= 1 && !this.caloriesError
        ? `${(calories / minutes).toLocaleString("uk-UA", { maximumFractionDigits: 2 })} ккал/хв`
        : "Введіть коректні тривалість і калорії";
    },
    apiSummary() {
      if (this.stale) return "Показано раніше завантажені дані. Оновлення не виконано.";
      if (this.loading && !this.apiItems.length) return "";
      return this.apiItems.length
        ? `Отримано вправ: ${this.apiItems.length}. Виконано: ${this.apiItems.filter(item => item.completed).length}.`
        : "Журнал поки що порожній.";
    },
  },
  methods: {
    async initializeStorage() {
      try {
        if (!WorkoutStorage.localMode) {
          await WorkoutStorage.openDB();
          this.storageError = await WorkoutStorage.migrate();
        }
        this.workouts = await WorkoutStorage.getAllItems();
        this.storageReady = true;
        this.storageStatus = WorkoutStorage.localMode ? "Навчальний етап: localStorage" : "Дані зберігаються в IndexedDB";
      } catch (error) {
        this.storageStatus = "Сховище недоступне";
        this.storageError = WorkoutStorage.localMode
          ? "Не вдалося прочитати localStorage. Перевірте дозволи та збережені дані."
          : "Не вдалося відкрити IndexedDB. Дозвольте збереження даних і перезавантажте сторінку.";
      }
    },
    async changeStorage(operation) {
      if (this.storageBusy || !this.storageReady) return false;
      this.storageBusy = true;
      this.storageError = "";
      try {
        await operation();
        this.workouts = await WorkoutStorage.getAllItems();
        return true;
      } catch (error) {
        this.storageError = "Не вдалося зберегти зміну. Перезавантажте журнал і повторіть спробу.";
        return false;
      } finally {
        this.storageBusy = false;
      }
    },
    async addWorkout() {
      const minutes = Number(this.form.minutes);
      const calories = Number(this.form.calories);
      if (!WORKOUT_TYPES.includes(this.form.type) || !Number.isSafeInteger(minutes) || minutes < 1
        || !Number.isInteger(calories) || calories < 1 || this.caloriesError) return;

      const today = new Date();
      const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")].join("-");
      const saved = await this.changeStorage(() => WorkoutStorage.putItem({
        type: this.form.type, duration: minutes, calories, date: this.form.date || localDate,
      }));
      if (saved) this.form = { type: "", minutes: "", calories: "", date: "" };
    },
    async increaseMinutes(id) {
      const workout = this.workouts.find(item => item.id === id);
      if (workout && Number.isSafeInteger(workout.duration + 5)) {
        await this.changeStorage(() => WorkoutStorage.putItem({ ...workout, duration: workout.duration + 5 }));
      }
    },
    async removeWorkout(id) {
      await this.changeStorage(() => WorkoutStorage.deleteItem(id));
    },
    async loadWorkouts() {
      if (this.loading) return;
      this.loading = true;
      this.apiError = "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw Object.assign(new Error("HTTP"), { httpStatus: response.status });
        }
        const data = await response.json();
        if (!Array.isArray(data) || !data.every(item => item && Number.isInteger(item.id)
          && typeof item.title === "string" && typeof item.completed === "boolean")
          || new Set(data.map(item => item.id)).size !== data.length) {
          throw new SyntaxError("Невідповідна структура відповіді API");
        }
        this.apiItems = data;
        this.stale = false;
      } catch (error) {
        this.apiError = error.httpStatus
          ? "Не вдалося завантажити журнал із сервера. Спробуйте пізніше."
          : error instanceof SyntaxError
            ? "Сервер повернув некоректні дані. Спробуйте пізніше."
            : error.name === "AbortError"
              ? "Час очікування відповіді вичерпано. Спробуйте ще раз."
              : "Не вдалося з’єднатися із сервером. Перевірте підключення до мережі.";
        this.stale = this.apiItems.length > 0;
      } finally {
        clearTimeout(timeout);
        this.loading = false;
      }
    },
  },
  mounted() {
    this.initializeStorage();
    this.loadWorkouts();
  },
}).mount("#app");
