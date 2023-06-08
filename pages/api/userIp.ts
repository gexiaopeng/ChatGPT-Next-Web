import { kv } from '@vercel/kv';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse,
) {
    let userIps = await kv.hgetall("userIps");
    const chatCount=await kv.get("chatCount") || 0;
    return response.status(200).json({chatCount,userIps});
}