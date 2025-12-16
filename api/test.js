export default async function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'API is working',
            timestamp: new Date().toISOString(),
            environment: {
                hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
                hasTelegramChatId: !!process.env.TELEGRAM_CHAT_ID
            }
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
