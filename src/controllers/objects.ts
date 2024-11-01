import express from "express";

export const objectsController = express.Router();

objectsController.get("/:cid", async (req, res) => {
  const { cid } = req.params;

  if (!cid) {
    res.status(400).json({ error: "Missing cid" });
    return;
  }

  //@ts-ignore
  const object = await getObject(cid); // TODO: Implement

  res.json(object);

  return;
});
