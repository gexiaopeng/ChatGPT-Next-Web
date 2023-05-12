import { NextRequest } from "next/server";

const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;
let seq=0;
export async function requestOpenai(req: NextRequest) {
  const token = req.headers.get("token");
  const tokens = token?.split(",") ?? [];
  let len=tokens.length;
  if(seq>=len){
    seq=0;
  }
  const apiKey=tokens[seq];
  seq++;
  const openaiPath = req.headers.get("path");
  let baseUrl = BASE_URL;
  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }

  console.log("[Proxy] ", openaiPath);
  console.log("[Base Url]", baseUrl);
  let res=fetch(`${baseUrl}/${openaiPath}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: req.method,
    body: req.body,
  });
  let key=apiKey.slice(-4);
  //res={...res,...{key}};
  return res;
}
