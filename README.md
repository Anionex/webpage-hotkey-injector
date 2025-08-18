# Webpage Hotkeys Injector
<img width="2782" height="1394" alt="image" src="https://github.com/user-attachments/assets/826bc6b4-a4eb-403e-bcae-dc847ca99f71" />
这个项目是一个网页热键注入器（Webpage Hotkeys Injector），主要功能如下：

1. **热键管理系统**：允许用户为网页创建自定义快捷键，并将这些配置保存到浏览器的本地存储中。

2. **元素HTML查看器**：通过Alt+Q快捷键，可以获取上次点击元素的完整HTML代码和CSS选择器路径，方便网页分析和调试。

3. **可视化面板**：提供了一个用户友好的仪表盘界面，用户可以通过它来添加、编辑和删除热键配置。

4. **多种操作类型**：
   - 点击指定元素
   - 聚焦指定元素
   - 执行自定义JavaScript函数

5. **元素选择器**：使用CSS选择器来定位页面元素，并支持多种查找方法：
   - 第一个匹配元素
   - 最后一个匹配元素
   - 页面底部的匹配元素

6. **持久化存储**：热键配置会保存在浏览器的localStorage中，针对不同网站保存不同的配置。

7. **拖拽界面**：管理面板可以拖动，并支持最小化功能。

这个工具非常适合需要频繁在特定网页上执行重复操作的用户，可以大大提高浏览效率。用户可以通过`HotkeyManager.showDashboard()`命令来打开管理面板，并轻松配置自己的网页快捷键。

## 使用方式

### 直接引入
- 打开f12开发者选项，将js内容粘贴到console中回车执行。
- 或将`wepageHotkeysInjector.user.js`文件添加到您的页面中：
```html
<script src="wepageHotkeysInjector.user.js"></script>
```

### 油猴脚本
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或类似的用户脚本管理器
2. 安装 `webpageHotkeysInjector.user.js` 脚本
3. 脚本将自动在任何网页上运行

## 使用说明
- 使用 `Ctrl+Shift+Alt+H` 组合键打开/关闭热键管理面板
- 在管理面板中，您可以添加、编辑和删除热键配置
- 也可以通过控制台运行 `HotkeyManager.showDashboard()` 来打开面板
- 使用 `Alt+Q` 获取上次点击元素的HTML代码和CSS选择器（适合快速定位元素，无需查看源码）

### 效果概览
<img width="2782" height="1395" alt="image" src="https://github.com/user-attachments/assets/f19eeee4-5137-402b-99f3-ff19f7cf4029" />
<img width="2782" height="1401" alt="image" src="https://github.com/user-attachments/assets/b02ff685-7577-4530-815f-c3f778491e80" />

