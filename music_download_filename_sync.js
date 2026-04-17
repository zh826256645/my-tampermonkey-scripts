// ==UserScript==
// @name         无损音乐下载-下载文件名同步
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  点击下载时，使用“复制名称”的内容作为保存文件名
// @author       XiGuaShu
// @match        https://flac.music.hi.cn/
// @grant        GM_download
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    function isTargetPage() {
        return document.title.includes('无损音乐下载') || Boolean(document.querySelector('#brModal, #download_music'));
    }

    function sanitizeFileName(name) {
        return name.replace(/[\\/:*?"<>|]/g, '_').trim();
    }

    function parseCopyName(href) {
        const matched = href.match(/copy\('([\s\S]*)'\)/);
        return matched ? matched[1] : '';
    }

    function getNameFromCard(card) {
        if (!card) {
            return '';
        }

        const copyButton = card.querySelector('a.btn-outline-info[href^="javascript:copy("]');
        if (copyButton) {
            return parseCopyName(copyButton.getAttribute('href') || '');
        }

        const nameItem = Array.from(card.querySelectorAll('li')).find(item => item.textContent.trim().startsWith('名称：'));
        return nameItem ? nameItem.textContent.replace(/^名称：/, '').trim() : '';
    }

    function getFormatFromCard(card) {
        if (!card) {
            return '';
        }

        const formatItem = Array.from(card.querySelectorAll('li')).find(item => item.textContent.trim().startsWith('格式：'));
        return formatItem ? formatItem.textContent.replace(/^格式：/, '').trim().toLowerCase() : '';
    }

    function getExtension(url, format) {
        try {
            const pathname = new URL(url, location.href).pathname;
            const matched = pathname.match(/\.([a-z0-9]+)$/i);
            if (matched) {
                return matched[1].toLowerCase();
            }
        } catch (error) {
            console.error('解析下载地址失败', error);
        }

        return format || 'mp3';
    }

    function triggerBrowserDownload(url, fileName) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.rel = 'noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    function downloadWithTargetName(url, fileName) {
        if (typeof GM_download !== 'function') {
            triggerBrowserDownload(url, fileName);
            return;
        }

        GM_download({
            url,
            name: fileName,
            saveAs: false,
            onerror: function () {
                triggerBrowserDownload(url, fileName);
            }
        });
    }

    document.addEventListener('click', function (event) {
        if (!isTargetPage()) {
            return;
        }

        const downloadLink = event.target.closest('a.btn-outline-success');
        if (!downloadLink || downloadLink.textContent.trim() !== '点击下载') {
            return;
        }

        const card = downloadLink.closest('#download_music, .card');
        const rawName = getNameFromCard(card);
        if (!rawName) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const extension = getExtension(downloadLink.href, getFormatFromCard(card));
        const fileName = sanitizeFileName(`${rawName}.${extension}`);
        downloadWithTargetName(downloadLink.href, fileName);
    }, true);
}());
