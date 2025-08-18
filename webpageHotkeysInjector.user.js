// ==UserScript==
// @name         网页热键注入器 (Webpage Hotkeys Injector)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  为任何网页添加自定义热键，支持点击、聚焦和自定义函数等操作
// @author       User
// @match        *://*/*
// @grant        none
// @license      MIT
// ==/UserScript==

// == HotkeyManager v2.0 -- A Universal Injectable Hotkey System with UI Dashboard ==
(function(window) {
    'use strict';

    if (window.HotkeyManager && window.HotkeyManager.version === '2.0') {
        console.log('HotkeyManager v2.0 is already running.');
        window.HotkeyManager.showDashboard();
        return;
    }

    const HotkeyManager = {
        version: '2.0',
        hotkeys: [],
        isInitialized: false,
        storageKey: 'hotkeyManagerConfig',
        themeKey: 'hotkeyManagerTheme',
        theme: 'light', // 默认使用深色主题
        lastClickedElement: null,

        init: function() {
            if (this.isInitialized) return;
            this.loadHotkeys();
            this.loadThemePreference();
            document.addEventListener('keydown', this.handleKeyDown.bind(this), true); // Use capturing phase
            document.addEventListener('click', this.recordClickedElement.bind(this), true); // 记录点击的元素
            this.isInitialized = true;
            console.log('%cHotkeyManager v2.0 initialized successfully!', 'color: #4CAF50; font-weight: bold;');
            console.log('Call `HotkeyManager.showDashboard()` to open the management panel.');
            console.log('Press Alt+Q to get HTML of the last clicked element');
            this.injectCSS();
            this.createDashboard();
        },
        
        recordClickedElement: function(event) {
            // 记录被点击的元素
            this.lastClickedElement = event.target;
            // 不阻止事件传播
        },
        
        getLastClickedElementHTML: function() {
            if (!this.lastClickedElement) {
                alert('请先点击一个页面元素');
                return;
            }
            
            // 获取元素的outerHTML，保留完整标签结构
            const elementHTML = this.lastClickedElement.outerHTML;
            
            // 获取元素的CSS选择器路径
            const selector = this.getCssSelectorPath(this.lastClickedElement);
            
            // 创建一个模态框来显示HTML代码
            this.showHTMLModal(elementHTML, selector);
        },
        
        getCssSelectorPath: function(element) {
            if (!element || element === document.body) return 'body';
            
            // 获取元素的选择器片段
            let selector = this.getElementSelector(element);
            
            // 遍历父元素，构建完整路径
            let current = element;
            let iterations = 0;
            const maxIterations = 25; // 防止无限循环
            
            while (current.parentElement && iterations < maxIterations) {
                current = current.parentElement;
                
                // 到达body就停止
                if (current === document.body) {
                    selector = 'body > ' + selector;
                    break;
                }
                
                // 添加父元素选择器
                selector = this.getElementSelector(current) + ' > ' + selector;
                iterations++;
            }
            
            return selector;
        },
        
        getElementSelector: function(el) {
            // 尝试使用ID
            if (el.id) {
                return '#' + el.id;
            }
            
            // 尝试使用类名
            if (el.className && typeof el.className === 'string' && el.className.trim()) {
                return el.tagName.toLowerCase() + '.' + el.className.trim().replace(/\s+/g, '.');
            }
            
            // 尝试使用元素类型和位置
            const sameTypeElements = Array.from(el.parentNode.children).filter(child => 
                child.tagName === el.tagName
            );
            
            if (sameTypeElements.length > 1) {
                const index = sameTypeElements.indexOf(el);
                return el.tagName.toLowerCase() + ':nth-child(' + (index + 1) + ')';
            }
            
            // 默认使用元素类型
            return el.tagName.toLowerCase();
        },
        
        showHTMLModal: function(html, selector) {
            // 创建模态框元素
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${this.theme === 'dark' ? '#2c2c2c' : '#ffffff'};
                color: ${this.theme === 'dark' ? '#f0f0f0' : '#333333'};
                border: 1px solid ${this.theme === 'dark' ? '#555' : '#dddddd'};
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                z-index: 9999999;
                padding: 20px;
                max-width: 90%;
                max-height: 80%;
                overflow: auto;
                font-family: monospace;
                user-select: text;
            `;
            
            // 重设页面所有元素的user-select，确保模态框中的文本可选
            const originalStyles = {};
            
            // 添加事件监听器以确保模态框内的文本可选
            modal.addEventListener('mousedown', function(e) {
                // 阻止拖拽开始可能会影响文本选择
                e.stopPropagation();
            }, true);
            
            // 添加关闭按钮
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '关闭';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: ${this.theme === 'dark' ? '#444' : '#eee'};
                color: ${this.theme === 'dark' ? '#fff' : '#333'};
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
            `;
            closeBtn.onclick = () => document.body.removeChild(modal);
            
            // 添加复制按钮 - HTML
            const copyHTMLBtn = document.createElement('button');
            copyHTMLBtn.textContent = '复制HTML';
            copyHTMLBtn.style.cssText = `
                background: ${this.theme === 'dark' ? '#4CAF50' : '#4CAF50'};
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 15px;
                cursor: pointer;
                margin-right: 10px;
            `;
            copyHTMLBtn.onclick = () => {
                navigator.clipboard.writeText(html)
                    .then(() => {
                        copyHTMLBtn.textContent = '复制成功！';
                        setTimeout(() => copyHTMLBtn.textContent = '复制HTML', 2000);
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                        copyHTMLBtn.textContent = '复制失败';
                        setTimeout(() => copyHTMLBtn.textContent = '复制HTML', 2000);
                    });
            };
            
            // 添加复制按钮 - 选择器
            const copySelectorBtn = document.createElement('button');
            copySelectorBtn.textContent = '复制CSS选择器';
            copySelectorBtn.style.cssText = `
                background: ${this.theme === 'dark' ? '#2196F3' : '#2196F3'};
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 15px;
                cursor: pointer;
            `;
            copySelectorBtn.onclick = () => {
                navigator.clipboard.writeText(selector)
                    .then(() => {
                        copySelectorBtn.textContent = '复制成功！';
                        setTimeout(() => copySelectorBtn.textContent = '复制CSS选择器', 2000);
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                        copySelectorBtn.textContent = '复制失败';
                        setTimeout(() => copySelectorBtn.textContent = '复制CSS选择器', 2000);
                    });
            };
            
            // 添加标题
            const title = document.createElement('h3');
            title.textContent = '元素信息';
            title.style.marginTop = '0';
            
            // 创建元素预览区域
            const previewContainer = document.createElement('div');
            previewContainer.style.cssText = `
                margin-bottom: 20px;
                padding: 15px;
                background: ${this.theme === 'dark' ? '#1c1c1c' : '#f5f5f5'};
                border-radius: 6px;
                border: 2px dashed ${this.theme === 'dark' ? '#555' : '#ddd'};
                overflow: visible;
                width: 90%;
                max-width: 800px;
            `;
            
            const previewTitle = document.createElement('div');
            previewTitle.textContent = '元素预览:';
            previewTitle.style.fontWeight = 'bold';
            previewTitle.style.marginBottom = '12px';
            previewTitle.style.fontSize = '16px';
            
            // 创建预览内容
            const previewContent = document.createElement('div');
            previewContent.style.cssText = `
                max-height: 300px;
                overflow: auto;
                padding: 12px;
                background: ${this.theme === 'dark' ? '#2a2a2a' : '#ffffff'};
                border-radius: 4px;
                word-break: break-all;
                min-height: 200px;
            `;
            
            // 创建一个真实渲染的元素预览
            if (this.lastClickedElement) {
                try {
                    // 创建一个预览标签
                    const elementType = document.createElement('div');
                    elementType.style.cssText = `
                        font-size: 12px;
                        color: ${this.theme === 'dark' ? '#aaa' : '#666'};
                        margin-bottom: 8px;
                        padding: 3px 6px;
                        background: ${this.theme === 'dark' ? '#333' : '#eee'};
                        border-radius: 3px;
                        display: inline-block;
                    `;
                    elementType.textContent = `元素类型: ${this.lastClickedElement.tagName.toLowerCase()}`;
                    previewContent.appendChild(elementType);
                    
                    // 创建一个隔离的容器用于呈现元素
                    const renderContainer = document.createElement('div');
                    renderContainer.style.cssText = `
                        padding: 10px;
                        border: 1px solid ${this.theme === 'dark' ? '#444' : '#ddd'};
                        border-radius: 4px;
                        background: ${this.theme === 'dark' ? '#222' : '#fff'};
                        overflow: hidden;
                        position: relative;
                    `;
                    
                    // 克隆元素，保留所有样式和属性
                    const clonedElement = this.lastClickedElement.cloneNode(true);
                    
                    // 处理特殊元素
                    if (clonedElement.tagName === 'HTML' || clonedElement.tagName === 'BODY') {
                        renderContainer.textContent = `无法直接预览 ${clonedElement.tagName.toLowerCase()} 元素`;
                    } 
                    // 处理iframe和框架
                    else if (clonedElement.tagName === 'IFRAME' || clonedElement.tagName === 'FRAME') {
                        const frameInfo = document.createElement('div');
                        frameInfo.innerHTML = `<div style="padding: 20px; text-align: center; border: 1px dashed #666;">
                            iframe: ${clonedElement.src ? new URL(clonedElement.src).hostname : '无源'}
                            <br><small>(出于安全考虑，不显示iframe内容)</small>
                        </div>`;
                        renderContainer.appendChild(frameInfo);
                    }
                    // 处理图片
                    else if (clonedElement.tagName === 'IMG') {
                        // 设置最大尺寸，保持纵横比
                        clonedElement.style.maxWidth = '100%';
                        clonedElement.style.maxHeight = '150px';
                        clonedElement.style.objectFit = 'contain';
                        
                        // 添加加载错误处理
                        clonedElement.onerror = function() {
                            this.style.display = 'none';
                            const errorText = document.createElement('div');
                            errorText.textContent = '图片加载失败';
                            errorText.style.color = 'red';
                            errorText.style.textAlign = 'center';
                            errorText.style.padding = '10px';
                            this.parentNode.appendChild(errorText);
                        };
                        
                        renderContainer.appendChild(clonedElement);
                        
                        // 添加图片尺寸信息
                        if (this.lastClickedElement.naturalWidth) {
                            const sizeInfo = document.createElement('div');
                            sizeInfo.textContent = `尺寸: ${this.lastClickedElement.naturalWidth} × ${this.lastClickedElement.naturalHeight}`;
                            sizeInfo.style.fontSize = '11px';
                            sizeInfo.style.textAlign = 'right';
                            sizeInfo.style.paddingTop = '4px';
                            sizeInfo.style.color = this.theme === 'dark' ? '#aaa' : '#888';
                            renderContainer.appendChild(sizeInfo);
                        }
                    }
                    // 其他所有元素
                    else {
                        // 保留元素原始宽度和高度的相对比例，但限制最大尺寸
                        const originalRect = this.lastClickedElement.getBoundingClientRect();
                        const maxWidth = 300;
                        const maxHeight = 200;
                        
                        // 计算宽高比例和缩放
                        let scale = 1;
                        if (originalRect.width > maxWidth || originalRect.height > maxHeight) {
                            scale = Math.min(maxWidth / originalRect.width, maxHeight / originalRect.height);
                        }
                        
                        // 应用样式
                        clonedElement.style.transform = `scale(${scale})`;
                        clonedElement.style.transformOrigin = 'top left';
                        
                        // 恢复原始宽高，让元素有足够空间展示
                        if (originalRect.width > 0) {
                            renderContainer.style.width = Math.min(originalRect.width, maxWidth) + 'px';
                        }
                        renderContainer.style.height = Math.min(originalRect.height * scale, maxHeight) + 'px';
                        
                        // 对于输入框和文本区域，确保值能显示
                        if (clonedElement.tagName === 'INPUT' || clonedElement.tagName === 'TEXTAREA') {
                            clonedElement.value = this.lastClickedElement.value;
                            clonedElement.readOnly = true; // 防止修改
                        }
                        
                        // 删除可能引起安全问题的属性
                        const attributesToRemove = ['href', 'onclick', 'onload', 'onmouseover', 'onerror', 'srcset', 'data-'];
                        attributesToRemove.forEach(attr => {
                            if (attr.endsWith('-')) {
                                // 处理data-*等属性
                                Array.from(clonedElement.attributes)
                                    .filter(a => a.name.startsWith(attr))
                                    .forEach(a => clonedElement.removeAttribute(a.name));
                            } else if (clonedElement.hasAttribute(attr)) {
                                clonedElement.removeAttribute(attr);
                            }
                        });
                        
                        // 为链接添加特殊标记
                        if (clonedElement.tagName === 'A') {
                            const linkUrl = this.lastClickedElement.getAttribute('href');
                            clonedElement.style.position = 'relative';
                            clonedElement.style.textDecoration = 'underline';
                            
                            if (linkUrl) {
                                const linkInfo = document.createElement('div');
                                linkInfo.textContent = linkUrl.length > 30 ? linkUrl.substring(0, 30) + '...' : linkUrl;
                                linkInfo.style.fontSize = '10px';
                                linkInfo.style.color = this.theme === 'dark' ? '#8ab4f8' : '#0066cc';
                                linkInfo.style.wordBreak = 'break-all';
                                renderContainer.appendChild(linkInfo);
                            }
                        }
                        
                        renderContainer.appendChild(clonedElement);
                    }
                    
                    previewContent.appendChild(renderContainer);
                } catch (err) {
                    // 如果渲染失败，提供备用信息
                    const errorInfo = document.createElement('div');
                    errorInfo.textContent = `无法渲染预览: ${err.message}`;
                    errorInfo.style.color = 'red';
                    errorInfo.style.padding = '10px';
                    
                    // 添加元素基本信息
                    const elementInfo = document.createElement('div');
                    elementInfo.style.marginTop = '10px';
                    elementInfo.innerHTML = `<strong>元素类型:</strong> ${this.lastClickedElement.tagName.toLowerCase()}<br>`;
                    
                    // 显示一些元素属性
                    const attributes = [];
                    for (let attr of this.lastClickedElement.attributes) {
                        if (attributes.length >= 5) break; // 最多显示5个属性
                        const attrValue = attr.value.length > 30 ? attr.value.substring(0, 30) + '...' : attr.value;
                        attributes.push(`${attr.name}="${attrValue}"`);
                    }
                    
                    if (attributes.length > 0) {
                        elementInfo.innerHTML += `<strong>属性:</strong> ${attributes.join(', ')}`;
                    }
                    
                    previewContent.appendChild(errorInfo);
                    previewContent.appendChild(elementInfo);
                }
            } else {
                previewContent.textContent = '无法生成预览';
            }
            
            previewContainer.appendChild(previewTitle);
            previewContainer.appendChild(previewContent);
            
            // 创建选择器展示区
            const selectorContainer = document.createElement('div');
            selectorContainer.style.cssText = `
                margin-bottom: 15px;
                padding: 10px;
                background: ${this.theme === 'dark' ? '#1c1c1c' : '#f5f5f5'};
                border-radius: 4px;
            `;
            
            const selectorTitle = document.createElement('div');
            selectorTitle.textContent = 'CSS选择器:';
            selectorTitle.style.fontWeight = 'bold';
            selectorTitle.style.marginBottom = '5px';
            
            const selectorContent = document.createElement('div');
            selectorContent.textContent = selector;
            selectorContent.style.wordBreak = 'break-all';
            selectorContent.style.overflowWrap = 'break-word';
            selectorContent.style.userSelect = 'text';  // 确保文本可选择
            selectorContent.style.cursor = 'text';      // 显示文本选择光标
            selectorContent.style.padding = '5px';
            selectorContent.style.backgroundColor = this.theme === 'dark' ? '#252525' : '#f9f9f9';
            selectorContent.style.border = `1px solid ${this.theme === 'dark' ? '#444' : '#ddd'}`;
            selectorContent.style.borderRadius = '3px';
            
            selectorContainer.appendChild(selectorTitle);
            selectorContainer.appendChild(selectorContent);
            
            // 显示HTML代码
            const htmlTitle = document.createElement('div');
            htmlTitle.textContent = 'HTML:';
            htmlTitle.style.fontWeight = 'bold';
            htmlTitle.style.marginBottom = '5px';
            
            const pre = document.createElement('pre');
            pre.style.cssText = `
                background: ${this.theme === 'dark' ? '#1c1c1c' : '#f5f5f5'};
                color: ${this.theme === 'dark' ? '#f0f0f0' : '#333'};
                padding: 10px;
                border-radius: 4px;
                overflow: auto;
                white-space: pre-wrap;
                word-break: break-all;
                margin-top: 0;
                user-select: text;
                cursor: text;
                border: 1px solid ${this.theme === 'dark' ? '#333' : '#ddd'};
            `;
            pre.textContent = html;
            
            // 构建模态框内容
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginBottom = '15px';
            buttonContainer.appendChild(copyHTMLBtn);
            buttonContainer.appendChild(copySelectorBtn);
            
            modal.appendChild(closeBtn);
            modal.appendChild(title);
            modal.appendChild(buttonContainer);
            modal.appendChild(previewContainer);  // 添加预览区域
            modal.appendChild(selectorContainer);
            modal.appendChild(htmlTitle);
            modal.appendChild(pre);
            
            // 添加到页面
            document.body.appendChild(modal);
        },
        
        loadThemePreference: function() {
            try {
                const storedTheme = localStorage.getItem(this.themeKey + window.location.hostname);
                if (storedTheme) {
                    this.theme = storedTheme;
                }
            } catch (e) {
                console.error("Failed to load theme preference from localStorage:", e);
            }
        },
        
        saveThemePreference: function() {
            try {
                localStorage.setItem(this.themeKey + window.location.hostname, this.theme);
            } catch (e) {
                console.error("Failed to save theme preference to localStorage:", e);
            }
        },
        
        toggleTheme: function() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            this.saveThemePreference();
            this.applyTheme();
        },
        
        applyTheme: function() {
            if (this.dashboard) {
                this.dashboard.setAttribute('data-theme', this.theme);
            }
        },
        
        loadHotkeys: function() {
            try {
                const storedHotkeys = localStorage.getItem(this.storageKey + window.location.hostname);
                if (storedHotkeys) {
                    this.hotkeys = JSON.parse(storedHotkeys).map(hotkey => {
                        if (hotkey.action.type === 'function') {
                             try {
                                // IMPORTANT: Recreate function from stored string. Be aware of security implications.
                                hotkey.action.value = new Function('targetElement', hotkey.action.value);
                            } catch (e) {
                                console.error('Error recreating function for hotkey:', hotkey, e);
                                // Fallback to a no-op function
                                hotkey.action.value = () => console.error(`Invalid custom function for hotkey "${hotkey.description}"`);
                            }
                        }
                        return hotkey;
                    });
                     console.log(`Loaded ${this.hotkeys.length} hotkeys for this site.`);
                }
            } catch (e) {
                console.error("Failed to load hotkeys from localStorage:", e);
                this.hotkeys = [];
            }
        },

        saveHotkeys: function() {
             try {
                const storableHotkeys = this.hotkeys.map(hotkey => {
                    const clone = { ...hotkey };
                    if (typeof clone.action.value === 'function') {
                        // Store function body as a string
                        clone.action.value = clone.action.value.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1].trim();
                     }
                    return clone;
                });
                localStorage.setItem(this.storageKey + window.location.hostname, JSON.stringify(storableHotkeys));
            } catch (e) {
                console.error("Failed to save hotkeys to localStorage:", e);
            }
        },

        add: function(config) {
            if (!config || !config.keys || !config.selector) {
                console.error('Invalid configuration.');
                return false;
            }
            config.normalizedKeys = config.keys.toLowerCase().split('+').map(k => k.trim());
            this.hotkeys.push(config);
            this.saveHotkeys();
            console.log(`Hotkey added: [${config.keys}] for "${config.description}"`);
            return true;
        },

        remove: function(index) {
            if (index > -1 && index < this.hotkeys.length) {
                const removed = this.hotkeys.splice(index, 1);
                this.saveHotkeys();
                console.log(`Hotkey removed: "${removed[0].description}"`);
                this.renderHotkeysList();
            }
        },

        update: function(index, config) {
            if (index > -1 && index < this.hotkeys.length) {
                config.normalizedKeys = config.keys.toLowerCase().split('+').map(k => k.trim());
                this.hotkeys[index] = config;
                this.saveHotkeys();
                console.log(`Hotkey updated: "${config.description}"`);
                return true;
            }
            return false;
        },

        handleKeyDown: function(event) {
            const pressedKeys = [];
            if (event.ctrlKey || event.metaKey) pressedKeys.push('control');
            if (event.shiftKey) pressedKeys.push('shift');
            if (event.altKey) pressedKeys.push('alt');
            
            const mainKey = event.key.toLowerCase();
            if(!['control', 'shift', 'alt', 'meta'].includes(mainKey)) {
                pressedKeys.push(mainKey);
            }

            this.hotkeys.forEach(hotkey => {
                if (pressedKeys.length === hotkey.normalizedKeys.length && pressedKeys.every(k => hotkey.normalizedKeys.includes(k))) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log(`%cHotkey Triggered: ${hotkey.description}`, 'color: #2196F3;');
                    this.executeAction(hotkey);
                }
            });
        },

        executeAction: function(hotkey) {
			const elements = Array.from(document.querySelectorAll(hotkey.selector));
			if (elements.length === 0) {
				console.warn(`No element found for selector: "${hotkey.selector}"`);
				return;
			}
			
			let targetElement = null;
			const findMethod = (hotkey.options && hotkey.options.find) || 'first';
			
            switch (findMethod) {
				case 'last': targetElement = elements[elements.length - 1]; break;
				case 'bottommost':
					targetElement = elements.reduce((bottommost, current) => {
                        if (!bottommost) return current;
                        const bottomRect = bottommost.getBoundingClientRect();
                        const currentRect = current.getBoundingClientRect();
                        return currentRect.bottom > bottomRect.bottom ? current : bottommost;
                    }, null);
					break;
				case 'first': default: targetElement = elements[0]; break;
			}

            if (!targetElement) { console.warn(`Could not find a target element for selector "${hotkey.selector}"`); return; }

            if (hotkey.action.type === 'function') {
                hotkey.action.value(targetElement);
            } else if (typeof targetElement[hotkey.action.value] === 'function') {
                targetElement[hotkey.action.value]();
            }
        },
        
        // --- UI Dashboard Section ---
        
        dashboard: null,
        
        injectCSS: function() {
            if (document.getElementById('hk-manager-styles')) return;
            const style = document.createElement('style');
            style.id = 'hk-manager-styles';
            style.innerHTML = `
                /* 深色主题（默认） */
                #hk-manager-dashboard { position: fixed; top: 20px; right: 20px; width: 420px; background: #2c2c2c; color: #f0f0f0; border: 1px solid #555; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; display: none; flex-direction: column; max-height: 90vh; }
                #hk-manager-dashboard.hk-minimized { height: 38px; width: 200px; overflow: hidden; }
                #hk-header { background: #3a3a3a; padding: 8px 12px; border-bottom: 1px solid #555; cursor: move; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; }
                #hk-header h3 { margin: 0; font-size: 16px; user-select: none; color: #fff; }
                #hk-controls button { background: none; border: none; color: #ccc; font-size: 18px; cursor: pointer; padding: 2px 5px;}
                #hk-controls button:hover { color: #fff; }
                #hk-theme-toggle { background: none; border: none; color: #ccc; font-size: 16px; cursor: pointer; padding: 2px 5px; margin-right: 5px; }
                #hk-theme-toggle:hover { color: #fff; }
                #hk-content { padding: 15px; overflow-y: auto; }
                #hk-list { list-style: none; padding: 0; margin-bottom: 15px; border-top: 1px solid #444; }
                #hk-list li { background: #383838; padding: 10px; border-bottom: 1px solid #444; display: flex; align-items: center; justify-content: space-between; }
                #hk-list li .info { flex-grow: 1; }
                #hk-list li .keys { font-weight: bold; color: #76d7ff; background: #2a2a2a; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-right: 10px; }
                #hk-list li .desc { color: #ddd; }
                #hk-list li .actions button { background: #555; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; margin-left: 5px; }
                #hk-list li .actions button:hover { background: #666; }
                .hk-form-group { margin-bottom: 12px; }
                .hk-form-group label { display: block; margin-bottom: 5px; color: #ccc; font-weight: bold; }
                .hk-form-group input, .hk-form-group select, .hk-form-group textarea { width: 100%; background: #222; color: #f0f0f0; border: 1px solid #555; padding: 8px; border-radius: 4px; box-sizing: border-box; }
                #hk-custom-action-group { display: none; }
                #hk-form-submit { width: 100%; background: #4CAF50; color: white; padding: 10px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
                #hk-form-submit:hover { background: #45a049; }
                
                /* 亮色主题 */
                #hk-manager-dashboard[data-theme="light"] { background: #ffffff; color: #333333; border: 1px solid #dddddd; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
                #hk-manager-dashboard[data-theme="light"] #hk-header { background: #f4f4f4; border-bottom: 1px solid #dddddd; }
                #hk-manager-dashboard[data-theme="light"] #hk-header h3 { color: #333333; }
                #hk-manager-dashboard[data-theme="light"] #hk-controls button { color: #666666; }
                #hk-manager-dashboard[data-theme="light"] #hk-controls button:hover { color: #333333; }
                #hk-manager-dashboard[data-theme="light"] #hk-theme-toggle { color: #666666; }
                #hk-manager-dashboard[data-theme="light"] #hk-theme-toggle:hover { color: #333333; }
                #hk-manager-dashboard[data-theme="light"] #hk-list { border-top: 1px solid #dddddd; }
                #hk-manager-dashboard[data-theme="light"] #hk-list li { background: #f4f4f4; border-bottom: 1px solid #dddddd; }
                #hk-manager-dashboard[data-theme="light"] #hk-list li .keys { color: #0066cc; background: #e8f4ff; }
                #hk-manager-dashboard[data-theme="light"] #hk-list li .desc { color: #333333; }
                #hk-manager-dashboard[data-theme="light"] #hk-list li .actions button { background: #e0e0e0; color: #333333; }
                #hk-manager-dashboard[data-theme="light"] #hk-list li .actions button:hover { background: #d0d0d0; }
                #hk-manager-dashboard[data-theme="light"] .hk-form-group label { color: #555555; }
                #hk-manager-dashboard[data-theme="light"] .hk-form-group input, 
                #hk-manager-dashboard[data-theme="light"] .hk-form-group select, 
                #hk-manager-dashboard[data-theme="light"] .hk-form-group textarea { 
                    background: #f4f4f4; color: #333333; border: 1px solid #cccccc; 
                }
            `;
            document.head.appendChild(style);
        },

        createDashboard: function() {
            if (document.getElementById('hk-manager-dashboard')) return;
            
            this.dashboard = document.createElement('div');
            this.dashboard.id = 'hk-manager-dashboard';
            this.dashboard.setAttribute('data-theme', this.theme);
            this.dashboard.innerHTML = `
                <div id="hk-header">
                    <h3>Hotkey Manager</h3>
                    <div id="hk-controls">
                        <button id="hk-theme-toggle" title="切换主题">🌓</button>
                        <button id="hk-minimize-btn" title="Minimize">－</button>
                        <button id="hk-close-btn" title="Close">×</button>
                    </div>
                </div>
                <div id="hk-content">
                    <h4>Current Hotkeys</h4>
                    <ul id="hk-list"></ul>
                    <h4>Add / Edit Hotkey</h4>
                    <form id="hk-add-form">
                        <input type="hidden" id="hk-edit-index" value="-1">
                        <div class="hk-form-group">
                            <label for="hk-keys">Keys (e.g., Control+Shift+D)</label>
                            <input type="text" id="hk-keys" required placeholder="control+shift+d">
                        </div>
                        <div class="hk-form-group">
                            <label for="hk-selector">CSS Selector</label>
                            <input type="text" id="hk-selector" required placeholder=".my-button or #button-id">
                        </div>
                        <div class="hk-form-group">
                            <label for="hk-description">Description</label>
                            <input type="text" id="hk-description" required placeholder="Delete the last message">
                        </div>
                         <div class="hk-form-group">
                            <label for="hk-find-method">Find Method</label>
                            <select id="hk-find-method">
                                <option value="first">First element</option>
                                <option value="last">Last element</option>
                                <option value="bottommost">Bottom-most element</option>
                            </select>
                        </div>
                        <div class="hk-form-group">
                            <label for="hk-action-type">Action</label>
                            <select id="hk-action-type">
                                <option value="click">Click</option>
                                <option value="focus">Focus</option>
                                <option value="custom">Custom Function</option>
                            </select>
                        </div>
                        <div class="hk-form-group" id="hk-custom-action-group">
                            <label for="hk-custom-action">Custom Function(targetElement) { ... }</label>
                            <textarea id="hk-custom-action" rows="5" placeholder="console.log(targetElement);\n// Your complex logic here"></textarea>
                        </div>
                        <button type="submit" id="hk-form-submit">Save Hotkey</button>
                    </form>
                </div>
            `;
            document.body.appendChild(this.dashboard);
            this.makeDraggable();
            this.attachUIEventListeners();
            this.renderHotkeysList();
        },
        
        showDashboard: function() {
            if (!this.dashboard) this.createDashboard();
            this.applyTheme();
            this.dashboard.style.display = 'flex';
        },

        attachUIEventListeners: function() {
            document.getElementById('hk-close-btn').addEventListener('click', () => this.dashboard.style.display = 'none');
            document.getElementById('hk-minimize-btn').addEventListener('click', () => {
                this.dashboard.classList.toggle('hk-minimized');
            });
            document.getElementById('hk-theme-toggle').addEventListener('click', () => {
                this.toggleTheme();
            });
            
            const form = document.getElementById('hk-add-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const index = parseInt(document.getElementById('hk-edit-index').value, 10);
                const actionType = document.getElementById('hk-action-type').value;

                const config = {
                    keys: document.getElementById('hk-keys').value,
                    selector: document.getElementById('hk-selector').value,
                    description: document.getElementById('hk-description').value,
                    options: { find: document.getElementById('hk-find-method').value },
                    action: {
                        type: actionType === 'custom' ? 'function' : 'string',
                        value: actionType === 'custom' 
                               ? document.getElementById('hk-custom-action').value 
                               : actionType
                    }
                };
                
                if (actionType === 'custom') {
                    try {
                        config.action.value = new Function('targetElement', config.action.value);
                    } catch (err) {
                        alert('Invalid custom function: ' + err.message);
                        return;
                    }
                }
                
                let success = false;
                if(index === -1) {
                    success = this.add(config);
                } else {
                    success = this.update(index, config);
                }
                
                if (success) {
                    form.reset();
                    document.getElementById('hk-edit-index').value = -1;
                    document.getElementById('hk-action-type').dispatchEvent(new Event('change'));
                    this.renderHotkeysList();
                }
            });

            document.getElementById('hk-action-type').addEventListener('change', (e) => {
                document.getElementById('hk-custom-action-group').style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        },
        
        renderHotkeysList: function() {
            const list = document.getElementById('hk-list');
            list.innerHTML = '';
            if (this.hotkeys.length === 0) {
                list.innerHTML = '<li><div class="info">No hotkeys registered for this site.</div></li>';
                return;
            }

            this.hotkeys.forEach((hotkey, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="info">
                        <span class="keys">${hotkey.keys}</span>
                        <span class="desc">${hotkey.description}</span>
                    </div>
                    <div class="actions">
                        <button class="edit-btn" data-index="${index}">Edit</button>
                        <button class="delete-btn" data-index="${index}">Delete</button>
                    </div>
                `;
                list.appendChild(li);
            });
            
            list.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => {
                if (confirm('Are you sure you want to delete this hotkey?')) {
                    this.remove(parseInt(e.target.dataset.index, 10));
                }
            }));

            list.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                const hotkey = this.hotkeys[index];
                document.getElementById('hk-edit-index').value = index;
                document.getElementById('hk-keys').value = hotkey.keys;
                document.getElementById('hk-selector').value = hotkey.selector;
                document.getElementById('hk-description').value = hotkey.description;
                document.getElementById('hk-find-method').value = hotkey.options.find || 'first';
                
                const actionTypeSelect = document.getElementById('hk-action-type');
                const customActionText = document.getElementById('hk-custom-action');
                if (hotkey.action.type === 'function') {
                    actionTypeSelect.value = 'custom';
                    const funcString = hotkey.action.value.toString();
                    customActionText.value = funcString.substring(funcString.indexOf('{') + 1, funcString.lastIndexOf('}')).trim();
                } else {
                    actionTypeSelect.value = hotkey.action.value;
                    customActionText.value = '';
                }
                actionTypeSelect.dispatchEvent(new Event('change'));
                document.getElementById('hk-add-form').scrollIntoView({ behavior: 'smooth' });
            }));
        },

        makeDraggable: function() {
            const header = document.getElementById('hk-header');
            let isDragging = false, offsetX, offsetY;
            
            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - this.dashboard.offsetLeft;
                offsetY = e.clientY - this.dashboard.offsetTop;
                document.body.style.userSelect = 'none';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    this.dashboard.style.left = `${e.clientX - offsetX}px`;
                    this.dashboard.style.top = `${e.clientY - offsetY}px`;
                }
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.body.style.userSelect = '';
            });
        }
    };

    // 添加全局热键 Ctrl+Shift+Alt+H 来打开/关闭面板
    const toggleHotkeyManager = function(e) {
        // 打开/关闭管理面板
        if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            e.stopPropagation();
            
            if (HotkeyManager.dashboard && HotkeyManager.dashboard.style.display === 'flex') {
                HotkeyManager.dashboard.style.display = 'none';
            } else {
                HotkeyManager.showDashboard();
            }
        }
        
        // Alt+Q 获取上次点击元素的HTML
        if (e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'q') {
            e.preventDefault();
            e.stopPropagation();
            HotkeyManager.getLastClickedElementHTML();
        }
    };
    
    document.addEventListener('keydown', toggleHotkeyManager, true);

    window.HotkeyManager = HotkeyManager;
    window.HotkeyManager.init();
    // 不默认显示面板，等待用户按下热键
    // window.HotkeyManager.showDashboard();

})(window);




