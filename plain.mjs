import { createServer } from "http";
import { Writable } from "node:stream";
import { createWriteStream } from "node:fs";

const prettyMemoryUsage = (mem) => {
  const formattedMemory = Object.entries(mem).map(([key, value]) => {
    const formattedValue = (value / 1024 / 1024).toFixed(2);
    return `${key}: ${formattedValue} MB`;
  });

  return formattedMemory.join("\n");
};

createServer(async (req, res) => {
  const memHistory = [];
  const timer = setInterval(() => {
    memHistory.push(process.memoryUsage());
  }, 0);

  const outStream = createWriteStream("/dev/null");

  if (req.url === "/dup") {
    const dupReq = new Request("http://localhost:3000/dup", {
      body: req,
      method: req.method,
      headers: req.headers,
      duplex: "half",
    });

    await dupReq.body.pipeTo(Writable.toWeb(outStream));
  } else {
    req.pipe(outStream);
    await new Promise((resolve) => {
      outStream.on("finish", () => {
        resolve(undefined);
      });
    });
  }

  clearInterval(timer);

  const result = prettyMemoryUsage(
    memHistory.reduce((acc, mem) =>
      Object.entries(acc).reduce(
        (accc, [key, value]) => ({
          ...accc,
          [key]: Math.max(value, mem[key]),
        }),
        {}
      )
    )
  );

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end(result);
  process.exit();
}).listen(3000);

console.log("ready");

/*
$ node plain.mjs &; sleep 2; curl localhost:3000 -X POST -F 'file=@./100mbfile'
[1] 12748
ready
rss: 81.36 MB
heapTotal: 6.14 MB
heapUsed: 4.90 MB
external: 33.88 MB
arrayBuffers: 31.76 MB%                                                                                                                                                                                                                  [1]  + 12748 done       node plain.mjs

$ node plain.mjs &; sleep 2; curl localhost:3000 -X POST -F 'file=@./1gbfile'
[1] 12819
ready
rss: 82.44 MB
heapTotal: 6.39 MB
heapUsed: 4.89 MB
external: 34.13 MB
arrayBuffers: 32.01 MB%                                                                                                                                                                                                                  [1]  + 12819 done       node plain.mjs

$ node plain.mjs &; sleep 2; curl localhost:3000/dup -X POST -F 'file=@./100mbfile'
[1] 13670
ready
rss: 158.63 MB
heapTotal: 14.64 MB
heapUsed: 9.42 MB
external: 102.47 MB
arrayBuffers: 98.89 MB%                                                                                                                                                                                                                  [1]  + 13670 done       node plain.mjs

$ node plain.mjs &; sleep 2; curl localhost:3000/dup -X POST -F 'file=@./1gbfile'
[1] 13741
ready
rss: 1101.13 MB
heapTotal: 49.73 MB
heapUsed: 30.09 MB
external: 1009.59 MB
arrayBuffers: 1006.02 MB%
*/
