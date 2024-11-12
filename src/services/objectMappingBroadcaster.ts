import { BroadcastServer } from "../drivers/ws/server";
import { ObjectMappingListEntry } from "../models/mapping";

let objectMappingBroadcaster: BroadcastServer | null = null;

const init = (broadcastServer: BroadcastServer) => {
  objectMappingBroadcaster = broadcastServer;
};

export const broadcast = (objectMapping: ObjectMappingListEntry) => {
  if (!objectMappingBroadcaster) {
    throw new Error("Object mapping broadcaster not initialized");
  }

  objectMappingBroadcaster.broadcastMessage(objectMapping);
};

export const objectMapiingBroadcaster = {
  init,
  broadcast,
};
