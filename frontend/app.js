const API_BASE = "/api";
const $ = (selector) => document.querySelector(selector);
const state = { transactions: [], goals: [], editingTransactionId: null };
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
const localISODate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const currentMonth = () => localISODate().slice(0, 7);

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function selectedMonthTransactions() {
  const month = $("#monthFilter").value;
  return state.transactions.filter((item) => item.date.startsWith(month));
}

function renderSummary() {
  const items = selectedMonthTransactions();
  const income = items.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = income - expenses;
  const target = state.goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const saved = state.goals.reduce((sum, goal) => sum + Number(goal.saved_amount), 0);
  const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  $("#incomeTotal").textContent = money(income);
  $("#expenseTotal").textContent = money(expenses);
  $("#balanceTotal").textContent = money(balance);
  $("#balanceTotal").style.color = balance < 0 ? "var(--red)" : "var(--ink)";
  $("#goalProgress").textContent = `${percent}%`;
  $("#snapshotIncome").textContent = money(income);
  $("#snapshotExpense").textContent = money(expenses);
  $("#snapshotBalance").textContent = money(balance);
  $("#monthLabel").textContent = new Date(`${$("#monthFilter").value}-01T12:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const ratio = income > 0 ? Math.min(100, (expenses / income) * 100) : (expenses > 0 ? 100 : 0);
  $("#spendingBar").style.width = `${ratio}%`;
  $("#spendingMessage").textContent = income > 0
    ? `${Math.round(ratio)}% of this month's recorded income has been spent.`
    : expenses > 0 ? "You have expenses recorded but no income for this month yet." : "Add transactions to see your monthly spending snapshot.";
}

function renderTransactions() {
  const query = $("#searchTransactions").value.trim().toLowerCase();
  const type = $("#typeFilter").value;
  const monthItems = selectedMonthTransactions().filter((item) => {
    const searchable = `${item.title} ${item.category} ${item.notes || ""}`.toLowerCase();
    return searchable.includes(query) && (type === "all" || item.type === type);
  }).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const tbody = $("#transactionRows");
  tbody.replaceChildren();
  if (!monthItems.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-cell";
    cell.textContent = query || type !== "all" ? "No matching transactions for this month." : "No transactions yet. Add your first transaction!";
    row.append(cell); tbody.append(row); return;
  }
  for (const item of monthItems) {
    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    const title = document.createElement("div"); title.className = "transaction-name"; title.textContent = item.title;
    titleCell.append(title);
    if (item.notes) { const notes = document.createElement("div"); notes.className = "transaction-notes"; notes.textContent = item.notes; titleCell.append(notes); }
    const categoryCell = document.createElement("td"); const tag = document.createElement("span"); tag.className = "category-tag"; tag.textContent = item.category; categoryCell.append(tag);
    const dateCell = document.createElement("td"); dateCell.textContent = new Date(`${item.date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const amountCell = document.createElement("td"); amountCell.className = item.type === "income" ? "amount-income" : "amount-expense"; amountCell.textContent = `${item.type === "income" ? "+" : "−"}${money(item.amount)}`;
    const actionCell = document.createElement("td");
    const edit = document.createElement("button"); edit.className = "delete-button"; edit.type = "button"; edit.title = "Edit transaction"; edit.setAttribute("aria-label", `Edit ${item.title}`); edit.textContent = "✎"; edit.addEventListener("click", () => openEditTransaction(item));
    const remove = document.createElement("button"); remove.className = "delete-button"; remove.type = "button"; remove.title = "Delete transaction"; remove.setAttribute("aria-label", `Delete ${item.title}`); remove.textContent = "×"; remove.addEventListener("click", () => deleteTransaction(item));
    actionCell.append(edit, remove); row.append(titleCell, categoryCell, dateCell, amountCell, actionCell); tbody.append(row);
  }
}

function renderGoals() {
  const list = $("#goalList"); list.replaceChildren();
  if (!state.goals.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "Your goals start here. Create a savings goal and track your progress."; list.append(empty); return; }
  for (const goal of state.goals) {
    const percent = Math.min(100, Math.round(Number(goal.saved_amount) / Number(goal.target_amount) * 100));
    const item = document.createElement("div"); item.className = "goal-item";
    const head = document.createElement("div"); head.className = "goal-head";
    const titleWrap = document.createElement("div"); const title = document.createElement("p"); title.className = "goal-title"; title.textContent = goal.title; titleWrap.append(title);
    const date = document.createElement("span"); date.className = "goal-date"; date.textContent = goal.target_date ? `Target: ${new Date(`${goal.target_date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "No deadline"; titleWrap.append(date);
    const percentLabel = document.createElement("span"); percentLabel.className = "goal-percent"; percentLabel.textContent = `${percent}%`;
    head.append(titleWrap, percentLabel);
    const progress = document.createElement("div"); progress.className = "goal-progress"; const bar = document.createElement("span"); bar.style.width = `${percent}%`; progress.append(bar);
    const bottom = document.createElement("div"); bottom.className = "goal-bottom";
    const saved = document.createElement("span"); saved.textContent = `${money(goal.saved_amount)} saved`;
    const target = document.createElement("strong"); target.textContent = `of ${money(goal.target_amount)}`;
    const actions = document.createElement("div"); actions.style.cssText = "display:flex;justify-content:flex-end;gap:8px;margin-top:9px";
    const add = document.createElement("button"); add.type = "button"; add.className = "button button-soft"; add.textContent = "＋ Add savings"; add.addEventListener("click", () => addSavings(goal));
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "delete-button"; remove.textContent = "×"; remove.title = "Delete goal"; remove.setAttribute("aria-label", `Delete goal ${goal.title}`); remove.addEventListener("click", () => deleteGoal(goal));
    bottom.append(saved, target); actions.append(add, remove); item.append(head, progress, bottom, actions); list.append(item);
  }
}

async function loadData() {
  try {
    const [transactions, goals] = await Promise.all([api("/transactions"), api("/goals")]);
    state.transactions = transactions; state.goals = goals;
    renderSummary(); renderTransactions(); renderGoals();
  } catch (error) {
    showToast(`Could not load data: ${error.message}. Check your server and Supabase setup.`, true);
    $("#transactionRows").innerHTML = '<tr><td colspan="5" class="empty-cell">Unable to load data. Check the backend configuration.</td></tr>';
    $("#goalList").textContent = "Unable to load goals.";
  }
}

function openTransactionDialog() {
  state.editingTransactionId = null;
  $("#transactionForm").reset();
  $("#transactionDialogTitle").textContent = "Add transaction";
  $("#transactionDate").value = localISODate();
  $("#transactionError").textContent = "";
  $("#transactionDialog").showModal();
}
function openEditTransaction(item) {
  state.editingTransactionId = item.id;
  $("#transactionDialogTitle").textContent = "Edit transaction";
  $("#transactionTitle").value = item.title;
  $("#transactionType").value = item.type;
  $("#transactionAmount").value = item.amount;
  $("#transactionCategory").value = item.category;
  $("#transactionDate").value = item.date;
  $("#transactionNotes").value = item.notes || "";
  $("#transactionError").textContent = "";
  $("#transactionDialog").showModal();
}

async function deleteTransaction(item) {
  if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
  try { await api(`/transactions/${item.id}`, { method: "DELETE" }); showToast("Transaction deleted."); await loadData(); }
  catch (error) { showToast(error.message, true); }
}

async function deleteGoal(goal) {
  if (!confirm(`Delete savings goal "${goal.title}"?`)) return;
  try { await api(`/goals/${goal.id}`, { method: "DELETE" }); showToast("Savings goal deleted."); await loadData(); }
  catch (error) { showToast(error.message, true); }
}

async function addSavings(goal) {
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.saved_amount));
  const raw = prompt(`How much would you like to add to "${goal.title}"? Remaining to target: ${money(remaining)}`);
  if (raw === null) return;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) { showToast("Enter an amount greater than zero.", true); return; }
  try {
    await api(`/goals/${goal.id}/contributions`, { method: "POST", body: JSON.stringify({ amount }) });
    showToast("Savings progress updated."); await loadData();
  } catch (error) { showToast(error.message, true); }
}

$("#addTransactionBtn").addEventListener("click", openTransactionDialog);
$("#addGoalBtn").addEventListener("click", () => { $("#goalForm").reset(); $("#goalSaved").value = "0"; $("#goalError").textContent = ""; $("#goalDialog").showModal(); });
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => $(`#${button.dataset.close}`).close()));
$("#monthFilter").value = currentMonth();
$("#monthFilter").addEventListener("change", () => { renderSummary(); renderTransactions(); });
$("#searchTransactions").addEventListener("input", renderTransactions);
$("#typeFilter").addEventListener("change", renderTransactions);

$("#transactionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = { title: form.get("title").trim(), type: form.get("type"), amount: Number(form.get("amount")), category: form.get("category"), date: form.get("date"), notes: form.get("notes").trim() };
  $("#transactionError").textContent = "";
  try {
    if (state.editingTransactionId) await api(`/transactions/${state.editingTransactionId}`, { method: "PUT", body: JSON.stringify(payload) });
    else await api("/transactions", { method: "POST", body: JSON.stringify(payload) });
    $("#transactionDialog").close(); showToast(state.editingTransactionId ? "Transaction updated." : "Transaction saved."); await loadData();
  } catch (error) { $("#transactionError").textContent = error.message; }
});

$("#goalForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = { title: form.get("title").trim(), target_amount: Number(form.get("target_amount")), saved_amount: Number(form.get("saved_amount")), target_date: form.get("target_date") || null };
  $("#goalError").textContent = "";
  try {
    await api("/goals", { method: "POST", body: JSON.stringify(payload) });
    $("#goalDialog").close(); showToast("Savings goal created."); await loadData();
  } catch (error) { $("#goalError").textContent = error.message; }
});

loadData();
