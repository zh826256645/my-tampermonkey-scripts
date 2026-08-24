// ==UserScript==
// @name         修改网站 imgur 的链接
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  由于 imgur 无法访问，修改为镜像网站
// @author       XiGuaShu
// @match        https://v2ex.com/*
// @run-at document-end
// ==/UserScript==

(function () {
    'use strict';
    // 获取当前网页中 body 的所有 img 标签
	const imgElements = document.getElementsByTagName("img");

	// 遍历每个 img 标签
	for (let i = 0; i < imgElements.length; i++) {
        const imgElement = imgElements[i];
        const src = imgElement.getAttribute('src');
        const isImgurUrl = src && (src.startsWith('https://i.imgur.com/') || src.startsWith('https://imgur.com/'));
        const isGifUrl = isImgurUrl && new URL(src).pathname.toLowerCase().endsWith('.gif');

        // 检查 img 标签的 src 是否以 /img/ 开头
        if (isImgurUrl && !isGifUrl) {
            imgElement.setAttribute('src', `https://img.noobzone.ru/getimg.php?url=${src.replace("https://imgur.com/", "https://i.imgur.com/")}`);
            imgElement.setAttribute('referrerPolicy', 'no-referrer');
        }
	}
}());
