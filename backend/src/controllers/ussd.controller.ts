import type { RequestHandler } from "express";

export const handleUssdWebhook: RequestHandler = (req, res) => {
  const text = String(req.body.text ?? "");

  if (!text) {
    res.type("text/plain").send("CON Welcome to CampNav\n1. Find facility\n2. Find zone\n3. Lost person\n4. Emergency");
    return;
  }

  res.type("text/plain").send("END CampNav USSD flow placeholder. Backend menu logic goes here.");
};
