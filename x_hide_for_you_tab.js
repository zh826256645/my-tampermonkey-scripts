// ==UserScript==
// @name         X-隐藏为你推荐
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  隐藏 X 首页的“为你推荐”标签，并自动切换到“正在关注”
// @author       XiGuaShu
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const HIDDEN_ATTRIBUTE = 'data-tm-x-hide-for-you';
    const FOR_YOU_LABELS = new Set(['为你推荐', 'for you']);
    const FOLLOWING_LABELS = new Set(['正在关注', 'following']);
    const styleId = 'tm-x-hide-for-you-style';
    let lastSwitchAt = 0;
    let updateTimer;

    function normalize(text) {
        return text.replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function findTab(labels) {
        return [...document.querySelectorAll('[role="tab"]')]
            .find(tab => labels.has(normalize(tab.textContent || '')));
    }

    function addStyle() {
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `[${HIDDEN_ATTRIBUTE}] { display: none !important; }`;
        (document.head || document.documentElement).appendChild(style);
    }

    function hideForYouTab() {
        const forYouTab = findTab(FOR_YOU_LABELS);
        if (!forYouTab) return null;

        const container = forYouTab.parentElement?.getAttribute('role') === 'presentation'
            ? forYouTab.parentElement : forYouTab;
        if (!container.hasAttribute(HIDDEN_ATTRIBUTE)) {
            container.setAttribute(HIDDEN_ATTRIBUTE, '');
            container.setAttribute('aria-hidden', 'true');
        }
        return forYouTab;
    }

    function switchToFollowing() {
        const forYouTab = findTab(FOR_YOU_LABELS);
        const followingTab = findTab(FOLLOWING_LABELS);
        if (!forYouTab || !followingTab || forYouTab.getAttribute('aria-selected') !== 'true') return;

        // X 更新选中状态时可能触发多次 DOM 变更，避免重复点击。
        if (Date.now() - lastSwitchAt < 1000) return;
        lastSwitchAt = Date.now();
        followingTab.click();
    }

    function update() {
        updateTimer = undefined;
        addStyle();
        hideForYouTab();
        switchToFollowing();
    }

    function scheduleUpdate() {
        if (updateTimer) return;
        updateTimer = window.setTimeout(update, 100);
    }

    update();
    new MutationObserver(scheduleUpdate).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
})();
