(function() {
    // ... (其他变量定义保持不变)
    const mapImageBounds = [[-3161, 0], [0, 3161]]; 
    const mapCenter = [-1580.5, 1580.5]; 
    const imageUrl = './image/map_1.jpg'; // 替换为您的图片路径!

    // === 1. 初始化地图 ===
    const map = L.map('map-frame', {
        zoomControl: false, 
        inertia: false,
        crs: L.CRS.Simple,
        minZoom: -2, 
        maxZoom: 3,  
        zoomSnap: 0.5 
    }).setView(mapCenter, 0); 

    // ** 关键修改：将 map 实例暴露给全局，供 map_highlight.js 使用 **
    window.mapInstance = map; 

    // === 2. 加载本地图片作为地图底图 ===
    const imageOverlay = L.imageOverlay(imageUrl, mapImageBounds).addTo(map);

    // 调整地图视图以适应图片边界
    map.fitBounds(mapImageBounds);

    // ⚠️ 移除原 map_ctrl.js 中的 POI 数据定义和列表生成逻辑！

    // === 3. 自定义缩放按钮逻辑 (保持不变) ===
    const zoomInButton = document.getElementById('zoom-in-btn');
    const zoomOutButton = document.getElementById('zoom-out-btn');

    if (zoomInButton) {
        zoomInButton.addEventListener('click', () => {
            map.zoomIn(0.5); 
        });
    }

    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', () => {
            map.zoomOut(0.5); 
        });
    }

})();