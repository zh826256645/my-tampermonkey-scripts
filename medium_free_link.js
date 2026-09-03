// ==UserScript==
// @name         Medium 免费阅读跳转
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  在 Medium 页面增加跳转到 Freedium 镜像的按钮
// @author       XiGuaShu
// @match        https://medium.com/*
// @match        https://*.medium.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const freeLink = document.createElement('a');
    freeLink.href = `https://freedium-mirror.cfd/${location.href}`;
    freeLink.textContent = '免费阅读';
    freeLink.style.cssText = `
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483647;
        padding: 10px 16px;
        border-radius: 999px;
        background: #1a8917;
        color: #fff;
        font: 600 14px/20px Arial, sans-serif;
        text-decoration: none;
        box-shadow: 0 2px 8px rgb(0 0 0 / 20%);
    `;

    document.body.appendChild(freeLink);
}());
