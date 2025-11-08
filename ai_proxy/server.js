// ai_proxy/server.js - DeepSeek API 代理服务器

// 1. 引入依赖
import express from 'express';
import fetch from 'node-fetch'; // 标准 ESM 导入 node-fetch v3+
import cors from 'cors';
import { readFileSync } from 'fs'; // 导入同步读取方法 (CommonJS 风格，但在 ESM 中可以这样导入)
// Vercel 部署时，不要使用 .env 文件，而是直接配置环境变量
// process.env.DEEPSEEK_API_KEY 会自动从 Vercel 的环境变量中获取

const app = express();
// Vercel 会自动设置 PORT 变量，本地使用 3000
const PORT = process.env.PORT || 3000; 

// 2. 配置中间件
// 允许跨域请求：允许您的前端页面（localhost 或文件系统）访问
app.use(cors()); 
app.use(express.json()); // 用于解析前端 POST 请求体中的 JSON 数据


// 3. 定义 AI 查询代理路由：/api/ai-query
app.post('/api/ai-query', async (req, res) => {
    // 关键：从安全的环境变量中获取密钥
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY; 
    const query = req.body.query; // 获取前端发送的查询内容

    if (!deepseekApiKey) {
        // 在 Vercel 上，我们检查是否存在环境变量，而不是检查硬编码的占位符
        return res.status(500).send({ error: 'DeepSeek API 密钥未配置。请检查 Vercel 环境变量设置。' });
    }
    
    if (!query) {
        return res.status(400).send({ error: '缺少查询参数。' });
    }

    try {
        // 4. 使用密钥安全地调用 DeepSeek API
        // 知识库 RAG 实现：在服务器启动时一次性加载知识库
        const systemPrompt =                             
                            `对于字词片段，猜测其相关的可能地名（要求是知识库里有的，若不在则猜测其可能不记得确切名字，你应该根据知识库提供多个可能的相关结果）。
                            若是询问做某些事的最佳场所之类的，也可以根据知识库中的问答回答，将推荐的地址写在最前面。
                            相关线索在知识库中，请尽可能根据知识库回答，如果无法有效推理出确切位置信息，请直接表达自己无法做到这一点，而不是尝试从互联网查找信息（这通常是不准确的）
                            如果是与该校区地理位置查找无关的问题，可以简洁的回应，结束对话
                            如果要求推荐，应该给出推荐的理由，并且基于知识库内容进行推荐，也可以结合自己的认识加以补充。
                            回答时无需说明信息来源，仅说“推测”：
                            \n\n--- 知识库 ---\n${knowledgeBase}\n--- 结束 ---`;

        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}` // 密钥只在后端使用
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                stream: false
            })
        });

        if (!deepseekResponse.ok) {
            const errorData = await deepseekResponse.json();
            return res.status(deepseekResponse.status).send({ error: errorData.error.message || "DeepSeek API 调用失败" });
        }

        // 5. 解析并只返回 AI 的回答
        const data = await deepseekResponse.json();
        const aiAnswer = data.choices[0].message.content.trim();
        
        // 6. 成功返回给前端
        res.json({ answer: aiAnswer });

    } catch (error) {
        console.error('代理服务器内部错误:', error);
        res.status(500).send({ error: '后端代理服务内部发生错误。' });
    }
});

// ⚠️ 知识库 RAG 实现：在服务器启动时一次性加载知识库
const KNOWLEDGE_BASE_FILE = 'knowledge.txt';
let knowledgeBase = '';

try {
    // 同步读取文件，确保在处理请求前加载完成
    knowledgeBase = readFileSync(KNOWLEDGE_BASE_FILE, 'utf8');
    console.log(`📖 知识库加载成功，共 ${knowledgeBase.length} 字符。`);
} catch (e) {
    console.error(`❌ 知识库文件 (${KNOWLEDGE_BASE_FILE}) 读取失败或不存在！`, e.message);
    // 如果失败，knowledgeBase 保持为空字符串
}

// 7. 启动服务器监听
app.listen(PORT, () => {
    console.log(`✅ DeepSeek 代理服务器运行在 http://localhost:${PORT}`);
    console.log(`📢 请确保前端 ai_interaction.js 调用此地址。`);
});

// 默认导出 app 供 Vercel Serverless Function 使用
export default app;
