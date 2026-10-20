"use strict";
const form = document.querySelector('.workout-form');
const grid = document.querySelector('.workouts-grid');
const goal = 5;
function updateStats() {
    const cards = [...grid.querySelectorAll('.workout-card')];
    const figures = document.querySelectorAll('.stat-figure');
    figures[0].textContent = cards.length;
    figures[1].textContent = cards.reduce((sum, card) => sum + Number(card.querySelectorAll('.workout-metrics strong')[0].textContent), 0) + ' хв';
    figures[2].textContent = cards.reduce((sum, card) => sum + Number(card.querySelectorAll('.workout-metrics strong')[1].textContent), 0) + ' ккал';
    // Мета стосується поточного календарного тижня, а не всієї історії.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const completed = cards.filter(card => {
        const date = new Date(card.querySelector('time').dateTime + 'T00:00:00');
        return date >= start && date < end;
    }).length;
    document.querySelector('#completed-count').textContent = completed;
    document.querySelector('#weekly-progress').value = Math.min(completed, goal);
    document.querySelector('#weekly-progress').textContent = Math.min(completed / goal * 100, 100) + '%';
    document.querySelector('#progress-note').textContent = completed >= goal ? 'Мету тижня виконано' : `До мети залишилося занять: ${goal - completed}`;
}
form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const card = grid.querySelector('.workout-card').cloneNode(true);
    const type = String(data.get('type'));
    card.dataset.type = type;
    card.className = 'workout-card';
    const badge = card.querySelector('.workout-badge');
    badge.textContent = type;
    card.querySelector('.workout-title').textContent = type;
    const time = card.querySelector('time');
    time.dateTime = String(data.get('date'));
    time.textContent = new Date(time.dateTime + 'T00:00:00').toLocaleDateString('uk-UA');
    const values = card.querySelectorAll('.workout-metrics strong');
    values[0].textContent = data.get('minutes');
    values[1].textContent = data.get('calories');
    grid.prepend(card);
    updateStats();
    form.reset();
});
updateStats();
