// ==UserScript==
// @name         Gemini Font Replacer
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  替换 Gemini 网页的字体，使用 JetBrains Mono 极客等宽字体，使其能够清晰区分大写 I 和小写 l
// @author       XiGuaShu
// @match        https://gemini.google.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 注入 CSS。引入 JetBrains Mono 字体，并设置 Consolas/Menlo/Monaco/monospace 作为本地回退等宽字体栈
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&display=swap');

        /* 强力覆盖对话输入框、用户提问、助手回答中的所有文本元素，但排除代码和图标 */
        textarea,
        [contenteditable="true"],
        [contenteditable="true"] *,
        .prompt-textarea,
        .prompt-textarea *,
        .query-text,
        .query-text *,
        .query-content,
        .query-content *,
        message-content *:not(.google-symbols):not(.material-symbols-outlined):not([class*="icon"]):not([class*="symbol"]):not(code):not(pre):not(kbd):not(samp):not(.code-block):not(.code-container) {
            font-family: 'JetBrains Mono', Consolas, Menlo, Monaco, monospace !important;
        }

        /* 确保代码块和行内代码依然使用清晰的等宽字体 */
        code,
        pre,
        kbd,
        samp,
        .code-block,
        .code-container,
        code *,
        pre * {
            font-family: 'JetBrains Mono', Consolas, Menlo, Monaco, monospace !important;
        }
    `);
})();
