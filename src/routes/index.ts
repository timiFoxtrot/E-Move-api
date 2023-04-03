import express, { Request, Response, NextFunction } from "express";
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
  next();
});


export default router;
