import { kv } from '@vercel/kv';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse,
) {
    const { query } = request;
    let ip = query.ip;
    console.log("==ip:"+ip);
    let success=0;
    if(ip && ip!="undefined"){
        // @ts-ignore
        let ipStat = await kv.hget("userIps", ip);
        if(ipStat){
            // @ts-ignore
            kv.decrby("chatCount",ipStat.count);
            // @ts-ignore
            kv.hdel("userIps", ip);
        }
       success=1;
    }
    return response.status(200).json({success});
}