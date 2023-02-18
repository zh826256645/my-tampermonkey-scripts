// ==UserScript==
// @name         微博-广告-移除
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  移除浏览关注用户的微博时夹杂的广告
// @author       XiGuaShu
// @match        https://weibo.com/*
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    const originOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (_, url) {
        if (url.search("/ajax/feed/groupstimeline") != -1 || url.search("/ajax/feed/unreadfriendstimeline") != -1) {
            this.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    const res = JSON.parse(this.responseText);
                    Object.defineProperty(this, "responseText", {
                        writable: true,
                      });
                    if (res.statuses) {
                        let statuses = []
                        res.statuses.forEach(item => {
                            if (item.promotion === undefined) {
                                statuses.push(item)
                            } else {
                                console.log("去除" + item.text_raw)
                            }
                        });
                        res.statuses = statuses;
                        this.responseText = JSON.stringify(res);
                    }
                }
            });
        } else if (url.search('/ajax/feed/getTipsAd') != -1) {
            this.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    const res = JSON.parse(this.responseText);
                    Object.defineProperty(this, "responseText", {
                        writable: true,
                      });
                    if (res.data) {
                        let data = []
                        res.data.forEach(item => {
                            console.log("去除" + item.imageurl)
                        });
                        res.data = data;
                        this.responseText = JSON.stringify(res);
                    }
                }
            });
        }
        originOpen.apply(this, arguments);
    }
}());