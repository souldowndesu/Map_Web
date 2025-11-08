/* 由gemini生成 - 不要手动修改此文件 */

// 1. 获取需要操作的元素
const header = document.getElementById('main-header');
const trigger = document.getElementById('header-trigger');

// ⭐ 关键新增：获取“列表查找”链接元素
const listSearchLink = document.querySelector('nav.main-nav a[href="#search-anchor"]');

// 2. 声明一个变量来跟踪鼠标是否在顶部区域
let isMouseInTopArea = false;

// 3. 当鼠标进入顶部触发区域时
trigger.addEventListener('mouseenter', () => {
    isMouseInTopArea = true;
    // 立即展开顶栏
    header.classList.remove('is-hidden');
});

// 4. 当鼠标离开*顶栏本身*时
header.addEventListener('mouseleave', () => {
    isMouseInTopArea = false;
    // 如果页面已经滚下去了，就再次隐藏
    if (window.pageYOffset > 100) { // 100px 是一个缓冲值
        header.classList.add('is-hidden');
    }
});

// 5. 监听页面的滚动事件
window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset; // 获取当前滚动条位置

    if (scrollTop > 100) {
        // 如果滚动超过 100px，并且鼠标*不在*顶部区域
        if (!isMouseInTopArea) {
            // 收起顶栏
            header.classList.add('is-hidden');
        }
    } else {
        // 如果回到了页面顶部，则始终显示顶栏
        header.classList.remove('is-hidden');
    }
});

// ⭐ 关键新增：缓动函数 (Easing Function)
// 这是一个常用的缓动函数：二次方的输入/输出缓动
function easeInOutCubic(t) {
    // t 是时间进度 (0 到 1)
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ⭐ 关键新增：自定义平滑滚动函数
function customScrollTo(targetY, duration) {
    const startY = window.pageYOffset; // 当前滚动条位置
    const distance = targetY - startY;  // 需要滚动的距离
    const startTime = performance.now();

    function step(currentTime) {
        const elapsedTime = currentTime - startTime; // 已经过去的时间
        const progress = Math.min(1, elapsedTime / duration); // 进度 (0 到 1)
        
        // 使用缓动函数调整进度
        const easedProgress = easeInOutCubic(progress);

        // 计算当前应该到达的位置
        const newY = startY + distance * easedProgress;

        window.scrollTo(0, newY);

        // 如果动画未结束，继续下一帧
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }

    // 启动动画循环
    window.requestAnimationFrame(step);
}


// ⭐ 关键修改：列表查找链接点击事件逻辑 (调用 customScrollTo)
if (listSearchLink) {
    listSearchLink.addEventListener('click', (event) => {
        // 阻止默认的锚点跳转行为
        event.preventDefault();

        // 获取目标元素 (搜索容器)
        const targetElement = document.getElementById('search-anchor');

        if (targetElement) {
            // 计算目标滚动位置 (元素顶部相对于视口顶部的距离 + 当前滚动位置)
            const targetY = targetElement.getBoundingClientRect().top + window.pageYOffset;

            // 调用自定义滚动函数
            customScrollTo(targetY, 800); // 800 毫秒的自定义滚动时间
        }
    });
}