type WorkerSuccess = {
  ok: true;
  serialized: string;
};

type WorkerFailure = {
  ok: false;
  message: string;
};

const workerSource = `
self.onmessage = async (event) => {
  const { source, input } = event.data;

  try {
    const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));

    try {
      const module = await import(moduleUrl);
      const transform = module.default;

      if (typeof transform !== "function") {
        throw new Error("The module must default-export a function.");
      }

      const result = await transform(input);
      const serialized = JSON.stringify(result);

      if (serialized === undefined) {
        throw new Error("The transform must return a JSON-serializable value.");
      }

      self.postMessage({ ok: true, serialized });
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    self.postMessage({ ok: false, message });
  }
};
`;

function createRunnerWorker() {
  const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  const worker = new Worker(workerUrl, { type: "module" });

  setTimeout(() => URL.revokeObjectURL(workerUrl), 0);

  return worker;
}

function parseWorkerResult(event: MessageEvent<WorkerSuccess | WorkerFailure>) {
  if (event.data.ok) {
    return JSON.parse(event.data.serialized);
  }

  throw new Error(event.data.message);
}

export async function runJsonBenchTransform(sourceCode: string, inputText: string) {
  try {
    const input = JSON.parse(inputText);
    const worker = createRunnerWorker();

    const result = await new Promise<unknown>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerSuccess | WorkerFailure>) => {
        try {
          resolve(parseWorkerResult(event));
        } catch (error) {
          reject(error);
        } finally {
          worker.terminate();
        }
      };

      worker.onerror = (event) => {
        worker.terminate();
        reject(new Error(event.message || "The JSON Bench worker failed."));
      };

      worker.postMessage({
        source: sourceCode,
        input
      });
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
