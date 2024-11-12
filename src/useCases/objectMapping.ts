import { ObjectMappingListEntry } from "../models/mapping.js";
import { blockRepository } from "../repositories/block.js";
import { objectMappingRepository } from "../repositories/objectMapping.js";
import { objectMapiingBroadcaster } from "../services/objectMappingBroadcaster.js";

export const objectMappingUseCase = {
  processObjectMapping: async (event: ObjectMappingListEntry) => {
    await Promise.all([
      blockRepository.saveBlock(event.blockNumber),
      objectMappingRepository.saveObjectMappings(event.v0.objects),
    ]);

    objectMapiingBroadcaster.broadcast(event);
  },
};
