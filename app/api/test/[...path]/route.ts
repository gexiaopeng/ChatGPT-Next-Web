import { NextRequest, NextResponse } from "next/server";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const OPENAI_URL = "api.openai.com";
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;

async function handle(req: NextRequest) {
  //console.log("[OpenAI Route] params ", params);
  const { method } = req;
  console.log("-method-" + method + ",url:[" + req.url + "]");
  console.log(
    "pathname:" + req.nextUrl.pathname + ",search:[" + req.nextUrl.search + "]",
  );
  const url = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/test/",
    "",
  );
  let baseUrl = BASE_URL;
  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }
  let ourl = baseUrl + "/" + url;
  console.log("-ourl-[" + ourl + "]");
  return NextResponse.json(
    {
      msg: "url:[" + url + "]",
    },
    {
      status: 200,
    },
  );
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
