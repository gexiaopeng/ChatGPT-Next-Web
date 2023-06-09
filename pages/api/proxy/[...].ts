import {NextRequest, NextResponse} from 'next/server';

export default async function handler(req: NextRequest) {
    const {method} = req;
    console.log("-method-" + method + ",url:[" + req.url + "]");
    //console.log("-query-",query);
    //console.log("-res-",res);
    const url = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll("/api/proxy/", "");
    //let newHeaders =  new Headers( req.headers);
    //newHeaders.delete('host');
    let newHeaders =  new Headers();
    newHeaders.set('authorization',req.headers.get("authorization")+"");
    newHeaders.set('content-type',req.headers.get("content-type")+"");
    console.log("-url-[" + url + "]");
    if(!url.startsWith("http")){
        return NextResponse.json(
            {
                error: true,
                msg: "["+url+"] is invalid!",
            },
            {
                status: 500,
            },
        );
    }
    try {
        return fetch(url, {
            headers: newHeaders,
            method: method,
            body: req.body,
        });
    } catch (e) {
        console.error("[api/proxy]error", e);
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
export const config = {
    runtime: 'edge',
};