// ==UserScript==
// @name         百度-导航栏-透明
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       XiGuaShu
// @match        https://www.baidu.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 插入透明度设置进度条
    GM_addStyle('.progress {position: relative;width: 15%;float: right;color: #222;-webkit-filter: opacity(0%)}.progress_bg {height: 0.5em;border: 1px solid #ddd;border-radius: 0.5em;overflow: hidden;background-color: #f2f2f2;} .progress_bar {background: #19b5fe;width: 100px;height: 0.5em;border-radius: 0.5em;} .progress_btn {width: 1em;height: 1em;border-radius: 0.2em;position: absolute;background: #fff;left: 100px;margin-left: -10px;top: -0.2em;cursor: pointer;border: 1px #ddd solid;box-sizing: border-box;} .progress_btn:hover {border-color: #19b5fe;} .progress:hover {-webkit-filter: opacity(80%)}')

    let progressDiv = document.createElement("div")
    document.getElementById('s_menus_wrapper').appendChild(progressDiv)
    progressDiv.setAttribute('class', 'progress')
    progressDiv.innerHTML = '<div id="progress_bg" class="progress_bg"><div id="progress_bar" class="progress_bar"></div></div><div id="progress_btn" class="progress_btn"></div><div id="progress_text" class="text">0%</div>'

    let sMainDiv = document.getElementById('s_main')
    let progressBtnDiv = document.getElementById('progress_btn')
    let progressBarsDiv = document.getElementById('progress_bar')
    let progressBgDiv = document.getElementById('progress_bg')
    let textDiv = document.getElementById('progress_text')

    let updateMainDiv = function (btnLeft) {
        progressBtnDiv.style.left = btnLeft + 'px'
        progressBarsDiv.style.width = btnLeft + 'px'
        let alpha = parseInt((btnLeft / progressDiv.offsetWidth) * 100)
        textDiv.textContent = alpha + '%'
        sMainDiv.style.backgroundColor = `rgba(255,255,255,${alpha / 100})`
        localStorage.setItem('btnLeft', btnLeft)
    }


    let left = localStorage.getItem('btnLeft')
    if (!left && typeof (left) != 'undefined' && left != 0) {
        left = 40
    }

    let tag = false, ox = 0

    // 初始化透明度
    updateMainDiv(left)

    // 绑定事件
    progressBtnDiv.addEventListener('mousedown', e => {
        ox = e.pageX - left
        tag = true
    })

    document.addEventListener('mouseup', e => {
        tag = false
    })

    // 鼠标移动事件
    progressDiv.addEventListener('mousemove', e => {
        if (tag) {
            left = e.pageX - ox;
            if (left <= 0) {
                left = 0
            }else if (left > progressDiv.offsetWidth) {
                left = progressDiv.offsetWidth
            }
            updateMainDiv(left)
        }
    })

    // 鼠标点击事件
    progressBgDiv.addEventListener('click', e => {
        if (!tag) {
            left = e.offsetX
            if (left <= 0) {
                left = 0
            } else if (left > progressDiv.offsetWidth) {
                left = progressDiv.offsetWidth
            }
            updateMainDiv(left)
        }
    })

})();
