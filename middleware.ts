import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "./app/config/server";
import { getIP} from "./global";
import md5 from "spark-md5";

export const config = {
  matcher: ["/api/openai", "/api/chat-stream"],
};

const serverConfig = getServerSideConfig();


export function middleware(req: NextRequest) {
  const accessCode = req.headers.get("access-code");
  const token = req.headers.get("token");
  const hashedCode = md5.hash(accessCode ?? "").trim();

 // console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  //console.log("[Auth] got access code:", accessCode);
 // console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
 // console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !token) {
    return NextResponse.json(
        {
          error: {
            message: "Please set your access code.",
            type: "invalid_request_error",
            param: null,
            code: "need_access_code."
          }
        },
      {
        status: 401,
      },
    );
  }

  // inject api key
  if (!token) {
    const apiKey = serverConfig.apiKey;
    if (apiKey) {
      console.log("[Auth] set system token");
      req.headers.set("token", apiKey);
    } else {
      return NextResponse.json(
         {
            error: {
              message: "Empty Api Key",
              type: "invalid_request_error",
              param: null,
              code: "empty_api_key"
            }
         },
        {
          status: 401,
        },
      );
    }
  } else {
    console.log("[Auth] set user token");
  }

  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
}
