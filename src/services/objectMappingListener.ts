import { createSubstrateEventListener } from "../drivers/substrateEvents.js";

type ObjectMappingListener = {
  start: () => void;
};

type Block = {
  params: {
    parentHash: string;
    number: string;
    stateRoot: string;
    extrinsicsRoot: string;
    digest: {
      logs: string[];
    };
  };
};

export const createObjectMappingListener = (): ObjectMappingListener => {
  return {
    start: () => {
      const substrateListener = createSubstrateEventListener();

      substrateListener.subscribe("chain_subscribeNewHeads", (event: Block) => {
        console.log("New block:", event);
      });

      substrateListener.subscribe(
        "subspace_subscribeObjectMappings",
        (event: any) => {
          console.log(event);
        }
      );
    },
  };
};
