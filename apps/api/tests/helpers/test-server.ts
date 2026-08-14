import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

type TestHttpServer = {
  url: string;
  close: () => Promise<void>;
};

type RequestHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void;

export const createTestHttpServer = (
  handler: RequestHandler,
): Promise<TestHttpServer> => {
  return new Promise((resolve, reject) => {
    const server: Server = createServer(handler);

    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Unable to resolve test server address"));
        return;
      }

      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }

              closeResolve();
            });
          }),
      });
    });
  });
};
