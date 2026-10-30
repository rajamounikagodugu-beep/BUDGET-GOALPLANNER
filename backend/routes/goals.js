const express = require("express");
const supabase = require("../supabase");
const { validateGoal, validatePositiveAmount } = require("../middleware/validate");
const router = express.Router();

function publicError(res, status, message) { return res.status(status).json({ error: message }); }

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("savings_goals").select("id,title,target_amount,saved_amount,target_date,created_at,updated_at").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const errors = validateGoal(req.body || {});
  if (errors.length) return publicError(res, 400, errors.join(" "));
  try {
    const body = req.body;
    const { data, error } = await supabase.from("savings_goals").insert({
      title: body.title.trim(), target_amount: Number(body.target_amount),
      saved_amount: Number(body.saved_amount), target_date: body.target_date || null
    }).select("id,title,target_amount,saved_amount,target_date,created_at,updated_at").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
});

router.post("/:id/contributions", async (req, res, next) => {
  const errors = validatePositiveAmount(req.body || {});
  if (errors.length) return publicError(res, 400, errors.join(" "));
  try {
    const { data, error } = await supabase.rpc("add_goal_contribution", {
      p_goal_id: req.params.id,
      p_amount: Number(req.body.amount)
    });
    if (error) {
      if (error.code === "P0002") return publicError(res, 404, "Savings goal not found.");
      if (error.code === "22023") return publicError(res, 400, "Contribution cannot make saved amount exceed target amount.");
      throw error;
    }
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("savings_goals").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return publicError(res, 404, "Savings goal not found.");
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
