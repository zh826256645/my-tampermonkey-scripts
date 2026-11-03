// ==UserScript==
// @name         Linux.do-隐藏运营反馈
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  从 linux.do 帖子列表中隐藏类别为“运营反馈”的话题，支持滚动加载与站内切页
// @author       XiGuaShu
// @match        https://linux.do/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const CATEGORY_NAME = '运营反馈';
    const CATEGORY_ID = '2';
    const CATEGORY_PATH = '/c/feedback/2';
    const FEEDBACK_CATEGORY_PAGE = /^\/c\/feedback(?:\/|$)/;
    const TOPIC_ROW_SELECTOR = [
        'tr.topic-list-item',
        'li.topic-list-item',
        '.latest-topic-list-item',
    ].join(',');
    const HIDDEN_ATTRIBUTE = 'data-tm-linux-do-hide-feedback';

    function isFeedbackCategoryPage() {
        return FEEDBACK_CATEGORY_PAGE.test(location.pathname);
    }

    function isFeedbackTopic(row) {
        if (row.classList.contains('category-feedback')) return true;

        for (const badge of row.querySelectorAll('a.badge-category__wrapper, a.badge-category')) {
            const categoryId = badge
                .querySelector('[data-category-id]')
                ?.getAttribute('data-category-id');
            if (categoryId === CATEGORY_ID) return true;

            const href = badge.getAttribute('href');
            if (href) {
                const categoryPath = new URL(href, location.origin).pathname.replace(/\/$/, '');
                if (categoryPath === CATEGORY_PATH) return true;
            }

            if (badge.textContent.trim() === CATEGORY_NAME) return true;
        }

        return false;
    }

    function hideFeedbackTopics() {
        if (isFeedbackCategoryPage()) {
            for (const row of document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`)) {
                row.removeAttribute(HIDDEN_ATTRIBUTE);
                row.style.removeProperty('display');
            }
            return;
        }

        for (const row of document.querySelectorAll(TOPIC_ROW_SELECTOR)) {
            if (!isFeedbackTopic(row)) continue;

            row.setAttribute(HIDDEN_ATTRIBUTE, '1');
            row.style.setProperty('display', 'none', 'important');
        }
    }

    let scanScheduled = false;

    function scheduleScan() {
        if (scanScheduled) return;
        scanScheduled = true;

        requestAnimationFrame(() => {
            scanScheduled = false;
            hideFeedbackTopics();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleScan, { once: true });
    } else {
        scheduleScan();
    }

    new MutationObserver(scheduleScan).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });

    window.addEventListener('popstate', scheduleScan);
})();
