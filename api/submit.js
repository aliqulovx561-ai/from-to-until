// Use ES module syntax for Node.js 24
import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        let submission;
        
        // Parse JSON body
        if (typeof req.body === 'string') {
            submission = JSON.parse(req.body);
        } else {
            submission = req.body;
        }
        
        // Telegram bot configuration from environment variables
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
        
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('Telegram bot configuration missing');
            return res.status(500).json({ 
                error: 'Server configuration error',
                message: 'Telegram credentials not configured'
            });
        }
        
        // Calculate score
        const answerKey = {
            q1: 'b', q2: 'd', q3: 'c', q4: 'c', q5: 'c',
            q6: 'b', q7: 'd', q8: 'b', q9: 'c', q10: 'b',
            q11: 'b', q12: 'c', q13: 'd', q14: 'd', q15: 'b',
            q16: 'b', q17: 'c', q18: 'b', q19: 'b', q20: 'c'
        };
        
        let score = 0;
        let detailedAnswers = [];
        
        for (let i = 1; i <= 20; i++) {
            const question = `q${i}`;
            const studentAnswer = submission.answers[question];
            const correctAnswer = answerKey[question];
            const isCorrect = studentAnswer === correctAnswer;
            
            if (isCorrect) score++;
            
            detailedAnswers.push({
                question: i,
                studentAnswer: studentAnswer || 'No answer',
                correctAnswer,
                isCorrect
            });
        }
        
        const percentage = (score / 20) * 100;
        
        // Format time taken
        const timeTaken = submission.timeTaken || 0;
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Create detailed report
        const report = `
📚 *NEW TEST SUBMISSION*

👤 *Student:* ${submission.studentName || 'Unknown'}
🏫 *Group:* ${submission.studentGroup || 'Unknown'}
⏱️ *Time Taken:* ${timeFormatted}
📅 *Submitted:* ${new Date().toLocaleString()}
🚪 *Page Leaves:* ${submission.pageLeaves || 0}

📊 *SCORE: ${score}/20 (${percentage.toFixed(1)}%)*

${percentage >= 75 ? '✅ EXCELLENT!' : percentage >= 50 ? '⚠️ NEEDS PRACTICE' : '❌ NEEDS IMPROVEMENT'}

*Answers Summary:*
${detailedAnswers.slice(0, 10).map(a => 
    `Q${a.question}: ${a.studentAnswer} ${a.isCorrect ? '✅' : `❌`}`
).join(' | ')}

${detailedAnswers.slice(10).map(a => 
    `Q${a.question}: ${a.studentAnswer} ${a.isCorrect ? '✅' : `❌`}`
).join(' | ')}

*Correct Answers Key:*
1-5: b,d,c,c,c
6-10: b,d,b,c,b
11-15: b,c,d,d,b
16-20: b,c,b,b,c
        `.trim();
        
        // Send report to Telegram
        try {
            const telegramResponse = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: report,
                        parse_mode: 'Markdown'
                    })
                }
            );
            
            const telegramResult = await telegramResponse.json();
            
            if (!telegramResponse.ok) {
                console.error('Telegram API error:', telegramResult);
            }
        } catch (telegramError) {
            console.error('Failed to send to Telegram:', telegramError);
        }
        
        // Return success response to client
        return res.status(200).json({
            success: true,
            score: `${score}/20`,
            percentage: percentage.toFixed(1),
            message: 'Test submitted successfully'
        });
        
    } catch (error) {
        console.error('Error processing submission:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
