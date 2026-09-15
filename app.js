const CATEGORIES = [
    { name: "Продукты", color: "#4c6ef5" },
    { name: "Кафе и рестораны", color: "#f59f00" },
    { name: "Транспорт", color: "#12b886" },
    { name: "Жильё и счета", color: "#ae3ec9" },
    { name: "Развлечения", color: "#f76707" },
    { name: "Медицина", color: "#15aabf" },
    { name: "Другое", color: "#868e96" }
];

const STORAGE_KEY = "expenses";
const isDemo = new URLSearchParams(location.search).has("demo");
let demoExpenses = [
    { amount: 8500, category: "Продукты" },
    { amount: 4200, category: "Жильё и счета" },
    { amount: 3400, category: "Кафе и рестораны" },
    { amount: 1500, category: "Транспорт" },
    { amount: 2200, category: "Развлечения" },
    { amount: 1250, category: "Медицина" },
    { amount: 900, category: "Другое" }
];
const amountInput = document.getElementById("amountInput");
const categorySelect = document.getElementById("categorySelect");
const addBtn = document.getElementById("addBtn");
const resetBtn = document.getElementById("resetBtn");
const totalAmount = document.getElementById("totalAmount");
const monthLabel = document.getElementById("monthLabel");
const emptyHint = document.getElementById("emptyHint");
const ctx = document.getElementById("expenseChart").getContext("2d");

for (const cat of CATEGORIES) {
    const option = document.createElement("option");
    option.value = cat.name;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
}

function monthKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function loadAll() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function currentMonth() {
    return monthKey(new Date());
}

function getExpenses() {
    if (isDemo) {
        return demoExpenses;
    }
    return loadAll()[currentMonth()] || [];
}

function addExpense(amount, category) {
    if (isDemo) {
        demoExpenses.push({ amount, category, date: new Date().toISOString() });
        return;
    }
    const data = loadAll();
    const key = currentMonth();
    if (!data[key]) {
        data[key] = [];
    }
    data[key].push({ amount, category, date: new Date().toISOString() });
    saveAll(data);
}

function resetMonth() {
    if (isDemo) {
        demoExpenses.length = 0;
        return;
    }
    const data = loadAll();
    delete data[currentMonth()];
    saveAll(data);
}

const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [],
            borderWidth: 2,
            borderColor: "#fff"
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: "bottom",
                labels: { padding: 16, usePointStyle: true }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return context.label + ": " + formatMoney(context.parsed) + " ₽";
                    }
                }
            }
        }
    }
});

function formatMoney(value) {
    return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

function formatMonth(key, date) {
    return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function render() {
    const now = new Date();
    monthLabel.textContent = formatMonth(currentMonth(), now).replace(/^./, function (m) { return m.toUpperCase(); });

    const expenses = getExpenses();
    const byCategory = {};
    let total = 0;
    for (const exp of expenses) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
        total += exp.amount;
    }

    totalAmount.textContent = formatMoney(total) + " ₽";
    emptyHint.style.display = expenses.length ? "none" : "block";

    const labels = [];
    const values = [];
    const colors = [];
    for (const cat of CATEGORIES) {
        if (byCategory[cat.name]) {
            labels.push(cat.name);
            values.push(byCategory[cat.name]);
            colors.push(cat.color);
        }
    }
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
}

addBtn.addEventListener("click", function () {
    const amount = parseFloat(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) {
        amountInput.focus();
        return;
    }
    addExpense(amount, categorySelect.value);
    amountInput.value = "";
    amountInput.focus();
    render();
});

amountInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        addBtn.click();
    }
});

resetBtn.addEventListener("click", function () {
    if (confirm("Начать новый месяц и удалить расходы текущего месяца?")) {
        resetMonth();
        render();
    }
});

render();