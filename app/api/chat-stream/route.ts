import { createParser } from "eventsource-parser";
import { NextRequest } from "next/server";
import { requestOpenai } from "../common";
import { kv } from "@vercel/kv";
import { getIP, ipToDecimal, getDateTime } from "../../../global";

async function createStream(req: NextRequest) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await requestOpenai(req);

  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("stream")) {
    const content = await (
      await res.text()
    ).replace(/provided:.*. You/, "provided: ***. You");
    console.log("[Stream] error ", content);
    return "```json\n" + content + "```";
  }

  const stream = new ReadableStream({
    async start(controller) {
      function onParse(event: any) {
        if (event.type === "event") {
          const data = event.data;
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      }

      const parser = createParser(onParse);
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk, { stream: true }));
      }
    },
  });
  return stream;
}

export async function POST(req: NextRequest) {
  try {
    //await stat(req);
    stat(req);
    const stream = await createStream(req);
    //const resp = new Response(stream);
    //resp.headers.set("chat-count", count + "");
    //console.log("resp", resp);
    return new Response(stream);
  } catch (error) {
    console.error("[Chat Stream error]", error);
    return new Response(
      ["```json\n", JSON.stringify(error, null, "  "), "\n```"].join(""),
    );
  }
}
async function stat(req: NextRequest) {
  kv.incr("chatCount");
  const ip = getIP(req) + "";
  let ipStat = await kv.hget("userIps", ip);

  //console.log("ipStat",ipStat);
  let userIp = {};
  let newIpStat;
  if (!ipStat) {
    userIp = {};
    newIpStat = { count: 1, lastTime: getDateTime() };
  } else {
    // @ts-ignore
    newIpStat = { count: ipStat.count + 1, lastTime: getDateTime() };
  }
  // @ts-ignore
  userIp[ip] = newIpStat;
  // @ts-ignore
  kv.hset("userIps", userIp);
}
export const runtime = "edge";
/**
 export const config = {
  runtime: "edge", //默认serverless
};
 */
