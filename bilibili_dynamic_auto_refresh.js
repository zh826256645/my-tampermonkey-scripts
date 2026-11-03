// ==UserScript==
// @name         Bilibili-顶部动态弹框定时刷新
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  定时刷新 B 站顶部“动态”弹框中的直播和历史动态
// @author       XiGuaShu
// @match        https://www.bilibili.com/*
// @match        https://t.bilibili.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const REFRESH_INTERVAL_MS = 60 * 1000;
    const NAV_API = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/nav?offset=&web_location=333.1007';
    const LIVE_API = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/live-up?web_location=333.1007';
    const POPOVER_SELECTOR = '.dynamic-panel-popover';
    const DYNAMIC_LIST_SELECTOR = '.dynamic-all';

    function protocolRelative(url) {
        return String(url || '').replace(/^https?:/, '');
    }

    function imageWithParams(url, params) {
        if (!url) return '';
        const base = String(url).split('@')[0].split('?')[0];
        return `${protocolRelative(base)}@${params}`;
    }

    function updateImage(image, url, params) {
        if (!image) return;
        const src = imageWithParams(url, params);
        image.setAttribute('src', src);
        image.setAttribute('data-src', src);
    }

    function updatePicture(picture, url, params) {
        if (!picture) return;
        const src = imageWithParams(url, params);
        const sources = picture.querySelectorAll('source');
        if (sources[0]) sources[0].setAttribute('srcset', `${src}.avif`);
        if (sources[1]) sources[1].setAttribute('srcset', `${src}.webp`);
        updateImage(picture.querySelector('img'), url, params);
    }

    function updateLiveList(items) {
        const popover = document.querySelector(POPOVER_SELECTOR);
        const header = popover?.querySelector('.dynamic-header');
        const list = popover?.querySelector('.living-up-list');
        if (!list) return;

        let links = [...list.querySelectorAll(':scope > .up-item')];
        const template = links[0];
        const hasLive = items.length > 0;

        if (header) header.style.display = hasLive ? '' : 'none';
        list.style.display = hasLive ? '' : 'none';
        if (!hasLive || !template) return;

        while (links.length < items.length) {
            const clone = template.cloneNode(true);
            list.appendChild(clone);
            links.push(clone);
        }

        links.forEach((link, index) => {
            const item = items[index];
            link.style.display = item ? '' : 'none';
            if (!item) return;

            link.setAttribute('href', item.link);
            const name = link.querySelector('.up-name');
            if (name) name.textContent = item.uname;
            updatePicture(link.querySelector('.up-avatar__img'), item.face, '84w_84h');
        });
    }

    function updateDynamicList(items) {
        const list = document.querySelector(DYNAMIC_LIST_SELECTOR);
        if (!list) return;

        let links = [...list.querySelectorAll(':scope > a')];
        const template = links[0];
        if (!template) return;

        while (links.length < items.length) {
            const clone = template.cloneNode(true);
            list.appendChild(clone);
            links.push(clone);
        }

        links.forEach((link, index) => {
            const item = items[index];
            link.style.display = item ? '' : 'none';
            if (!item) return;

            const href = protocolRelative(item.jump_url);
            const authorHref = protocolRelative(item.author?.jump_url);

            link.setAttribute('href', href);

            const avatar = link.querySelector('.header-dynamic-avatar');
            if (avatar) {
                avatar.setAttribute('href', authorHref);
                avatar.setAttribute('title', item.author?.name || '');
                updateImage(avatar.querySelector('img'), item.author?.face, '96w_96h_1c_1s_!web-avatar.avif');
            }

            const userName = link.querySelector('.user-name a');
            if (userName) {
                userName.setAttribute('href', authorHref);
                userName.setAttribute('title', item.author?.name || '');
                userName.textContent = item.author?.name || '';
            }

            const info = link.querySelector('.dynamic-info-content');
            if (info) info.setAttribute('title', item.title || '');

            const title = link.querySelector('.title-text');
            if (title) {
                title.setAttribute('title', item.title || '');
                title.textContent = item.title || '';
            }

            const publishTime = link.querySelector('.publish-time');
            if (publishTime) publishTime.textContent = item.pub_time || '';

            const coverLink = link.querySelector('.header-dynamic__box--right');
            if (coverLink) coverLink.setAttribute('href', href);

            const cover = link.querySelector('.cover');
            if (cover) {
                cover.style.display = item.cover ? '' : 'none';
                if (item.cover) {
                    updatePicture(cover.querySelector('picture'), item.cover, '164w_92h_1c');
                }
            }
        });
    }

    async function fetchJson(url) {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    let refreshing = false;

    async function refreshPopover() {
        if (refreshing || document.hidden || !document.querySelector(DYNAMIC_LIST_SELECTOR)) return;
        refreshing = true;

        try {
            const [navResult, liveResult] = await Promise.allSettled([
                fetchJson(NAV_API),
                fetchJson(LIVE_API),
            ]);

            if (navResult.status === 'fulfilled' && navResult.value.code === 0) {
                const items = (navResult.value.data?.items || [])
                    .filter(item => item.visible !== false && !item.fold);
                updateDynamicList(items);
            }

            if (liveResult.status === 'fulfilled' && liveResult.value.code === 0) {
                updateLiveList(liveResult.value.data?.items || []);
            }
        } finally {
            refreshing = false;
        }
    }

    let activeList = null;
    let checkTimer;

    function checkPopover() {
        checkTimer = undefined;
        const list = document.querySelector(DYNAMIC_LIST_SELECTOR);
        if (!list) {
            activeList = null;
            return;
        }
        if (list === activeList) return;

        activeList = list;
        window.setTimeout(refreshPopover, 300);
    }

    function scheduleCheck() {
        if (checkTimer) return;
        checkTimer = window.setTimeout(checkPopover, 100);
    }

    scheduleCheck();
    window.setInterval(refreshPopover, REFRESH_INTERVAL_MS);
    new MutationObserver(scheduleCheck).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshPopover();
    });
})();
