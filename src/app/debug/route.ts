import { createWriteStream } from "fs";
import { NextResponse } from "next/server";
import { Writable } from "stream";

const prettyMemoryUsage = (mem: ReturnType<typeof process.memoryUsage>) => {
  const formattedMemory = Object.entries(mem).map(([key, value]) => {
    const formattedValue = (value / 1024 / 1024).toFixed(2); // Convert to MB and round to 2 decimal places
    return `${key}: ${formattedValue} MB`;
  });

  return formattedMemory.join("\n");
};

export async function POST(request: Request) {
  const memHistory: Array<ReturnType<typeof process.memoryUsage>> = [];
  const timer = setInterval(() => {
    memHistory.push(process.memoryUsage());
  }, 0);

  await request.body?.pipeTo(Writable.toWeb(createWriteStream("/dev/null")));

  const result = prettyMemoryUsage(
    memHistory.reduce((acc, mem) =>
      Object.entries(acc).reduce(
        (accc, [key, value]) => ({
          ...accc,
          [key]: Math.max(value, (mem as any)[key]),
        }),
        {} as any
      )
    )
  );

  clearInterval(timer);

  return NextResponse.json(result);
}
