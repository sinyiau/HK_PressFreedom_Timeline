// script.js - 更新版，處理左右兩側固定顯示區的顯隱和內容更新

document.addEventListener('DOMContentLoaded', () => {
    const mainContentSections = document.querySelectorAll('.main-content section[data-year]');
    
    // 左側固定顯示元素
    const stickyLeftElement = document.getElementById('sticky-left-display');
    const stickyLeftLargeText = stickyLeftElement ? stickyLeftElement.querySelector('.sticky-marker-large-text') : null;

    // 右側固定顯示元素
    const stickyRightElement = document.getElementById('sticky-right-display');
    const stickyRightLargeText = stickyRightElement ? stickyRightElement.querySelector('.sticky-marker-large-text') : null;
    const stickyRightSmallText = stickyRightElement ? stickyRightElement.querySelector('.sticky-marker-small-text') : null;
    
    // 右側時間軸標題 (可選，如果也想JS控制顯隱)
    // const rightTimelineTitle = document.getElementById('right-timeline-title');

    if (!stickyLeftElement || !stickyLeftLargeText) {
        console.error('Left sticky display elements not found. Check #sticky-left-display and .sticky-marker-large-text.');
    }
    if (!stickyRightElement || !stickyRightLargeText || !stickyRightSmallText) {
        console.error('Right sticky display elements not found. Check #sticky-right-display and its children.');
    }

    // 1. 讀取左側事件數據
    const eventMarkerData = {};
    document.querySelectorAll('.timeline-left .timeline-event-marker[data-marker-year]').forEach(marker => {
        const year = marker.dataset.markerYear;
        const largeTextElement = marker.querySelector('.marker-large-text');
        // const smallTextElement = marker.querySelector('.marker-small-text'); // 如果你將來要加回小字
        if (year && largeTextElement) {
            eventMarkerData[year] = {
                largeText: largeTextElement.textContent.trim()
                // smallText: smallTextElement ? smallTextElement.textContent.trim() : ''
            };
        }
    });

    // 2. 讀取右側排名數據
    const rankingMarkerData = {};
    document.querySelectorAll('.timeline-right .timeline-rank-marker[data-marker-year]').forEach(marker => {
        const year = marker.dataset.markerYear;
        const largeTextElement = marker.querySelector('.marker-large-text');
        const smallTextElement = marker.querySelector('.marker-small-text');
        if (year && largeTextElement && smallTextElement) { // 確保所有元素都存在
            rankingMarkerData[year] = {
                largeText: largeTextElement.textContent.trim(),
                smallText: smallTextElement.textContent.trim()
            };
        }
    });

    // Intersection Observer 設定
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50% 0px', // 當元素中心線到達視窗中心線時觸發
        threshold: 0.01 // 元素稍微可見就觸發
    };

    let currentlyDisplayedYear = null;

    const intersectionCallback = (entries) => {
        let activeSection = null;
        const visibleSections = entries
            .filter(entry => entry.isIntersecting)
            .map(entry => entry.target)
            .sort((a, b) => a.offsetTop - b.offsetTop); // 按頂部位置排序

        if (visibleSections.length > 0) {
            activeSection = visibleSections[0]; // 取最靠上的那個活躍 section
        }

        if (activeSection) {
            const sectionYear = activeSection.dataset.year;
            if (sectionYear && sectionYear !== currentlyDisplayedYear) {
                currentlyDisplayedYear = sectionYear;
                console.log(`Updating displays for year: ${sectionYear}`);

                // 更新左側顯示
                if (stickyLeftElement && stickyLeftLargeText) {
                    const eventData = eventMarkerData[sectionYear];
                    stickyLeftLargeText.textContent = (eventData && eventData.largeText) ? eventData.largeText : sectionYear;
                    stickyLeftElement.classList.add('is-visible');
                }

                // 更新右側顯示
                if (stickyRightElement && stickyRightLargeText && stickyRightSmallText) {
                    const rankData = rankingMarkerData[sectionYear];
                    if (rankData) {
                        stickyRightLargeText.textContent = rankData.largeText;
                        stickyRightSmallText.textContent = rankData.smallText;
                        stickyRightElement.classList.add('is-visible');
                        // // 可選：控制右側標題的顯隱 (例如從2003年開始顯示)
                        // if (rightTimelineTitle) {
                        //     parseInt(sectionYear) >= 2003 ? rightTimelineTitle.classList.add('is-visible') : rightTimelineTitle.classList.remove('is-visible');
                        // }
                    } else {
                        // 如果該年份沒有排名數據，則隱藏右側排名顯示
                        stickyRightLargeText.textContent = '';
                        stickyRightSmallText.textContent = '';
                        stickyRightElement.classList.remove('is-visible');
                    }
                }
            } else if (sectionYear && sectionYear === currentlyDisplayedYear) {
                // 如果是同一年份，確保它們是可見的 (例如頁面初始載入時)
                if (stickyLeftElement && !stickyLeftElement.classList.contains('is-visible') && stickyLeftLargeText.textContent) {
                    stickyLeftElement.classList.add('is-visible');
                }
                if (stickyRightElement && !stickyRightElement.classList.contains('is-visible') && stickyRightLargeText.textContent) {
                    stickyRightElement.classList.add('is-visible');
                }
            }
        } else { // 沒有任何 active section
            if (currentlyDisplayedYear !== null) { // 只有當之前有顯示內容時才操作隱藏
                console.log('No active section, hiding sticky displays.');
                if (stickyLeftElement && stickyLeftLargeText) {
                    stickyLeftLargeText.textContent = '';
                    stickyLeftElement.classList.remove('is-visible');
                }
                if (stickyRightElement && stickyRightLargeText && stickyRightSmallText) {
                    stickyRightLargeText.textContent = '';
                    stickyRightSmallText.textContent = '';
                    stickyRightElement.classList.remove('is-visible');
                }
                // if (rightTimelineTitle) rightTimelineTitle.classList.remove('is-visible'); // 如果標題也受JS控制
                currentlyDisplayedYear = null;
            }
        }
    };

    const observer = new IntersectionObserver(intersectionCallback, observerOptions);

    if (mainContentSections.length > 0) {
        mainContentSections.forEach(section => observer.observe(section));
    } else {
        console.warn('No sections with [data-year] found to observe.');
    }
});