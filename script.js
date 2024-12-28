// Variabili globali
let expenses = []; // Array per le spese
let chart; // Variabile per il grafico

// Funzione per ottenere il mese corrente (esempio: "2024-12")
function getCurrentMonthKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

// Funzione per aggiornare il selettore dei mesi
function updateMonthSelector() {
    const monthSelector = document.getElementById('month-selector');
    monthSelector.innerHTML = ''; // Svuota il selettore

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    for (let year = 2024; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
            if (year === currentYear && month > currentMonth) break;

            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = monthKey;
            option.textContent = `${year} - ${String(month).padStart(2, '0')}`;
            monthSelector.appendChild(option);
        }
    }

    monthSelector.value = getCurrentMonthKey(); // Seleziona il mese corrente
}

// Funzione per caricare le spese del mese selezionato
function loadSelectedMonth() {
    const selectedMonth = document.getElementById('month-selector').value;
    const monthlyExpenses = JSON.parse(localStorage.getItem(selectedMonth)) || [];

    expenses = monthlyExpenses; // Aggiorna l'array globale
    renderExpenses();
    updateBalance();
    updateChart();
    updateSuggestions();
}

// Funzione per aggiungere una nuova spesa
function addExpense(description, amount, category, date) {
    amount = parseFloat(amount.replace(',', '.')); // Corregge l'importo
    const expense = { description, amount, category, date };

    const monthKey = date.slice(0, 7); // Calcola il mese di riferimento
    const monthlyExpenses = JSON.parse(localStorage.getItem(monthKey)) || [];
    monthlyExpenses.push(expense);

    localStorage.setItem(monthKey, JSON.stringify(monthlyExpenses));

    if (monthKey === getCurrentMonthKey()) {
        expenses = monthlyExpenses;
        renderExpenses();
        updateBalance();
        updateChart();
        updateSuggestions();
    }
}

// Funzione per visualizzare le spese nella lista
function renderExpenses() {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';
    expenses.forEach((expense) => {
        const expenseItem = document.createElement('div');
        expenseItem.innerHTML = `
            <span>${expense.description} (${expense.category}) - ${expense.date}</span>
            <span>${expense.amount.toFixed(2)} €</span>
        `;
        expenseList.appendChild(expenseItem);
    });
}

// Funzione per aggiornare il bilancio
function updateBalance() {
    const totalEntrate = expenses.filter(e => e.category === 'entrata').reduce((sum, e) => sum + e.amount, 0);
    const totalUscite = expenses.filter(e => e.category === 'uscita').reduce((sum, e) => sum + e.amount, 0);
    const balance = totalEntrate - totalUscite;

    const balanceEl = document.getElementById('balance');
    balanceEl.textContent = `${balance.toFixed(2)} €`;

    if (balance < 0) {
        balanceEl.classList.remove('balance-positive');
        balanceEl.classList.add('balance-negative');
    } else {
        balanceEl.classList.remove('balance-negative');
        balanceEl.classList.add('balance-positive');
    }
}

// Funzione per aggiornare il grafico
function updateChart() {
    if (chart) chart.destroy();

    const labels = expenses.map(e => e.date);
    const data = expenses.map(e => e.amount * (e.category === 'uscita' ? -1 : 1));

    chart = new Chart(document.getElementById('expense-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Andamento Spese',
                data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                fill: true,
            }],
        },
    });
}

// Funzione per il pulsante modalità chiaro/scuro
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    themeToggle.textContent = isDark ? '🌙 Modalità Chiara' : '🌞 Modalità Scura';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Funzione per inizializzare il tema salvato
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        themeToggle.textContent = '🌙 Modalità Chiara';
    } else {
        body.classList.remove('dark');
        themeToggle.textContent = '🌞 Modalità Scura';
    }
}

// Funzione per scaricare spese e grafico in un file CSV
function downloadCSVWithChart() {
    const selectedMonth = document.getElementById('month-selector').value;
    const monthlyExpenses = JSON.parse(localStorage.getItem(selectedMonth)) || [];

    if (monthlyExpenses.length === 0) {
        alert('Non ci sono spese da includere nel CSV per il mese selezionato.');
        return;
    }

    let csvContent = 'Descrizione,Importo,Categoria,Data\n';
    monthlyExpenses.forEach(expense => {
        csvContent += `${expense.description},${expense.amount.toFixed(2)},${expense.category},${expense.date}\n`;
    });

    const chartCanvas = document.getElementById('expense-chart');
    if (chartCanvas) {
        const chartImage = chartCanvas.toDataURL('image/png');
        csvContent += '\nGrafico:\n';
        csvContent += chartImage;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report-spese-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event listener per aggiungere una nuova spesa
document.getElementById('expense-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    addExpense(description, amount, category, date);
    document.getElementById('expense-form').reset();
});

// Event listener per il pulsante "Carica Spese"
document.getElementById('load-month').addEventListener('click', loadSelectedMonth);

// Event listener per il pulsante tema chiaro/scuro
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// Event listener per il pulsante CSV
document.getElementById('download-csv').addEventListener('click', downloadCSVWithChart);

// Inizializzazione all'avvio
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    updateMonthSelector();
    loadSelectedMonth();
});
