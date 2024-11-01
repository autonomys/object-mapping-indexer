import "dotenv/config.js";
import { createObjectMappingListener } from "./services/objectMappingListener.js";

const listener = createObjectMappingListener();

listener.start();
