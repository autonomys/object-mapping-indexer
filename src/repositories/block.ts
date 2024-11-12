import { getDatabase } from "../drivers/pg.js";

const saveBlock = async (block: number) => {
  const db = await getDatabase();

  await db.query(
    "INSERT INTO blocks (number) VALUES ($1) ON CONFLICT DO NOTHING",
    [block]
  );
};

export const blockRepository = {
  saveBlock,
};
