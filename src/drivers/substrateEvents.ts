import { config } from "../config.js";
import { createWS, WS } from "./ws.js";

type SubstrateSubscription = {
  id: string;
  callbacks: ((event: any) => void)[];
};

type SubstrateEventListenerState = {
  subscriptions: Record<string, SubstrateSubscription>;
  ws: WS;
};

type SubscriptionResponse = {
  result: string;
};

export const createSubstrateEventListener = () => {
  const state: SubstrateEventListenerState = {
    subscriptions: {},
    ws: createWS(config.rpcUrl),
  };

  const subscribe = async (
    subscribingEventName: string,
    callback: (event: any) => void
  ) => {
    if (!state.subscriptions[subscribingEventName]) {
      const response: SubscriptionResponse = await state.ws.send({
        jsonrpc: "2.0",
        method: subscribingEventName,
        params: [],
      });

      console.log("response", response);

      if (!response?.result) {
        throw new Error(
          `Failed to subscribe to event: ${JSON.stringify(response, null, 2)}`
        );
      }

      state.subscriptions[subscribingEventName] = {
        id: response.result,
        callbacks: [callback],
      };

      state.ws.on((event) => {
        state.subscriptions[subscribingEventName].callbacks.forEach(
          (callback) => callback(event.params)
        );
      });
    } else {
      state.subscriptions[subscribingEventName].callbacks.push(callback);
    }
  };

  return { subscribe };
};
