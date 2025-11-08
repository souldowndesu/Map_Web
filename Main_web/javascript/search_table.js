// 文件名: search_table.js

(function() {
    // 确保依赖项已加载
    if (!window.poiData || !window.poiData.selectAndHighlight || !window.appState) {
        console.error("POI 数据或核心函数未加载，检索表功能初始化失败。");
        return;
    }

    // ⭐ 关键修改：解构出 poiMap，用于列表项的点击事件
    const { pois, poiMap, selectAndHighlight } = window.poiData; 
    const appState = window.appState;
    const retrievalListElement = document.getElementById('retrieval-poi-list');

    // [新增] 获取搜索输入框元素
    const searchInput = document.getElementById('search-input');
    
    // ⭐ 关键新增：将母标签和所有子标签扁平化为一个可搜索的数组
    let allSearchablePois = [];
    pois.forEach(poi => {
        // 1. 添加母标签
        allSearchablePois.push(poi);
        // 2. 添加子标签
        if (poi.sub_labels) {
            poi.sub_labels.forEach(sub => {
                // 子标签对象已在 map_poi.js 中构造好，直接使用 poiMap[sub.id]
                const subPoi = poiMap[sub.id]; 
                if (subPoi) {
                    allSearchablePois.push(subPoi);
                }
            });
        }
    });


    // 辅助函数：将检索表和侧边栏的选中状态同步 (保持不变)
    function syncSelection(currentPoiId) {
        // 移除所有列表项的选中状态
        document.querySelectorAll('.retrieval-poi-list-style li').forEach(li => {
            li.classList.remove('selected');
        });
        // 移除主列表的所有选中状态 (主列表只显示母标签，但可能被子标签的选中所同步)
        document.querySelectorAll('#poi-list li').forEach(li => {
             li.classList.remove('selected');
        });


        if (currentPoiId) {
            // 选中检索表中的项
            const retrievalItem = document.querySelector(`#retrieval-poi-list li[data-poi-id='${currentPoiId}']`);
            if (retrievalItem) retrievalItem.classList.add('selected');
            
            // ⭐ 关键修改：如果当前选中是子标签，也要同步选中母标签的主列表项
            const selectedPoi = poiMap[currentPoiId];
            const targetPoiId = selectedPoi.isSubLabel ? selectedPoi.parentId : currentPoiId;

            // 选中侧边栏中的项 (如果是子标签，选中母标签)
            const poiItem = document.querySelector(`#poi-list li[data-poi-id='${targetPoiId}']`);
            if (poiItem) poiItem.classList.add('selected');
        }
    }

    // [新增] 辅助函数：创建单个列表项 (li)
    function createListItem(poi, selectAndHighlight, syncSelection, poiMap) {
        const listItem = document.createElement('li');
        
        let htmlContent = `<span>${poi.name}</span>`;
        if (poi.isSubLabel) {
            const parentPoi = poiMap[poi.parentId];
            // ⭐ 关键修改：显示子标签时，添加母标签的提示
            htmlContent += `<span class="sub-label-hint"> (${parentPoi.name})</span>`;
            listItem.classList.add('is-sub-label');
        }
        
        listItem.innerHTML = htmlContent;
        listItem.dataset.poiId = poi.id;
        listItem.className = 'retrieval-list-item';

        listItem.addEventListener('click', (event) => {
            const poiId = event.currentTarget.dataset.poiId;
            const selectedPoi = poiMap[poiId];

            if (!selectedPoi) return;

            if (appState.currentSelectedPoiId === poiId) {
                // 再次点击已选中的项 -> 执行跳转 
                // ⭐ 关键修改：跳转使用子标签/母标签自己的 url (已在 map_poi.js 中处理继承逻辑)
                console.log(`检索表二次点击：${selectedPoi.name}，跳转到 ${selectedPoi.url}`);
                window.location.href = selectedPoi.url;
            } else {
                // 第一次点击或点击了新的项 -> 选中/高亮
                selectAndHighlight(poiId); // 调用 map_poi.js 暴露的核心函数
                syncSelection(poiId);     // 确保两个列表同步
            }
        });
        return listItem;
    }

    // === 1. [重构/替换] 生成检索表内容 (实现 FLIP 动画) ===
    function generateRetrievalList(data) {
        // ... (FLIP 动画逻辑保持不变)
        if (!retrievalListElement) return;

        // --- F (First) - 记录现有元素的位置 ---
        const firstPositions = new Map();
        const existingItems = Array.from(retrievalListElement.children);
        const newPoiIds = new Set(data.map(poi => poi.id));
        const itemsToAnimate = [];
        
        // 1. 记录现有元素的位置 (仅记录非正在离开的元素)
        existingItems.forEach(item => {
            const id = item.dataset.poiId;
            if (!item.classList.contains('is-leaving')) {
                firstPositions.set(id, item.getBoundingClientRect());
            }
        });

        // 现有子元素的映射（用于快速查找）
        const existingItemMap = new Map(existingItems.map(item => [item.dataset.poiId, item]));

        // --- L (Last) - 更新 DOM 结构至最终状态 ---
        
        // 2. a) 处理离开的元素 (退出动画)
        existingItems.forEach(item => {
            const id = item.dataset.poiId;
            if (!newPoiIds.has(id) && !item.classList.contains('is-leaving')) {
                // 元素需要离开，且尚未标记为离开
                item.classList.add('is-leaving');
                // 在动画结束后从 DOM 移除 (使用 once: true 自动清理监听器)
                item.addEventListener('transitionend', function removeLeavingItem(e) {
                    if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
                        item.remove();
                    }
                }, { once: true });
            }
        });

        // 2. b) 根据新的数据数组，构建新的 DOM 列表 (reorder/add)
        const newOrderFragment = document.createDocumentFragment();
        data.forEach(poi => {
            let item = existingItemMap.get(poi.id);
            
            if (item) {
                // 现有元素：移动或保持
                item.classList.remove('is-leaving');
            } else {
                // 新增元素：创建
                item = createListItem(poi, selectAndHighlight, syncSelection, poiMap);
                item.classList.add('is-leaving'); // 初始状态 (opacity: 0)
            }
            
            itemsToAnimate.push(item); // 标记为需要计算动画
            newOrderFragment.appendChild(item); // 插入到文档片段中，完成重新排序
        });

        // 2. c) 执行主要的 DOM 替换 (这将保留正在离开的元素，并将其移动到列表末尾/或移除)
        // 简化的 FLIP 步骤：移除所有现有子节点，然后插入新片段
        while (retrievalListElement.firstChild) {
            retrievalListElement.removeChild(retrievalListElement.firstChild);
        }
        retrievalListElement.appendChild(newOrderFragment);
        
        // --- I (Invert) & P (Play) - 动画移动/进入元素 ---
        // 使用 requestAnimationFrame 确保浏览器已经计算出 Last 位置
        requestAnimationFrame(() => {
            itemsToAnimate.forEach(item => {
                const id = item.dataset.poiId;
                const firstRect = firstPositions.get(id); // 旧位置

                if (firstRect) { 
                    // 移动/保持动画 (Move/Stay)
                    const lastRect = item.getBoundingClientRect(); // 新位置
                    const deltaX = firstRect.left - lastRect.left;
                    const deltaY = firstRect.top - lastRect.top;
                    
                    if (deltaX !== 0 || deltaY !== 0) {
                        // I (Invert): 瞬移回旧位置
                        item.style.transition = 'none'; // 禁用 CSS 过渡
                        item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                        
                        // P (Play): 动画到新位置
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                item.style.transition = ''; // 恢复 CSS 过渡
                                item.style.transform = ''; // 动画到新位置 (0, 0)
                            });
                        });
                    }
                } 
                
                // 新增元素 (Enter Animation)
                if (item.classList.contains('is-leaving')) {
                    // P (Play Enter): 立即移除 is-leaving，让 CSS 动画到 opacity: 1
                    requestAnimationFrame(() => {
                        item.classList.remove('is-leaving'); 
                    });
                }
            });
        });

        // 首次加载时，将列表项的选中状态与全局状态同步
        if (appState.currentSelectedPoiId) {
            syncSelection(appState.currentSelectedPoiId);
        }
    }


    // === 2. 搜索逻辑 (调用新的生成函数) ===
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase().trim();
            
            // ⭐ 关键修改：过滤 allSearchablePois 列表
            // 过滤 POI：匹配名称 (name) 或信息 (info) 字段
            const filteredPois = allSearchablePois.filter(poi => {
                const infoText = poi.info ? poi.info.toLowerCase() : '';
                return poi.name.toLowerCase().includes(searchTerm) || 
                       infoText.includes(searchTerm);
            });

            // 调用新的带 FLIP 动画的列表生成函数
            generateRetrievalList(filteredPois);
        });
    }

    // 初始化加载全部 POI (使用扁平化的列表)
    generateRetrievalList(allSearchablePois); 

})();