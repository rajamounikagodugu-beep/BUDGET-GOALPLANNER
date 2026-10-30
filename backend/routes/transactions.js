const express = require("express");
const supabase = require("../supabase");
const { validateTransaction } = require("../middleware/validate");
const router = express.Router();

function publicError(res, status, message) { return res.status(status).json({ error: message }); }

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("transactions").select("id,title,type,amount,category,date,notes,created_at,updated_at").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    res.json(data || []);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const errors = validateTransaction(req.body || {});
  if (errors.length) return publicError(res, 400, errors.join(" "));
  const body = req.body;
  try {
    const { data, error } = await supabase.from("transactions").insert({
      title: body.title.trim(), type: body.type, amount: Number(body.amount),
      category: body.category.trim(), date: body.date, notes: (body.notes || "").trim() || null
    }).select("id,title,type,amount,category,date,notes,created_at,updated_at").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  const errors = validateTransaction(req.body || {});
  if (errors.length) return publicError(res, 400, errors.join(" "));
  try {
    const body = req.body;
    const { data, error } = await supabase.from("transactions").update({
      title: body.title.trim(), type: body.type, amount: Number(body.amount),
      category: body.category.trim(), date: body.date, notes: (body.notes || "").trim() || null
    }).eq("id", req.params.id).select("id,title,type,amount,category,date,notes,created_at,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return publicError(res, 404, "Transaction not found.");
    res.json(data);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("transactions").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return publicError(res, 404, "Transaction not found.");
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
