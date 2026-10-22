const API = 'http://localhost:5000/api';
let categories = [];
let currentMonth, currentYear;
let categoryChart, trendChart;

// Helpers
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const fmt = n => '$' + Number(n).toFixed(2);

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  const now = new Date();
  currentMonth = now.getMonth() + 1;
  currentYear = now.getFullYear();
  $('monthPicker').value = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  await loadCategories();
  await refreshAll();
});

$('monthPicker').onchange = e => {
  const [y, m] = e.target.value.split('-');
  currentYear = Number(y);
  currentMonth = Number(m);
  refreshAll();
};

// Categories
async function loadCategories() {
  categories = await api('/categories');
  rebuildCategorySelects();
  $('txType').onchange = rebuildTxCategories;
}

function rebuildCategorySelects() {
  // Budget select (expenses only)
  const bSel = $('budgetCategory');
  bSel.innerHTML = '';
  categories.filter(c => c.type === 'expense').forEach(c => {
    bSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
  rebuildTxCategories();
}

function rebuildTxCategories() {
  const type = $('txType').value;
  const sel = $('txCategory');
  sel.innerHTML = '';
  categories.filter(c => c.type === type).forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// Refresh everything
async function refreshAll() {
  await Promise.all([
    loadSummary(),
    loadCategoryChart(),
    loadTrendChart(),
    loadBudgets(),
    loadTransactions()
  ]);
}

async function loadSummary() {
  const s = await api(`/dashboard/summary?month=${currentMonth}&year=${currentYear}`);
  $('totalIncome').textContent = fmt(s.totalIncome);
  $('totalExpense').textContent = fmt(s.totalExpense);
  $('balance').textContent = fmt(s.balance);
}

async function loadCategoryChart() {
  const data = await api(`/dashboard/categories?month=${currentMonth}&year=${currentYear}`);
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart($('categoryChart'), {
    type: 'doughnut',
    data: {
      labels: data.length ? data.map(d => d.name) : ['No data'],
      datasets: [{
        data: data.length ? data.map(d => d.total) : [1],
        backgroundColor: data.length
          ? ['#4c51bf','#48bb78','#ed8936','#e53e3e','#38b2ac','#9f7aea','#f56565','#4299e1','#d69e2e','#ed64a6']
          : ['#edf2f7']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

async function loadTrendChart() {
  const data = await api('/dashboard/trend');
  const labels = data.map(d => `${d.month}/${d.year}`);
  if (trendChart) trendChart.destroy();
  trendChart = new Chart($('trendChart'), {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [
        { label: 'Income', data: data.map(d => d.income), backgroundColor: '#48bb78' },
        { label: 'Expenses', data: data.map(d => d.expense), backgroundColor: '#e53e3e' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

async function loadBudgets() {
  const budgets = await api(`/budgets?month=${currentMonth}&year=${currentYear}`);
  const el = $('budgetList');
  if (!budgets.length) {
    el.innerHTML = '<p class="empty">No budgets set. Click "Set Budget" to add one.</p>';
    return;
  }
  el.innerHTML = budgets.map(b => {
    const pct = Math.min(100, (b.spent / b.amount) * 100);
    const cls = pct >= 100 ? 'danger' : pct >= 75 ? 'warn' : '';
    return `
      <div class="budget-item">
        <div class="budget-header">
          <span><i class="fas ${b.icon}"></i> ${b.category_name}</span>
          <span>
            ${fmt(b.spent)} / ${fmt(b.amount)}
            <button onclick="deleteBudget(${b.id})"><i class="fas fa-trash"></i></button>
          </span>
        </div>
        <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}

async function loadTransactions() {
  const all = await api('/transactions');
  const filtered = all.filter(t => {
    const d = new Date(t.transaction_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const el = $('transactionList');
  if (!filtered.length) {
    el.innerHTML = '<p class="empty">No transactions this month.</p>';
    return;
  }

  el.innerHTML = filtered.map(t => {
    const isIncome = t.type === 'income';
    const date = new Date(t.transaction_date).toLocaleDateString();
    return `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon ${t.type}"><i class="fas ${t.icon}"></i></div>
          <div class="tx-info">
            <span>${t.description || t.category_name}</span>
            <small>${t.category_name} • ${date}</small>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${t.type}">${isIncome ? '+' : '-'}${fmt(t.amount)}</span>
          <button class="tx-delete" onclick="deleteTransaction(${t.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

// Modals
$('addTransactionBtn').onclick = () => {
  $('transactionForm').reset();
  $('txDate').value = new Date().toISOString().split('T')[0];
  show('transactionModal');
};

$('setBudgetBtn').onclick = () => {
  $('budgetForm').reset();
  show('budgetModal');
};

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.onclick = () => hide(btn.dataset.close);
});

// Save transaction
$('transactionForm').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: $('txType').value,
        category_id: Number($('txCategory').value),
        amount: Number($('txAmount').value),
        description: $('txDescription').value || null,
        transaction_date: $('txDate').value
      })
    });
    hide('transactionModal');
    refreshAll();
  } catch (err) { alert(err.message); }
};

// Save budget
$('budgetForm').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/budgets', {
      method: 'POST',
      body: JSON.stringify({
        category_id: Number($('budgetCategory').value),
        amount: Number($('budgetAmount').value),
        month: currentMonth,
        year: currentYear
      })
    });
    hide('budgetModal');
    refreshAll();
  } catch (err) { alert(err.message); }
};

// Delete actions
async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  await api(`/transactions/${id}`, { method: 'DELETE' });
  refreshAll();
}

async function deleteBudget(id) {
  if (!confirm('Delete this budget?')) return;
  await api(`/budgets/${id}`, { method: 'DELETE' });
  refreshAll();
}

// expose for inline onclick
window.deleteTransaction = deleteTransaction;
window.deleteBudget = deleteBudget;