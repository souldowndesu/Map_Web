// 文件名: ai_interaction.js
// 目的: 调用安全的后端代理服务 (已部署在 Vercel)

(function() {
    // === 核心配置 (指向您的 Vercel 代理服务器地址) ===
    // ⚠️ 关键修改：使用相对路径，指向 Vercel 上的 API 路由
    const PROXY_ENDPOINT = "/api/ai-query"; 
    const MIN_QUERY_LENGTH = 2; 
    const DEBOUNCE_DELAY = 600; 
    // ===============================================

    const searchInput = document.getElementById('search-input');
    const aiResponseArea = document.getElementById('ai-response-area');
    let apiCallTimeout = null;

    if (!searchInput || !aiResponseArea) {
        console.error("AI 交互功能初始化失败：未找到 #search-input 或 #ai-response-area 元素。");
        return;
    }

    // === 辅助函数：更新 AI 区域状态和内容 (与之前保持一致) ===
    function updateAIResponse(state, content = '') {
        aiResponseArea.style.display = (state === 'hidden') ? 'none' : 'block';
        aiResponseArea.className = ''; 
        
        switch (state) {
            case 'loading':
                aiResponseArea.classList.add('loading');
                aiResponseArea.innerHTML = `正在询问 AI 关于：<b>"${content}"</b>...`;
                break;
            case 'error':
                aiResponseArea.classList.add('error');
                aiResponseArea.innerHTML = `⚠️ AI 服务暂时不可用: <b>${content}</b>`;
                break;
            case 'success':
                aiResponseArea.innerHTML = `🤖 AI 回答: ${content}`;
                break;
            case 'hidden':
            default:
                break;
        }
    }

    // === 核心函数：调用您自己的后端代理 ===
    async function callDeepSeekAPI(query) {
        updateAIResponse('loading', query);

        try {
            // ⭐ 关键修改已应用：使用相对路径 /api/ai-query
            const response = await fetch(PROXY_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query }) // 发送查询给后端
            });

            if (!response.ok) {
                // 如果代理服务器返回错误 (状态码 4xx 或 5xx)
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP 错误: ${response.status}`);
            }

            const data = await response.json();
            // ⭐ 从代理返回的 JSON 中获取 AI 回答
            const aiResponseText = data.answer; 

            updateAIResponse('success', aiResponseText);

        } catch (error) {
            console.error("代理服务调用失败:", error);
            // 提示用户可能的原因，例如密钥缺失或网络问题
            const errorMessage = (error.message.includes('500') || error.message.includes('密钥未配置')) 
                                ? "代理服务器故障或 API 密钥未配置，请联系管理员。" 
                                : error.message;
            updateAIResponse('error', errorMessage || "网络错误或代理服务器故障");
        }
    }

    // === 监听搜索框输入 (使用防抖) ===
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();

        clearTimeout(apiCallTimeout);
        
        if (searchTerm.length >= MIN_QUERY_LENGTH) {
            apiCallTimeout = setTimeout(() => {
                callDeepSeekAPI(searchTerm); 
            }, DEBOUNCE_DELAY); 
        } else {
            updateAIResponse('hidden');
        }
    });

    updateAIResponse('hidden'); 
})();
