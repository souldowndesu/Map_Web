// 文件名: map_poi.js

(function(L, map, appState) { 
    // ... (确保 L, map, appState 实例存在的检查)
    if (!L || !map || !appState) {
        console.error("Leaflet, map 实例或 appState 未找到。");
        return;
    }

    let currentHighlight = null; 

    // === POI 数据定义 (新增 url 字段 和 sub_labels 字段) ===
    const pois = [
        // 示例 1：图书馆 (北馆)
        { 
            id: 'lib_north',
            name: "图书馆 (北馆)", 
            coords: [-879, 1943], 
            bounds: [[-972, 1794], [-786, 2092]],
            info: "主要学习场所，建筑宏伟。",
            url: "/Map/building_web/b_html/lib.html", 
            isFeatured: true, 
            // ⭐ 关键新增：子标签
            sub_labels: []
        },
        {
            id: 'zhu',
            name: "主楼", 
            coords: [-836.5, 2418], 
            bounds: [[-669, 2291], [-1004, 2545]],
            info: "学校的标志性建筑，包含多个教学楼和行政办公室。",
            url: "/Map/building_web/b_html/zhu.html", 
            isFeatured: true,
            sub_labels: [
                { id: 'zhu_north', name: '主北', info: '南主楼'},
                { id: 'zhu_south', name: '主南', info: '北主楼' },
                { id: 'zhu_m', name: '主M',info: '主M楼'} // 没有 url，使用母标签 url，又 url 标签则使用该url
            ]
        },
        {
            id: '3building',
            name: "三号楼",
            coords: [-587.5, 2651],
            bounds: [[-485, 2500], [-590, 2803]],
            info: "三号楼。",
            url: "/Map/building_web/b_html/3building.html",
            isFeatured: true,
            sub_labels: [] // 没有子标签            
        },
        {
            id: '4building',
            name: "四号楼",
            coords: [-587.5, 2291],
            bounds: [[-485, 2140], [-590, 2443]],
            info: "四号楼。",
            url: "/Map/building_web/b_html/4building.html",
            isFeatured: false,
            sub_labels: [] // 没有子标签
        },
        {
            id: 'chengxing',
            name: "晨兴音乐厅",
            coords: [-1510.5, 2580],
            bounds: [[-1571, 2509], [-1450, 2652]],
            info: "举办音乐会和艺术活动的场所。",
            url: "/Map/building_web/b_html/musichall.html",
            isFeatured: true,
            sub_labels: [] // 没有子标签        
        },
        {
            id: 'he1',
            name: "合一食堂",
            coords: [-1300, 1800], 
            bounds: [[-1450, 1650], [-1150, 1950]], 
            info: "提供多样化餐饮选择的食堂。",
            url: "/Map/building_web/b_html/cafeteria_he1.html",
            isFeatured: false,
            sub_labels: [
                { id: 'nanqu', name: '南区食堂', info: '合一食堂' }
            ] 
        },
        { 
            id: 'stadium', 
            name: "体育场", 
            coords: [-1953.5, 1396.5], 
            bounds: [[-2190, 1065], [-1717, 1728]], 
            info: "大型活动和体育锻炼场地。",
            url: "/Map/building_web/b_html/stadium.html",
            sub_labels: [] // 没有子标签
        }
    ];
    
    // === 1. POI 映射表 (Map) - 关键修改：包含子标签的映射 ===
    const poiMap = {};
    const subLabelMap = {}; // 新增：子标签到母标签ID的映射

    pois.forEach(poi => {
        poiMap[poi.id] = poi;
        // 处理子标签
        if (poi.sub_labels && poi.sub_labels.length > 0) {
            poi.sub_labels.forEach(sub => {
                // 将子标签也加入 poiMap，以便统一查找
                poiMap[sub.id] = { 
                    ...sub, 
                    isSubLabel: true, 
                    parentId: poi.id, 
                    // 子标签的 bounds, coords 继承自母标签，用于高亮和定位
                    bounds: poi.bounds,
                    coords: poi.coords,
                    // 默认 url 使用子标签自己的，如果没有则使用母标签的
                    url: sub.url || poi.url 
                };
            });
        }
    });

    // --- 统一选中和高亮逻辑 (selectAndHighlight 保持不变，因为它接收的是 POI ID) ---
    function selectAndHighlight(poiId) {
        // ... (保持不变)
        // 1. 取消上一个列表项的选中状态
        document.querySelectorAll('#poi-list li').forEach(li => {
            li.classList.remove('selected');
        });

        // 2. 清除地图上的上一个高亮
        if (currentHighlight) {
            map.removeLayer(currentHighlight);
            currentHighlight = null;
        }

        const selectedPoi = poiMap[poiId];

        if (selectedPoi) {
            // 3. 设置当前选中 ID
            appState.currentSelectedPoiId = poiId;
            
            // ⭐ 关键修改：对于子标签，高亮和移动逻辑使用其继承的母标签属性
            const highlightPoi = selectedPoi.isSubLabel ? poiMap[selectedPoi.parentId] : selectedPoi;


            // 4. 高亮地图图块 (关键修改: interactive: true 并绑定点击事件)
            if (highlightPoi.bounds) {
                currentHighlight = L.rectangle(highlightPoi.bounds, {
                    className: 'poi-highlight',
                    fillOpacity: 0,
                    interactive: true // 开启交互，使其可以接收点击事件
                }).addTo(map);
                
                // 绑定点击事件：实现点击边框跳转 (跳转目标是当前选中的 POI/子标签的 URL)
                currentHighlight.on('click', function(e) {
                    // 阻止事件冒泡到 map.on('click')，防止状态被清除
                    L.DomEvent.stopPropagation(e); 

                    if (appState.currentSelectedPoiId === selectedPoi.id) {
                        // 再次点击已选中的高亮边框 -> 执行跳转
                        console.log(`边框二次点击：${selectedPoi.name}，跳转到 ${selectedPoi.url}`);
                        window.location.href = selectedPoi.url;
                    } else {
                        // 如果状态被意外清除，重新选中
                        selectAndHighlight(selectedPoi.id);
                    }
                });
                
                // 5. 移动并放大地图到 POI 中心
                map.setView(highlightPoi.coords, 0.15, {
                    animate: true,
                    duration: 0.6
                }); 
            }

            // 6. 选中列表项并变色 (仅对主列表有效，检索列表同步由 search_table.js 处理)
            const listItem = document.querySelector(`#poi-list li[data-poi-id="${poiId}"]`);
            if (listItem) {
                listItem.classList.add('selected');
            }
        }
    }
    
    window.poiData = {
        pois: pois,
        poiMap: poiMap,
        selectAndHighlight: selectAndHighlight // 关键：暴露这个函数
    };

    // === 地图点击事件：用于取消高亮 (保持不变) ===
    map.on('click', function() {
        if (currentHighlight) {
            // 清除地图上的高亮
            map.removeLayer(currentHighlight);
            currentHighlight = null;
        }
        // 清除选中状态和列表高亮
        if (appState.currentSelectedPoiId) {
            appState.currentSelectedPoiId = null;
            document.querySelectorAll('#poi-list li').forEach(li => {
                li.classList.remove('selected');
            });
        }
    });

    // === 2. 生成 POI 列表和绑定事件 (主列表只显示 isFeatured: true 的母标签) ===
    const poiListElement = document.getElementById('poi-list');
    if (poiListElement) {
        poiListElement.innerHTML = ''; 

        // 筛选出精选 POI (仅母标签)
        const featuredPois = pois.filter(poi => poi.isFeatured && !poi.isSubLabel); 

        featuredPois.forEach(poi => { 
            const listItem = document.createElement('li');

            listItem.textContent = poi.name;
            listItem.dataset.poiId = poi.id; 
            
            // 列表项点击事件
            listItem.addEventListener('click', (event) => {
                const poiId = event.currentTarget.dataset.poiId; 
                const selectedPoi = poiMap[poiId];

                if (!selectedPoi) return;

                if (appState.currentSelectedPoiId === poiId) {
                    // 再次点击已选中的项 -> 执行跳转
                    console.log(`列表二次点击：${poi.name}，跳转到 ${poi.url}`);
                    window.location.href = poi.url;
                } else {
                    // 第一次点击或点击了新的项 -> 选中/高亮
                    selectAndHighlight(poiId);
                }
            });

            poiListElement.appendChild(listItem);
        });
    }

    // 暴露 POI 映射和高亮函数供 map_clicklink.js 使用
    window.poiMap = poiMap;
    window.selectAndHighlight = selectAndHighlight;

})(L, window.mapInstance, window.appState);