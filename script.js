// script.js - 再次更新，力求精準控制左右固定顯示區的“浮現”與“消失”

document.addEventListener('DOMContentLoaded', () => {
    // 選取所有需要觀察的、帶有 data-year 屬性的內容區塊
    const mainContentSections = document.querySelectorAll('.main-content section[data-year]');
    
    // 左側固定顯示元素
    const stickyLeftElement = document.getElementById('sticky-left-display');
    const stickyLeftLargeText = stickyLeftElement ? stickyLeftElement.querySelector('.sticky-marker-large-text') : null;

    // 右側固定顯示元素
    const stickyRightElement = document.getElementById('sticky-right-display');
    const stickyRightLargeText = stickyRightElement ? stickyRightElement.querySelector('.sticky-marker-large-text') : null;
    const stickyRightSmallText = stickyRightElement ? stickyRightElement.querySelector('.sticky-marker-small-text') : null;

    // 基本檢查，確保HTML元素存在
    if (!stickyLeftElement || !stickyLeftLargeText) {
        console.error('關鍵錯誤：左側固定顯示區的HTML元素 (#sticky-left-display 或 .sticky-marker-large-text) 未找到。請檢查HTML。');
    }
    if (!stickyRightElement || !stickyRightLargeText || !stickyRightSmallText) {
        console.error('關鍵錯誤：右側固定顯示區的HTML元素 (#sticky-right-display 或其子元素) 未找到。請檢查HTML。');
    }

    // 從HTML的 .timeline-event-marker 和 .timeline-rank-marker 讀取數據
    const eventMarkerData = {};
    document.querySelectorAll('.timeline-left .timeline-event-marker[data-marker-year]').forEach(marker => {
        const year = marker.dataset.markerYear;
        const largeTextElement = marker.querySelector('.marker-large-text');
        if (year && largeTextElement) {
            eventMarkerData[year] = { largeText: largeTextElement.textContent.trim() };
        }
    });

    const rankingMarkerData = {};
    document.querySelectorAll('.timeline-right .timeline-rank-marker[data-marker-year]').forEach(marker => {
        const year = marker.dataset.markerYear;
        const largeTextElement = marker.querySelector('.marker-large-text');
        const smallTextElement = marker.querySelector('.marker-small-text');
        if (year && largeTextElement && smallTextElement) {
            rankingMarkerData[year] = {
                largeText: largeTextElement.textContent.trim(),
                smallText: smallTextElement.textContent.trim()
            };
        }
    });

    let currentlyDisplayedYear = null; // 追蹤當前應顯示的年份

    // Intersection Observer 的設定選項
    const observerOptions = {
        root: null, // 相對於瀏覽器視窗
        rootMargin: '0px 0px -50% 0px', // 觸發線設定在視窗垂直中線的位置
                                        // 當一個 section 的頂部超過中線，它就被視為活躍的候選者
        threshold: 0.01 // 只要有極小部分越過 rootMargin 定義的線就觸發
    };

    const intersectionCallback = (entries) => {
        // 找出所有當前 isIntersecting (即在觸發區域內) 的 section
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        let newActiveYear = null;

        if (intersectingEntries.length > 0) {
            // 如果有多個 section 在觸發區域內，我們選擇最靠上的那一個
            // (getBoundingClientRect().top 最小的那個，但這裡簡化為 entries 中最後一個滿足條件的，
            //  因為 Intersection Observer 的 entries 通常是按某種順序的，
            //  或者可以假設我們的 rootMargin 設定能讓一個主要 section 凸顯出來)
            // 更穩健的方式是比較它們的 .boundingClientRect.top
            intersectingEntries.sort((a, b) => a.target.offsetTop - b.target.offsetTop); // 確保按文檔順序
            
            // 選擇符合條件的 section 中，最“主要”的一個
            // 這裡我們假設第一個（即頁面上方最先符合條件的）
            const primaryEntry = intersectingEntries[0];
            newActiveYear = primaryEntry.target.dataset.year;
        }

        // 判斷是否需要更新顯示
        if (newActiveYear) {
            if (newActiveYear !== currentlyDisplayedYear) {
                currentlyDisplayedYear = newActiveYear; // 更新當前年份
                console.log(`Updating sticky displays for year: ${currentlyDisplayedYear}`);

                // 更新左側
                if (stickyLeftElement && stickyLeftLargeText) {
                    const eventData = eventMarkerData[currentlyDisplayedYear];
                    stickyLeftLargeText.textContent = (eventData && eventData.largeText) ? eventData.largeText : currentlyDisplayedYear;
                    stickyLeftElement.classList.add('is-visible');
                }

                // 更新右側
                if (stickyRightElement && stickyRightLargeText && stickyRightSmallText) {
                    const rankData = rankingMarkerData[currentlyDisplayedYear];
                    if (rankData && rankData.largeText) { // 確保 rankData 和 largeText 都存在
                        stickyRightLargeText.textContent = rankData.largeText;
                        stickyRightSmallText.textContent = rankData.smallText || ''; // 小字可選
                        stickyRightElement.classList.add('is-visible');
                    } else { // 如果該年份沒有排名數據
                        stickyRightLargeText.textContent = 'N/A';
                        stickyRightSmallText.textContent = 'Data not available';
                        stickyRightElement.classList.add('is-visible'); // 仍然顯示，但提示無數據
                        // 或者如果你希望沒有數據時也隱藏右側：
                        // stickyRightElement.classList.remove('is-visible');
                    }
                }
            } else {
                // 年份未變，但要確保 sticky 元素是可見的 (例如頁面載入時第一個元素就符合條件)
                if (stickyLeftElement && !stickyLeftElement.classList.contains('is-visible')) stickyLeftElement.classList.add('is-visible');
                if (stickyRightElement && !stickyRightElement.classList.contains('is-visible')) stickyRightElement.classList.add('is-visible');
            }
        } else { // 如果 newActiveYear 為 null，表示沒有任何 section 在觸發區域內
            if (currentlyDisplayedYear !== null) { // 只有當之前有東西顯示時，才執行隱藏
                console.log('No active section in trigger zone, hiding sticky displays.');
                if (stickyLeftElement) stickyLeftElement.classList.remove('is-visible');
                if (stickyRightElement) stickyRightElement.classList.remove('is-visible');
                currentlyDisplayedYear = null; // 重置當前年份
            }
        }
    };

    const observer = new IntersectionObserver(intersectionCallback, observerOptions);

    if (mainContentSections.length > 0) {
        mainContentSections.forEach(section => observer.observe(section));
    } else {
        console.warn('No sections with [data-year] found to observe in .main-content.');
    }
});