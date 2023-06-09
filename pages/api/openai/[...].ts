import {NextRequest, NextResponse} from 'next/server';
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const OPENAI_URL = "api.openai.com";
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;
export default async function handler(req: NextRequest) {
    const {method} = req;
    console.log("-method-" + method + ",url:[" + req.url + "]");
    const url = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll("/api/openai/", "");
    let baseUrl = BASE_URL;
    if (!baseUrl.startsWith("http")) {
        baseUrl = `${PROTOCOL}://${baseUrl}`;
    }
    let ourl=baseUrl+"/"+url;
   // let newHeaders =  new Headers( req.headers);
   // newHeaders.delete('host');

    let  newHeaders =  new Headers();
    newHeaders.set('authorization',req.headers.get("authorization")+"");
    newHeaders.set('content-type',req.headers.get("content-type")+"");
    //let ind=ourl.indexOf("?=");
    //if(ind>0){
    //ourl=ourl.substring(0,ind);
    //}
    console.log("-ourl-[" + ourl + "]");
    //let heads="";
    //for (const [key, value] of newHeaders.entries()) {
        //heads+=key+":"+value+"\n";
   // }
    //console.log("-heads-[" + heads + "]");
    //headers: newHeaders,
    try {
        return fetch(ourl, {
            headers: newHeaders,
            method: method,
            body: req.body,
        });
    } catch (e) {
        console.error("[api/openai]error", e);
        return NextResponse.json(
            {
                error: true,
                msg: JSON.stringify(e),
            },
            {
                status: 500,
            },
        );
    }

}
export const runtime = "edge";