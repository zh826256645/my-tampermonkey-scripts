// ==UserScript==
// @name         腾讯频道-修复监控上报死循环
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  拦截 Aegis 遥测上报，避免广告拦截器阻断请求后引发无限重试和 CPU 占用飙升
// @author       XiGuaShu
// @match        https://pd.qq.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const COLLECT_HOST = 'galileotelemetry.tencent.com';
    const COLLECT_PATH = '/collect';
    const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if (!proto) return;

    const nativeOpen = proto.open;
    const nativeSend = proto.send;
    const nativeSetRequestHeader = proto.setRequestHeader;
    const nativeGetResponseHeader = proto.getResponseHeader;
    const nativeGetAllResponseHeaders = proto.getAllResponseHeaders;
    const nativeOverrideMimeType = proto.overrideMimeType;
    const nativeAbort = proto.abort;
    const mocked = new WeakMap();
    const stateProperties = [
        'readyState',
        'status',
        'statusText',
        'responseURL',
        'responseText',
        'response',
    ];

    function isCollectRequest(rawUrl) {
        try {
            const url = new URL(String(rawUrl), location.href);
            return url.hostname === COLLECT_HOST && url.pathname === COLLECT_PATH;
        } catch {
            return false;
        }
    }

    function defineState(xhr, state) {
        const getters = {
            readyState: () => state.readyState,
            status: () => state.status,
            statusText: () => state.statusText,
            responseURL: () => state.url,
            responseText: () => state.responseText,
            response: () => state.response,
        };

        Object.entries(getters).forEach(([name, get]) => {
            try {
                Object.defineProperty(xhr, name, {
                    configurable: true,
                    enumerable: true,
                    get,
                });
            } catch {
                // Different browsers expose slightly different XHR properties.
            }
        });
    }

    function clearState(xhr) {
        stateProperties.forEach((name) => {
            try {
                delete xhr[name];
            } catch {
                // Ignore non-configurable properties on unusual XHR shims.
            }
        });
    }

    function emit(xhr, type) {
        let event;
        try {
            event = new ProgressEvent(type);
        } catch {
            event = new Event(type);
        }
        xhr.dispatchEvent(event);
    }

    proto.open = function (method, url) {
        if (!isCollectRequest(url)) {
            clearState(this);
            mocked.delete(this);
            return nativeOpen.apply(this, arguments);
        }

        const state = {
            url: String(url),
            readyState: 1,
            status: 0,
            statusText: '',
            responseText: '',
            response: '',
            sent: false,
        };
        mocked.set(this, state);
        defineState(this, state);
    };

    proto.send = function () {
        const state = mocked.get(this);
        if (!state) return nativeSend.apply(this, arguments);
        if (state.sent) return;
        state.sent = true;

        // 返回成功响应，阻止 Aegis 把“上报失败”再次上报，从而跳出死循环。
        queueMicrotask(() => {
            emit(this, 'loadstart');
            state.readyState = 2;
            state.status = 204;
            state.statusText = 'No Content';
            emit(this, 'readystatechange');

            state.readyState = 4;
            emit(this, 'readystatechange');
            emit(this, 'load');
            emit(this, 'loadend');
        });
    };

    proto.setRequestHeader = function () {
        if (mocked.has(this)) return;
        return nativeSetRequestHeader.apply(this, arguments);
    };

    proto.getResponseHeader = function () {
        if (mocked.has(this)) return null;
        return nativeGetResponseHeader.apply(this, arguments);
    };

    proto.getAllResponseHeaders = function () {
        if (mocked.has(this)) return '';
        return nativeGetAllResponseHeaders.apply(this, arguments);
    };

    proto.overrideMimeType = function () {
        if (mocked.has(this)) return;
        return nativeOverrideMimeType.apply(this, arguments);
    };

    proto.abort = function () {
        if (mocked.has(this)) return;
        return nativeAbort.apply(this, arguments);
    };
}());
