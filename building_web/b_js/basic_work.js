/* --- basic_work.js (针对 Leaflet 改造版) --- */

// ---------------------------------------------
// 楼层数据定义 (所有楼层信息集中管理)
// ---------------------------------------------
const floorData = [
    { 
        id: 1, 
        name: "主楼 - 3F", 
        mapSrc: "../b_image/b_main_3.jpg", // 替换为您的实际图片路径
        thumbSrc: "../b_image/b_main_3.jpg", // 替换为您的实际图片路径
        hotspots: [
            { top: "20%", left: "30%", title: "C101 计算机教室" },
            { top: "55%", left: "70%", title: "教师办公室" }
        ]
    },
    { 
        id: 2, 
        name: "主楼概略图 - About", 
        mapSrc: "../b_image/b_main_a.jpg", 
        thumbSrc: "../b_image/b_main_a.jpg", 
        hotspots: [
            { top: "10%", left: "50%", title: "C201 阶梯教室" },
            { top: "70%", left: "20%", title: "公共休息区" }
        ]
    },
    { 
        id: 3, 
        name: "教学楼 A - 3F", 
        mapSrc: "placeholder-3f-map.jpg", 
        thumbSrc: "placeholder-3f-thumb.jpg", 
        hotspots: [
            { top: "35%", left: "45%", title: "会议室" }
        ]
    }
];

const INITIAL_FLOOR_ID = 1;

// ---------------------------------------------
// DOM 元素引用
// ---------------------------------------------
// 移除原有的 centralMap 和 mapOverlay 引用，它们在 Leaflet 模式下不再需要
const floorNameDisplay = document.getElementById('current-floor-name');
const thumbnailsContainer = document.getElementById('floor-thumbnails-container');


/**
 * 切换主地图显示，并更新楼层信息
 * @param {number} floorId - 要切换到的楼层 ID
 */
function switchMap(floorId) {
    const selectedFloor = floorData.find(f => f.id === floorId);
    if (!selectedFloor) return;

    // 1. 调用 b_map_ctrl.js 中的函数来切换 Leaflet 地图中的图片和热区
    // b_map_ctrl.js 负责初始化 Leaflet 实例、加载图片和渲染热区 Marker
    if (window.switchMapImage) {
        window.switchMapImage(selectedFloor.mapSrc, selectedFloor.hotspots);
    } else {
        console.error("Leaflet control not loaded: window.switchMapImage is undefined. 请确保已正确引入 b_map_ctrl.js。");
    }

    // 2. 更新楼层名称显示
    floorNameDisplay.textContent = selectedFloor.name;

    // 3. 更新缩略图的 active 状态
    document.querySelectorAll('.thumbnail-item').forEach(t => {
        t.classList.remove('active');
    });
    const activeThumb = document.querySelector(`.thumbnail-item[data-floor="${floorId}"]`);
    if (activeThumb) {
        activeThumb.classList.add('active');
    }
}

/**
 * 动态生成楼层缩略图并绑定事件
 */
function renderThumbnails() {
    floorData.forEach((floor, index) => {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'thumbnail-item';
        thumbDiv.setAttribute('data-floor', floor.id);

        if (floor.id === INITIAL_FLOOR_ID) {
            thumbDiv.classList.add('active');
        }

        thumbDiv.innerHTML = `
            <img src="${floor.thumbSrc}" alt="${floor.name} 缩略图" class="thumb-image">
            <span class="floor-name">${floor.name.split(' - ')[1]} ${index === 0 ? '(当前)' : ''}</span>
        `;
        
        // 绑定点击事件
        thumbDiv.addEventListener('click', () => {
            switchMap(floor.id);
        });

        thumbnailsContainer.appendChild(thumbDiv);
    });
}


// ---------------------------------------------
// 页面加载完成后的初始化
// ---------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. 渲染缩略图和事件监听
    renderThumbnails();
    
    // 2. 首次加载时显示默认楼层地图
    // 使用 setTimeout 延迟调用，以确保 DOM 和外部 Leaflet JS 完全准备好
    setTimeout(() => {
        switchMap(INITIAL_FLOOR_ID);
    }, 100); 
});