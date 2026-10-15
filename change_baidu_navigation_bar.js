// ==UserScript==
// @name         百度-导航栏-透明
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  调节百度首页内容卡片的背景透明度，适配新版热搜卡片并记住设置
// @author       XiGuaShu
// @match        https://www.baidu.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 只修改首页，避免影响搜索结果页。
    if (!/^\/(?:index\.(?:php|html))?$/.test(location.pathname)) return;

    const storageKey = 'baidu-panel-opacity';
    const controlId = 'tm-baidu-transparency';
    const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
    let opacity = null;
    let control;

    function readNumber(key) {
        try {
            const value = localStorage.getItem(key);
            return value !== null && value.trim() !== '' && Number.isFinite(Number(value))
                ? Number(value) : null;
        } catch {
            return null;
        }
    }

    GM_addStyle(`
        #s_main {
            background-color: rgba(255, 255, 255, var(--tm-baidu-panel-alpha, .4)) !important;
        }
        /* 新版百度在伪元素上额外叠了白底和模糊，必须一起清除。 */
        #s_main::before {
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
        }
        #${controlId} {
            display: inline-flex;
            align-items: center;
            gap: 0;
            float: right;
            position: relative;
            z-index: 1;
            max-width: 100%;
            height: 28px;
            /* 给新版热搜右侧的“换一换”留出位置。 */
            margin: 0 88px 0 12px;
            padding: 0;
            border-radius: 14px;
            background: transparent;
            font-size: 12px;
            line-height: normal;
            color: #333;
            cursor: pointer;
        }
        #${controlId} span {
            display: none;
        }
        #${controlId} input {
            /* 保留键盘焦点入口，聚焦后自动展开。 */
            width: 0;
            max-width: 20vw;
            margin: 0;
            padding: 0;
            opacity: 0;
            pointer-events: none;
            cursor: pointer;
            accent-color: #4e6ef2;
        }
        #${controlId}:hover,
        #${controlId}:focus-within {
            gap: 6px;
            padding: 0 8px;
            background: rgba(255, 255, 255, .8);
        }
        #${controlId}:hover span,
        #${controlId}:focus-within span {
            display: inline;
        }
        #${controlId}:hover input,
        #${controlId}:focus-within input {
            width: 90px;
            opacity: 1;
            pointer-events: auto;
        }
        #${controlId} output {
            min-width: 4ch;
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
    `);

    function applyOpacity() {
        document.documentElement.style.setProperty('--tm-baidu-panel-alpha', opacity / 100);
        control.querySelector('input').value = opacity;
        control.querySelector('output').textContent = `${opacity}%`;
        try {
            localStorage.setItem(storageKey, String(opacity));
        } catch {
            // 禁用站点存储时仍可调节当前页面。
        }
    }

    function mountControl() {
        const main = document.getElementById('s_main');
        const host = document.getElementById('s_menus_wrapper');
        if (!main || !host) return;

        if (!control) {
            const saved = readNumber(storageKey);
            const legacyLeft = readNumber('btnLeft');
            // 旧版保存的是 15% 宽滑轨上的像素位置；迁移为与窗口宽度无关的百分比。
            const legacyWidth = host.getBoundingClientRect().width * .15;
            opacity = clamp(saved ?? (legacyLeft !== null && legacyWidth > 0
                ? legacyLeft / legacyWidth * 100 : 40));

            control = document.createElement('label');
            control.id = controlId;
            control.title = '背景不透明度：移入或点击后调节';
            control.innerHTML = '<span>背景</span><input type="range" min="0" max="100" step="1" aria-label="背景不透明度" title="0% 完全透明，100% 不透明"><output></output>';
            control.querySelector('input').addEventListener('input', event => {
                opacity = clamp(Number(event.target.value));
                applyOpacity();
            });
            applyOpacity();
        }

        // 百度会延迟加载或重建卡片；复用同一控件，不重复绑定事件。
        if (control.parentElement !== host) host.appendChild(control);
    }

    mountControl();
    new MutationObserver(mountControl).observe(document.body, { childList: true, subtree: true });
})();
