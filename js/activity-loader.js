/**
 * 活動リストの「もっと見る」「しまう」機能
 */
const ActivityLoader = (function () {
    const INITIAL_SHOW_COUNT = 5;

    function setupToggleButtons() {
        const container = document.querySelector('.activity-container');
        const loadMoreContainer = document.getElementById('load-more-container');
        const collapseContainer = document.getElementById('collapse-container');
        const items = container ? container.querySelectorAll('.activity-item') : [];

        if (!loadMoreContainer || !collapseContainer || items.length === 0) return;

        /**
         * 表示/非表示の切り替え
         */
        function toggleActivities(showAll) {
            items.forEach((item, index) => {
                if (index >= INITIAL_SHOW_COUNT) {
                    if (showAll) {
                        item.classList.remove('hidden-activity');
                    } else {
                        item.classList.add('hidden-activity');
                    }
                }
            });
            loadMoreContainer.style.display = showAll ? 'none' : 'block';
            collapseContainer.style.display = showAll ? 'block' : 'none';
        }

        // 初期化
        toggleActivities(false);

        // ボタンイベント
        loadMoreContainer.addEventListener('click', () => toggleActivities(true));
        collapseContainer.addEventListener('click', () => {
            toggleActivities(false);
            loadMoreContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // ----------------------------------------------------------------
        // アンカージャンプ処理（最速仕様）
        // ----------------------------------------------------------------
        function performJump() {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#activity-')) {
                const target = document.querySelector(hash);
                if (target) {
                    toggleActivities(true);
                    const headerHeight = document.querySelector('header').offsetHeight || 90;
                    const targetTop = $(target).offset().top - headerHeight - 20;

                    $('html, body').stop().animate({ scrollTop: targetTop }, 300, 'swing', function() {
                        $(target).css({
                            'transition': 'all 0.8s ease',
                            'background-color': 'rgba(4, 181, 159, 0.2)',
                            'transform': 'scale(1.02)'
                        });
                        setTimeout(() => {
                            $(target).css({
                                'background-color': '',
                                'transform': ''
                            });
                        }, 2000);
                    });
                }
            }
        }

        // 実行
        performJump();
        window.addEventListener('hashchange', performJump);
        window.addEventListener('load', performJump);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupToggleButtons);
    } else {
        setupToggleButtons();
    }

    return { refresh: setupToggleButtons };
})();
