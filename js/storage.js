"use strict";

const WorkoutStorage = (() => {
  const KEY = "workoutTracker.workouts";
  const MIGRATED = "workoutTracker.migrated.v1";
  const localMode = new URLSearchParams(location.search).get("storage") === "local";
  let connection;
  function validDate(value) {
    if (value === "") return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + "T00:00:00");
    return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4))
      && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10));
  }
  // Старі записи з minutes приводяться до моделі duration без втрати калорій.
  function normalize(item) {
    if (!item || typeof item !== "object") throw new Error("Некоректний запис");
    const duration = item.duration ?? item.minutes;
    if (typeof item.type !== "string" || !item.type.trim()
      || !Number.isSafeInteger(duration) || duration < 1
      || !Number.isInteger(item.calories) || item.calories < 1 || item.calories > 2000
      || typeof item.date !== "string" || !validDate(item.date)) throw new Error("Некоректні дані");
    const record = { type: item.type, duration, calories: item.calories, date: item.date };
    if (item.id !== undefined) {
      if (!Number.isSafeInteger(item.id) || item.id < 1) throw new Error("Некоректний id");
      record.id = item.id;
    }
    return record;
  }
  function saveToLocalStorage(items) {
    localStorage.setItem(KEY, JSON.stringify(items.map(normalize)));
  }
  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) throw new Error("Очікується список");
      const records = items.map(normalize);
      const ids = records.filter(item => item.id !== undefined).map(item => item.id);
      if (new Set(ids).size !== ids.length) throw new Error("Повторення id");
      return { items: records, error: "" };
    } catch (error) {
      return { items: [], error: "Не вдалося прочитати localStorage. Початкові дані залишено без змін." };
    }
  }
  // Схема створюється лише під час оновлення версії бази.
  function openDB() {
    if (connection) return Promise.resolve(connection);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("WorkoutTrackerDB", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("workouts")) {
          request.result.createObjectStore("workouts", { keyPath: "id", autoIncrement: true });
        }
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Закрийте інші вкладки застосунку"));
      request.onsuccess = () => {
        connection = request.result;
        connection.onversionchange = () => { connection.close(); connection = undefined; };
        resolve(connection);
      };
    });
  }
  // Запис вважається успішним лише після завершення всієї транзакції.
  async function transact(mode, operation) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workouts", mode);
      const request = operation(tx.objectStore("workouts"));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Транзакцію скасовано"));
    });
  }
  function readLocalItems() {
    const loaded = loadFromLocalStorage();
    if (loaded.error) throw new Error(loaded.error);
    return loaded.items;
  }
  const getAllItems = async () => localMode ? readLocalItems() : transact("readonly", store => store.getAll());
  const putItem = async item => {
    if (!localMode) return transact("readwrite", store => store.put(normalize(item)));
    const items = readLocalItems();
    const record = normalize(item);
    if (record.id === undefined) record.id = Math.max(0, ...items.map(value => value.id || 0)) + 1;
    const index = items.findIndex(value => value.id === record.id);
    if (index < 0) items.push(record); else items[index] = record;
    saveToLocalStorage(items);
    return record.id;
  };
  const deleteItem = async id => {
    if (!localMode) return transact("readwrite", store => store.delete(id));
    saveToLocalStorage(readLocalItems().filter(item => item.id !== id));
  };
  // Міграція атомарна; прапорець встановлюється після успішного commit.
  async function migrate() {
    // Заблокований localStorage не повинен зупиняти роботу з IndexedDB.
    try {
      if (localStorage.getItem(MIGRATED) === "true") return "";
    } catch (error) {
      return "localStorage недоступне, перенесення старих даних пропущено.";
    }
    const loaded = loadFromLocalStorage();
    if (loaded.error) return loaded.error;
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("workouts", "readwrite");
      const store = tx.objectStore("workouts");
      const count = store.count();
      count.onsuccess = () => { if (!count.result) loaded.items.forEach(item => store.put(item)); };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Помилка міграції"));
    });
    try {
      localStorage.setItem(MIGRATED, "true");
    } catch (error) {
      return "Не вдалося зберегти позначку перенесення в localStorage.";
    }
    return "";
  }
  return { localMode, normalize, saveToLocalStorage, loadFromLocalStorage, openDB, getAllItems, putItem, deleteItem, migrate };
})();
