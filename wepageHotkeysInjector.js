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

        init: function() {
            if (this.isInitialized) return;
            this.loadHotkeys();
            this.loadThemePreference();
            document.addEventListener('keydown', this.handleKeyDown.bind(this), true); // Use capturing phase
            this.isInitialized = true;
            console.log('%cHotkeyManager v2.0 initialized successfully!', 'color: #4CAF50; font-weight: bold;');
            console.log('Call `HotkeyManager.showDashboard()` to open the management panel.');
            this.injectCSS();
            this.createDashboard();
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
        if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            e.stopPropagation();
            
            if (HotkeyManager.dashboard && HotkeyManager.dashboard.style.display === 'flex') {
                HotkeyManager.dashboard.style.display = 'none';
            } else {
                HotkeyManager.showDashboard();
            }
        }
    };
    
    document.addEventListener('keydown', toggleHotkeyManager, true);

    window.HotkeyManager = HotkeyManager;
    window.HotkeyManager.init();
    // 不默认显示面板，等待用户按下热键
    // window.HotkeyManager.showDashboard();

})(window);

