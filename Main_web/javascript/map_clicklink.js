// 文件名: map_click_links.js (修改后)

(function(L, map, appState, poiMap, selectAndHighlight, poiData) { 
    // ... (确保 L, map, appState, poiMap, selectAndHighlight 已加载)
    if (!L || !map || !appState || !poiMap || !selectAndHighlight || !poiData) {
        console.error("Leaflet, map 实例, appState, poiMap, selectAndHighlight 或 poiData 未找到。");
        return;
    }

    // === 1. 从 map_poi.js 获取数据，移除本地的 linkAreas 数组 ===
    // 使用 map_poi.js 导出的 poiData.pois 作为数据源
    const pois = poiData.pois; 

    // === 2. 在地图上绘制并绑定点击事件 (透明覆盖层) ===
    pois.forEach(poi => {
        // 只有定义了 bounds 的 POI 才需要绘制可点击区域
        if (poi.bounds) {
            const poiId = poi.id;

            // 创建一个不可见的矩形覆盖层 (Rectangle)
            const rect = L.rectangle(poi.bounds, {
                fillOpacity: 0.0,
                weight: 0, 
                interactive: true,
                className: `clickable-area-${poiId}` 
            }).addTo(map);

            // 绑定点击事件 (逻辑与您原代码相同)
            rect.on('click', function(e) {
                L.DomEvent.stopPropagation(e);

                if (appState.currentSelectedPoiId === poiId) {
                    // 二次点击 -> 执行跳转 (直接使用 POI 数据中的 URL)
                    const targetUrl = poi.url; 
                    if (targetUrl) {
                        console.log(`地图区域二次点击: ${poi.name}，跳转到 ${targetUrl}`);
                        window.location.href = targetUrl;
                    } else {
                        console.warn(`区域 ${poi.name} 没有可用的跳转 URL。`);
                    }
                } else {
                    // 第一次点击 -> 选中/高亮
                    selectAndHighlight(poi.id);
                }
            });
        }
    });

})(L, window.mapInstance, window.appState, window.poiMap, window.selectAndHighlight, window.poiData);