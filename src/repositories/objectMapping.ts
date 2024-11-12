import { getDatabase } from "../drivers/pg.js";
import { ObjectMapping } from "../models/mapping.js";
import pgFormat from "pg-format";

export const objectMappingRepository = {
  saveObjectMappings: async (objectMappings: ObjectMapping[]) => {
    const db = await getDatabase();
    await db.query(
      pgFormat(
        "INSERT INTO object_mappings (hash, piece_index, piece_offset) VALUES %L ON CONFLICT DO NOTHING",
        objectMappings
      )
    );
  },
};
