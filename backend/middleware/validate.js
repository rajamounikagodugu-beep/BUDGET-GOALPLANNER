function validateTransaction(body) {
  const errors = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = body.type;
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const date = body.date;
  const amount = Number(body.amount);
  if (!title || title.length > 90) errors.push("Title is required and must be at most 90 characters.");
  if (!["income", "expense"].includes(type)) errors.push("Type must be income or expense.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999) errors.push("Amount must be greater than 0 and within the supported limit.");
  if (!category || category.length > 40) errors.push("Category is required and must be at most 40 characters.");
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) errors.push("Date must be a valid YYYY-MM-DD date.");
  if (body.notes != null && (typeof body.notes !== "string" || body.notes.length > 500)) errors.push("Notes must be 500 characters or fewer.");
  return errors;
}

function validateGoal(body) {
  const errors = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const target = Number(body.target_amount);
  const saved = Number(body.saved_amount);
  if (!title || title.length > 90) errors.push("Goal name is required and must be at most 90 characters.");
  if (!Number.isFinite(target) || target <= 0 || target > 999999999) errors.push("Target amount must be greater than 0 and within the supported limit.");
  if (!Number.isFinite(saved) || saved < 0 || saved > 999999999) errors.push("Saved amount must be zero or more and within the supported limit.");
  if (Number.isFinite(target) && Number.isFinite(saved) && saved > target) errors.push("Saved amount cannot exceed the target amount.");
  if (body.target_date != null && body.target_date !== "" && (typeof body.target_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.target_date) || Number.isNaN(Date.parse(`${body.target_date}T00:00:00Z`)))) errors.push("Target date must be a valid YYYY-MM-DD date.");
  return errors;
}

function validatePositiveAmount(body) {
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999) return ["Contribution amount must be greater than 0 and within the supported limit."];
  return [];
}

module.exports = { validateTransaction, validateGoal, validatePositiveAmount };
