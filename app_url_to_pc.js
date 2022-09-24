// ==UserScript==
// @name         手机链接跳转到 PC 端链接
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       西瓜树
// @match        https://m.hupu.com/bbs/*
// @match        https://item.m.jd.com/product/*
// @match        https://m.weibo.cn/detail/*
// @match        https://m.weibo.cn/status/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                  ? args[number]
                  : match
                ;
            });
        };
    }

    var WeiboUtil = {
        // 62进制字典
        str62keys: [
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
        ],
    };

    /**
     * 62进制值转换为10进制
     * @param {String} str62 62进制值
     * @return {String} 10进制值
     */
    WeiboUtil.str62to10 = function(str62) {
        var i10 = 0;
        for (var i = 0; i < str62.length; i++)
        {
            var n = str62.length - i - 1;
            var s = str62[i];
            i10 += this.str62keys.indexOf(s) * Math.pow(62, n);
        }
        return i10;
    };

    /**
     * 10进制值转换为62进制
     * @param {String} int10 10进制值
     * @return {String} 62进制值
     */
    WeiboUtil.int10to62 = function(int10) {
        var s62 = '';
        var r = 0;
        while (int10 != 0 && s62.length < 100) {
            r = int10 % 62;
            s62 = this.str62keys[r] + s62;
            int10 = Math.floor(int10 / 62);
        }
        return s62;
    };

    /**
     * URL字符转换为mid
     * @param {String} url 微博URL字符，如 "wr4mOFqpbO"
     * @return {String} 微博mid，如 "201110410216293360"
     */
    WeiboUtil.url2mid = function(url) {
        var mid = '';

        for (var i = url.length - 4; i > -4; i = i - 4) //从最后往前以4字节为一组读取URL字符
        {
            var offset1 = i < 0 ? 0 : i;
            var offset2 = i + 4;
            var str = url.substring(offset1, offset2);

            str = this.str62to10(str);
            if (offset1 > 0) { //若不是第一组，则不足7位补0
                while (str.length < 7)
                {
                    str = '0' + str;
                }
            }

            mid = str + mid;
        }

        return mid;
    };

    /**
     * mid转换为URL字符
     * @param {String} mid 微博mid，如 "201110410216293360"
     * @return {String} 微博URL字符，如 "wr4mOFqpbO"
     */
    WeiboUtil.mid2url = function(mid) {
        if(!mid) {
            return mid;
        }
        mid = String(mid); //mid数值较大，必须为字符串！
        if(!/^\d+$/.test(mid)){ return mid; }
        var url = '';

        for (var i = mid.length - 7; i > -7; i = i - 7) //从最后往前以7字节为一组读取mid
        {
            var offset1 = i < 0 ? 0 : i;
            var offset2 = i + 7;
            var num = mid.substring(offset1, offset2);

            num = this.int10to62(num);
            url = num + url;
        }

        return url;
    };

    WeiboUtil.getPCUrl = function() {
        try {
            const html = document.documentElement.innerHTML
            const mid = html.match(/"mid":\s"(.*?)"/)[1]
            const uid = html.match(/https:\/\/m\.weibo\.cn\/u\/(.*?)\?/)[1];
            var id = "";
            if (document.location.href.match(/^.*m\.weibo\.cn\/(status|detail)\/(\w+)\??.*$/i) && !/^\d+$/.test(RegExp.$2)) {
                id = RegExp.$2;
            } else {
                id = WeiboUtil.mid2url(mid);
            }
            return `https://weibo.com/${uid}/${id}`
        } catch (e) {
            console.log('[WeiboPcGo] 解析 id 失败', e)
        }
    }

    var hostMappingInfo = {
        'm.hupu.com' : {
            'url': 'https://bbs.hupu.com/{0}.html',
            'regular': /\/bbs\/(\d*)\.html/,
            'num': 1
        },
        'item.m.jd.com': {
            'url': 'https://item.jd.com/{0}.html',
            'regular': /\/product\/(\d*).html/,
            'num': 1
        },
        'm.weibo.cn': {
            'regular': /\/(status|detail)\/(.*)/,
            'func': WeiboUtil.getPCUrl
        }
    }

    // 获取网页的 PC URL
    function getPCUrl(url) {
        let urlObj = new URL(url)
        let info = hostMappingInfo[urlObj.host]
        if (info) {
            let result = url.match(info.regular)
            if (result) {
                if (info.url) {
                    // 使用 url 中的参数获取 url
                    let urlArgs = new Array()
                    for (let i=0; i < info.num; i++) {
                        urlArgs[i] = result[i + 1]
                    }
                    if (urlArgs) {
                        return info.url.format(...urlArgs)
                    }
                } else if (info.func) {
                    // 使用方法获取 url
                    url = info.func()
                    if (url) {
                        return url
                    }
                }
            }
        }
    }

    // window.onload = function() {
    let currentUrl = window.location.href
    let newUrl = getPCUrl(currentUrl)
    if (newUrl) {
        window.location.href=newUrl
    }
    // }
})();