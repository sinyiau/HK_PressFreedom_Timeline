// script.js - 更新版，實現更可靠的“浮現”和“消失”效果

document.addEventListener('DOMContentLoaded', () => {
    const mainContentSections = document.querySelectorAll('.main-content section[data-year]'); // 只選取有 data-year 的 section
    const stickyElement = document.getElementById('sticky-left-display');
    const stickyDisplayLargeText = stickyElement ? stickyElement.querySelector('.sticky-marker-large-text') : null;

    if (!stickyElement || !stickyDisplayLargeText) {
        console.error('Sticky display elements not found in HTML. Please check IDs (#sticky-left-display) and class (.sticky-marker-large-text).');
        return;
    }

    // 從 HTML 的 .timeline-event-marker 讀取年份數據
    const markerData = {};
    document.querySelectorAll('.timeline-left .timeline-event-marker[data-marker-year]').forEach(marker => {
        const year = marker.dataset.markerYear;
        const largeTextElement = marker.querySelector('.marker-large-text');
        if (year && largeTextElement) {
            markerData[year] = {
                largeText: largeTextElement.textContent.trim()
            };
        }
    });

    let currentlyDisplayedYear = null; // 用於追蹤當前固定顯示區顯示的年份

    // Intersection Observer 的設定
    // rootMargin: '0px 0px -X% 0px' 
    //   -X% 負的底部邊距，意味著當元素的底部距離視窗底部還有X%時 (即元素出現在視窗上半部分時)，
    //   視為進入觀察區。X值越大，觸發點越靠上。
    //   例如 '-40%' 表示元素在視窗上半部約60%區域時開始觸發。
    //   '-50%' 表示元素在中線以上時觸發。
    // threshold: 0.1 表示元素至少10%可見時。
    // 你可以調整這些值來找到最適合你的觸發時機。
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50% 0px', // 嘗試調整此處，例如讓元素更靠中間時觸發
        threshold: 0.01 // 元素稍微可見就觸發，主要依賴 rootMargin
    };

    const intersectionCallback = (entries) => {
        let activeSection = null;

        // 遍歷所有狀態改變的 entries，找到那個應該“激活”的 section
        // 我們選擇在視窗內（根據 rootMargin 判斷）且最靠上的那個
        // （或者在滾動方向上最後一個滿足條件的）
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 如果有多個 section isIntersecting，我們需要一個規則來選擇哪一個是“當前”的。
                // 一個簡單的規則是選取 boundingClientRect.top 最小（最靠上）且為正數，
                // 或者 entry.intersectionRatio 最大的。
                // 為簡化，且假設我們的 rootMargin 設定得當，
                // 這裡我們傾向於取 entries 中最後一個 isIntersecting 的元素。
                // 或者，我們可以總是檢查所有被觀察的元素，但那樣效率較低。
                // 目前這個邏輯會讓滾動時，最後一個觸發 isIntersecting=true 的 section 被選中。
                activeSection = entry.target;
            }
        });
        
        // 收集所有當前真正在視窗內（符合IO條件）的 section
        const visibleSections = entries.filter(entry => entry.isIntersecting)
                                     .map(entry => entry.target)
                                     .sort((a, b) => a.offsetTop - b.offsetTop); // 按頂部位置排序

        if (visibleSections.length > 0) {
            // 通常我們關心的是在特定觸發區域內 "最主要" 的那個
            // 這裡我們簡單取第一個（最靠頂部的那個符合條件的）
            activeSection = visibleSections[0]; 
            const sectionYear = activeSection.dataset.year;

            if (sectionYear && sectionYear !== currentlyDisplayedYear) {
                currentlyDisplayedYear = sectionYear;
                const dataForYear = markerData[sectionYear];
                const textToShow = (dataForYear && dataForYear.largeText) ? dataForYear.largeText : sectionYear;
                
                stickyDisplayLargeText.textContent = textToShow;
                stickyElement.classList.add('is-visible');
                console.log(`Displaying year: ${sectionYear}`);

            } else if (sectionYear && sectionYear === currentlyDisplayedYear && !stickyElement.classList.contains('is-visible')) {
                // 如果是同一年份但之前被隱藏了，則重新顯示
                stickyElement.classList.add('is-visible');
            }
        } else {
            // 如果 entries 中沒有任何元素是 isIntersecting (表示之前活躍的元素移出去了，且沒有新的進來)
            // 或者所有可見的 section 都沒有 data-year
            // 這種情況下，我們需要判斷是否真的沒有任何被觀察的 section 處於 active 狀態
            // 一個更穩妥的做法是，如果 visibleSections 為空，則隱藏
            if (currentlyDisplayedYear !== null) { // 只有當之前有顯示內容時才操作隱藏
                stickyDisplayLargeText.textContent = ''; // 清空文字
                stickyElement.classList.remove('is-visible'); // 隱藏元素
                currentlyDisplayedYear = null; // 重置狀態
                console.log('Hiding sticky display');
            }
        }
    };

    const observer = new IntersectionObserver(intersectionCallback, observerOptions);

    if (mainContentSections.length > 0) {
        mainContentSections.forEach(section => observer.observe(section));
    } else {
        console.warn('No sections found to observe. Ensure .main-content section[data-year] exists.');
    }
});