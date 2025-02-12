import { NextRequest, NextResponse } from "next/server";
import { requestOpenai } from "../common";

async function makeRequest(req: NextRequest) {
  try {
    const api = await requestOpenai(req);

    //const myOptions = { status:api.status, statusText:api.statusText,headers: api.headers};
    //console.log("[api res {token,status}] ", token,status);
    //const res =  new NextResponse(api.body,myOptions);
    return api;
  } catch (e) {
    console.error("[OpenAI] ", req.body, e);
    return NextResponse.json(
      {
        error: {
          message: JSON.stringify(e),
          type: "Internal server errorr",
          param: null,
          code: "internal_error",
        },
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  return makeRequest(req);
}

export async function GET(req: NextRequest) {
  return makeRequest(req);
}
export const runtime = "edge";
/**
export const config = {
  runtime: "edge",
};
 */
