/* --- b_map_ctrl.js (Leaflet 地图控制) --- */

// 全局 Leaflet 实例和图层
window.mapInstance = null;
window.imageOverlay = null;
window.hotspotLayerGroup = null; // 用于存放当前楼层热区标记

// Leaflet 坐标系统参数 (根据您的图片尺寸调整)
// ⚠️ 参数调整位置 1: MAP_SIZE
//    请根据您最大的楼层图的宽度或高度设置，确保所有图片能包含在这个逻辑坐标系内。
//    例如，如果您的图片宽度是 3000px，高度也是 3000px，则设置为 3000。
//    如果图片是 4000x3000，您可以取较大的值，例如 4000。
const MAP_SIZE = 1920; 
const MAP_BOUNDS = [[-1376, 0], [0, 1920]]; 
const MAP_CENTER = [-1376 / 2, 1920 / 2]; 

// ⚠️ 参数调整位置 2: 缩放级别
//    minZoom: 允许地图缩小的最小级别。负值表示比原始尺寸更小。
//    maxZoom: 允许地图放大的最大级别。
//    initialZoom: 初始缩放级别。0 通常表示图片完整填充边界。
const MIN_ZOOM = -2; 
const MAX_ZOOM = 3; 
const INITIAL_ZOOM = -0.7; 
const ZOOM_STEP = 0.4; // 自定义缩放按钮的步长

/**
 * 将 basic_work.js 中的百分比坐标转换为 Leaflet 坐标 (L.CRS.Simple 模式)
 * @param {string} topPct - "20%"
 * @param {string} leftPct - "30%"
 * @returns {L.LatLng} 
 */
function toLeafletCoords(topPct, leftPct) {
    const top = parseFloat(topPct) / 100;
    const left = parseFloat(leftPct) / 100;
    
    const lat = MAP_BOUNDS[0][0] * (1 - top); 
    const lng = MAP_BOUNDS[1][1] * left;      
    
    return L.latLng(lat, lng);
}

/**
 * 渲染当前楼层的热区标记 (POI Markers)
 * @param {Array<Object>} hotspots - 热区数据数组，来自 basic_work.js
 */
function renderHotspots(hotspots) {
    if (!window.mapInstance) return;

    // 清除上一楼层的热区
    if (window.hotspotLayerGroup) {
        window.hotspotLayerGroup.clearLayers();
    } else {
        window.hotspotLayerGroup = L.layerGroup().addTo(window.mapInstance);
    }
    
    hotspots.forEach(hotspot => {
        const coords = toLeafletCoords(hotspot.top, hotspot.left);

        const poiIcon = L.divIcon({
            className: 'poi-marker',
            iconSize: [26, 26], 
            iconAnchor: [13, 13]
        });

        L.marker(coords, { icon: poiIcon })
            .bindPopup(`<b>${hotspot.title}</b>`)
            .addTo(window.hotspotLayerGroup);
    });
}


/**
 * 初始化或切换 Leaflet 地图的图片和热区
 * @param {string} newImageUrl - 新的图片路径
 * @param {Array<Object>} newHotspots - 新的热区数据
 */
window.switchMapImage = function(newImageUrl, newHotspots) {
    if (!window.mapInstance) {
        // 第一次调用：初始化地图
        initLeafletMap(newImageUrl);
    } else {
        // 切换图片时，移除旧的 ImageOverlay
        if (window.imageOverlay) {
            window.mapInstance.removeLayer(window.imageOverlay);
        }
        window.imageOverlay = L.imageOverlay(newImageUrl, MAP_BOUNDS).addTo(window.mapInstance);
        
        // 重置视图，使其填充容器并回到初始缩放级别
        resetMapView();
    }
    
    // 渲染新楼层的热区
    renderHotspots(newHotspots);
};

/**
 * 初始化 Leaflet 地图
 * @param {string} initialImageUrl - 初始图片路径
 */
function initLeafletMap(initialImageUrl) {
    // 1. 初始化地图容器，禁用 Leaflet 默认的缩放控件
    window.mapInstance = L.map('map-frame', {
        zoomControl: false,      // 禁用 Leaflet 默认的缩放按钮
        scrollWheelZoom: true,   // 启用滚轮缩放
        dragging: true,          // 启用拖动
        crs: L.CRS.Simple,       // 使用简单坐标系 (非地理地图)
        minZoom: MIN_ZOOM,       // 最小缩放级别
        maxZoom: MAX_ZOOM,       // 最大缩放级别
        zoomSnap: ZOOM_STEP      // 缩放步长
    }); 
    
    // 2. 加载图片和设置边界
    window.imageOverlay = L.imageOverlay(initialImageUrl, MAP_BOUNDS).addTo(window.mapInstance);
    window.mapInstance.setMaxBounds(MAP_BOUNDS); // 设置最大边界，防止拖动到图片范围外
    
    // 3. 初始时，使地图尽可能填满容器
    resetMapView();

    // 4. 绑定自定义缩放按钮事件
    document.getElementById('zoom-in-btn').addEventListener('click', () => {
        window.mapInstance.zoomIn(ZOOM_STEP);
    });
    document.getElementById('zoom-out-btn').addEventListener('click', () => {
        window.mapInstance.zoomOut(ZOOM_STEP);
    });
}

/**
 * 重置地图视图：使其尽可能填满容器，并回到初始缩放级别
 */
function resetMapView() {
    if (window.mapInstance && window.imageOverlay) {
        window.mapInstance.fitBounds(MAP_BOUNDS); // 适应图片边界
        window.mapInstance.setView(MAP_CENTER, INITIAL_ZOOM); // 设置到初始中心和缩放级别
        // 确保地图刷新以适应容器 (在某些浏览器或复杂布局中可能需要)
        window.mapInstance.invalidateSize(); 
    }
}