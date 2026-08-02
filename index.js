(() => {
    const EXTENSION_VERSION = '1.0.6';
    const INSTALL_REFRESH_STORAGE_KEY = 'xy-theme-install-refresh-version';
    document.documentElement.dataset.xyTwoWing = 'loaded';
    document.documentElement.dataset.xyLayout = 'sidebar';
    window.__xyTwoWingDrawerBehavior = true;
    const ISOLATED_THEME_VARIABLES = {
        '--SmartThemeBodyColor': 'rgba(222, 226, 220, .9)',
        '--SmartThemeEmColor': 'rgba(194, 209, 202, .86)',
        '--SmartThemeUnderlineColor': 'rgba(216, 197, 141, .9)',
        '--SmartThemeQuoteColor': 'rgba(219, 227, 217, .9)',
        '--SmartThemeBlurTintColor': 'rgba(12, 20, 25, .94)',
        '--SmartThemeChatTintColor': 'rgba(10, 17, 22, .9)',
        '--SmartThemeUserMesBlurTintColor': 'rgba(21, 42, 44, .84)',
        '--SmartThemeBotMesBlurTintColor': 'rgba(16, 31, 37, .84)',
        '--SmartThemeShadowColor': 'rgba(0, 0, 0, .72)',
        '--SmartThemeBorderColor': 'rgba(169, 159, 124, .28)',
        '--mainFontFamily': '"玄尘渡鸿蒙黑体", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif',
        '--monoFontFamily': '"Cascadia Mono", Consolas, monospace',
    };
    const THEME_DISPLAY_DEFAULTS = [
        { settingKey: 'timer_enabled', controlId: 'messageTimerEnabled', value: true, bodyClass: 'no-timer', classWhenEnabled: false },
        { settingKey: 'timestamps_enabled', controlId: 'messageTimestampsEnabled', value: true, bodyClass: 'no-timestamps', classWhenEnabled: false },
        { settingKey: 'mesIDDisplay_enabled', controlId: 'mesIDDisplayEnabled', value: true, bodyClass: 'no-mesIDDisplay', classWhenEnabled: false },
        { settingKey: 'hideChatAvatars_enabled', controlId: 'hideChatAvatarsEnabled', value: false, bodyClass: 'hideChatAvatars', classWhenEnabled: true },
        { settingKey: 'message_token_count_enabled', controlId: 'messageTokensEnabled', value: true, bodyClass: 'no-tokenCount', classWhenEnabled: false },
    ];
    let themeDisplayDefaultsApplied = false;

    function enforceThemeIsolation() {
        const root = document.documentElement;
        root.dataset.xyThemeIsolation = 'active';
        for (const [name, value] of Object.entries(ISOLATED_THEME_VARIABLES)) {
            root.style.setProperty(name, value, 'important');
        }

        // 酒馆主题和「自定义 CSS」共用这个运行时样式节点。只在本页禁用，
        // 不写回用户设置；停用扩展并刷新即可完整恢复原主题。
        document.getElementById('custom-style')?.setAttribute('media', 'not all');
    }

    enforceThemeIsolation();
    new MutationObserver(enforceThemeIsolation).observe(document.head, {
        childList: true,
        characterData: true,
        subtree: true,
    });

    const ASSETS = {
        boat: new URL('assets/nav-boat-banner-alpha.webm', import.meta.url).href,
        navInkLeft: new URL('assets/nav-ink-left.webp', import.meta.url).href,
        navInkRight: new URL('assets/nav-ink-right.webp', import.meta.url).href,
        homeLogo: new URL('assets/xuanchendu-logo-ink-cropped.png?v=1.0.4', import.meta.url).href,
        searchableSelects: new URL('assets/searchable-selects.js?v=1.2.0', import.meta.url).href,
        gsap: new URL('assets/vendor/gsap-3.13.0.min.js?v=3.13.0-composer', import.meta.url).href,
        pixelSnow: new URL('assets/pixel-snow.js?v=1.2.0', import.meta.url).href,
        sidebarGrainient: new URL('assets/grainient-sidebar.js?v=1.6.0', import.meta.url).href,
        genderDialogue: new URL('assets/gender-dialogue.js?v=1.0.12', import.meta.url).href,
        floatingBallDock: new URL('assets/floating-ball-dock.js?v=1.0.13', import.meta.url).href,
    };
    const PANEL_SELECTOR = [
        '#left-nav-panel',
        '#rm_api_block',
        '#AdvancedFormatting',
        '#Backgrounds',
        '#WorldInfo',
        '#rm_extensions_block',
        '#user-settings-block',
        '#PersonaManagement',
        '#right-nav-panel',
    ].join(',');
    const PANEL_POPUP_SELECTOR = '.select2-container, .ui-front, #xy-select-popover, #shadow_popup, #dialogue_popup, #completion_prompt_manager_popup, .TH-popup, dialog';

    const AI_PANEL_SELECTOR = '#left-nav-panel';
    const PANEL_META = {
        'left-nav-panel': { title: 'AI 响应配置', side: 'left', savesOnClose: true, focus: { eyebrow: '当前正在浏览', title: 'AI 响应配置', hint: '配置 AI 的响应行为' } },
        rm_api_block: { title: 'API 连接', side: 'left', focus: { eyebrow: '当前正在浏览', title: 'API 连接', hint: '管理服务连接和访问凭据' } },
        AdvancedFormatting: { title: 'AI 回复格式化', side: 'left', focus: { eyebrow: '当前正在浏览', title: 'AI 回复格式化', hint: '设置回复的格式规则' } },
        Backgrounds: { title: '背景', side: 'left', focus: { eyebrow: '当前正在浏览', title: '界面背景', hint: '选择和管理背景图' } },
        PersonaManagement: { title: '用户设定管理', side: 'left', focus: { eyebrow: '当前正在浏览', title: '用户设定管理', hint: '管理用户设定资料' } },
        WorldInfo: { title: '世界书', side: 'left' },
        rm_extensions_block: { title: '扩展程序', side: 'left', focus: { eyebrow: '当前正在浏览', title: '扩展程序', hint: '管理已安装的扩展模块' } },
        'user-settings-block': { title: '用户设置', side: 'left', focus: { eyebrow: '当前正在浏览', title: '用户设置', hint: '调整应用偏好和显示选项' } },
        'right-nav-panel': { title: '角色管理', side: 'left', focus: { eyebrow: '当前正在浏览', title: '角色管理', hint: '浏览和管理角色资料' } },
    };
    let aiSnapshot = null;
    let pendingPanelId = null;
    let activeFocusPanelId = null;
    let aiPromptEditorStateObserver = null;
    let searchableSelectsPromise = null;
    let composerGsapPromise = null;
    let focusSyncFrame = null;
    let focusSyncNeedsPresentation = false;
    let themePanels = null;
    let focusWorkspaceAnimation = null;
    const focusPanelHomes = new WeakMap();
    let worldbookEnhanceFrame = null;
    let worldbookResizeFrame = null;
    let worldbookListObserver = null;
    let activeWorldbookEntry = null;
    let worldbookToggleSyncing = false;
    let worldbookShortcutBound = false;
    let worldbookRestoreInFlight = false;
    let worldbookMemoryRestoreAttempted = false;
    const WORLDBOOK_MEMORY_KEY = 'xy-worldbook-last-entry-v1';
    const WORLDBOOK_MEMORY_ENABLED_KEY = 'xy-worldbook-memory-enabled-v1';
    const HOME_PIXEL_SNOW_ENABLED_KEY = 'xy-home-pixel-snow-enabled-v1';
    const HOME_PIXEL_SNOW_OPTIONS = Object.freeze({
        brightness: 1,
        color: '#ffffff',
        density: .3,
        depthFade: 5,
        direction: 125,
        farPlane: 20,
        flakeSize: .02,
        gamma: .4545,
        minFlakeSize: 1.25,
        pixelResolution: 500,
        speed: 1.25,
        variant: 'snowflake',
    });
const WELCOME_HOME_VERSION = 'xuanchendu-v16';
    const COMPOSER_PLACEHOLDER = '提笔入卷，输入 /? 取阅指引';
    let welcomeHomeFrame = null;
    let welcomeObserver = null;
    let activeWelcomePanel = null;
    let messageMetaFrame = null;
    const messageMetaPendingMessages = new Set();
    let messageMetaNeedsFullScan = false;
    let messageMetaObserver = null;
    let messageMetaSettingsObserver = null;
    let messageMetaVisibilitySignature = '';
    let homePixelSnowRenderer = null;
    const SIDEBAR_MODE_KEY = 'xy-sidebar-mode-v2';
    let sidebarTween = null;
    let genderDialoguePromise = null;
    let genderDialoguePromptEventsBound = false;
    let floatingBallDockPromise = null;
    const MESSAGE_PRESENTATION_PROMPT_ENABLED_KEY = 'xy-message-presentation-prompt-enabled-v1';
    const MESSAGE_META_MESSAGE_SELECTOR = '.mes[mesid]:not(.smallSysMes):not([type="welcome_prompt"])';
    const MESSAGE_META_RELEVANT_NODE_SELECTOR = '.timestamp, .tokenCounterDisplay, .mes_timer, .mes_block, .mes_header, .ch_name';
    const MESSAGE_META_BATCH_SIZE = 6;

    function isMessagePresentationPromptEnabled() {
        try {
            return window.localStorage.getItem(MESSAGE_PRESENTATION_PROMPT_ENABLED_KEY) !== 'false';
        } catch {
            return true;
        }
    }

    function setMessagePresentationPromptEnabled(enabled) {
        try {
            window.localStorage.setItem(MESSAGE_PRESENTATION_PROMPT_ENABLED_KEY, String(Boolean(enabled)));
        } catch {
            // The prompt remains controllable for this page when storage is unavailable.
        }
    }

    function registerGenderDialoguePrompt(core, dialogueModule) {
        const enabled = isMessagePresentationPromptEnabled();
        core.setExtensionPrompt(
            dialogueModule.DIALOGUE_GENDER_PROMPT_KEY,
            enabled ? dialogueModule.DIALOGUE_GENDER_PROMPT : '',
            core.extension_prompt_types.IN_CHAT,
            0,
            false,
            core.extension_prompt_roles.SYSTEM,
        );
        document.documentElement.dataset.xyGenderDialoguePrompt = enabled ? 'registered' : 'disabled';
    }

    function ensureGenderDialogue() {
        if (!genderDialoguePromise) {
            genderDialoguePromise = import(ASSETS.genderDialogue).then(async (dialogueModule) => {
                try {
                    const core = await import(new URL('../../../../script.js', import.meta.url).href);
                    const restorePrompt = () => registerGenderDialoguePrompt(core, dialogueModule);
                    restorePrompt();
                    if (!genderDialoguePromptEventsBound) {
                        genderDialoguePromptEventsBound = true;
                        core.eventSource.on(core.event_types.CHAT_CHANGED, restorePrompt);
                        core.eventSource.on(core.event_types.GENERATION_STARTED, restorePrompt);
                    }
                } catch (error) {
                    document.documentElement.dataset.xyGenderDialoguePrompt = 'failed';
                    console.warn('[玄尘渡] 性别台词提示词注册失败。', error);
                }
                return dialogueModule;
            }).catch((error) => {
                genderDialoguePromise = null;
                console.warn('[玄尘渡] 性别台词渲染模块加载失败。', error);
                return null;
            });
        }

        return genderDialoguePromise.then((dialogueModule) => {
            dialogueModule?.bindGenderDialogueRenderer();
            return dialogueModule;
        });
    }

    async function refreshMessagePresentationPrompt() {
        const dialogueModule = await ensureGenderDialogue();
        if (!dialogueModule) {
            return false;
        }
        try {
            const core = await import(new URL('../../../../script.js', import.meta.url).href);
            registerGenderDialoguePrompt(core, dialogueModule);
            return true;
        } catch (error) {
            document.documentElement.dataset.xyGenderDialoguePrompt = 'failed';
            console.warn('[玄尘渡] 消息标记提示词刷新失败。', error);
            return false;
        }
    }

    function ensureFloatingBallDock() {
        if (!floatingBallDockPromise) {
            floatingBallDockPromise = import(ASSETS.floatingBallDock)
                .then((dockModule) => dockModule.mountFloatingBallDock())
                .catch((error) => {
                    floatingBallDockPromise = null;
                    console.warn('[玄尘渡] 悬浮球收纳模块加载失败。', error);
                    return null;
                });
        }
        return floatingBallDockPromise;
    }

    function normalizeRecentSearch(value) {
        return String(value ?? '')
            .normalize('NFKC')
            .toLocaleLowerCase('zh-CN')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function optimisticallyReorderPinnedChat(event) {
        const button = event.target instanceof Element
            ? event.target.closest('.welcomePanel .recentChat .pinChat')
            : null;
        const card = button?.closest('.recentChat');
        const list = card?.parentElement;
        if (!(button instanceof HTMLButtonElement)
            || !(card instanceof HTMLElement)
            || !(list instanceof HTMLElement)
            || !list.classList.contains('recentChatList')) {
            return;
        }

        const pinning = !button.classList.contains('active');
        button.classList.toggle('active', pinning);
        card.querySelector(':scope > .recentChatPinned')?.remove();

        if (pinning) {
            const marker = document.createElement('div');
            marker.className = 'recentChatPinned';
            marker.innerHTML = '<i class="fa-solid fa-thumbtack fa-fw fa-xs" title="Pinned chat"></i>';
            card.prepend(marker);
            card.classList.remove('hidden');
            list.prepend(card);
            list.scrollTop = 0;
        } else {
            const remainingPinned = [...list.querySelectorAll(':scope > .recentChat')]
                .filter((candidate) => candidate !== card && candidate.querySelector('.pinChat.active'));
            const lastPinned = remainingPinned.at(-1);
            if (lastPinned) {
                lastPinned.after(card);
            } else {
                list.prepend(card);
            }
        }

        card.closest('.welcomePanel')?.__xyWelcomeInteractionEffects?.syncPointer?.();
    }

    function ensureComposerPlaceholder() {
        const composer = document.querySelector('#send_textarea');
        if (composer instanceof HTMLTextAreaElement) {
            composer.placeholder = COMPOSER_PLACEHOLDER;
        }
    }

    function loadComposerGsap() {
        if (window.gsap) {
            return Promise.resolve(window.gsap);
        }
        if (!composerGsapPromise) {
            composerGsapPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const timeout = window.setTimeout(() => {
                    script.remove();
                    reject(new Error('GSAP load timed out'));
                }, 4000);
                script.src = ASSETS.gsap;
                script.async = true;
                script.dataset.xyComposerGsap = 'true';
                script.onload = () => {
                    window.clearTimeout(timeout);
                    window.gsap ? resolve(window.gsap) : reject(new Error('GSAP did not initialise'));
                };
                script.onerror = () => {
                    window.clearTimeout(timeout);
                    reject(new Error('GSAP failed to load'));
                };
                document.head.append(script);
            }).catch((error) => {
                composerGsapPromise = null;
                throw error;
            });
        }
        return composerGsapPromise;
    }

    function ensureComposerEffects() {
        const form = document.querySelector('#send_form');
        const textarea = document.querySelector('#send_textarea');
        if (!(form instanceof HTMLElement) || !(textarea instanceof HTMLTextAreaElement)) {
            return;
        }

        let placeholder = form.querySelector(':scope > .xy-composer-placeholder');
        if (!(placeholder instanceof HTMLElement)) {
            placeholder = document.createElement('span');
            placeholder.className = 'xy-composer-placeholder';
            placeholder.setAttribute('aria-hidden', 'true');
            form.append(placeholder);
        }
        placeholder.textContent = COMPOSER_PLACEHOLDER;
        form.classList.add('xy-composer-effects-ready');

        const existing = form.__xyComposerEffects;
        if (existing) {
            existing.sync();
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const controls = [...form.querySelectorAll(':scope :is(#leftSendForm, #rightSendForm) > div')]
            .filter((control) => control instanceof HTMLElement);
        let gsap = null;
        let placeholderVisible = null;
        const controller = { controls, placeholder, sync: null };
        form.__xyComposerEffects = controller;

        const setPlaceholderVisibility = (visible) => {
            placeholder.style.opacity = visible ? '1' : '0';
            placeholder.style.visibility = visible ? 'visible' : 'hidden';
            placeholder.style.setProperty('--xy-composer-placeholder-blur', visible ? '0px' : '4px');
        };
        const syncPlaceholder = (animate = false) => {
            const visible = textarea.value.length === 0 && document.activeElement !== textarea;
            if (visible === placeholderVisible) {
                return;
            }
            placeholderVisible = visible;
            if (!gsap || reduceMotion || !animate) {
                setPlaceholderVisibility(visible);
                return;
            }
            gsap.killTweensOf(placeholder);
            if (visible) {
                gsap.set(placeholder, {
                    autoAlpha: 1,
                    opacity: 0,
                    '--xy-composer-placeholder-blur': '4px',
                });
                gsap.to(placeholder, {
                    opacity: 1,
                    '--xy-composer-placeholder-blur': '0px',
                    duration: .32,
                    ease: 'power2.out',
                    overwrite: 'auto',
                    onComplete: () => {
                        if (placeholderVisible) {
                            setPlaceholderVisibility(true);
                        }
                    },
                });
            } else {
                gsap.to(placeholder, {
                    opacity: 0,
                    '--xy-composer-placeholder-blur': '4px',
                    duration: .24,
                    ease: 'power2.in',
                    overwrite: 'auto',
                    onComplete: () => {
                        if (!placeholderVisible) {
                            gsap.set(placeholder, { visibility: 'hidden' });
                        }
                    },
                });
            }
        };
        controller.sync = syncPlaceholder;
        textarea.addEventListener('input', () => syncPlaceholder(true));
        textarea.addEventListener('focus', () => syncPlaceholder(true));
        textarea.addEventListener('blur', () => syncPlaceholder(true));

        if (reduceMotion) {
            syncPlaceholder();
            return;
        }

        void loadComposerGsap().then((loadedGsap) => {
            if (form.__xyComposerEffects !== controller) {
                return;
            }
            gsap = loadedGsap;
            controls.forEach((control) => {
                control.classList.add('xy-composer-action');
                gsap.set(control, { transformOrigin: '50% 50%', force3D: true });
                const settle = (active) => gsap.to(control, active
                    ? { y: -1.5, scale: 1.045, duration: .12, ease: 'power2.out', overwrite: 'auto' }
                    : { y: 0, scale: 1, duration: .14, ease: 'power1.out', overwrite: 'auto' });
                control.addEventListener('pointerenter', () => settle(true));
                control.addEventListener('pointerleave', () => settle(false));
                control.addEventListener('focusin', () => settle(true));
                control.addEventListener('focusout', (event) => {
                    if (!control.contains(event.relatedTarget)) {
                        settle(false);
                    }
                });
            });
            placeholderVisible = null;
            syncPlaceholder();
        }).catch(syncPlaceholder);
    }

    function ensureComposerMenuAlignment() {
        const form = document.querySelector('#send_form');
        const menus = ['#options', '#extensionsMenu']
            .map((selector) => document.querySelector(selector))
            .filter((menu) => menu instanceof HTMLElement);
        if (!(form instanceof HTMLElement) || menus.length === 0 || form.__xyComposerMenuAlignment) {
            return;
        }

        let frame = null;
        const isVisible = (menu) => menu.getClientRects().length > 0 && getComputedStyle(menu).display !== 'none';
        const alignMenu = (menu) => {
            if (!isVisible(menu)) {
                return;
            }
            const menuBounds = menu.getBoundingClientRect();
            const formBounds = form.getBoundingClientRect();
            const gap = Number.parseFloat(getComputedStyle(menu).marginBottom) || 0;
            const correction = (formBounds.top - gap) - menuBounds.bottom;
            if (Math.abs(correction) < .25) {
                return;
            }
            const current = menu.__xyComposerMenuTranslateY || 0;
            const next = current + correction;
            menu.__xyComposerMenuTranslateY = next;
            menu.style.translate = `0px ${next}px`;
        };
        const schedule = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
            frame = requestAnimationFrame(() => {
                frame = null;
                menus.forEach(alignMenu);
            });
        };

        form.__xyComposerMenuAlignment = { schedule };
        const observer = new ResizeObserver(schedule);
        observer.observe(form);
        menus.forEach((menu) => observer.observe(menu));
        window.addEventListener('resize', schedule, { passive: true });
        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)
                || !event.target.closest('#options_button, #extensionsMenuButton')) {
                return;
            }
            schedule();
            window.setTimeout(schedule, 120);
        }, true);
    }

    function filterWelcomeRecentChats(panel) {
        const search = panel.querySelector('.xy-recent-search');
        const input = search?.querySelector('.xy-recent-search-input');
        const list = panel.querySelector('.recentChatList');
        if (!search || !(input instanceof HTMLInputElement) || !list) {
            return;
        }

        const query = normalizeRecentSearch(input.value);
        let matchCount = 0;

        const windowController = list.__xyRecentWindowController;
        const cards = windowController?.cards
            ?? [...list.querySelectorAll(':scope > .recentChat')];
        cards.forEach((item) => {
            const searchableText = normalizeRecentSearch([
                item.querySelector('.chatName')?.textContent,
                item.querySelector('.chatName')?.getAttribute('title'),
                item.querySelector('.characterName')?.textContent,
                item.querySelector('.chatMessage')?.textContent,
                item.querySelector('.chatMessage')?.getAttribute('title'),
                item.querySelector('.chatDate')?.textContent,
                item.querySelector('.chatDate')?.getAttribute('title'),
                item.getAttribute('data-file'),
            ].filter(Boolean).join(' '));
            const matches = !query
                || searchableText.includes(query);

            item.classList.toggle('xy-search-hidden', !matches);
            if (query && matches) {
                item.classList.remove('hidden');
            }
            if (matches) {
                matchCount += 1;
            }
        });

        panel.classList.toggle('xy-recent-searching', Boolean(query));
        if (windowController) {
            if (query) {
                windowController.searching = true;
            } else {
                windowController.searching = false;
                windowController.restoreVisibleCards();
            }
        }
        const empty = list.querySelector(':scope > .xy-recent-search-empty');
        if (empty instanceof HTMLElement) {
            empty.hidden = !query || matchCount > 0;
        }
    }

    function ensureWelcomeRecentWindow(list) {
        if (!(list instanceof HTMLElement) || list.__xyRecentWindowController) {
            return;
        }

        const cards = [...list.querySelectorAll(':scope > .recentChat')];
        if (cards.length === 0) {
            return;
        }

        const initiallyVisible = cards.filter(card => !card.classList.contains('hidden')).length;
        const firstVisibleCard = cards.find(card => !card.classList.contains('hidden'));
        const rowHeight = firstVisibleCard?.getBoundingClientRect().height || 0;
        const rowGap = Number.parseFloat(getComputedStyle(list).rowGap) || 0;
        const visibleRows = rowHeight > 0
            ? Math.max(1, Math.floor((list.clientHeight + rowGap) / (rowHeight + rowGap)))
            : initiallyVisible;
        const controller = {
            cards,
            // 多显示一行，先建立原生滚动距离，后续批次才能由接近底部的滚动事件触发。
            revealedCount: Math.min(cards.length, Math.max(1, initiallyVisible, visibleRows + 1)),
            searching: false,
            batchSize: 12,
            restoreVisibleCards: null,
        };

        const restoreVisibleCards = () => {
            controller.cards.forEach((card, index) => {
                card.classList.remove('xy-search-hidden');
                card.classList.toggle('hidden', index >= controller.revealedCount);
            });
        };
        const revealNextBatch = () => {
            if (controller.searching || controller.revealedCount >= controller.cards.length) {
                return;
            }

            controller.revealedCount = Math.min(
                controller.cards.length,
                controller.revealedCount + controller.batchSize,
            );
            restoreVisibleCards();
        };
        const onScroll = () => {
            const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
            if (remaining <= Math.max(160, list.clientHeight * .35)) {
                revealNextBatch();
            }
        };

        controller.restoreVisibleCards = restoreVisibleCards;
        list.__xyRecentWindowController = controller;
        list.addEventListener('scroll', onScroll, { passive: true });
        list.querySelector(':scope > button.showMoreChats')?.remove();
        restoreVisibleCards();
    }

    function ensureWelcomeRecentPreview(list) {
        if (!(list instanceof HTMLElement) || list.__xyRecentPreviewController) {
            return;
        }

        let popover = document.getElementById('xy-recent-chat-preview');
        if (!(popover instanceof HTMLElement)) {
            popover = document.createElement('aside');
            popover.id = 'xy-recent-chat-preview';
            popover.setAttribute('role', 'tooltip');
            popover.setAttribute('aria-hidden', 'true');
            popover.innerHTML = `
                <div class="xy-recent-chat-preview__meta"></div>
                <div class="xy-recent-chat-preview__progress" aria-hidden="true"><div></div></div>
                <div class="xy-recent-chat-preview__content"></div>
            `;
            document.body.append(popover);
        }
        popover.__xyRecentPreviewDestroy?.();

        const meta = popover.querySelector('.xy-recent-chat-preview__meta');
        const progressValue = popover.querySelector('.xy-recent-chat-preview__progress > div');
        const content = popover.querySelector('.xy-recent-chat-preview__content');
        if (!(meta instanceof HTMLElement) || !(progressValue instanceof HTMLElement) || !(content instanceof HTMLElement)) {
            return;
        }

        // SillyTavern may apply a global overflow declaration with !important after this extension stylesheet loads.
        content.style.setProperty('overflow', 'auto', 'important');
        content.style.setProperty('overflow-x', 'hidden', 'important');
        content.style.setProperty('scrollbar-width', 'none', 'important');

        const previews = new WeakMap();
        const controller = {
            activeCard: null,
            activeMessage: null,
            hideTimer: null,
            layoutFrame: null,
            showTimer: null,
        };
        list.__xyRecentPreviewController = controller;

        const clearTimer = (name) => {
            if (controller[name] !== null) {
                window.clearTimeout(controller[name]);
                controller[name] = null;
            }
        };
        const getPreviewText = (message) => {
            if (previews.has(message)) {
                return previews.get(message);
            }
            const text = message.getAttribute('title') ?? message.textContent ?? '';
            previews.set(message, text);
            message.removeAttribute('title');
            return text;
        };
        const suppressNativePreviews = (records = null) => {
            const messages = records
                ? records.flatMap(record => [...record.addedNodes]).flatMap((node) => {
                    if (!(node instanceof HTMLElement)) {
                        return [];
                    }
                    return [
                        ...(node.matches('.chatMessage[title]') ? [node] : []),
                        ...node.querySelectorAll('.chatMessage[title]'),
                    ];
                })
                : [...list.querySelectorAll(':scope > .recentChat .chatMessage[title]')];
            messages.forEach(getPreviewText);
        };
        const finishHide = () => {
            popover.classList.remove('is-visible');
            popover.setAttribute('aria-hidden', 'true');
        };
        const hidePreview = () => {
            clearTimer('showTimer');
            clearTimer('hideTimer');
            controller.activeCard = null;
            controller.activeMessage = null;
            finishHide();
        };
        const getPreviewLayout = () => {
            if (window.innerWidth <= 900) {
                return null;
            }
            const chat = document.querySelector('#chat');
            if (!(chat instanceof HTMLElement)) {
                return null;
            }
            const chatRect = chat.getBoundingClientRect();
            const actionGuide = document.querySelector('#chat > .mes[type="welcome_prompt"]');
            const actionGuideRect = actionGuide instanceof HTMLElement
                ? actionGuide.getBoundingClientRect()
                : null;
            // Preview is anchored to the chat work area, with just enough breathing room at both edges.
            const viewportGap = Math.round(Math.max(6, Math.min(10, window.innerWidth * .005)));
            const left = Math.round(chatRect.right + viewportGap);
            const width = Math.floor(window.innerWidth - left - viewportGap);
            // The bottom of the "启行引" card is the reading boundary; retain a visible reading area when the viewport is shorter.
            const bottom = Math.min(actionGuideRect?.bottom ?? chatRect.bottom, window.innerHeight - viewportGap);
            const top = Math.round(chatRect.top);
            const height = Math.round(bottom) - top;
            if (width < 180 || height < 120) {
                return null;
            }
            return {
                height,
                left,
                top,
                width,
            };
        };
        const applyPreviewLayout = () => {
            const layout = getPreviewLayout();
            if (!layout) {
                return false;
            }
            popover.style.left = `${layout.left}px`;
            popover.style.top = `${layout.top}px`;
            popover.style.width = `${layout.width}px`;
            popover.style.maxHeight = `${layout.height}px`;
            popover.style.height = 'auto';
            const chromeHeight = popover.offsetHeight - content.clientHeight;
            const contentHeight = content.scrollHeight + chromeHeight;
            popover.style.height = `${Math.min(contentHeight, layout.height)}px`;
            return true;
        };
        const updatePreviewProgress = () => {
            const range = content.scrollHeight - content.clientHeight;
            const value = range > 0 ? content.scrollTop / range : 1;
            progressValue.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
        };
        const scheduleLayout = () => {
            if (controller.layoutFrame !== null) {
                return;
            }
            controller.layoutFrame = requestAnimationFrame(() => {
                controller.layoutFrame = null;
                if (popover.classList.contains('is-visible') && !applyPreviewLayout()) {
                    hidePreview();
                }
            });
        };
        const showPreview = (card, message) => {
            clearTimer('showTimer');
            clearTimer('hideTimer');
            controller.activeCard = card;
            controller.activeMessage = message;
            controller.showTimer = window.setTimeout(() => {
                controller.showTimer = null;
                if (controller.activeCard !== card || controller.activeMessage !== message || !message.isConnected) {
                    return;
                }
                const character = card.querySelector('.characterName')?.textContent?.trim();
                const date = card.querySelector('.chatDate')?.textContent?.trim();
                meta.textContent = [character, date].filter(Boolean).join('  ');
                content.textContent = getPreviewText(message).trim();
                content.scrollTop = 0;
                if (!applyPreviewLayout()) {
                    return;
                }
                updatePreviewProgress();
                popover.classList.add('is-visible');
                popover.setAttribute('aria-hidden', 'false');
            }, 320);
        };
        const scheduleHide = () => {
            clearTimer('showTimer');
            clearTimer('hideTimer');
            controller.hideTimer = window.setTimeout(hidePreview, 220);
        };
        const onPointerOver = (event) => {
            const target = event.target instanceof Element ? event.target : null;
            const card = target?.closest('.recentChat');
            if (!card || card.parentElement !== list || target?.closest('button, a, input, .recentChatPinned')) {
                return;
            }
            const message = card.querySelector('.chatMessage');
            if (message instanceof HTMLElement) {
                showPreview(card, message);
            }
        };
        const onPointerOut = (event) => {
            const card = event.target instanceof Element ? event.target.closest('.recentChat') : null;
            if (card && card === controller.activeCard && !card.contains(event.relatedTarget)) {
                scheduleHide();
            }
        };
        const onPopoverEnter = () => clearTimer('hideTimer');
        const onRecentChatSelect = (event) => {
            const target = event.target instanceof Element ? event.target : null;
            const card = target?.closest('.recentChat');
            if (!card || card.parentElement !== list || target?.closest('button, a, input, .recentChatPinned')) {
                return;
            }
            // A selected record leaves the welcome page. Dispose the body-level preview before navigation starts.
            destroyPreview();
        };
        const titleObserver = new MutationObserver(suppressNativePreviews);
        const chat = document.querySelector('#chat');
        const resizeObserver = typeof ResizeObserver === 'function'
            ? new ResizeObserver(scheduleLayout)
            : null;

        list.addEventListener('pointerover', onPointerOver);
        list.addEventListener('pointerout', onPointerOut);
        list.addEventListener('click', onRecentChatSelect, true);
        list.addEventListener('scroll', hidePreview, { passive: true });
        popover.addEventListener('pointerenter', onPopoverEnter);
        popover.addEventListener('pointerleave', scheduleHide);
        content.addEventListener('scroll', updatePreviewProgress, { passive: true });
        window.addEventListener('resize', scheduleLayout, { passive: true });
        if (chat instanceof HTMLElement) {
            resizeObserver?.observe(chat);
        }
        titleObserver.observe(list, { childList: true, subtree: true });
        suppressNativePreviews();

        const destroyPreview = () => {
            clearTimer('showTimer');
            clearTimer('hideTimer');
            if (controller.layoutFrame !== null) {
                cancelAnimationFrame(controller.layoutFrame);
            }
            titleObserver.disconnect();
            resizeObserver?.disconnect();
            list.removeEventListener('pointerover', onPointerOver);
            list.removeEventListener('pointerout', onPointerOut);
            list.removeEventListener('click', onRecentChatSelect, true);
            list.removeEventListener('scroll', hidePreview);
            popover.removeEventListener('pointerenter', onPopoverEnter);
            popover.removeEventListener('pointerleave', scheduleHide);
            content.removeEventListener('scroll', updatePreviewProgress);
            window.removeEventListener('resize', scheduleLayout);
            finishHide();
            if (list.__xyRecentPreviewController === controller) {
                delete list.__xyRecentPreviewController;
            }
            if (popover.__xyRecentPreviewDestroy === destroyPreview) {
                delete popover.__xyRecentPreviewDestroy;
            }
        };
        popover.__xyRecentPreviewDestroy = destroyPreview;
    }

    function ensureWelcomeInteractionEffects(panel) {
        const list = panel.querySelector('.welcomeRecent .recentChatList');
        const cards = list ? [...list.querySelectorAll(':scope > .recentChat')] : [];
        const heroActions = [...panel.querySelectorAll('#xy-home-hero .welcomeShortcuts > .menu_button')]
            .filter((button) => button instanceof HTMLElement);
        const headerActions = [...panel.querySelectorAll('.welcomeHeaderTitle .mes_button')]
            .filter((button) => button instanceof HTMLElement);
        const recentActions = cards.flatMap((card) => [...card.querySelectorAll('.chatActions .menu_button')])
            .filter((button) => button instanceof HTMLElement);
        const actions = [...heroActions, ...headerActions, ...recentActions];
        if (!(list instanceof HTMLElement) || cards.length === 0) {
            return;
        }

        const existing = panel.__xyWelcomeInteractionEffects;
        const hasSameElements = (current, previous) => current.length === previous.length
            && current.every((element) => previous.includes(element));
        if (existing?.list === list
            && hasSameElements(cards, existing.cards)
            && hasSameElements(actions, existing.actions)) {
            return;
        }
        existing?.destroy();

        heroActions.forEach((action) => action.classList.add('xy-home-action-3d'));
        headerActions.forEach((action) => action.classList.add('xy-home-header-action-3d'));
        recentActions.forEach((action) => action.classList.add('xy-recent-action-3d'));
        cards.forEach((card) => {
            card.classList.add('xy-recent-depth-card', 'xy-recent-depth-muted');
            card.style.opacity = '.48';
        });

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const visibleCards = new Set();
        let activeCard = null;
        let pointer = null;
        let frame = null;
        let gsap = null;
        const cleanup = [];
        const controller = { list, cards, actions, destroy: null, syncPointer: null };

        const getAffectedCards = (next) => new Set([
            ...visibleCards,
            activeCard,
            next,
        ].filter((card) => card instanceof HTMLElement));
        const setActiveCard = (next) => {
            if (!gsap || activeCard === next) {
                return;
            }
            const affected = getAffectedCards(next);
            affected.forEach((card) => {
                const focused = card === next;
                const muted = !focused;
                card.classList.toggle('xy-recent-depth-active', focused);
                card.classList.toggle('xy-recent-depth-muted', muted);
                card.classList.add('xy-recent-depth-animating');
                gsap.killTweensOf(card);
                gsap.to(card, {
                    opacity: focused ? 1 : .48,
                    duration: focused ? .2 : .16,
                    ease: focused ? 'power2.out' : 'power1.out',
                    overwrite: 'auto',
                    onComplete: () => card.classList.remove('xy-recent-depth-animating'),
                });
            });
            activeCard = next;
        };
        const updatePointerCard = () => {
            frame = null;
            if (!pointer) {
                setActiveCard(null);
                return;
            }
            const target = document.elementFromPoint(pointer.x, pointer.y);
            const card = target instanceof Element ? target.closest('.recentChat') : null;
            if (card instanceof HTMLElement && list.contains(card)) {
                setActiveCard(card);
                return;
            }
            const bounds = list.getBoundingClientRect();
            const pointerInsideList = pointer.x >= bounds.left
                && pointer.x <= bounds.right
                && pointer.y >= bounds.top
                && pointer.y <= bounds.bottom;
            if (!pointerInsideList) {
                setActiveCard(null);
            }
        };
        const schedulePointerCard = () => {
            if (frame === null) {
                frame = requestAnimationFrame(updatePointerCard);
            }
        };
        controller.syncPointer = schedulePointerCard;
        const onPointerMove = (event) => {
            pointer = { x: event.clientX, y: event.clientY };
            schedulePointerCard();
        };
        const onPointerLeave = () => {
            pointer = null;
            schedulePointerCard();
        };
        list.addEventListener('pointermove', onPointerMove, { passive: true });
        list.addEventListener('pointerleave', onPointerLeave, { passive: true });
        list.addEventListener('scroll', schedulePointerCard, { passive: true });
        cleanup.push(() => {
            list.removeEventListener('pointermove', onPointerMove);
            list.removeEventListener('pointerleave', onPointerLeave);
            list.removeEventListener('scroll', schedulePointerCard);
        });

        const observer = typeof IntersectionObserver === 'function'
            ? new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        visibleCards.add(entry.target);
                    } else {
                        visibleCards.delete(entry.target);
                    }
                });
            }, { root: list, threshold: .12 })
            : null;
        if (observer) {
            cards.forEach((card) => observer.observe(card));
            cleanup.push(() => observer.disconnect());
        } else {
            cards.slice(0, 6).forEach((card) => visibleCards.add(card));
        }

        if (!reduceMotion) {
            void loadComposerGsap().then((loadedGsap) => {
                if (panel.__xyWelcomeInteractionEffects !== controller) {
                    return;
                }
                gsap = loadedGsap;
                gsap.set(cards, { clearProps: 'transform' });
                actions.forEach((action) => {
                    gsap.set(action, { transformOrigin: '50% 50%', force3D: true });
                    const usesComposerMotion = headerActions.includes(action) || recentActions.includes(action);
                    const settle = (active) => gsap.to(action, active
                        ? usesComposerMotion
                            ? { y: -1.5, scale: 1.045, duration: .18, ease: 'power2.out', overwrite: 'auto' }
                            : { y: -1.5, scale: 1.018, rotationX: -2, duration: .18, ease: 'power2.out', overwrite: 'auto' }
                        : usesComposerMotion
                            ? { y: 0, scale: 1, duration: .2, ease: 'power1.out', overwrite: 'auto' }
                            : { y: 0, scale: 1, rotationX: 0, duration: .2, ease: 'power1.out', overwrite: 'auto' });
                    const onPointerEnter = () => settle(true);
                    const onPointerLeave = () => settle(false);
                    const onFocusIn = () => settle(true);
                    const onFocusOut = (event) => {
                        if (!action.contains(event.relatedTarget)) {
                            settle(false);
                        }
                    };
                    action.addEventListener('pointerenter', onPointerEnter);
                    action.addEventListener('pointerleave', onPointerLeave);
                    action.addEventListener('focusin', onFocusIn);
                    action.addEventListener('focusout', onFocusOut);
                    cleanup.push(() => {
                        action.removeEventListener('pointerenter', onPointerEnter);
                        action.removeEventListener('pointerleave', onPointerLeave);
                        action.removeEventListener('focusin', onFocusIn);
                        action.removeEventListener('focusout', onFocusOut);
                    });
                });
                schedulePointerCard();
            }).catch(() => {});
        }

        controller.destroy = () => {
                if (frame !== null) {
                    cancelAnimationFrame(frame);
                }
                cleanup.forEach((dispose) => dispose());
                gsap?.killTweensOf([...cards, ...actions]);
                cards.forEach((card) => {
                    card.classList.remove('xy-recent-depth-card', 'xy-recent-depth-active', 'xy-recent-depth-muted', 'xy-recent-depth-animating');
                    card.style.removeProperty('transform');
                    card.style.removeProperty('opacity');
                });
                actions.forEach((action) => {
                    action.classList.remove('xy-home-action-3d', 'xy-home-header-action-3d', 'xy-recent-action-3d');
                    action.style.removeProperty('transform');
                });
                delete panel.__xyWelcomeInteractionEffects;
        };
        panel.__xyWelcomeInteractionEffects = controller;
    }

    function ensureWelcomeLogoTilt(panel) {
        const figure = panel.querySelector('#xy-home-hero .xy-home-logo-tilt');
        const inner = figure?.querySelector(':scope > .xy-home-logo-tilt__inner');
        if (!(figure instanceof HTMLElement)
            || !(inner instanceof HTMLElement)) {
            return;
        }

        const existing = panel.__xyWelcomeLogoTilt;
        if (existing?.figure === figure) {
            return;
        }
        existing?.destroy();

        const createSpring = (value, stiffness, damping, mass) => ({
            value,
            target: value,
            velocity: 0,
            stiffness,
            damping,
            mass,
        });
        // These match the supplied TiltedCard component's spring configuration.
        const rotateX = createSpring(0, 100, 30, 2);
        const rotateY = createSpring(0, 100, 30, 2);
        const scale = createSpring(1, 100, 30, 2);
        let lastY = 0;
        let frame = null;
        let lastTimestamp = 0;

        const stepSpring = (spring, seconds) => {
            const acceleration = ((spring.target - spring.value) * spring.stiffness
                - spring.velocity * spring.damping) / spring.mass;
            spring.velocity += acceleration * seconds;
            spring.value += spring.velocity * seconds;
            if (Math.abs(spring.target - spring.value) < .001 && Math.abs(spring.velocity) < .001) {
                spring.value = spring.target;
                spring.velocity = 0;
            }
        };
        const isSettled = (spring) => spring.value === spring.target && spring.velocity === 0;
        const render = (timestamp) => {
            const seconds = Math.min(.05, Math.max(.001, (timestamp - lastTimestamp || 16.667) / 1000));
            lastTimestamp = timestamp;
            [rotateX, rotateY, scale].forEach((spring) => stepSpring(spring, seconds));
            inner.style.transform = `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) scale(${scale.value})`;
            if ([rotateX, rotateY, scale].some((spring) => !isSettled(spring))) {
                frame = requestAnimationFrame(render);
            } else {
                frame = null;
            }
        };
        const requestRender = () => {
            if (frame === null) {
                frame = requestAnimationFrame(render);
            }
        };
        const onPointerMove = (event) => {
            const rect = figure.getBoundingClientRect();
            const offsetX = event.clientX - rect.left - rect.width / 2;
            const offsetY = event.clientY - rect.top - rect.height / 2;
            rotateX.target = (offsetY / (rect.height / 2)) * -14;
            rotateY.target = (offsetX / (rect.width / 2)) * 14;
            const velocityY = offsetY - lastY;
            lastY = offsetY;
            requestRender();
        };
        const onPointerEnter = () => {
            scale.target = 1.3;
            requestRender();
        };
        const onPointerLeave = () => {
            scale.target = 1;
            rotateX.target = 0;
            rotateY.target = 0;
            requestRender();
        };
        figure.addEventListener('pointermove', onPointerMove, { passive: true });
        figure.addEventListener('pointerenter', onPointerEnter, { passive: true });
        figure.addEventListener('pointerleave', onPointerLeave, { passive: true });
        panel.__xyWelcomeLogoTilt = {
            figure,
            destroy() {
                if (frame !== null) {
                    cancelAnimationFrame(frame);
                }
                figure.removeEventListener('pointermove', onPointerMove);
                figure.removeEventListener('pointerenter', onPointerEnter);
                figure.removeEventListener('pointerleave', onPointerLeave);
                inner.style.removeProperty('transform');
                delete panel.__xyWelcomeLogoTilt;
            },
        };
    }

    function ensureWelcomeRecentSearch(panel, header, recent) {
        let search = header.querySelector(':scope > .xy-recent-search');
        if (!search) {
            search = document.createElement('div');
            search.className = 'xy-recent-search';
            search.innerHTML = `
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <input class="xy-recent-search-input" type="search" placeholder="寻卷问迹 旧卷皆循" aria-label="搜索聊天记录">
            `;
            header.append(search);

            let filterFrame = null;
            const scheduleFilter = () => {
                if (filterFrame !== null) {
                    cancelAnimationFrame(filterFrame);
                }
                filterFrame = requestAnimationFrame(() => {
                    filterFrame = null;
                    filterWelcomeRecentChats(panel);
                });
            };

            search.addEventListener('click', event => event.stopPropagation());
            search.querySelector('.xy-recent-search-input')?.addEventListener('input', scheduleFilter);
            search.querySelector('.xy-recent-search-input')?.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape' || !(event.currentTarget instanceof HTMLInputElement)) {
                    return;
                }
                event.currentTarget.value = '';
                scheduleFilter();
            });
        }

        search.querySelector('.xy-recent-search-modes')?.remove();
        search.removeAttribute('data-mode');
        const searchInput = search.querySelector('.xy-recent-search-input');
        if (searchInput instanceof HTMLInputElement) {
            searchInput.placeholder = '寻卷问迹 旧卷皆循';
        }

        const list = recent.querySelector('.recentChatList');
        ensureWelcomeRecentWindow(list);
        ensureWelcomeRecentPreview(list);
        if (list && !list.querySelector(':scope > .xy-recent-search-empty')) {
            const empty = document.createElement('div');
            empty.className = 'xy-recent-search-empty';
            empty.hidden = true;
            empty.textContent = '未找到匹配的聊天记录';
            list.append(empty);
        }
        list?.querySelectorAll(':scope > .recentChat .xy-recent-depth-layer').forEach((layer) => layer.remove());
        list?.querySelectorAll(':scope > .recentChat[data-xy-depth-state]').forEach((card) => card.removeAttribute('data-xy-depth-state'));

    }

    function enforceThemePresentation() {
        const body = document.body;
        if (!body) {
            return;
        }

        const context = globalThis.SillyTavern?.getContext?.();
        const settings = context?.powerUserSettings;
        let settingsChanged = false;

        if (settings && settings.chat_display !== 1) {
            settings.chat_display = 1;
            settingsChanged = true;
        }
        if (settings && settings.avatar_style !== 0) {
            settings.avatar_style = 0;
            settingsChanged = true;
        }

        setClassState(body, 'bubblechat', true);
        ['documentstyle', 'big-avatars', 'square-avatars', 'rounded-avatars']
            .forEach((className) => setClassState(body, className, false));
        const chatDisplay = document.querySelector('#chat_display');
        const avatarStyle = document.querySelector('#avatar_style');
        if (chatDisplay instanceof HTMLSelectElement) {
            chatDisplay.value = '1';
        }
        if (avatarStyle instanceof HTMLSelectElement) {
            avatarStyle.value = '0';
        }

        if (settingsChanged) {
            context.saveSettingsDebounced?.();
        }
    }

    function applyThemeDisplayDefaults() {
        if (themeDisplayDefaultsApplied) {
            return true;
        }

        const context = globalThis.SillyTavern?.getContext?.();
        const settings = context?.powerUserSettings;
        const controls = THEME_DISPLAY_DEFAULTS.map(({ controlId }) => document.getElementById(controlId));
        if (!settings || controls.some((control) => !(control instanceof HTMLInputElement))) {
            return false;
        }

        const body = document.body;
        let settingsChanged = false;
        THEME_DISPLAY_DEFAULTS.forEach((setting, index) => {
            const control = controls[index];
            const requiresUpdate = settings[setting.settingKey] !== setting.value || control.checked !== setting.value;
            settingsChanged ||= settings[setting.settingKey] !== setting.value;
            settings[setting.settingKey] = setting.value;
            control.checked = setting.value;
            setClassState(body, setting.bodyClass, setting.classWhenEnabled ? setting.value : !setting.value);
            if (requiresUpdate) {
                control.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        if (settingsChanged) {
            context.saveSettingsDebounced?.();
        }
        themeDisplayDefaultsApplied = true;
        return true;
    }

    function setClassState(element, className, enabled) {
        if (!element || element.classList.contains(className) === enabled) {
            return;
        }
        element.classList.toggle(className, enabled);
    }

    function getThemePanels() {
        if (!themePanels || themePanels.some((panel) => !panel.isConnected)) {
            themePanels = [...document.querySelectorAll(PANEL_SELECTOR)];
        }
        return themePanels;
    }

    function scheduleFocusSync(enforcePresentation = false) {
        focusSyncNeedsPresentation ||= enforcePresentation;
        if (focusSyncFrame !== null) {
            return;
        }
        focusSyncFrame = requestAnimationFrame(() => {
            focusSyncFrame = null;
            if (focusSyncNeedsPresentation) {
                enforceThemePresentation();
            }
            focusSyncNeedsPresentation = false;
            rememberAiPanel();
            saveAiPanelIfChanged();
            syncFocusMode();
        });
    }

    function isHomePixelSnowEnabled() {
        try {
            return localStorage.getItem(HOME_PIXEL_SNOW_ENABLED_KEY) !== 'false';
        } catch {
            return true;
        }
    }

    function setHomePixelSnowEnabled(enabled) {
        try {
            localStorage.setItem(HOME_PIXEL_SNOW_ENABLED_KEY, String(Boolean(enabled)));
        } catch {
            // Private browsing can deny local storage without preventing the current visual state.
        }
        syncHomePixelSnow();
    }

    function destroyHomePixelSnow(canvas = document.querySelector('#bg1 > .xy-home-pixel-snow')) {
        homePixelSnowRenderer?.destroy?.();
        homePixelSnowRenderer = null;
        canvas?.remove();
    }

    function syncHomePixelSnow() {
        const background = document.querySelector('#bg1');
        const enabled = isHomePixelSnowEnabled();
        document.body.classList.toggle('xy-home-pixel-snow-enabled', enabled);
        const existing = background?.querySelector(':scope > .xy-home-pixel-snow');
        if (!(background instanceof HTMLElement) || !enabled) {
            destroyHomePixelSnow(existing);
            return;
        }
        if (homePixelSnowRenderer || existing?.dataset.xyPixelSnowLoading === 'true') {
            return;
        }

        const canvas = existing || document.createElement('canvas');
        canvas.className = 'xy-home-pixel-snow';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.dataset.xyPixelSnowLoading = 'true';
        if (!canvas.isConnected) {
            background.append(canvas);
        }

        import(ASSETS.pixelSnow)
            .then(({ createPixelSnow }) => {
                if (!canvas.isConnected || !isHomePixelSnowEnabled() || canvas.parentElement !== background) {
                    canvas.remove();
                    return;
                }
                homePixelSnowRenderer = createPixelSnow(canvas, HOME_PIXEL_SNOW_OPTIONS);
                delete canvas.dataset.xyPixelSnowLoading;
            })
            .catch((error) => {
                console.warn('Could not initialize home pixel snow.', error);
                canvas.remove();
            });
    }

    function ensureWelcomeHome() {
        const panel = document.querySelector('#chat > .welcomePanel');
        if (!panel) {
            return;
        }
        if (activeWelcomePanel && activeWelcomePanel !== panel) {
            activeWelcomePanel.__xyWelcomeInteractionEffects?.destroy();
            activeWelcomePanel.__xyWelcomeLogoTilt?.destroy();
            document.getElementById('xy-recent-chat-preview')?.__xyRecentPreviewDestroy?.();
        }
        activeWelcomePanel = panel;

        const existingRecentHost = document.querySelector('#chat > .mes[type="assistant_message"] .xy-home-guide-recent');
        const header = panel.querySelector('.welcomeHeader')
            || existingRecentHost?.querySelector(':scope > .welcomeHeader');
        const recent = panel.querySelector('.welcomeRecent')
            || existingRecentHost?.querySelector(':scope > .welcomeRecent');
        if (!header || !recent) {
            return;
        }

        header.querySelector(':scope > button.showMoreChats')?.remove();

        const recentModule = panel.querySelector(':scope > .xy-recent-module');
        if (recentModule) {
            panel.insertBefore(header, recentModule);
            panel.insertBefore(recent, recentModule);
            recentModule.remove();
        }

        ensureWelcomeRecentSearch(panel, header, recent);

        let hero = panel.querySelector('#xy-home-hero');
        if (!hero) {
            hero = document.createElement('section');
            hero.id = 'xy-home-hero';
            hero.innerHTML = `
                <div class="xy-home-hero-copy"></div>
                <div class="xy-home-hero-actions"></div>
            `;
            panel.insertBefore(hero, header.parentElement === panel ? header : null);
        }

        if (hero.dataset.xyContentVersion !== WELCOME_HOME_VERSION) {
            hero.querySelector('.xy-home-hero-copy').innerHTML = `
                <figure class="xy-home-hero-titlegroup xy-home-logo-tilt">
                    <div class="xy-home-logo-tilt__inner">
                        <img class="xy-home-hero-logo" src="${ASSETS.homeLogo}" alt="玄尘渡">
                    </div>
                </figure>
            `;
            hero.dataset.xyContentVersion = WELCOME_HOME_VERSION;
        }
        panel.querySelector('.xy-home-hero-reserve')?.remove();
        ensureWelcomeLogoTilt(panel);

        let shortcutHost = hero.querySelector(':scope > .xy-home-hero-actions')
            || panel.querySelector(':scope > .xy-home-hero-actions');
        if (!shortcutHost) {
            shortcutHost = document.createElement('div');
            shortcutHost.className = 'xy-home-hero-actions';
        }
        if (shortcutHost.parentElement !== hero) {
            hero.append(shortcutHost);
        }
        const shortcuts = panel.querySelector('.welcomeShortcuts');
        if (shortcutHost && shortcuts && shortcuts.parentElement !== shortcutHost) {
            shortcutHost.append(shortcuts);
        }
        shortcuts?.querySelector('.openTemporaryChat')?.classList.add('xy-temporary-chat-action');

        const recentAlreadyPlaced = header.parentElement === panel
            && recent.parentElement === panel;
        if (!recentAlreadyPlaced) {
            panel.append(header, recent);
        }

        const assistantText = document.querySelector('#chat > .mes[type="assistant_message"] .mes_text');
        if (assistantText) {
            let guide = assistantText.querySelector('.xy-home-guide');
            if (!guide) {
                guide = document.createElement('section');
                guide.className = 'xy-home-guide';
                assistantText.replaceChildren(guide);
            }
            if (guide.dataset.xyContentVersion !== WELCOME_HOME_VERSION) {
                guide.innerHTML = `
                    <p class="xy-home-section-mark">入卷引</p>
                    <h3>故卷可续，仙途可启。</h3>
                    <p>择近来一卷重返故地，或循启行引另开前路。</p>
                `;
                guide.dataset.xyContentVersion = WELCOME_HOME_VERSION;
            }
        }

        const promptText = document.querySelector('#chat > .mes[type="welcome_prompt"] .mes_text');
        const actionList = promptText?.querySelector(':scope > .custom-flex-container, :scope > .flex-container');
        if (promptText && actionList) {
            let heading = promptText.querySelector('.xy-home-actions-heading');
            if (!heading) {
                heading = document.createElement('div');
                heading.className = 'xy-home-actions-heading';
                promptText.insertBefore(heading, actionList);
            }
            if (heading.dataset.xyContentVersion !== WELCOME_HOME_VERSION) {
                heading.innerHTML = '<p class="xy-home-section-mark">启行引</p><span>携卷启行，再渡尘寰</span>';
                heading.dataset.xyContentVersion = WELCOME_HOME_VERSION;
            }
        }
        ensureWelcomeInteractionEffects(panel);
    }

    function scheduleWelcomeHome() {
        if (welcomeHomeFrame !== null) {
            return;
        }
        welcomeHomeFrame = requestAnimationFrame(() => {
            welcomeHomeFrame = null;
            ensureWelcomeHome();
            welcomeObserver?.takeRecords();
        });
    }

    function resizeWorldbookReaderContent() {
        const textarea = document.querySelector('#xy-worldbook-reader textarea[name="content"]');
        if (!textarea) {
            return;
        }
        textarea.style.removeProperty('height');
        textarea.style.removeProperty('overflow-y');
    }

    function scheduleWorldbookReaderResize() {
        if (worldbookResizeFrame !== null) {
            return;
        }
        worldbookResizeFrame = requestAnimationFrame(() => {
            worldbookResizeFrame = null;
            resizeWorldbookReaderContent();
        });
    }

    function classifyWorldbookEditor(entry) {
        const editor = entry?.querySelector('.world_entry_edit');
        if (!editor || editor.dataset.xyWorldbookClassified === 'true') {
            return;
        }

        editor.querySelector('[name="keywordsAndLogicBlock"]')?.classList.add('xy-wi-keyword-rules');
        const overrides = editor.querySelector('[name="perEntryOverridesBlock"]');
        overrides?.classList.add('xy-wi-entry-overrides');
        overrides?.querySelectorAll(':scope > .world_entry_form_control').forEach((control) => {
            control.classList.toggle('xy-wi-override-outlet', Boolean(control.querySelector('input[name="outletName"]')));
            control.classList.toggle('xy-wi-override-automation', Boolean(control.querySelector('input[name="automationId"]')));
            control.classList.toggle('xy-wi-override-delay', Boolean(control.querySelector('input[name="delayUntilRecursionLevel"]')));
        });

        [...editor.children].forEach((section) => {
            section.classList.toggle('xy-wi-timing-row', Boolean(section.querySelector(':scope input[name="group"]')));
            section.classList.toggle('xy-wi-filter-row', Boolean(section.querySelector(':scope select[name="characterFilter"]')));
            section.classList.toggle('xy-wi-matching-sources', Boolean(section.querySelector(':scope input[name="matchCharacterDescription"]')));
        });

        editor.querySelectorAll('.xy-wi-filter-row > *').forEach((control) => {
            control.classList.toggle('xy-wi-filter-triggers', Boolean(control.querySelector('select[name="triggers"]')));
        });
        editor.querySelectorAll(':is(.xy-wi-timing-row, .xy-wi-filter-row) :is(label, .checkbox_label)').forEach((label) => {
            label.classList.toggle('xy-wi-title-checkbox', Boolean(label.querySelector('input[type="checkbox"]')));
            label.classList.toggle('xy-wi-invisible-toggle', Boolean(label.querySelector('input[name="__invisible"]')));
        });
        editor.dataset.xyWorldbookClassified = 'true';
    }

    function emitWorldbookField(source, value, eventName = 'input') {
        if (!source) {
            return;
        }
        source.value = value;
        source.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    function restoreWorldbookReaderSections(reader) {
        reader.querySelectorAll('[data-xy-worldbook-section]').forEach((section) => {
            const home = section.__xyWorldbookHome;
            const next = section.__xyWorldbookNextSibling;
            if (home instanceof Element) {
                if (next instanceof Node && next.parentNode === home) {
                    home.insertBefore(section, next);
                } else {
                    home.append(section);
                }
            }
            section.removeAttribute('data-xy-worldbook-section');
            delete section.__xyWorldbookHome;
            delete section.__xyWorldbookNextSibling;
        });
    }

    function getSelectedWorldbookName() {
        const select = document.querySelector('#world_editor_select');
        const worldName = select?.selectedOptions?.[0]?.textContent?.trim();
        return select?.value && worldName ? worldName : null;
    }

    function isWorldbookMemoryEnabled() {
        try {
            return localStorage.getItem(WORLDBOOK_MEMORY_ENABLED_KEY) === 'true';
        } catch {
            return false;
        }
    }

    function setWorldbookMemoryEnabled(enabled) {
        try {
            const active = Boolean(enabled);
            localStorage.setItem(WORLDBOOK_MEMORY_ENABLED_KEY, String(active));
            if (!active) {
                localStorage.removeItem(WORLDBOOK_MEMORY_KEY);
            }
        } catch {
            // The switch remains usable for the current page if local storage is unavailable.
        }
    }

    function rememberWorldbookSelection() {
        if (!isWorldbookMemoryEnabled()) {
            return;
        }
        const select = document.querySelector('#world_editor_select');
        if (!select) {
            return;
        }
        const worldName = getSelectedWorldbookName();
        if (!worldName) {
            localStorage.removeItem(WORLDBOOK_MEMORY_KEY);
            return;
        }
        localStorage.setItem(WORLDBOOK_MEMORY_KEY, JSON.stringify({ worldName }));
    }

    function rememberWorldbookEntry(entry) {
        if (!isWorldbookMemoryEnabled()) {
            return;
        }
        const worldName = getSelectedWorldbookName();
        const uid = entry?.getAttribute('uid') || entry?.dataset.uid;
        if (!worldName || uid === undefined || uid === null || uid === '') {
            return;
        }
        localStorage.setItem(WORLDBOOK_MEMORY_KEY, JSON.stringify({ worldName, uid: String(uid) }));
    }

    function readWorldbookMemory() {
        if (!isWorldbookMemoryEnabled()) {
            return null;
        }
        try {
            const value = JSON.parse(localStorage.getItem(WORLDBOOK_MEMORY_KEY) || 'null');
            if (typeof value?.worldName !== 'string' || !value.worldName) {
                return null;
            }
            return typeof value.uid === 'string' && value.uid ? value : { worldName: value.worldName };
        } catch {
            return null;
        }
    }

    function persistActiveWorldbookMemory() {
        if (!isWorldbookMemoryEnabled()) {
            return;
        }
        if (activeWorldbookEntry) {
            rememberWorldbookEntry(activeWorldbookEntry);
        } else {
            rememberWorldbookSelection();
        }
    }

    function restoreRememberedWorldbookEntry(uid, attempts = 24) {
        const entry = [...document.querySelectorAll('#world_popup_entries_list .world_entry')]
            .find((item) => String(item.getAttribute('uid') || item.dataset.uid) === uid);
        if (entry) {
            setWorldbookEntryExpanded(entry, true);
            classifyWorldbookEditor(entry);
            renderWorldbookReader(entry);
            return;
        }
        if (attempts > 0) {
            requestAnimationFrame(() => restoreRememberedWorldbookEntry(uid, attempts - 1));
        }
    }

    async function restoreWorldbookMemory() {
        if (!isWorldbookMemoryEnabled()
            || !document.body.classList.contains('xy-worldbook-mode')
            || worldbookMemoryRestoreAttempted
            || worldbookRestoreInFlight) {
            return;
        }
        worldbookMemoryRestoreAttempted = true;
        const memory = readWorldbookMemory();
        const select = document.querySelector('#world_editor_select');
        if (!memory || !select) {
            return;
        }
        const option = [...select.options].find((item) => item.textContent.trim() === memory.worldName);
        if (!option) {
            return;
        }

        worldbookRestoreInFlight = true;
        try {
            const worldInfo = await import('/scripts/world-info.js');
            select.value = option.value;
            // 原生值已恢复，但 Select2 不会自动刷新已选文本。
            window.$?.(select).trigger('change.select2');
            await worldInfo.showWorldEditor(memory.worldName);

            if (!memory.uid) {
                return;
            }

            const data = await worldInfo.loadWorldInfo(memory.worldName);
            const entries = Object.values(data?.entries || {}).filter((entry) => entry && typeof entry === 'object')
                .map((entry) => ({ ...entry, displayIndex: entry.displayIndex ?? entry.uid }));
            const sortedEntries = worldInfo.sortWorldInfoEntries(entries);
            const entryIndex = sortedEntries.findIndex((entry) => String(entry.uid) === memory.uid);
            const perPage = Number(document.querySelector('#world_info_pagination select')?.value) || 25;
            const page = entryIndex >= 0 ? Math.floor(entryIndex / perPage) + 1 : 1;
            if (page > 1 && typeof window.$ === 'function') {
                window.$('#world_info_pagination').pagination('go', page);
            }
            restoreRememberedWorldbookEntry(memory.uid);
        } catch {
            // The native world editor remains available if its module is not ready yet.
        } finally {
            worldbookRestoreInFlight = false;
        }
    }

    function settleWorldbookEntryToggle(entry) {
        const drawerContent = entry?.querySelector(':scope > .world_entry_form > .inline-drawer > .inline-drawer-content');
        if (!drawerContent || typeof window.$ !== 'function') {
            return;
        }

        // Let the native handler initialize the editor, then skip its height animation.
        window.$(drawerContent).stop(true, true);
    }

    function setWorldbookEntryExpanded(entry, expanded) {
        const toggle = entry?.querySelector(':scope > .world_entry_form > .inline-drawer > .inline-drawer-header .inline-drawer-toggle');
        if (!toggle || toggle.classList.contains(expanded ? 'up' : 'down')) {
            return false;
        }

        worldbookToggleSyncing = true;
        try {
            toggle.click();
            settleWorldbookEntryToggle(entry);
        } finally {
            worldbookToggleSyncing = false;
        }
        return true;
    }

    function toggleWorldbookEntrySelection(entry) {
        if (activeWorldbookEntry === entry) {
            renderWorldbookReader();
            rememberWorldbookSelection();
            setWorldbookEntryExpanded(entry, false);
            return;
        }

        if (activeWorldbookEntry) {
            const previous = activeWorldbookEntry;
            renderWorldbookReader();
            setWorldbookEntryExpanded(previous, false);
        }
        setWorldbookEntryExpanded(entry, true);
        classifyWorldbookEditor(entry);
        renderWorldbookReader(entry);
    }

    function navigateWorldbookEntry(offset) {
        const entries = [...document.querySelectorAll('#world_popup_entries_list .world_entry')];
        const currentIndex = entries.indexOf(activeWorldbookEntry);
        const nextEntry = entries[currentIndex + offset];
        if (!nextEntry) {
            return false;
        }

        const previousEntry = activeWorldbookEntry;
        if (previousEntry && previousEntry !== nextEntry) {
            setWorldbookEntryExpanded(previousEntry, false);
        }
        setWorldbookEntryExpanded(nextEntry, true);
        classifyWorldbookEditor(nextEntry);
        renderWorldbookReader(nextEntry);
        requestAnimationFrame(() => {
            document.querySelector('#xy-worldbook-reader textarea[name="content"]')?.focus();
        });
        return true;
    }

    function renderWorldbookReader(entry = null) {
        const reader = document.querySelector('#xy-worldbook-reader');
        if (!reader) {
            return;
        }

        restoreWorldbookReaderSections(reader);

        document.querySelectorAll('#world_popup_entries_list .world_entry.xy-wi-entry--selected')
            .forEach((item) => item.classList.remove('xy-wi-entry--selected'));
        activeWorldbookEntry = entry;

        if (!entry) {
            reader.classList.add('xy-wi-reader--empty');
            reader.innerHTML = [
                '<div class="xy-wi-reader__bar">',
                '<span class="xy-wi-reader__eyebrow">条目阅读</span>',
                '<span class="xy-wi-reader__shortcut">编辑后　可使用 Alt 加 W S 快速切换条目</span>',
                '</div>',
                '<p class="xy-wi-reader__empty-copy">选择一条目　即可在此阅览及修改正文</p>',
            ].join('');
            return;
        }

        rememberWorldbookEntry(entry);
        entry.classList.add('xy-wi-entry--selected');
        reader.classList.remove('xy-wi-reader--empty');
        classifyWorldbookEditor(entry);

        const titleSource = entry.querySelector('textarea[name="comment"]');
        const contentBlock = entry.querySelector('[name="contentAndCharFilterBlock"]');
        const recursionOptions = contentBlock?.querySelector('label > small:not(.displayNone) > .flex-container > div.flex-container');
        const title = String(titleSource?.value || '').trim() || '未命名';

        if (recursionOptions) {
            const leftSettings = entry.querySelector('.world_entry_edit > .flex-container:first-child');
            let recursionHost = leftSettings?.querySelector(':scope > .xy-wi-left-recursion');
            if (leftSettings && !recursionHost) {
                recursionHost = document.createElement('div');
                recursionHost.className = 'xy-wi-left-recursion';
                leftSettings.append(recursionHost);
            }
            recursionHost?.append(recursionOptions);
        }

        reader.innerHTML = [
            '<div class="xy-wi-reader__bar">',
            '<span class="xy-wi-reader__eyebrow">条目阅读</span>',
            '<span class="xy-wi-reader__shortcut">编辑后　可使用 Alt 加 W S 快速切换条目</span>',
            '<div class="xy-wi-reader__actions">',
            '<button type="button" class="xy-wi-reader__close-button">收起</button>',
            '</div>',
            '</div>',
            '<h4 class="xy-wi-reader__title"></h4>',
            '<div class="xy-wi-reader__sections"></div>',
        ].join('');

        reader.querySelector('.xy-wi-reader__title').textContent = title;
        const sections = reader.querySelector('.xy-wi-reader__sections');
        [contentBlock].filter(Boolean).forEach((section) => {
            section.__xyWorldbookHome = section.parentElement;
            section.__xyWorldbookNextSibling = section.nextSibling;
            section.dataset.xyWorldbookSection = 'content';
            sections.append(section);
        });
        requestAnimationFrame(resizeWorldbookReaderContent);

        reader.querySelector('.xy-wi-reader__close-button').addEventListener('click', () => {
            renderWorldbookReader();
            rememberWorldbookSelection();
            setWorldbookEntryExpanded(entry, false);
        });
    }

    function fitWorldbookHeaderLabels(header) {
        const labels = [...header.querySelectorAll(':scope > small')];
        const signature = `${header.clientWidth}\u0001${labels.map((label) => label.textContent).join('\u0001')}`;
        if (header.dataset.xyWorldbookHeaderFit === signature) {
            return;
        }
        let size = 12;
        while (size > 9) {
            header.style.setProperty('--xy-wi-header-size', `${size}px`);
            if (labels.every((label) => label.scrollWidth <= label.clientWidth)) {
                break;
            }
            size -= 1;
        }
        header.dataset.xyWorldbookHeaderFit = signature;
    }

    function fitWorldbookStrategySelect() {
        const select = document.querySelector('#WorldInfo #world_info_character_strategy');
        if (!select || !select.options.length) {
            return;
        }

        select.closest('#wiSliders > .flex-container')?.classList.add('xy-wi-strategy-row');

        const styles = window.getComputedStyle(select);
        const signature = [
            styles.fontWeight,
            styles.fontSize,
            styles.fontFamily,
            ...[...select.options].map((option) => option.textContent.trim()),
        ].join('\u0001');
        if (select.dataset.xyStrategyFitSignature === signature) {
            return;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
        const longestOption = Math.max(...[...select.options]
            .map((option) => context.measureText(option.textContent.trim()).width));
        const width = Math.ceil(longestOption + 44);
        select.style.inlineSize = `${width}px`;
        select.style.minInlineSize = `${width}px`;
        select.dataset.xyStrategyFitSignature = signature;
    }

    function syncBottomWorldbookPagination() {
        const source = document.querySelector('#world_info_pagination');
        const target = document.querySelector('#xy-wi-bottom-pagination');
        if (!source || !target) {
            return;
        }
        const markup = source.innerHTML;
        if (target.dataset.xyPaginationMarkup === markup) {
            return;
        }
        target.innerHTML = markup;
        target.dataset.xyPaginationMarkup = markup;
    }

    function placeWorldbookTopPagination() {
        const source = document.querySelector('#world_info_pagination');
        const activationSettings = document.querySelector('#wiActivationSettings');
        const header = activationSettings?.closest('.inline-drawer')?.querySelector(':scope > .inline-drawer-header');
        if (!source || !header) {
            return;
        }

        let holder = header.querySelector(':scope > #xy-wi-top-pagination');
        if (!holder) {
            holder = document.createElement('div');
            holder.id = 'xy-wi-top-pagination';
            holder.setAttribute('aria-label', '世界书分页');
            const stopHeaderToggle = (event) => event.stopPropagation();
            holder.addEventListener('pointerdown', stopHeaderToggle);
            holder.addEventListener('click', stopHeaderToggle);
            holder.addEventListener('change', stopHeaderToggle);
            header.append(holder);
        }
        holder.append(source);
    }

    function returnWorldbookToTop() {
        requestAnimationFrame(() => {
            const panel = document.querySelector('#WorldInfo');
            if (!panel) {
                return;
            }
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            panel.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
    }

    function ensureWorldbookWorkspace() {
        const popup = document.querySelector('#WorldInfo #world_popup');
        const list = popup?.querySelector('#world_popup_entries_list');
        if (!popup || !list) {
            return;
        }

        let workspace = popup.querySelector(':scope > .xy-wi-workspace');
        if (!workspace) {
            workspace = document.createElement('div');
            workspace.className = 'xy-wi-workspace';
            popup.append(workspace);
        }

        let leftColumn = workspace.querySelector(':scope > .xy-wi-workspace__left');
        if (!leftColumn) {
            leftColumn = document.createElement('section');
            leftColumn.className = 'xy-wi-workspace__left';
            leftColumn.setAttribute('aria-label', '世界书条目工作区');
            workspace.prepend(leftColumn);
        }

        // Native toolbar rows remain intact, but belong to the entry workspace instead of spanning the reader.
        const toolbarRows = [...popup.querySelectorAll(':scope > .flex-container')];
        leftColumn.append(...toolbarRows);
        leftColumn.append(list);

        let reader = workspace.querySelector('#xy-worldbook-reader');
        if (!reader) {
            reader = document.createElement('aside');
            reader.id = 'xy-worldbook-reader';
            reader.setAttribute('aria-label', '世界书条目阅览');
            workspace.append(reader);
            renderWorldbookReader();
        }

        let pagination = popup.querySelector('#xy-wi-bottom-pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.id = 'xy-wi-bottom-pagination';
            pagination.setAttribute('aria-label', '世界书分页');
            pagination.addEventListener('click', (event) => {
                const control = event.target instanceof Element ? event.target.closest('a, button') : null;
                if (!control) {
                    return;
                }
                event.preventDefault();
                const cloneControls = [...pagination.querySelectorAll('a, button')];
                const sourceControls = [...document.querySelectorAll('#world_info_pagination a, #world_info_pagination button')];
                const sourceControl = sourceControls[cloneControls.indexOf(control)];
                if (!sourceControl) {
                    return;
                }
                sourceControl.click();
                returnWorldbookToTop();
            });
            pagination.addEventListener('change', (event) => {
                const control = event.target instanceof HTMLSelectElement ? event.target : null;
                if (!control) {
                    return;
                }
                const cloneControls = [...pagination.querySelectorAll('select')];
                const sourceControls = [...document.querySelectorAll('#world_info_pagination select')];
                const source = sourceControls[cloneControls.indexOf(control)];
                if (source) {
                    source.value = control.value;
                    source.dispatchEvent(new Event('change', { bubbles: true }));
                    returnWorldbookToTop();
                }
            });
        }
        leftColumn.append(pagination);
        placeWorldbookTopPagination();
        syncBottomWorldbookPagination();
        fitWorldbookStrategySelect();
        restoreWorldbookMemory();
    }

    function enhanceWorldbookList() {
        const list = document.querySelector('#world_popup_entries_list');
        if (!list) {
            return;
        }

        ensureWorldbookWorkspace();

        const header = list.querySelector('#WIEntryHeaderTitlesPC');
        if (header && header.dataset.xyWorldbookHeaders !== 'ready') {
            const labels = ['标题（备忘）', '触发策略', '插入位置', '深度', '顺序', '触发概率 %'];
            header.replaceChildren(...labels.map((label) => {
                const item = document.createElement('small');
                item.textContent = label;
                return item;
            }));
            header.dataset.xyWorldbookHeaders = 'ready';
        }
        if (header) {
            fitWorldbookHeaderLabels(header);
        }

        list.querySelectorAll('.world_entry').forEach((entry) => {
            classifyWorldbookEditor(entry);
            entry.querySelector('.xy-wi-content-preview')?.remove();
        });

        if (activeWorldbookEntry && !list.contains(activeWorldbookEntry)) {
            renderWorldbookReader();
        }
        syncBottomWorldbookPagination();
    }

    function scheduleWorldbookEnhancement() {
        if (worldbookEnhanceFrame !== null) {
            return;
        }
        worldbookEnhanceFrame = requestAnimationFrame(() => {
            worldbookEnhanceFrame = null;
            enhanceWorldbookList();
        });
    }

    function bindWorldbookEnhancer() {
        const list = document.querySelector('#world_popup_entries_list');
        if (!list) {
            return false;
        }
        if (worldbookListObserver) {
            return true;
        }

        worldbookListObserver = new MutationObserver(scheduleWorldbookEnhancement);
        worldbookListObserver.observe(list, { childList: true });
        list.addEventListener('input', (event) => {
            if (event.target instanceof HTMLTextAreaElement
                && event.target.matches('textarea[name="comment"]')
                && event.target.closest('.world_entry') === activeWorldbookEntry) {
                const value = event.target.value.trim() || '未命名';
                document.querySelector('#xy-worldbook-reader .xy-wi-reader__title')?.replaceChildren(value);
            }
        });
        list.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target : null;
            const entry = target?.closest('.world_entry');
            if (!entry || target.closest('input, select, textarea, button, a, i, .drag-handle, .killSwitch')) {
                return;
            }

            if (target.closest('.inline-drawer-toggle')) {
                if (worldbookToggleSyncing) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                toggleWorldbookEntrySelection(entry);
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            toggleWorldbookEntrySelection(entry);
        }, true);
        return true;
    }

    function bindWorldbookShortcuts() {
        if (worldbookShortcutBound) {
            return;
        }
        worldbookShortcutBound = true;
    document.addEventListener('keydown', (event) => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target?.closest('#xy-worldbook-reader') || event.isComposing) {
                return;
            }

            const shortcutKey = event.key.toLowerCase();
            const offset = shortcutKey === 'w' ? -1 : shortcutKey === 's' ? 1 : 0;
            if (event.altKey && !event.ctrlKey && !event.shiftKey && offset && navigateWorldbookEntry(offset)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

        });
    }

    window.addEventListener('resize', scheduleWorldbookReaderResize);

    function ensureSearchableSelects() {
        const mount = () => window.XYSearchableSelects?.mount({
            rootSelector: PANEL_SELECTOR,
            minOptions: 10,
        });

        if (window.XYSearchableSelects) {
            mount();
            return;
        }

        if (!searchableSelectsPromise) {
            searchableSelectsPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = ASSETS.searchableSelects;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.append(script);
            });
        }

        searchableSelectsPromise.then(mount).catch(() => {
            // Native selects remain available if the optional enhancement cannot load.
        });
    }

    function applyLocalAssetUrls() {
        const root = document.documentElement;
        root.style.setProperty('--xy-nav-ink-left-url', `url("${ASSETS.navInkLeft}")`);
        root.style.setProperty('--xy-nav-ink-right-url', `url("${ASSETS.navInkRight}")`);
    }

    function ensureNavInk() {
        const holder = document.querySelector('#top-settings-holder');
        if (!holder) {
            return;
        }

        for (const id of ['xy-nav-ink-left', 'xy-nav-ink-right']) {
            if (!document.getElementById(id)) {
                const ornament = document.createElement('i');
                ornament.id = id;
                ornament.setAttribute('aria-hidden', 'true');
                holder.append(ornament);
            }
        }

        document.getElementById('xy-nav-boat-stage')?.remove();
    }

    function resolveCurrentExtensionName() {
        const match = decodeURIComponent(new URL(import.meta.url).pathname)
            .match(/\/scripts\/extensions\/(third-party\/[^/]+)\//);
        return match?.[1] || 'third-party/玄元江湖录-两翼书阁Demo扩展';
    }

    function ensureVesselExitPopover() {
        let popover = document.getElementById('xy-vessel-exit-popover');
        if (popover instanceof HTMLElement && popover.__xyVesselExitPopover) {
            return popover.__xyVesselExitPopover;
        }

        popover = document.createElement('div');
        popover.id = 'xy-vessel-exit-popover';
        popover.className = 'xy-vessel-exit-popover';
        popover.setAttribute('role', 'dialog');
        popover.setAttribute('aria-labelledby', 'xy-vessel-exit-title');
        popover.hidden = true;
        popover.innerHTML = `
            <div class="xy-vessel-exit-popover__content">
                <header class="xy-vessel-exit-popover__header">
                    <i class="fa-solid fa-compass xy-vessel-exit-popover__icon" aria-hidden="true"></i>
                    <h2 id="xy-vessel-exit-title">渡舟枢纽</h2>
                </header>
                <p class="xy-vessel-exit-popover__copy">掌舟行止　常用设定于此收束</p>
                <p class="xy-vessel-exit-popover__status" aria-live="polite"></p>
                <div class="xy-vessel-exit-popover__actions" role="toolbar" aria-label="渡舟功能">
                    <button type="button" class="menu_button_icon xy-vessel-exit-popover__tool xy-vessel-exit-popover__memory" aria-pressed="false" aria-label="世界书记忆">
                        <i class="fa-solid fa-book-bookmark" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="menu_button_icon xy-vessel-exit-popover__tool xy-vessel-exit-popover__confirm" aria-label="停用玄尘渡主题" data-tooltip="停用玄尘渡主题　页面将重新加载">
                        <i class="fa-solid fa-power-off" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="menu_button_icon xy-vessel-exit-popover__tool xy-vessel-exit-popover__snow" aria-pressed="true" aria-label="背景飞雪">
                        <i class="fa-solid fa-snowflake" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="menu_button_icon xy-vessel-exit-popover__tool xy-vessel-exit-popover__presentation" aria-pressed="true" aria-label="消息标记注入">
                        <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
                    </button>
                </div>
            </div>`;
        document.body.append(popover);

        const status = popover.querySelector('.xy-vessel-exit-popover__status');
        const confirm = popover.querySelector('.xy-vessel-exit-popover__confirm');
        const memory = popover.querySelector('.xy-vessel-exit-popover__memory');
        const snow = popover.querySelector('.xy-vessel-exit-popover__snow');
        const presentation = popover.querySelector('.xy-vessel-exit-popover__presentation');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const controller = {
            popover,
            status,
            confirm,
            memory,
            presentation,
            timeline: null,
            sequence: 0,
            open: false,
            place: null,
            close: null,
        };

        controller.syncMemoryButton = () => {
            if (!(memory instanceof HTMLButtonElement)) {
                return;
            }
            const enabled = isWorldbookMemoryEnabled();
            const tooltip = enabled
                ? '世界书记忆已开启　下次进入世界书时恢复上次浏览的位置'
                : '世界书记忆已关闭　使用酒馆默认行为';
            memory.setAttribute('aria-pressed', String(enabled));
            memory.dataset.tooltip = tooltip;
            memory.removeAttribute('title');
        };
        controller.syncMemoryButton();
        controller.syncSnowButton = () => {
            if (!(snow instanceof HTMLButtonElement)) {
                return;
            }
            const enabled = isHomePixelSnowEnabled();
            snow.setAttribute('aria-pressed', String(enabled));
            snow.dataset.tooltip = enabled
                ? '背景飞雪已开启　酒馆背景图将落下像素雪'
                : '背景飞雪已关闭　点击重新开启';
            snow.removeAttribute('title');
        };
        controller.syncSnowButton();
        controller.syncPresentationButton = () => {
            if (!(presentation instanceof HTMLButtonElement)) {
                return;
            }
            const enabled = isMessagePresentationPromptEnabled();
            presentation.setAttribute('aria-pressed', String(enabled));
            presentation.dataset.tooltip = enabled
                ? '消息标记注入已开启　以最高优先级约束时空栏与人物台词'
                : '消息标记注入已关闭　下次生成不再注入时空栏与台词协议';
            presentation.removeAttribute('title');
        };
        controller.syncPresentationButton();

        const getSideOffset = (side, distance = 8) => ({
            right: { x: -distance, y: 0 },
            left: { x: distance, y: 0 },
            bottom: { x: 0, y: -distance },
            top: { x: 0, y: distance },
        }[side] || { x: 0, y: distance });

        controller.place = () => {
            const hub = document.getElementById('xy-vessel-hub');
            if (!(hub instanceof HTMLElement)) {
                return;
            }
            const safe = 12;
            const gap = 10;
            const hubRect = hub.getBoundingClientRect();
            const popoverRect = popover.getBoundingClientRect();
            const width = popoverRect.width;
            const height = popoverRect.height;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const horizontal = hubRect.left + hubRect.width / 2 < viewportWidth / 2 ? 'right' : 'left';
            const vertical = hubRect.top + hubRect.height / 2 < viewportHeight / 2 ? 'bottom' : 'top';
            const oppositeHorizontal = horizontal === 'right' ? 'left' : 'right';
            const oppositeVertical = vertical === 'bottom' ? 'top' : 'bottom';
            const candidates = {
                right: { left: hubRect.right + gap, top: hubRect.top + (hubRect.height - height) / 2 },
                left: { left: hubRect.left - gap - width, top: hubRect.top + (hubRect.height - height) / 2 },
                bottom: { left: hubRect.left + (hubRect.width - width) / 2, top: hubRect.bottom + gap },
                top: { left: hubRect.left + (hubRect.width - width) / 2, top: hubRect.top - gap - height },
            };
            const order = [horizontal, vertical, oppositeHorizontal, oppositeVertical];
            const fits = ({ left, top }) => left >= safe
                && top >= safe
                && left + width <= viewportWidth - safe
                && top + height <= viewportHeight - safe;
            let side = order.find((candidate) => fits(candidates[candidate]));
            if (!side) {
                side = order.reduce((best, candidate) => {
                    const { left, top } = candidates[candidate];
                    const overflow = Math.max(0, safe - left)
                        + Math.max(0, safe - top)
                        + Math.max(0, left + width - (viewportWidth - safe))
                        + Math.max(0, top + height - (viewportHeight - safe));
                    return overflow < best.overflow ? { side: candidate, overflow } : best;
                }, { side: order[0], overflow: Number.POSITIVE_INFINITY }).side;
            }
            const position = candidates[side];
            const maxLeft = Math.max(safe, viewportWidth - width - safe);
            const maxTop = Math.max(safe, viewportHeight - height - safe);
            const left = Math.min(Math.max(position.left, safe), maxLeft);
            const top = Math.min(Math.max(position.top, safe), maxTop);
            popover.dataset.side = side;
            popover.style.left = `${Math.round(left)}px`;
            popover.style.top = `${Math.round(top)}px`;
            popover.style.setProperty('--xy-vessel-caret-x', `${Math.round(Math.min(Math.max(hubRect.left + hubRect.width / 2 - left, 18), width - 18))}px`);
            popover.style.setProperty('--xy-vessel-caret-y', `${Math.round(Math.min(Math.max(hubRect.top + hubRect.height / 2 - top, 18), height - 18))}px`);
        };

        controller.close = async (immediate = false) => {
            if (!controller.open && popover.hidden) {
                return;
            }
            controller.open = false;
            const sequence = ++controller.sequence;
            controller.timeline?.kill();
            const hide = () => {
                if (sequence === controller.sequence) {
                    popover.hidden = true;
                    popover.style.removeProperty('visibility');
                    popover.style.removeProperty('transform');
                    popover.style.removeProperty('opacity');
                }
            };
            if (immediate || reduceMotion.matches) {
                hide();
                return;
            }
            try {
                const gsap = await loadComposerGsap();
                if (sequence !== controller.sequence) {
                    return;
                }
                const offset = getSideOffset(popover.dataset.side);
                controller.timeline = gsap.timeline({ onComplete: hide })
                    .to(popover, {
                        autoAlpha: 0,
                        x: offset.x,
                        y: offset.y,
                        scale: 0.985,
                        duration: 0.14,
                        ease: 'power2.in',
                    });
            } catch {
                hide();
            }
        };

        confirm?.addEventListener('click', async () => {
            if (!(confirm instanceof HTMLButtonElement)) {
                return;
            }
            confirm.disabled = true;
            if (status) {
                status.textContent = '正在关闭主题';
            }
            controller.place();
            try {
                const { disableExtension, findExtension } = await import('/scripts/extensions.js');
                const extension = findExtension(resolveCurrentExtensionName());
                if (!extension?.enabled) {
                    throw new Error('当前主题扩展未处于可停用状态');
                }
                await disableExtension(extension.name);
                window.location.reload();
            } catch (error) {
                console.error('Could not disable the current theme extension.', error);
                if (status) {
                    status.textContent = '无法关闭主题 请在扩展程序中手动停用';
                }
                confirm.disabled = false;
                controller.place();
            }
        });
        memory?.addEventListener('click', () => {
            const enabled = !isWorldbookMemoryEnabled();
            setWorldbookMemoryEnabled(enabled);
            if (enabled) {
                persistActiveWorldbookMemory();
            }
            controller.syncMemoryButton();
        });
        snow?.addEventListener('click', () => {
            setHomePixelSnowEnabled(!isHomePixelSnowEnabled());
            controller.syncSnowButton();
        });
        presentation?.addEventListener('click', () => {
            const enabled = !isMessagePresentationPromptEnabled();
            setMessagePresentationPromptEnabled(enabled);
            controller.syncPresentationButton();
            if (status) {
                status.textContent = enabled ? '消息标记注入已开启' : '消息标记注入已关闭';
            }
            void refreshMessagePresentationPrompt();
        });
        document.addEventListener('pointerdown', (event) => {
            if (!controller.open || popover.contains(event.target) || event.target instanceof Element && event.target.closest('#xy-vessel-hub')) {
                return;
            }
            controller.close();
        }, true);
        document.addEventListener('keydown', (event) => {
            if (controller.open && event.key === 'Escape') {
                controller.close();
            }
        });
        popover.__xyVesselExitPopover = controller;
        return controller;
    }

    async function toggleVesselExitPopover() {
        const controller = ensureVesselExitPopover();
        if (controller.open) {
            controller.close();
            return;
        }
        controller.open = true;
        const sequence = ++controller.sequence;
        controller.timeline?.kill();
        controller.status.textContent = '';
        controller.confirm.disabled = false;
        controller.syncMemoryButton?.();
        controller.syncSnowButton?.();
        controller.syncPresentationButton?.();
        controller.popover.hidden = false;
        controller.popover.style.opacity = '0';
        controller.popover.style.visibility = 'hidden';
        controller.place();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            controller.popover.style.removeProperty('opacity');
            controller.popover.style.removeProperty('visibility');
            return;
        }
        try {
            const gsap = await loadComposerGsap();
            if (!controller.open || sequence !== controller.sequence) {
                return;
            }
            const offset = ({
                right: { x: -8, y: 0 },
                left: { x: 8, y: 0 },
                bottom: { x: 0, y: -8 },
                top: { x: 0, y: 8 },
            }[controller.popover.dataset.side] || { x: 0, y: 8 });
            const details = controller.popover.querySelectorAll('.xy-vessel-exit-popover__header, .xy-vessel-exit-popover__copy, .xy-vessel-exit-popover__actions');
            gsap.set(controller.popover, { autoAlpha: 0, x: offset.x, y: offset.y, scale: 0.985 });
            controller.timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
                .to(controller.popover, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.22 })
                .fromTo(details, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.16, stagger: 0.05 }, 0.06);
        } catch {
            controller.popover.style.removeProperty('opacity');
            controller.popover.style.removeProperty('visibility');
            controller.popover.style.removeProperty('transform');
        }
    }

    function ensureVesselHub() {
        let hub = document.getElementById('xy-vessel-hub');
        if (!(hub instanceof HTMLVideoElement)) {
            const previousHub = hub;
            hub = document.createElement('video');
            hub.id = 'xy-vessel-hub';
            hub.className = 'xy-vessel-hub';
            hub.setAttribute('aria-label', '渡舟枢纽');
            hub.src = ASSETS.boat;
            hub.muted = true;
            hub.autoplay = true;
            hub.loop = true;
            hub.playsInline = true;
            hub.tabIndex = 0;
            if (previousHub instanceof HTMLElement) {
                hub.dataset.xyVesselX = previousHub.dataset.xyVesselX || '0';
                hub.dataset.xyVesselY = previousHub.dataset.xyVesselY || '0';
                hub.style.setProperty('--xy-vessel-x', previousHub.style.getPropertyValue('--xy-vessel-x'));
                hub.style.setProperty('--xy-vessel-y', previousHub.style.getPropertyValue('--xy-vessel-y'));
                previousHub.replaceWith(hub);
            } else {
                document.body.append(hub);
            }
        }

        hub.removeAttribute('title');

        if (hub.dataset.xyVesselBound === 'true') {
            return;
        }

        hub.dataset.xyVesselBound = 'true';
        const storageKey = 'xy-vessel-position-v1';
        const readOffset = () => ({
            x: Number(hub.dataset.xyVesselX || 0),
            y: Number(hub.dataset.xyVesselY || 0),
        });
        const applyOffset = (x, y) => {
            hub.dataset.xyVesselX = String(Math.round(x));
            hub.dataset.xyVesselY = String(Math.round(y));
            hub.style.setProperty('--xy-vessel-x', `${Math.round(x)}px`);
            hub.style.setProperty('--xy-vessel-y', `${Math.round(y)}px`);
        };
        const constrainOffset = (x, y) => {
            const current = readOffset();
            const rect = hub.getBoundingClientRect();
            return {
                x: Math.min(Math.max(x, current.x - rect.left), current.x + window.innerWidth - rect.right),
                y: Math.min(Math.max(y, current.y - rect.top), current.y + window.innerHeight - rect.bottom),
            };
        };
        const persistOffset = () => {
            try {
                window.localStorage.setItem(storageKey, JSON.stringify(readOffset()));
            } catch {
                // The hub remains usable when local storage is unavailable.
            }
        };
        const restoreOffset = () => {
            try {
                const saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
                if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
                    applyOffset(saved.x, saved.y);
                }
            } catch {
                // Ignore stale or malformed persisted coordinates.
            }
            window.requestAnimationFrame(() => {
                const offset = readOffset();
                const constrained = constrainOffset(offset.x, offset.y);
                applyOffset(constrained.x, constrained.y);
            });
        };

        let drag = null;
        let suppressClickUntil = 0;
        const isHubTarget = (target) => target instanceof Element && Boolean(target.closest('#xy-vessel-hub'));

        window.addEventListener('pointerdown', (event) => {
            if (!isHubTarget(event.target) || event.button !== 0) {
                return;
            }
            const offset = readOffset();
            drag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originX: offset.x,
                originY: offset.y,
                moved: false,
            };
            hub.setPointerCapture?.(event.pointerId);
            event.stopImmediatePropagation();
        }, true);

        window.addEventListener('pointermove', (event) => {
            if (!drag || event.pointerId !== drag.pointerId) {
                return;
            }
            const deltaX = event.clientX - drag.startX;
            const deltaY = event.clientY - drag.startY;
            if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) {
                return;
            }
            drag.moved = true;
            hub.dataset.xyVesselDragging = 'true';
            const constrained = constrainOffset(drag.originX + deltaX, drag.originY + deltaY);
            applyOffset(constrained.x, constrained.y);
            const exitPopover = document.getElementById('xy-vessel-exit-popover')?.__xyVesselExitPopover;
            if (exitPopover?.open) {
                exitPopover.place();
            }
            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);

        window.addEventListener('pointerup', (event) => {
            if (!drag || event.pointerId !== drag.pointerId) {
                return;
            }
            if (drag.moved) {
                suppressClickUntil = performance.now() + 350;
                persistOffset();
            }
            hub.releasePointerCapture?.(event.pointerId);
            delete hub.dataset.xyVesselDragging;
            drag = null;
            event.stopImmediatePropagation();
        }, true);

        window.addEventListener('mousedown', (event) => {
            if (isHubTarget(event.target)) {
                event.stopImmediatePropagation();
            }
        }, true);
        window.addEventListener('click', (event) => {
            if (!isHubTarget(event.target)) {
                return;
            }
            if (performance.now() < suppressClickUntil) {
                event.preventDefault();
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            toggleVesselExitPopover();
        }, true);
        window.addEventListener('resize', () => {
            const offset = readOffset();
            const constrained = constrainOffset(offset.x, offset.y);
            applyOffset(constrained.x, constrained.y);
            const exitPopover = document.getElementById('xy-vessel-exit-popover')?.__xyVesselExitPopover;
            if (exitPopover?.open) {
                exitPopover.place();
            }
        }, { passive: true });

        restoreOffset();
    }

    function readSidebarMode() {
        // A fresh page always begins with the rail tucked away. Runtime persistence still
        // records the current interaction state, but is intentionally not restored.
        return 'hidden';
    }

    function applySidebarMode(mode, persist = true) {
        const holder = document.querySelector('#top-settings-holder');
        const nextMode = mode === 'hidden' ? 'hidden' : 'expanded';

        holder?.setAttribute('data-xy-sidebar-mode', nextMode);

        const control = holder?.querySelector('#xy-sidebar-toggle');
        if (control) {
            const hidden = nextMode === 'hidden';
            control.setAttribute('aria-pressed', String(hidden));
            control.setAttribute('aria-label', hidden ? '展开功能栏' : '隐藏功能栏');
            control.removeAttribute('title');
            let arrow = control.querySelector('.xy-sidebar-toggle__icon');
            if (!(arrow instanceof HTMLElement)) {
                control.innerHTML = '<span class="xy-sidebar-toggle__glyph" aria-hidden="true"><i class="xy-sidebar-toggle__icon fa-solid fa-angles-right"></i></span>';
                arrow = control.querySelector('.xy-sidebar-toggle__icon');
            }
            arrow?.classList.add('fa-solid', 'fa-angles-right');
            arrow?.classList.remove('fa-angles-left');
        }

        if (persist) {
            try {
                window.localStorage.setItem(SIDEBAR_MODE_KEY, nextMode);
            } catch {
                // Private browsing can deny local storage without affecting the layout.
            }
        }
    }

    function clearSidebarAnimationState(holder) {
        if (!(holder instanceof HTMLElement)) {
            return;
        }
        delete holder.dataset.xySidebarAnimating;
    }

    function cancelSidebarAnimation(holder) {
        sidebarTween?.forEach((animation) => animation.cancel());
        sidebarTween = null;
        clearSidebarAnimationState(holder);
    }

    function suppressSidebarNativeTooltips(holder) {
        if (!(holder instanceof HTMLElement)) {
            return;
        }
        holder.querySelectorAll('[title]').forEach((element) => element.removeAttribute('title'));
        if (holder.dataset.xySidebarTooltipBound === 'true') {
            return;
        }
        holder.dataset.xySidebarTooltipBound = 'true';
        new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
                    mutation.target.removeAttribute('title');
                    return;
                }
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof HTMLElement)) {
                        return;
                    }
                    node.removeAttribute('title');
                    node.querySelectorAll('[title]').forEach((element) => element.removeAttribute('title'));
                });
            });
        }).observe(holder, {
            attributes: true,
            attributeFilter: ['title'],
            childList: true,
            subtree: true,
        });
    }

    function getSidebarTravel(holder, root = document.documentElement) {
        const holderRect = holder.getBoundingClientRect();
        const control = holder.querySelector('#xy-sidebar-toggle');
        const hiddenWidth = Number.parseFloat(
            getComputedStyle(root).getPropertyValue('--xy-sidebar-hidden-width'),
        ) || 0;
        if (control instanceof HTMLElement) {
            const controlRect = control.getBoundingClientRect();
            return Math.max(0, controlRect.left - holderRect.left - hiddenWidth);
        }
        return Math.max(0, holderRect.width - hiddenWidth);
    }

    async function setSidebarMode(mode, persist = true, animate = true) {
        const holder = document.querySelector('#top-settings-holder');
        const nextMode = mode === 'hidden' ? 'hidden' : 'expanded';
        const currentMode = holder?.dataset.xySidebarMode === 'hidden' ? 'hidden' : 'expanded';
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (animate && holder?.dataset.xySidebarAnimating === 'true') {
            return;
        }

        if (!(holder instanceof HTMLElement) || !animate || reduceMotion || nextMode === currentMode) {
            cancelSidebarAnimation(holder);
            applySidebarMode(nextMode, persist);
            return;
        }

        holder.dataset.xySidebarAnimating = 'true';
        const control = holder.querySelector('#xy-sidebar-toggle');
        const arrow = control?.querySelector('.xy-sidebar-toggle__icon');
        if (typeof holder.animate !== 'function') {
            applySidebarMode(nextMode, persist);
            clearSidebarAnimationState(holder);
            return;
        }

        cancelSidebarAnimation(holder);
        holder.dataset.xySidebarAnimating = 'true';
        const options = {
            duration: 500,
            easing: 'cubic-bezier(.45, 0, .55, 1)',
            fill: 'both',
        };
        const animations = [];

        if (nextMode === 'expanded') {
            applySidebarMode('expanded', persist);
            const travel = getSidebarTravel(holder);
            animations.push(holder.animate([
                { transform: `translateX(${-travel}px)` },
                { transform: 'translateX(0)' },
            ], options));
            if (arrow instanceof HTMLElement) {
                animations.push(arrow.animate([
                    { transform: 'rotate(0deg)' },
                    { transform: 'rotate(-180deg)' },
                ], options));
            }
        } else {
            if (persist) {
                try {
                    window.localStorage.setItem(SIDEBAR_MODE_KEY, 'hidden');
                } catch {
                    // Private browsing can deny local storage without affecting the layout.
                }
            }
            const travel = getSidebarTravel(holder);
            animations.push(holder.animate([
                { transform: 'translateX(0)' },
                { transform: `translateX(${-travel}px)` },
            ], options));
            if (arrow instanceof HTMLElement) {
                animations.push(arrow.animate([
                    { transform: 'rotate(-180deg)' },
                    { transform: 'rotate(0deg)' },
                ], options));
            }
        }

        sidebarTween = animations;
        try {
            await Promise.all(animations.map((animation) => animation.finished));
        } catch {
            if (sidebarTween === animations) {
                cancelSidebarAnimation(holder);
            }
            return;
        }
        if (sidebarTween !== animations) {
            return;
        }
        if (nextMode === 'hidden') {
            applySidebarMode('hidden', false);
        }
        cancelSidebarAnimation(holder);
    }

    function ensureSidebar() {
        const holder = document.querySelector('#top-settings-holder');
        if (!holder) {
            return;
        }

        holder.classList.add('xy-sidebar-holder');
        suppressSidebarNativeTooltips(holder);
        holder.querySelectorAll(':scope > .drawer').forEach((drawer) => {
            const panel = drawer.querySelector(PANEL_SELECTOR);
            const meta = panel ? PANEL_META[panel.id] : null;
            const trigger = drawer.querySelector(':scope > .drawer-toggle');
            if (!meta || !trigger) {
                return;
            }

            drawer.dataset.xyPanelId = panel.id;
            panel.dataset.xyPanelManaged = 'true';
            if (drawer.id) {
                panel.dataset.xyPanelDrawerId = drawer.id;
            }
            trigger.setAttribute('aria-label', meta.title);
            trigger.querySelector('.xy-sidebar-label')?.remove();
        });
        detachAdvancedFormattingPanel();

        let control = holder.querySelector('#xy-sidebar-toggle');
        if (!control) {
            control = document.createElement('button');
            control.id = 'xy-sidebar-toggle';
            control.type = 'button';
            control.className = 'menu_button_icon';
            holder.prepend(control);
        }

        if (holder.dataset.xySidebarBound !== 'true') {
            holder.dataset.xySidebarBound = 'true';
            const toggleSidebar = (event) => {
                const target = event.target instanceof Element ? event.target : null;
                if (!target?.closest('#xy-sidebar-toggle')) {
                    return;
                }
            event.preventDefault();
            event.stopImmediatePropagation();
            if (holder.dataset.xySidebarAnimating === 'true'
                || document.getElementById('xy-focus-workspace')?.dataset.xyFocusWorkspaceAnimating === 'true'
                || document.getElementById('xy-focus-workspace')?.dataset.xyFocusWorkspaceBusy === 'true') {
                return;
            }
            const current = holder.dataset.xySidebarMode;
            if (current === 'expanded') {
                void closeFocusWorkspace(() => void setSidebarMode('hidden'));
                return;
            }
            void setSidebarMode('expanded');
        };

            // 酒馆原生的抽屉关闭处理挂在 document 捕获阶段；在 window 阶段截住侧栏控制，
            // 不让收起导航的操作被识别为空白点击。
            window.addEventListener('pointerdown', (event) => {
                const target = event.target instanceof Element ? event.target : null;
                if (target?.closest('#xy-sidebar-toggle')) {
                    event.stopImmediatePropagation();
                }
            }, true);
            window.addEventListener('mousedown', (event) => {
                const target = event.target instanceof Element ? event.target : null;
                if (target?.closest('#xy-sidebar-toggle')) {
                    event.stopImmediatePropagation();
                }
            }, true);
            window.addEventListener('click', toggleSidebar, true);

        }

        void setSidebarMode(readSidebarMode(), false, false);
    }

    function ensureSidebarGrainient() {
        const holder = document.querySelector('#top-settings-holder.xy-sidebar-holder');
        if (!(holder instanceof HTMLElement) || holder.dataset.xySidebarGrainientLoading === 'true') {
            return;
        }
        holder.dataset.xySidebarGrainientLoading = 'true';
        import(ASSETS.sidebarGrainient)
            .then(({ ensureSidebarGrainient: mount }) => mount())
            .catch((error) => console.warn('[玄尘渡] Grainient 侧栏模块加载失败。', error))
            .finally(() => delete holder.dataset.xySidebarGrainientLoading);
    }

    function panelIsOpen(panel) {
        if (!panel) {
            return false;
        }

        // Theme-managed panels retain openDrawer to avoid a costly native subtree scan.
        // After ownership transfers, the theme data state is the only open-state authority.
        return panel.dataset.xyPanelState === 'open'
            || (panel.dataset.xyPanelManaged !== 'true' && panel.classList.contains('openDrawer'));
    }

    function getPanelDrawer(panel) {
        const drawerId = panel?.dataset.xyPanelDrawerId;
        return (drawerId ? document.getElementById(drawerId) : null)
            || panel?.closest('.drawer')
            || null;
    }

    function getDrawerPanel(drawer) {
        const panelId = drawer?.dataset.xyPanelId;
        return (panelId ? document.getElementById(panelId) : null)
            || drawer?.querySelector(PANEL_SELECTOR)
            || null;
    }

    function ensureFocusWorkspace() {
        let workspace = document.getElementById('xy-focus-workspace');
        if (!(workspace instanceof HTMLElement)) {
            workspace = document.createElement('div');
            workspace.id = 'xy-focus-workspace';
            workspace.setAttribute('aria-hidden', 'true');
            document.body.append(workspace);
        }

        let stage = workspace.querySelector(':scope > #xy-focus-workspace-stage');
        if (!(stage instanceof HTMLElement)) {
            stage = document.createElement('div');
            stage.id = 'xy-focus-workspace-stage';
            const existingChildren = [...workspace.children];
            workspace.append(stage);
            stage.append(...existingChildren);
        }
        let panelSlot = stage.querySelector(':scope > #xy-focus-panel-slot');
        if (!(panelSlot instanceof HTMLElement)) {
            panelSlot = document.createElement('div');
            panelSlot.id = 'xy-focus-panel-slot';
            const existingPanels = [...stage.children]
                .filter((element) => element.id !== 'xy-focus-scrim');
            stage.append(panelSlot);
            panelSlot.append(...existingPanels);
        }
        return workspace;
    }

    function getFocusWorkspaceStage(workspace = ensureFocusWorkspace()) {
        return workspace.querySelector(':scope > #xy-focus-workspace-stage');
    }

    function getFocusPanelSlot(workspace = ensureFocusWorkspace()) {
        return getFocusWorkspaceStage(workspace)?.querySelector(':scope > #xy-focus-panel-slot');
    }

    function mountPanelInFocusWorkspace(panel) {
        if (!(panel instanceof HTMLElement)) {
            return ensureFocusWorkspace();
        }

        const workspace = ensureFocusWorkspace();
        const panelSlot = getFocusPanelSlot(workspace);
        if (panel.parentElement === panelSlot) {
            return workspace;
        }

        const drawer = getPanelDrawer(panel);
        if (drawer?.id) {
            drawer.dataset.xyPanelId = panel.id;
            panel.dataset.xyPanelDrawerId = drawer.id;
        }
        focusPanelHomes.set(panel, {
            parent: panel.parentNode,
            nextSibling: panel.nextSibling,
        });
        panelSlot.append(panel);
        return workspace;
    }

    function restorePanelHome(panel) {
        const home = focusPanelHomes.get(panel);
        if (!home?.parent?.isConnected || panel.parentNode === home.parent) {
            focusPanelHomes.delete(panel);
            return;
        }

        if (home.nextSibling?.parentNode === home.parent) {
            home.parent.insertBefore(panel, home.nextSibling);
        } else {
            home.parent.append(panel);
        }
        focusPanelHomes.delete(panel);
    }

    function cancelFocusWorkspaceAnimation(workspace) {
        focusWorkspaceAnimation?.forEach((animation) => animation.cancel());
        focusWorkspaceAnimation = null;
        if (workspace instanceof HTMLElement) {
            delete workspace.dataset.xyFocusWorkspaceAnimating;
        }
    }

    function revealBasePageForFocusClose() {
        document.body.classList.add('xy-focus-revealing');
        document.body.classList.remove('xy-focus-mode');
    }

    async function animateFocusWorkspace(direction, complete, startTogether) {
        const workspace = ensureFocusWorkspace();
        if (workspace.dataset.xyFocusWorkspaceAnimating === 'true') {
            return false;
        }

        const finish = () => {
            complete?.();
            cancelFocusWorkspaceAnimation(workspace);
        };
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches
            || typeof workspace.animate !== 'function') {
            if (direction === 'close') {
                revealBasePageForFocusClose();
                document.body.classList.add('xy-focus-closing');
            }
            startTogether?.();
            finish();
            return true;
        }

        workspace.dataset.xyFocusWorkspaceAnimating = 'true';
        const opening = direction === 'open';
        const stage = getFocusWorkspaceStage(workspace);
        const panelSlot = getFocusPanelSlot(workspace);
        const hiddenTransform = 'translate3d(calc(-100dvw + var(--xy-focus-workspace-left)), 0, 0)';
        const keyframes = [
            { transform: opening ? hiddenTransform : 'translate3d(0, 0, 0)' },
            { transform: opening ? 'translate3d(0, 0, 0)' : hiddenTransform },
        ];
        const options = {
            duration: 500,
            easing: 'cubic-bezier(.45, 0, .55, 1)',
            fill: 'both',
        };
        const animations = [stage.querySelector(':scope > #xy-focus-scrim'), panelSlot]
            .filter((element) => element instanceof HTMLElement)
            .map((element) => element.animate(keyframes, options));
        focusWorkspaceAnimation = animations;
        try {
            if (!opening) {
                workspace.dataset.xyFocusWorkspaceState = 'closing';
                revealBasePageForFocusClose();
                document.body.classList.add('xy-focus-closing');
                startTogether?.();
            }
            await Promise.all(animations.map((animation) => animation.finished));
        } catch {
            if (!opening) {
                setClassState(document.body, 'xy-focus-revealing', false);
                setClassState(document.body, 'xy-focus-closing', false);
                syncFocusMode();
            }
            if (focusWorkspaceAnimation === animations) {
                cancelFocusWorkspaceAnimation(workspace);
            }
            return false;
        }
        if (focusWorkspaceAnimation !== animations) {
            return false;
        }
        finish();
        return true;
    }

    function detachAdvancedFormattingPanel() {
        const panel = document.querySelector('#AdvancedFormatting');
        if (!panel) {
            return;
        }

        // The inactive Advanced Formatting panel lives under body. Its active state is
        // temporarily mounted in the shared focus workspace with every other panel.
        if (panel.dataset.xyPanelDetached === 'true') {
            if (panel.parentElement !== document.body
                && panel.parentElement?.id !== 'xy-focus-workspace-stage') {
                document.body.append(panel);
            }
            return;
        }

        const drawer = getPanelDrawer(panel);
        if (!drawer?.id) {
            return;
        }

        // Advanced Formatting is the largest built-in drawer. Move its content outside
        // the element GSAP translates so it cannot retain a costly compositing branch.
        drawer.dataset.xyPanelId = panel.id;
        panel.dataset.xyPanelDrawerId = drawer.id;
        panel.dataset.xyPanelDetached = 'true';
        panel.classList.add('xy-panel-detached');
        document.body.append(panel);
    }

    function setPanelIconState(panel, open) {
        const drawer = getPanelDrawer(panel);
        if (!drawer) {
            return;
        }

        // Icon classes are also observed by keyboard.js. Keep its original closedIcon in
        // place and express the active treatment through a theme-owned data attribute.
        const nextState = open ? 'open' : 'closed';
        if (drawer.dataset.xyPanelIconState !== nextState) {
            drawer.dataset.xyPanelIconState = nextState;
        }
        const trigger = drawer.querySelector('.drawer-toggle');
        const expanded = String(open);
        if (trigger?.getAttribute('aria-expanded') !== expanded) {
            trigger?.setAttribute('aria-expanded', expanded);
        }
    }

    function openPanel(panel) {
        if (!panel) {
            return;
        }

        mountPanelInFocusWorkspace(panel);
        // Keep the large drawer subtree on its native closed class. SillyTavern's keyboard
        // observer scans every descendant when that class changes; this tiny data state does not.
        panel.dataset.xyPanelManaged = 'true';
        if (panel.dataset.xyPanelState !== 'open') {
            panel.dataset.xyPanelState = 'open';
        }
        if (panel.classList.contains('pinnedOpen') || panel.classList.contains('drawerPinnedOpen')) {
            panel.classList.remove('pinnedOpen', 'drawerPinnedOpen');
        }
        setPanelIconState(panel, true);

        if (panel.id === 'right-nav-panel') {
            document.querySelector('#rm_print_characters_block')?.dispatchEvent(new Event('scroll'));
        }
    }

    function ensureFocusScrim() {
        document.getElementById('xy-focus-hint')?.remove();
        const workspace = ensureFocusWorkspace();
        const stage = getFocusWorkspaceStage(workspace);
        let scrim = document.getElementById('xy-focus-scrim');
        if (scrim instanceof HTMLElement) {
            if (scrim.parentElement !== stage) {
                stage.prepend(scrim);
            }
            return scrim;
        }

        scrim = document.createElement('div');
        scrim.id = 'xy-focus-scrim';
        scrim.setAttribute('aria-hidden', 'true');
        scrim.addEventListener('click', (event) => {
            event.stopPropagation();
            void closeFocusWorkspace();
        });
        stage.prepend(scrim);
        return scrim;
    }

    function ensureFocusPresentation(scrim, copy) {
        let card = scrim.querySelector('.xy-focus-paper-card');
        if (!(card instanceof HTMLElement)) {
            card = document.createElement('section');
            card.className = 'xy-focus-paper-card';

            const content = document.createElement('div');
            content.className = 'xy-focus-paper-card-copy';

            const eyebrow = document.createElement('p');
            eyebrow.className = 'xy-focus-paper-card-eyebrow';

            const heading = document.createElement('h2');
            heading.className = 'xy-focus-paper-card-title';

            const hint = document.createElement('p');
            hint.className = 'xy-focus-paper-card-hint';

            content.append(eyebrow, heading, hint);
            card.append(content);
            scrim.append(card);
        }

        card.querySelector('.xy-focus-paper-card-eyebrow').textContent = copy.eyebrow;
        card.querySelector('.xy-focus-paper-card-title').textContent = copy.title;
        card.querySelector('.xy-focus-paper-card-hint').textContent = copy.hint;
    }

    function removeFocusPresentation(scrim) {
        scrim.querySelector('.xy-focus-paper-card')?.remove();
    }

    function syncAiPromptEditorState() {
        const panel = document.querySelector(AI_PANEL_SELECTOR);
        const workspace = document.getElementById('xy-focus-workspace');
        const popup = document.getElementById('completion_prompt_manager_popup');
        const editArea = document.getElementById('completion_prompt_manager_popup_edit');
        const isAiWorkspaceOpen = activeFocusPanelId === 'left-nav-panel'
            && panelIsOpen(panel)
            && workspace?.dataset.xyFocusWorkspaceState !== 'closed';
        const isNativeEditorOpen = popup instanceof HTMLElement
            && editArea instanceof HTMLElement
            && popup.classList.contains('openDrawer')
            && editArea.style.display !== 'none';
        const shouldUseFocusEditor = isAiWorkspaceOpen && isNativeEditorOpen;

        setClassState(popup, 'xy-ai-prompt-editor', shouldUseFocusEditor);
        setClassState(document.body, 'xy-ai-prompt-editor-open', shouldUseFocusEditor);
    }

    function bindAiPromptEditorState() {
        const popup = document.getElementById('completion_prompt_manager_popup');
        const editArea = document.getElementById('completion_prompt_manager_popup_edit');
        if (!(popup instanceof HTMLElement) || !(editArea instanceof HTMLElement)) {
            window.setTimeout(bindAiPromptEditorState, 500);
            return;
        }

        aiPromptEditorStateObserver?.disconnect();
        aiPromptEditorStateObserver = new MutationObserver(syncAiPromptEditorState);
        aiPromptEditorStateObserver.observe(popup, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
        aiPromptEditorStateObserver.observe(editArea, {
            attributes: true,
            attributeFilter: ['style'],
        });
        syncAiPromptEditorState();
    }

    function enterFocusMode(panel) {
        const meta = panel ? PANEL_META[panel.id] : null;
        if (!meta) {
            return;
        }

        const scrim = ensureFocusScrim();
        const isWorldbook = panel.id === 'WorldInfo';
        const isRevealingBasePage = document.body.classList.contains('xy-focus-revealing');
        const wasFocused = document.body.classList.contains('xy-focus-mode') || isRevealingBasePage;
        const isSameFocus = wasFocused && activeFocusPanelId === panel.id;
        const applySide = () => {
            setClassState(document.body, 'xy-focus-left', meta.side === 'left');
            setClassState(document.body, 'xy-focus-right', meta.side === 'right');
            setClassState(document.body, 'xy-worldbook-mode', isWorldbook);
        };

        // MutationObserver 会监听 body.class；相同面板无需再次写入 class，避免形成回调循环。
        if (isSameFocus) {
            if (isWorldbook) {
                removeFocusPresentation(scrim);
            } else {
                ensureFocusPresentation(scrim, meta.focus);
            }
            applySide();
            syncAiPromptEditorState();
            return;
        }
        // Keep the chat or welcome page beneath the workspace for the entire session.
        // The workspace scrim owns pointer events, so this does not make the base interactive.
        if (!isRevealingBasePage) {
            setClassState(document.body, 'xy-focus-mode', true);
        }
        scrim.setAttribute('aria-hidden', 'false');
        applySide();
        activeFocusPanelId = panel.id;
        if (isWorldbook) {
            removeFocusPresentation(scrim);
        } else {
            ensureFocusPresentation(scrim, meta.focus);
        }
        if (isWorldbook) {
            requestAnimationFrame(() => {
                if (bindWorldbookEnhancer()) {
                    enhanceWorldbookList();
                }
            });
        }
        syncAiPromptEditorState();
    }

    function leaveFocusMode() {
        document.querySelector('#completion_prompt_manager_popup.xy-ai-prompt-editor')
            ?.classList.remove('xy-ai-prompt-editor');
        document.body.classList.remove('xy-ai-prompt-editor-open');
        if (!document.body.classList.contains('xy-focus-mode')
            && !document.body.classList.contains('xy-focus-revealing')) {
            return;
        }

        const scrim = ensureFocusScrim();
        scrim.setAttribute('aria-hidden', 'true');
        removeFocusPresentation(scrim);
        document.body.classList.remove(
            'xy-focus-mode',
            'xy-focus-revealing',
            'xy-focus-closing',
            'xy-focus-left',
            'xy-focus-right',
            'xy-worldbook-mode',
        );
        if (activeFocusPanelId === 'WorldInfo') {
            worldbookMemoryRestoreAttempted = false;
        }
        activeFocusPanelId = null;

        // A panel switch can cancel a pending sidebar animation before it completes.
        // Clean only orphaned animation state; an active sidebar animation keeps ownership.
        requestAnimationFrame(() => {
            if (!sidebarTween) {
                clearSidebarAnimationState(document.querySelector('#top-settings-holder'));
            }
        });
    }

    function syncFocusMode() {
        const activePanel = getThemePanels().find(panelIsOpen);
        if (activePanel) {
            if (!document.body.classList.contains('xy-focus-revealing')) {
                enterFocusMode(activePanel);
            }
        } else {
            leaveFocusMode();
        }
    }

    function readPanelValues(panel) {
        return [...panel.querySelectorAll('input, select, textarea')]
            .filter((element) => element.type !== 'file')
            .map((element) => ({
                element,
                value: element.type === 'checkbox' || element.type === 'radio'
                    ? element.checked
                    : element.value,
            }));
    }

    function rememberAiPanel() {
        const panel = document.querySelector(AI_PANEL_SELECTOR);
        if (!panel || !panelIsOpen(panel)) {
            return;
        }

        if (!aiSnapshot) {
            aiSnapshot = readPanelValues(panel).map(({ value }) => value);
        }
    }

    function saveAiPanelIfChanged() {
        const panel = document.querySelector(AI_PANEL_SELECTOR);
        if (!panel || !aiSnapshot || panelIsOpen(panel)) {
            return;
        }

        const current = readPanelValues(panel);
        const changedIndexes = current
            .map(({ value }, index) => value !== aiSnapshot[index] ? index : -1)
            .filter((index) => index >= 0);
        aiSnapshot = null;

        if (changedIndexes.length === 0) {
            return;
        }

        for (const index of changedIndexes) {
            const element = current[index].element;
            const eventName = element.matches('select, input[type="checkbox"], input[type="radio"]')
                ? 'change'
                : 'input';
            element.dispatchEvent(new Event(eventName, { bubbles: true }));
            if (eventName === 'change') {
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        // 控件事件只更新内存设置；点击酒馆原生按钮才会写入当前预设并显示成功提示。
        document.querySelector('#update_oai_preset')?.click();
    }

    function closePanel(panel) {
        if (!panel) {
            return;
        }

        // Do not flip openDrawer/closedDrawer after startup. keyboard.js observes that class
        // on the full panel subtree and synchronously reprocesses hundreds of controls.
        const drawer = getPanelDrawer(panel);
        const needsIconSync = drawer?.dataset.xyPanelIconState !== 'closed'
            || drawer?.querySelector('.drawer-toggle')?.getAttribute('aria-expanded') !== 'false';
        const wasOpen = panel.dataset.xyPanelState === 'open';
        const wasPinned = panel.classList.contains('pinnedOpen') || panel.classList.contains('drawerPinnedOpen');
        panel.dataset.xyPanelManaged = 'true';
        delete panel.dataset.xyPanelOpening;
        if (wasOpen) {
            delete panel.dataset.xyPanelState;
        }
        if (wasPinned) {
            panel.classList.remove('pinnedOpen', 'drawerPinnedOpen');
        }
        if (wasOpen || wasPinned || needsIconSync) {
            setPanelIconState(panel, false);
        }
        restorePanelHome(panel);
    }

    async function closeFocusWorkspace(startTogether) {
        const panels = getThemePanels().filter((panel) => panelIsOpen(panel)
            || panel.classList.contains('pinnedOpen')
            || panel.classList.contains('drawerPinnedOpen'));
        const workspace = ensureFocusWorkspace();
        if (!panels.length) {
            startTogether?.();
            workspace.setAttribute('aria-hidden', 'true');
            workspace.dataset.xyFocusWorkspaceState = 'closed';
            syncFocusMode();
            return true;
        }

        workspace.dataset.xyFocusWorkspaceState = 'closing';
        return animateFocusWorkspace('close', () => {
            panels.forEach(closePanel);
            pendingPanelId = null;
            syncFocusMode();
            workspace.setAttribute('aria-hidden', 'true');
            workspace.dataset.xyFocusWorkspaceState = 'closed';
        }, startTogether);
    }

    function forceCloseStartupPanel(panel) {
        if (!panel) {
            return;
        }

        // 酒馆可能在扩展加载后恢复上次的抽屉状态，启动时统一以关闭状态为准。
        panel.classList.remove('openDrawer', 'pinnedOpen', 'drawerPinnedOpen');
        panel.classList.add('closedDrawer');

        const drawer = panel.closest('.drawer');
        const icon = drawer?.querySelector('.drawer-icon');
        icon?.classList.remove('openIcon', 'drawerPinnedOpen');
        icon?.classList.add('closedIcon');
    }

    function closeStartupPanels() {
        document.querySelectorAll('#left-nav-panel, #right-nav-panel')
            .forEach(forceCloseStartupPanel);
    }

    function closeCompetingPanels(currentDrawer) {
        getThemePanels().forEach((panel) => {
            if (getPanelDrawer(panel) !== currentDrawer && (panelIsOpen(panel)
                || panel.classList.contains('pinnedOpen')
                || panel.classList.contains('drawerPinnedOpen'))) {
                closePanel(panel);
            }
        });
    }

    function resolveThemePanelTrigger(target) {
        const trigger = target?.closest('.drawer-toggle, .drawer-opener');
        if (!trigger) {
            return null;
        }

        const drawer = trigger.closest('.drawer')
            || document.getElementById(trigger.dataset.target || '');
        const panel = getDrawerPanel(drawer);
        return panel && PANEL_META[panel.id] ? { trigger, drawer, panel } : null;
    }

    function revealPanelWhenReady(panel) {
        let stableFrames = 0;
        const checkGeometry = () => {
            if (!panelIsOpen(panel)) {
                delete panel.dataset.xyPanelOpening;
                return;
            }

            const rect = panel.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const fillsWorkspace = rect.top <= viewportHeight * .06
                && rect.bottom >= viewportHeight * .94;
            stableFrames = fillsWorkspace ? stableFrames + 1 : 0;

            if (stableFrames >= 2) {
                delete panel.dataset.xyPanelOpening;
                return;
            }
            requestAnimationFrame(checkGeometry);
        };

        requestAnimationFrame(checkGeometry);
    }

    async function toggleThemePanel(panel, drawer, deferReveal = false) {
        const workspace = ensureFocusWorkspace();
        if (workspace.dataset.xyFocusWorkspaceAnimating === 'true'
            || workspace.dataset.xyFocusWorkspaceBusy === 'true') {
            return;
        }

        const activePanel = getThemePanels().find(panelIsOpen);
        if (activePanel === panel) {
            await closeFocusWorkspace();
            pendingPanelId = null;
            return;
        }

        if (activePanel) {
            closePanel(activePanel);
        }
        closeCompetingPanels(drawer);
        if (deferReveal) {
            panel.dataset.xyPanelOpening = 'true';
        }
        workspace.setAttribute('aria-hidden', 'false');
        workspace.dataset.xyFocusWorkspaceState = activePanel ? 'open' : 'preparing';
        let openingAnimation = null;
        if (!activePanel) {
            // Start the composited travel before mounting the large native drawer subtree.
            // Both operations finish in this event turn, so the first paint still includes
            // the panel, while visual motion no longer waits on its synchronous setup.
            ensureFocusScrim();
            workspace.dataset.xyFocusWorkspaceBusy = 'true';
            workspace.dataset.xyFocusWorkspaceState = 'opening';
            document.body.classList.remove('xy-focus-closing');
            openingAnimation = animateFocusWorkspace('open', () => {
                workspace.dataset.xyFocusWorkspaceState = 'open';
            });
        }
        openPanel(panel);
        // 首页快捷入口必须直接进入完整工作台，不能留下原生抽屉的首帧小窗。
        enterFocusMode(panel);
        // Match the closing path: the workspace always travels above the current base page.
        // Apply this before the readiness frames so no blank frame is visible on opening.
        if (!activePanel) {
            revealBasePageForFocusClose();
        }
        if (deferReveal) {
            revealPanelWhenReady(panel);
        }
        pendingPanelId = null;
        scheduleFocusSync();
        if (activePanel) {
            return;
        }

        try {
            const opened = await openingAnimation;
            if (!opened && getThemePanels().some(panelIsOpen)) {
                workspace.dataset.xyFocusWorkspaceState = 'open';
            }
        } finally {
            delete workspace.dataset.xyFocusWorkspaceBusy;
        }
    }

    function bindThemePanelSwitching() {
        if (window.__xyThemePanelSwitchingBound) {
            return;
        }
        window.__xyThemePanelSwitchingBound = true;

        const closePromptWorkspaceFromScrim = (event) => {
            const eventPath = event.composedPath();
            const promptPopup = document.querySelector('#completion_prompt_manager_popup.openDrawer');
            const promptEditor = promptPopup?.querySelector('#completion_prompt_manager_popup_edit');
            const focusScrim = document.querySelector('#xy-focus-scrim');
            if (!promptPopup
                || !(promptEditor instanceof HTMLElement)
                || getComputedStyle(promptEditor).display === 'none'
                || !focusScrim
                || !eventPath.includes(focusScrim)) {
                return false;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
            promptPopup.querySelector('#completion_prompt_manager_popup_entry_form_close')?.click();
            void closeFocusWorkspace();
            return true;
        };

        window.addEventListener('pointerdown', closePromptWorkspaceFromScrim, true);

        let suppressThemePanelClickUntil = 0;
        const activateThemePanel = async (event) => {
            const target = event.target instanceof Element ? event.target : null;
            const match = resolveThemePanelTrigger(target);
            if (!match) {
                return false;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
            const isShortcut = match.trigger.classList.contains('drawer-opener');
            if (isShortcut) {
                await setSidebarMode('expanded');
            }
            await toggleThemePanel(match.panel, match.drawer, isShortcut);
            return true;
        };

        // Pointerdown is intentionally used for direct sidebar icons. A click event is sent
        // only after mouseup, which made opening feel delayed even though WAAPI was ready.
        window.addEventListener('pointerdown', (event) => {
            if (closePromptWorkspaceFromScrim(event) || event.button !== 0) {
                return;
            }
            if (event.target instanceof Element && resolveThemePanelTrigger(event.target)) {
                suppressThemePanelClickUntil = performance.now() + 900;
                void activateThemePanel(event);
            }
        }, true);

        // Suppress the mouseup-generated click after pointerdown, but retain keyboard click
        // activation for the same controls.
        window.addEventListener('click', (event) => {
            if (closePromptWorkspaceFromScrim(event)) {
                return;
            }
            const target = event.target instanceof Element ? event.target : null;
            if (!resolveThemePanelTrigger(target)) {
                return;
            }
            if (performance.now() < suppressThemePanelClickUntil) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            void activateThemePanel(event);
        }, true);
    }

    function isWelcomeSelectionLocked() {
        return document.body.classList.contains('bubblechat')
            && !document.body.classList.contains('xy-focus-mode')
            && Boolean(document.querySelector('#chat > .welcomePanel'));
    }

    function isEditableSelectionTarget(target) {
        if (!(target instanceof Element)) {
            return false;
        }
        const editable = target.closest('input, textarea, select, [contenteditable]');
        return editable instanceof HTMLInputElement
            || editable instanceof HTMLTextAreaElement
            || editable instanceof HTMLSelectElement
            || editable instanceof HTMLElement && editable.isContentEditable;
    }

    function clearWelcomeSelection() {
        const selection = window.getSelection();
        if (selection?.rangeCount) {
            selection.removeAllRanges();
        }
    }

    function bindWelcomeSelectionGuard() {
        if (window.__xyWelcomeSelectionGuardBound) {
            return;
        }
        window.__xyWelcomeSelectionGuardBound = true;

        window.addEventListener('keydown', (event) => {
            const target = event.target instanceof Element ? event.target : null;
            const selectsAll = (event.ctrlKey || event.metaKey)
                && !event.altKey
                && event.key.toLowerCase() === 'a';
            if (!selectsAll || !isWelcomeSelectionLocked() || isEditableSelectionTarget(target)) {
                return;
            }
            event.preventDefault();
            clearWelcomeSelection();
        }, true);

        window.addEventListener('selectstart', (event) => {
            if (isWelcomeSelectionLocked() && !isEditableSelectionTarget(event.target)) {
                event.preventDefault();
            }
        }, true);

        document.addEventListener('selectionchange', () => {
            if (!isWelcomeSelectionLocked() || isEditableSelectionTarget(document.activeElement)) {
                return;
            }
            clearWelcomeSelection();
        });
    }

    const THEME_CHAT_WIDTH_MIN = 60;
    const THEME_CHAT_WIDTH_MAX = 80;
    const THEME_CHAT_WIDTH_DEFAULT_KEY = 'xy-theme-chat-width-default-applied';

    function clampThemeChatWidth(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return THEME_CHAT_WIDTH_MIN;
        }
        return Math.min(THEME_CHAT_WIDTH_MAX, Math.max(THEME_CHAT_WIDTH_MIN, Math.round(numericValue)));
    }

    function bindThemeChatWidth() {
        if (window.__xyThemeChatWidthBound) {
            return true;
        }

        const slider = document.querySelector('#chat_width_slider');
        const counter = document.querySelector('#chat_width_slider_counter');
        if (!(slider instanceof HTMLInputElement) || !(counter instanceof HTMLInputElement)) {
            return false;
        }

        slider.min = String(THEME_CHAT_WIDTH_MIN);
        slider.max = String(THEME_CHAT_WIDTH_MAX);
        counter.min = String(THEME_CHAT_WIDTH_MIN);
        counter.max = String(THEME_CHAT_WIDTH_MAX);

        let applyDefault = false;
        try {
            applyDefault = window.localStorage.getItem(THEME_CHAT_WIDTH_DEFAULT_KEY) !== 'true';
            window.localStorage.setItem(THEME_CHAT_WIDTH_DEFAULT_KEY, 'true');
        } catch {
            // Storage can be unavailable in private browsing; range enforcement still works.
        }

        const initialValue = applyDefault ? THEME_CHAT_WIDTH_MIN : clampThemeChatWidth(slider.value);
        const initialChanged = Number(slider.value) !== initialValue || Number(counter.value) !== initialValue;
        slider.value = String(initialValue);
        counter.value = String(initialValue);
        if (initialChanged) {
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }

        let isSyncing = false;
        const applyClampedWidth = (value) => {
            const clampedValue = clampThemeChatWidth(value);
            isSyncing = true;
            slider.value = String(clampedValue);
            counter.value = String(clampedValue);
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            isSyncing = false;
            return clampedValue;
        };
        const enforceRange = (event) => {
            const target = event.target;
            if (isSyncing
                || !(target instanceof HTMLInputElement)
                || (target !== slider && target !== counter)) {
                return;
            }
            if (target === counter && event.type === 'input') {
                return;
            }

            const clampedValue = clampThemeChatWidth(target.value);
            if (Number(target.value) === clampedValue) {
                return;
            }

            event.stopImmediatePropagation();
            applyClampedWidth(clampedValue);
        };

        window.addEventListener('input', enforceRange, true);
        window.addEventListener('change', enforceRange, true);
        counter.addEventListener('blur', () => {
            if (isSyncing || Number(counter.value) === clampThemeChatWidth(counter.value)) {
                return;
            }
            applyClampedWidth(counter.value);
        });
        window.__xyThemeChatWidthBound = true;
        return true;
    }

    function getFocusPanelSlotFromEventPath(eventPath) {
        const panelSlot = document.querySelector('#xy-focus-panel-slot');
        return panelSlot instanceof HTMLElement && eventPath.includes(panelSlot) ? panelSlot : null;
    }

    function protectFocusPanelFromNativeDrawerClose(event) {
        if (!getThemePanels().some(panelIsOpen)) {
            return;
        }

        const panelSlot = getFocusPanelSlotFromEventPath(event.composedPath());
        if (!panelSlot) {
            return;
        }

        // SillyTavern's html-level mousedown handler only recognizes .openDrawer ancestry.
        // The focused panel is reparented, so expose a pinned sentinel for this event only.
        panelSlot.dataset.xyNativeDrawerShield = 'true';
        panelSlot.classList.add('openDrawer', 'pinnedOpen');
        queueMicrotask(() => {
            if (panelSlot.dataset.xyNativeDrawerShield !== 'true') {
                return;
            }
            delete panelSlot.dataset.xyNativeDrawerShield;
            panelSlot.classList.remove('openDrawer', 'pinnedOpen');
        });
    }

    function closeOnOutsideClick(event) {
        const target = event.target instanceof Element ? event.target : null;
        const eventPath = event.composedPath();
        const extensionsPanel = document.querySelector('#rm_extensions_block');

        if (target?.closest('#xy-sidebar-toggle, #xy-vessel-hub, #xy-floating-ball-dock, #xy-floating-ball-capture-layer')) {
            return;
        }

        // 扩展页内部包含动态组件与第三方卷签，点击行为完全交还酒馆原生处理。
        // composedPath 同时覆盖普通 DOM、动态挂载节点与 Shadow DOM 内部事件。
        if (extensionsPanel && eventPath.includes(extensionsPanel)) {
            return;
        }

        if (getFocusPanelSlotFromEventPath(eventPath)) {
            return;
        }

        const isInsidePanelOrPopup = eventPath.some((node) => node instanceof Element
            && (node.matches(PANEL_SELECTOR) || node.matches(PANEL_POPUP_SELECTOR)));
        if (isInsidePanelOrPopup) {
            return;
        }

        const trigger = target?.closest('.drawer-toggle, .drawer-icon');
        if (trigger) {
            const currentDrawer = trigger.closest('.drawer');
            const targetPanel = getDrawerPanel(currentDrawer);
            const isClosingCurrentPanel = panelIsOpen(targetPanel);

            if (targetPanel && !isClosingCurrentPanel) {
                // 专注态只在酒馆确认抽屉打开后进入，避免设置重绘留下空白半屏。
                pendingPanelId = targetPanel.id;
            } else {
                pendingPanelId = null;
            }

            // 原生抽屉处理器随后才会切换当前按钮；这里先清理其它抽屉，
            // 避免角色卡的 pinnedOpen 状态与新面板并存或阻塞切换。
            closeCompetingPanels(currentDrawer);
            queueMicrotask(scheduleFocusSync);
            return;
        }
        if (target?.closest('#top-settings-holder .drawer')) {
            return;
        }
        if (getThemePanels().some(panelIsOpen)) {
            void closeFocusWorkspace();
            return;
        }
        pendingPanelId = null;
        queueMicrotask(scheduleFocusSync);
    }

    function closeExtensionManagerOnBackdrop(event) {
        const dialog = event.target instanceof HTMLDialogElement ? event.target : null;
        if (!dialog?.open || !dialog.matches('dialog.popup') || !dialog.querySelector('.extensions_info')) {
            return;
        }

        const bounds = dialog.getBoundingClientRect();
        const outsideDialog = event.clientX < bounds.left
            || event.clientX > bounds.right
            || event.clientY < bounds.top
            || event.clientY > bounds.bottom;
        if (!outsideDialog) {
            return;
        }

        dialog.querySelector('.popup-button-ok[data-result]')?.click();
    }

    function isMessageMetaMessage(message, chat) {
        return message instanceof HTMLElement
            && message.parentElement === chat
            && message.matches(MESSAGE_META_MESSAGE_SELECTOR);
    }

    function getMessageMetaVisibilitySignature() {
        const body = document.body;
        return [
            body?.classList.contains('no-timestamps'),
            body?.classList.contains('no-tokenCount'),
            body?.classList.contains('no-timer'),
        ].join('|');
    }

    function isMessageMetaFieldVisible(field) {
        if (!field.textContent.trim()) {
            return false;
        }
        const body = document.body;
        return !(field.classList.contains('timestamp') && body.classList.contains('no-timestamps'))
            && !(field.classList.contains('tokenCounterDisplay') && body.classList.contains('no-tokenCount'))
            && !(field.classList.contains('mes_timer') && body.classList.contains('no-timer'));
    }

    function formatCloudNoteNumber(value) {
        const number = Math.max(0, Math.trunc(Number(value) || 0));
        const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const units = ['', '十', '百', '千'];
        const formatSection = (section) => {
            let result = '';
            let needsZero = false;
            for (let index = 3; index >= 0; index -= 1) {
                const divisor = 10 ** index;
                const digit = Math.floor(section / divisor) % 10;
                if (digit > 0) {
                    if (needsZero && result) {
                        result += digits[0];
                    }
                    result += `${digits[digit]}${units[index]}`;
                    needsZero = false;
                } else if (result) {
                    needsZero = true;
                }
            }
            return result || digits[0];
        };
        if (number < 10000) {
            return formatSection(number);
        }
        const high = Math.floor(number / 10000);
        const low = number % 10000;
        return `${formatSection(high)}万${low ? `${low < 1000 ? digits[0] : ''}${formatSection(low)}` : ''}`;
    }

    function syncCloudNoteNumber(message) {
        const messageId = Number(message.getAttribute('mesid'));
        if (Number.isInteger(messageId) && messageId >= 0) {
            message.dataset.xyMessageNote = formatCloudNoteNumber(messageId + 1);
        }
    }

    function syncMessageMetaCard(message) {
        syncCloudNoteNumber(message);
        const block = message.querySelector(':scope > .mes_block');
        if (!(block instanceof HTMLElement)) {
            return;
        }

        let meta = block.querySelector(':scope > .xy-message-meta');
        if (!(meta instanceof HTMLElement)) {
            meta = document.createElement('div');
            meta.className = 'xy-message-meta';
            meta.setAttribute('aria-live', 'polite');
            const content = block.querySelector(':scope > .mes_reasoning_details, :scope > .mes_text');
            block.insertBefore(meta, content);
        }

        const fields = [
            message.querySelector('.timestamp'),
            message.querySelector('.tokenCounterDisplay'),
            message.querySelector('.mes_timer'),
        ].filter((field) => field instanceof HTMLElement);
        fields.forEach((field) => {
            if (field.parentElement !== meta) {
                meta.append(field);
            }
        });

        meta.classList.toggle('xy-message-meta-empty', !fields.some(isMessageMetaFieldVisible));
    }

    function requestMessageMetaFlush() {
        if (messageMetaFrame !== null) {
            return;
        }

        messageMetaFrame = requestAnimationFrame(() => {
            messageMetaFrame = null;
            const chat = document.querySelector('#chat');
            if (!(chat instanceof HTMLElement)) {
                messageMetaPendingMessages.clear();
                messageMetaNeedsFullScan = false;
                return;
            }

            if (messageMetaNeedsFullScan) {
                messageMetaNeedsFullScan = false;
                [...chat.children].forEach((message) => {
                    if (isMessageMetaMessage(message, chat)) {
                        messageMetaPendingMessages.add(message);
                    }
                });
            }

            const messages = [...messageMetaPendingMessages];
            messageMetaPendingMessages.clear();
            messages.forEach(syncCloudNoteNumber);
            messages.slice(0, MESSAGE_META_BATCH_SIZE).forEach((message) => {
                if (isMessageMetaMessage(message, chat)) {
                    syncMessageMetaCard(message);
                }
            });
            messages.slice(MESSAGE_META_BATCH_SIZE).forEach((message) => messageMetaPendingMessages.add(message));

            if (messageMetaNeedsFullScan || messageMetaPendingMessages.size) {
                requestMessageMetaFlush();
            }
        });
    }

    function scheduleMessageMetaCards(messages = null) {
        if (messages) {
            messages.forEach((message) => {
                if (message instanceof HTMLElement) {
                    messageMetaPendingMessages.add(message);
                }
            });
        } else {
            messageMetaNeedsFullScan = true;
        }
        requestMessageMetaFlush();
    }

    function getMessageMetaMessage(node, chat) {
        const element = node instanceof Element ? node : node.parentElement;
        if (!(element instanceof Element) || element.closest('.xy-message-meta')) {
            return null;
        }
        const message = element.closest(MESSAGE_META_MESSAGE_SELECTOR);
        return isMessageMetaMessage(message, chat) ? message : null;
    }

    function bindMessageMetaCards() {
        const chat = document.querySelector('#chat');
        if (!(chat instanceof HTMLElement)) {
            return;
        }

        messageMetaObserver?.disconnect();
        messageMetaObserver = new MutationObserver((mutations) => {
            const affectedMessages = new Set();
            mutations.forEach((mutation) => {
                const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
                if (!(target instanceof Element) || target.closest('.xy-message-meta')) {
                    return;
                }
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) {
                        return;
                    }
                    if (isMessageMetaMessage(node, chat)) {
                        affectedMessages.add(node);
                        return;
                    }
                    if (node.matches(MESSAGE_META_RELEVANT_NODE_SELECTOR)) {
                        const message = getMessageMetaMessage(node, chat);
                        if (message) {
                            affectedMessages.add(message);
                        }
                    }
                });
            });
            if (affectedMessages.size) {
                scheduleMessageMetaCards(affectedMessages);
            }
        });
        messageMetaObserver.observe(chat, {
            childList: true,
            subtree: true,
        });
        messageMetaSettingsObserver?.disconnect();
        messageMetaVisibilitySignature = getMessageMetaVisibilitySignature();
        messageMetaSettingsObserver = new MutationObserver(() => {
            const nextSignature = getMessageMetaVisibilitySignature();
            if (nextSignature === messageMetaVisibilitySignature) {
                return;
            }
            messageMetaVisibilitySignature = nextSignature;
            scheduleMessageMetaCards();
        });
        messageMetaSettingsObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });
        scheduleMessageMetaCards();
    }

    window.addEventListener('mousedown', protectFocusPanelFromNativeDrawerClose, true);
    window.addEventListener('touchstart', protectFocusPanelFromNativeDrawerClose, true);
    document.addEventListener('click', closeOnOutsideClick, true);
    document.addEventListener('click', closeExtensionManagerOnBackdrop, true);
    document.addEventListener('click', optimisticallyReorderPinnedChat, true);
    document.addEventListener('change', (event) => {
        const select = event.target instanceof HTMLSelectElement ? event.target : null;
        if (!select?.matches('#world_editor_select') || worldbookRestoreInFlight) {
            return;
        }
        renderWorldbookReader();
        rememberWorldbookSelection();
    });
    document.addEventListener('click', (event) => {
        const header = event.target instanceof Element
            ? event.target.closest('#WorldInfo #wiTopBlock .inline-drawer-header')
            : null;
        if (header) {
            requestAnimationFrame(fitWorldbookStrategySelect);
        }
    });
    window.addEventListener('pagehide', persistActiveWorldbookMemory);
    window.addEventListener('beforeunload', persistActiveWorldbookMemory);
    enforceThemePresentation();
    applyThemeDisplayDefaults();
    bindThemeChatWidth();
    requestAnimationFrame(bindThemeChatWidth);
    bindThemePanelSwitching();
    bindWelcomeSelectionGuard();
    const focusObserver = new MutationObserver((mutations) => {
        const needsPresentation = mutations.some((mutation) => mutation.target === document.body
            && (!document.body.classList.contains('bubblechat')
                || document.body.classList.contains('documentstyle')
                || document.body.classList.contains('big-avatars')
                || document.body.classList.contains('square-avatars')
                || document.body.classList.contains('rounded-avatars')));
        scheduleFocusSync(needsPresentation);
    });
    focusObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    getThemePanels().forEach((panel) => {
        focusObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
    });
    const welcomeRoot = document.querySelector('#chat');
    welcomeObserver = new MutationObserver((mutations) => {
        const panel = welcomeRoot?.querySelector(':scope > .welcomePanel');
        if (!panel) {
            activeWelcomePanel?.__xyWelcomeInteractionEffects?.destroy();
            activeWelcomePanel?.__xyWelcomeLogoTilt?.destroy();
            document.getElementById('xy-recent-chat-preview')?.__xyRecentPreviewDestroy?.();
            activeWelcomePanel = null;
            return;
        }

        const recentList = panel.querySelector('.welcomeRecent .recentChatList');
        const recentController = recentList?.__xyRecentWindowController;
        const currentCards = recentList
            ? [...recentList.querySelectorAll(':scope > .recentChat')]
            : [];
        const onlyReorderedRecentCards = recentController
            && currentCards.length === recentController.cards.length
            && currentCards.every((card) => recentController.cards.includes(card))
            && mutations.length > 0
            && mutations.every((mutation) => {
                const target = mutation.target instanceof Element
                    ? mutation.target
                    : mutation.target.parentElement;
                return target instanceof Element
                    && target.closest('.welcomeRecent .recentChatList') === recentList;
            });
        if (!onlyReorderedRecentCards) {
            scheduleWelcomeHome();
        }
    });
    if (welcomeRoot) {
        welcomeObserver.observe(welcomeRoot, { childList: true, subtree: true });
    }

    // 延迟重试，覆盖酒馆原生抽屉和持久化状态的异步初始化。
    document.addEventListener('DOMContentLoaded', closeStartupPanels, { once: true });
    closeStartupPanels();
    applyLocalAssetUrls();
    ensureNavInk();
    ensureVesselHub();
    ensureSidebar();
    ensureSidebarGrainient();
    ensureFocusScrim();
    bindAiPromptEditorState();
    ensureSearchableSelects();
    bindWorldbookShortcuts();
    ensureComposerPlaceholder();
    ensureComposerEffects();
    ensureComposerMenuAlignment();
    void ensureGenderDialogue();
    void ensureFloatingBallDock();
    syncHomePixelSnow();
    ensureWelcomeHome();
    bindMessageMetaCards();
    syncFocusMode();
    setTimeout(closeStartupPanels, 500);
    setTimeout(closeStartupPanels, 1500);
    setTimeout(ensureComposerPlaceholder, 500);
    setTimeout(ensureComposerPlaceholder, 1500);
    setTimeout(ensureComposerEffects, 500);
    setTimeout(ensureComposerEffects, 1500);
    setTimeout(ensureComposerMenuAlignment, 500);
    setTimeout(() => void ensureGenderDialogue(), 500);
    setTimeout(() => void ensureGenderDialogue(), 1500);
    setTimeout(() => void ensureGenderDialogue(), 3000);
    setTimeout(scheduleWelcomeHome, 500);
    setTimeout(scheduleWelcomeHome, 1500);
    setTimeout(applyThemeDisplayDefaults, 500);
    setTimeout(applyThemeDisplayDefaults, 1500);

    // 首次载入当前扩展版本时刷新一次，确保酒馆重新加载全部主题资源。
    if (window.localStorage.getItem(INSTALL_REFRESH_STORAGE_KEY) !== EXTENSION_VERSION) {
        window.localStorage.setItem(INSTALL_REFRESH_STORAGE_KEY, EXTENSION_VERSION);
        window.setTimeout(() => window.location.reload(), 0);
    }
})();
