const STORAGE_KEY = 'xy-floating-ball-dock-v1';
const DOCK_MODE_STORAGE_KEY = 'xy-floating-ball-dock-mode-v1';
const DOCK_ID = 'xy-floating-ball-dock';
const CAPTURE_LAYER_ID = 'xy-floating-ball-capture-layer';
const CAPTURED_ATTRIBUTE = 'data-xy-floating-ball-captured';
const MAX_STABLE_CLASSES = 8;
const RESTORE_DELAY = 280;
const LARGE_DOCK_THRESHOLD = 10;
const PROTECTED_CAPTURE_SELECTOR = '#xy-sidebar-toggle, #xy-vessel-hub';
const CAPTURED_ICON_SIZE = 64;
const CAPTURED_VISUAL_SIZE = 48;
const POPUP_GAP = 10;
const POPUP_VIEWPORT_MARGIN = 10;
const STATE_CLASS_NAMES = new Set([
    'active',
    'closed',
    'disabled',
    'focus',
    'focused',
    'hidden',
    'hover',
    'open',
    'selected',
    'show',
    'shown',
    'visible',
]);

function isElementNode(value) {
    return Boolean(value
        && value.nodeType === 1
        && typeof value.getAttribute === 'function'
        && typeof value.closest === 'function');
}

function isStylableElement(value) {
    return Boolean(isElementNode(value)
        && value.style
        && typeof value.style.setProperty === 'function'
        && typeof value.getBoundingClientRect === 'function');
}

function getClassNames(element) {
    const classValue = element.getAttribute('class') || '';
    return classValue
        .split(/\s+/)
        .map((className) => className.trim())
        .filter((className) => className
            && !className.startsWith('xy-')
            && !className.startsWith('data-v-')
            && !/^_[a-z0-9]+$/i.test(className)
            && !STATE_CLASS_NAMES.has(className))
        .sort()
        .slice(0, MAX_STABLE_CLASSES);
}

function getScriptId(element) {
    return element.getAttribute('script_id')
        || element.closest('[script_id]')?.getAttribute('script_id')
        || null;
}

export function getFloatingBallFingerprint(element) {
    if (!isElementNode(element)) {
        return null;
    }

    return {
        ariaLabel: element.getAttribute('aria-label') || null,
        classNames: getClassNames(element),
        elementId: element.id && !element.id.startsWith('xy-') ? element.id : null,
        scriptId: getScriptId(element),
        tagName: element.tagName.toLowerCase(),
        title: element.getAttribute('title') || null,
    };
}

function isPersistentFingerprint(fingerprint) {
    return Boolean(fingerprint?.scriptId
        || fingerprint?.elementId
        || fingerprint?.title
        || fingerprint?.ariaLabel
        || fingerprint?.classNames?.length);
}

function suppressNativeTitles(element) {
    if (!isStylableElement(element)) {
        return [];
    }
    const titledElements = [element, ...element.querySelectorAll('[title]')]
        .filter((candidate) => candidate.hasAttribute('title'));
    const records = titledElements.map((candidate) => ({
        element: candidate,
        title: candidate.getAttribute('title'),
    }));
    titledElements.forEach((candidate) => candidate.removeAttribute('title'));
    return records;
}

function restoreNativeTitles(records) {
    records?.forEach(({ element, title }) => {
        if (isStylableElement(element) && title !== null) {
            element.setAttribute('title', title);
        }
    });
}

function getFingerprintKey(fingerprint) {
    return JSON.stringify({
        ariaLabel: fingerprint?.ariaLabel || null,
        classNames: fingerprint?.classNames || [],
        elementId: fingerprint?.elementId || null,
        scriptId: fingerprint?.scriptId || null,
        tagName: fingerprint?.tagName || null,
        title: fingerprint?.title || null,
    });
}

function scoreFingerprintMatch(candidate, expected) {
    if (!candidate || !expected) {
        return -1;
    }

    let score = 0;
    if (expected.scriptId) {
        if (candidate.scriptId !== expected.scriptId) {
            return -1;
        }
        score += 60;
    }
    if (expected.elementId) {
        if (candidate.elementId !== expected.elementId) {
            return -1;
        }
        score += 80;
    }
    if (expected.classNames?.length) {
        const candidateClasses = new Set(candidate.classNames || []);
        if (!expected.classNames.every((className) => candidateClasses.has(className))) {
            return -1;
        }
        score += 12 + expected.classNames.length * 4;
    }
    if (expected.title) {
        if (candidate.title !== expected.title) {
            return -1;
        }
        score += 24;
    }
    if (expected.ariaLabel) {
        if (candidate.ariaLabel !== expected.ariaLabel) {
            return -1;
        }
        score += 24;
    }
    if (expected.tagName === candidate.tagName) {
        score += 4;
    }
    return score;
}

function loadSavedDescriptors() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter((item) => item && isPersistentFingerprint(item.fingerprint))
            .map((item, order) => ({
                fingerprint: item.fingerprint,
                name: String(item.name || '悬浮球'),
                order: Number.isFinite(item.order) ? item.order : order,
            }));
    } catch {
        return [];
    }
}

function saveDescriptors(descriptors) {
    try {
        const serializable = descriptors
            .filter((item) => isPersistentFingerprint(item.fingerprint))
            .map((item, order) => ({
                fingerprint: item.fingerprint,
                name: item.name,
                order,
            }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
        // Storage denial does not prevent current-page capture.
    }
}

function getElementName(element) {
    const label = element.getAttribute('aria-label')
        || element.getAttribute('title')
        || element.querySelector('[aria-label]')?.getAttribute('aria-label')
        || element.querySelector('[title]')?.getAttribute('title')
        || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 36);
    return label || getScriptId(element) || element.id || '悬浮球';
}

function isVisibleElement(element, style = getComputedStyle(element)) {
    if (style.display === 'none'
        || style.visibility === 'hidden'
        || Number.parseFloat(style.opacity) === 0) {
        return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width >= 16 && rect.height >= 16;
}

function isDockElement(element) {
    return Boolean(element.closest(`#${DOCK_ID}, #${CAPTURE_LAYER_ID}`));
}

function isProtectedCaptureElement(element) {
    return Boolean(element.closest(PROTECTED_CAPTURE_SELECTOR));
}

function isProtectedFingerprint(fingerprint) {
    return fingerprint?.elementId === 'xy-sidebar-toggle'
        || fingerprint?.elementId === 'xy-vessel-hub';
}

export function scoreFloatingBallCandidate(element) {
    if (!isStylableElement(element)
        || element === document.body
        || element === document.documentElement
        || isDockElement(element)
        || isProtectedCaptureElement(element)
        || element.hasAttribute(CAPTURED_ATTRIBUTE)) {
        return -1;
    }

    const style = getComputedStyle(element);
    if (!isVisibleElement(element, style)) {
        return -1;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width > 180 || rect.height > 180) {
        return -1;
    }
    const aspectRatio = rect.width / rect.height;
    if (aspectRatio < .35 || aspectRatio > 2.85) {
        return -1;
    }

    const identity = [
        element.id,
        element.getAttribute('class'),
        element.getAttribute('title'),
        element.getAttribute('aria-label'),
        element.getAttribute('role'),
    ].filter(Boolean).join(' ').toLowerCase();
    const isNamedLikeBall = /(ball|float|floating|fab|launcher|bubble|orb|悬浮|浮球)/i.test(identity);
    const isInteractive = element.matches('button, a, [role="button"], .menu_button, .interactable')
        || style.cursor === 'pointer'
        || style.cursor === 'move'
        || style.cursor === 'grab';
    const isDraggable = element.classList.contains('ui-draggable')
        || element.getAttribute('draggable') === 'true';
    const hasIcon = Boolean(element.querySelector('i, svg, img, canvas'));
    const borderRadius = Number.parseFloat(style.borderTopLeftRadius) || 0;
    const isRound = borderRadius >= Math.min(rect.width, rect.height) * .32;
    const zIndex = Number.parseInt(style.zIndex, 10);

    let score = 0;
    if (style.position === 'fixed') {
        score += 120;
    } else if (style.position === 'sticky') {
        score += 80;
    } else if (style.position === 'absolute') {
        score += 22;
    }
    if (isNamedLikeBall) {
        score += 48;
    }
    if (getScriptId(element)) {
        score += 36;
    }
    if (isDraggable) {
        score += 34;
    }
    if (isInteractive) {
        score += 24;
    }
    if (hasIcon) {
        score += 10;
    }
    if (isRound) {
        score += 12;
    }
    if (Number.isFinite(zIndex) && zIndex > 100) {
        score += Math.min(24, Math.log10(zIndex) * 6);
    }
    if (rect.width <= 112 && rect.height <= 112) {
        score += 10;
    }
    return score >= 54 ? score : -1;
}

function getCandidateAtPoint(clientX, clientY) {
    const candidates = [];
    const visited = new Set();
    const stack = document.elementsFromPoint(clientX, clientY);
    if (stack.some((element) => isElementNode(element)
        && isProtectedCaptureElement(element))) {
        return null;
    }

    stack.forEach((stackElement, stackIndex) => {
        let element = stackElement;
        while (isStylableElement(element) && element !== document.body) {
            if (visited.has(element)) {
                element = element.parentElement;
                continue;
            }
            visited.add(element);
            const score = scoreFloatingBallCandidate(element);
            if (score >= 0) {
                const rect = element.getBoundingClientRect();
                candidates.push({
                    area: rect.width * rect.height,
                    element,
                    score,
                    stackIndex,
                });
            }
            element = element.parentElement;
        }
    });

    candidates.sort((left, right) => right.score - left.score
        || left.stackIndex - right.stackIndex
        || left.area - right.area);
    return candidates[0]?.element || null;
}

function getElementVisualMetrics(element) {
    const rootRect = element.getBoundingClientRect();
    const rootWidth = rootRect.width || element.offsetWidth || CAPTURED_ICON_SIZE;
    const rootHeight = rootRect.height || element.offsetHeight || CAPTURED_ICON_SIZE;
    const rootSize = Math.max(rootWidth, rootHeight, CAPTURED_ICON_SIZE);
    const bounds = {
        bottom: rootRect.bottom,
        left: rootRect.left,
        right: rootRect.right,
        top: rootRect.top,
    };
    const rootCenterX = rootRect.left + rootWidth / 2;
    const rootCenterY = rootRect.top + rootHeight / 2;

    [...element.children].forEach((child) => {
        if (!isStylableElement(child)) {
            return;
        }
        const style = getComputedStyle(child);
        const rect = child.getBoundingClientRect();
        const childCenterX = rect.left + rect.width / 2;
        const childCenterY = rect.top + rect.height / 2;
        const centerDistance = Math.hypot(childCenterX - rootCenterX, childCenterY - rootCenterY);
        const isVisible = style.display !== 'none'
            && style.visibility !== 'hidden'
            && Number.parseFloat(style.opacity) > .05
            && rect.width > 0
            && rect.height > 0;
        const isNearBall = centerDistance <= rootSize * 1.75
            && rect.width <= rootSize * 2.5
            && rect.height <= rootSize * 2.5;
        if (!isVisible || !isNearBall) {
            return;
        }
        bounds.left = Math.min(bounds.left, rect.left);
        bounds.top = Math.min(bounds.top, rect.top);
        bounds.right = Math.max(bounds.right, rect.right);
        bounds.bottom = Math.max(bounds.bottom, rect.bottom);
    });
    const visualWidth = Math.max(1, bounds.right - bounds.left);
    const visualHeight = Math.max(1, bounds.bottom - bounds.top);
    return {
        height: rootHeight,
        scale: Math.min(1, CAPTURED_VISUAL_SIZE / Math.max(visualWidth, visualHeight)),
        visualCenterX: (bounds.left + bounds.right) / 2 - rootRect.left,
        visualCenterY: (bounds.top + bounds.bottom) / 2 - rootRect.top,
        width: rootWidth,
    };
}

function setCapturedInlineStyle(element, metrics) {
    const { height, scale, visualCenterX, visualCenterY, width } = metrics;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const desiredLeft = CAPTURED_ICON_SIZE / 2 - visualCenterX * scale;
    const desiredTop = CAPTURED_ICON_SIZE / 2 - visualCenterY * scale;
    const constrainPosition = (value, scaledSize) => Number.isFinite(value)
        && value >= -scaledSize
        && value <= CAPTURED_ICON_SIZE
        ? value
        : (CAPTURED_ICON_SIZE - scaledSize) / 2;
    const properties = {
        bottom: 'auto',
        height: `${height}px`,
        left: `${constrainPosition(desiredLeft, scaledWidth)}px`,
        margin: '0',
        opacity: '1',
        position: 'absolute',
        right: 'auto',
        top: `${constrainPosition(desiredTop, scaledHeight)}px`,
        transform: `scale(${scale})`,
        'transform-origin': '0 0',
        visibility: 'visible',
        width: `${width}px`,
        'z-index': 'auto',
    };
    Object.entries(properties).forEach(([name, value]) => {
        element.style.setProperty(name, value, 'important');
    });
}

function shouldProxyCapturedElement(element) {
    const style = getComputedStyle(element);
    if (style.position === 'fixed'
        || element.classList.contains('ui-draggable')
        || element.getAttribute('draggable') === 'true') {
        return true;
    }

    let current = element;
    let depth = 0;
    while (isStylableElement(current) && depth < 5) {
        const runtimeKeys = Object.getOwnPropertyNames(current);
        const hasFrameworkRuntime = runtimeKeys.some((key) => key === '__ngContext__'
            || key.startsWith('__reactFiber$')
            || key.startsWith('__reactProps$')
            || key.startsWith('__svelte')
            || key.startsWith('__vue'));
        const hasScopedComponentAttribute = [...current.attributes]
            .some((attribute) => attribute.name.startsWith('data-v-'));
        if (hasFrameworkRuntime || hasScopedComponentAttribute || current.hasAttribute('data-reactroot')) {
            return true;
        }
        current = current.parentElement;
        depth += 1;
    }
    return false;
}

function createCapturedProxy(element) {
    const proxy = element.cloneNode(true);
    [...proxy.querySelectorAll('*')].forEach((node) => {
        node.removeAttribute('id');
        [...node.attributes].forEach((attribute) => {
            if (attribute.name.toLowerCase().startsWith('on')) {
                node.removeAttribute(attribute.name);
            }
        });
    });
    proxy.removeAttribute('draggable');
    proxy.setAttribute('data-xy-floating-ball-captured', 'true');
    proxy.setAttribute('data-xy-floating-ball-proxy', 'true');
    proxy.setAttribute('aria-label', `${getElementName(element)}（已收纳）`);
    return proxy;
}

function getProxyStyleContext(element) {
    const ancestors = [];
    let current = element.parentElement;
    let depth = 0;
    while (isElementNode(current)
        && current !== document.body
        && current !== document.documentElement
        && depth < 5) {
        const className = current.getAttribute('class') || '';
        const elementId = current.id || '';
        const contextAttributes = [...current.attributes]
            .filter((attribute) => (attribute.name.startsWith('data-')
                && !attribute.name.startsWith('data-xy-'))
                || attribute.name === 'script_id');
        if (className || elementId || contextAttributes.length) {
            ancestors.unshift({
                className,
                contextAttributes,
                elementId,
                inlineStyle: current.getAttribute('style') || '',
            });
        }
        current = current.parentElement;
        depth += 1;
    }
    return ancestors;
}

function createProxyStyleContext(proxy, ancestors) {
    let contextRoot = null;
    let contextParent = null;
    ancestors.forEach(({
        className,
        contextAttributes,
        elementId,
        inlineStyle,
    }) => {
        const wrapper = document.createElement('div');
        wrapper.className = `xy-floating-ball-style-context ${className}`.trim();
        if (elementId) {
            wrapper.id = elementId;
        }
        if (inlineStyle) {
            wrapper.style.cssText = inlineStyle;
        }
        contextAttributes.forEach((attribute) => {
            wrapper.setAttribute(attribute.name, attribute.value);
        });
        if (contextParent) {
            contextParent.append(wrapper);
        } else {
            contextRoot = wrapper;
        }
        contextParent = wrapper;
    });
    if (contextParent) {
        contextParent.append(proxy);
        return contextRoot;
    }
    return proxy;
}

function hideProxySource(element) {
    element.setAttribute(CAPTURED_ATTRIBUTE, 'true');
    element.style.setProperty('pointer-events', 'none', 'important');
    element.style.setProperty('translate', '-200vw 0', 'important');
}

function getDescendantPath(root, target) {
    const path = [];
    let current = target;
    while (isElementNode(current) && current !== root) {
        const parent = current.parentElement;
        if (!isElementNode(parent)) {
            return [];
        }
        path.unshift([...parent.children].indexOf(current));
        current = parent;
    }
    return current === root ? path : [];
}

function resolveDescendantPath(root, path) {
    let current = root;
    path.forEach((index) => {
        current = current?.children?.[index] || null;
    });
    return current;
}

function setDraggableState(element, enabled) {
    if (typeof window.$ !== 'function') {
        return;
    }
    try {
        const target = window.$(element);
        if (target.hasClass('ui-draggable')) {
            target.draggable(enabled ? 'enable' : 'disable');
        }
    } catch {
        // Not every jQuery build includes draggable.
    }
}

export function mountFloatingBallDock() {
    if (window.__xyFloatingBallDockController) {
        return window.__xyFloatingBallDockController;
    }

    const dock = document.createElement('aside');
    dock.id = DOCK_ID;
    dock.setAttribute('aria-label', '悬浮球收纳');

    const list = document.createElement('div');
    list.className = 'xy-floating-ball-dock__list';
    list.setAttribute('role', 'list');

    const captureButton = document.createElement('button');
    captureButton.id = 'xy-floating-ball-capture-button';
    captureButton.type = 'button';
    captureButton.setAttribute('data-tooltip', '捕捉悬浮球');
    captureButton.setAttribute('aria-label', '捕捉悬浮球');
    captureButton.setAttribute('aria-pressed', 'false');
    captureButton.innerHTML = '<i class="fa-solid fa-crosshairs" aria-hidden="true"></i>';

    const releaseAllButton = document.createElement('button');
    releaseAllButton.id = 'xy-floating-ball-release-all-button';
    releaseAllButton.type = 'button';
    releaseAllButton.setAttribute('data-tooltip', '释放全部悬浮球');
    releaseAllButton.setAttribute('aria-label', '释放全部悬浮球');
    releaseAllButton.innerHTML = '<i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i>';

    const toggleButton = document.createElement('button');
    toggleButton.id = 'xy-floating-ball-toggle-button';
    toggleButton.type = 'button';
    toggleButton.innerHTML = '<span class="xy-sidebar-toggle__glyph" aria-hidden="true"><i class="xy-sidebar-toggle__icon fa-solid fa-angles-left"></i></span>';

    const actions = document.createElement('div');
    actions.className = 'xy-floating-ball-dock__actions';
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', '悬浮球收纳操作');
    actions.append(releaseAllButton, captureButton);

    dock.append(toggleButton, list, actions);
    document.body.append(dock);

    let savedDescriptors = loadSavedDescriptors()
        .filter((descriptor) => !isProtectedFingerprint(descriptor.fingerprint));
    saveDescriptors(savedDescriptors);
    const capturedEntries = new Map();
    let captureLayer = null;
    let captureHighlight = null;
    let highlightedCandidate = null;
    let pointerFrame = null;
    let pendingPointer = null;
    let restoreTimer = null;
    let popupSyncFrame = null;
    let pendingPopupDetection = null;
    let popupOpenObserver = null;
    let popupOpenWatchTimer = null;
    let dockTween = null;
    const managedPopups = new Map();
    const popupStateObserver = new MutationObserver(() => {
        if (managedPopups.size) {
            schedulePopupSync();
        }
    });

    const rebindPopupStateObserver = () => {
        popupStateObserver.disconnect();
        managedPopups.forEach((_record, popup) => {
            if (popup.isConnected) {
                popupStateObserver.observe(popup, {
                    attributes: true,
                    attributeFilter: ['aria-hidden', 'class', 'hidden', 'open'],
                });
            }
            const entry = capturedEntries.get(_record.entryKey);
            if (entry?.element?.isConnected) {
                popupStateObserver.observe(entry.element, {
                    attributes: true,
                    attributeFilter: ['aria-expanded', 'aria-hidden', 'class', 'hidden', 'open'],
                });
            }
        });
    };

    const updateDockState = () => {
        const count = capturedEntries.size;
        dock.dataset.xyFloatingBallCount = String(count);
        dock.classList.toggle('xy-floating-ball-dock--has-balls', count > 0);
        captureButton.setAttribute('aria-label', `捕捉悬浮球，当前已收纳 ${count} 个`);
        releaseAllButton.disabled = count === 0;
        const totalBallHeight = [...capturedEntries.values()]
            .reduce((height) => height + CAPTURED_ICON_SIZE, 0) + Math.max(0, count - 1) * 8;
        dock.classList.toggle('xy-floating-ball-dock--scrolling',
            count >= LARGE_DOCK_THRESHOLD || totalBallHeight > window.innerHeight * .68);
    };

    const applyDockMode = (mode, persist = true) => {
        const nextMode = mode === 'hidden' ? 'hidden' : 'expanded';
        const hidden = nextMode === 'hidden';
        dock.dataset.xyFloatingBallMode = nextMode;
        toggleButton.setAttribute('aria-pressed', String(hidden));
        toggleButton.setAttribute('aria-label', hidden ? '展开悬浮球收纳' : '收起悬浮球收纳');
        toggleButton.setAttribute('data-tooltip', hidden ? '展开悬浮球收纳' : '收起悬浮球收纳');
        if (persist) {
            try {
                window.localStorage.setItem(DOCK_MODE_STORAGE_KEY, nextMode);
            } catch {
                // Storage denial does not affect the current-page dock state.
            }
        }
    };

    const cancelDockAnimation = () => {
        dockTween?.forEach((animation) => animation.cancel());
        dockTween = null;
        delete dock.dataset.xyFloatingBallAnimating;
    };

    const setDockMode = async (mode, persist = true, animate = true) => {
        const nextMode = mode === 'hidden' ? 'hidden' : 'expanded';
        const currentMode = dock.dataset.xyFloatingBallMode === 'expanded'
            ? 'expanded'
            : 'hidden';
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (dock.dataset.xyFloatingBallAnimating === 'true') {
            return;
        }
        if (!animate || reduceMotion || nextMode === currentMode || typeof dock.animate !== 'function') {
            cancelDockAnimation();
            applyDockMode(nextMode, persist);
            return;
        }

        cancelDockAnimation();
        dock.dataset.xyFloatingBallAnimating = 'true';
        const arrow = toggleButton.querySelector('.xy-sidebar-toggle__icon');
        const options = {
            duration: 500,
            easing: 'cubic-bezier(.45, 0, .55, 1)',
            fill: 'both',
        };
        const animations = [];
        if (nextMode === 'expanded') {
            applyDockMode('expanded', persist);
            animations.push(dock.animate([
                { transform: 'translate(100%, -50%)' },
                { transform: 'translate(0, -50%)' },
            ], options));
            if (isStylableElement(arrow)) {
                animations.push(arrow.animate([
                    { transform: 'rotate(0deg)' },
                    { transform: 'rotate(180deg)' },
                ], options));
            }
        } else {
            if (persist) {
                try {
                    window.localStorage.setItem(DOCK_MODE_STORAGE_KEY, 'hidden');
                } catch {
                    // Storage denial does not affect the current-page dock state.
                }
            }
            animations.push(dock.animate([
                { transform: 'translate(0, -50%)' },
                { transform: 'translate(100%, -50%)' },
            ], options));
            if (isStylableElement(arrow)) {
                animations.push(arrow.animate([
                    { transform: 'rotate(180deg)' },
                    { transform: 'rotate(0deg)' },
                ], options));
            }
        }
        dockTween = animations;
        try {
            await Promise.all(animations.map((animation) => animation.finished));
        } catch {
            if (dockTween === animations) {
                cancelDockAnimation();
            }
            return;
        }
        if (dockTween !== animations) {
            return;
        }
        if (nextMode === 'hidden') {
            applyDockMode('hidden', false);
        }
        cancelDockAnimation();
    };

    const persistEntries = () => {
        const order = [...list.querySelectorAll('.xy-floating-ball-slot')]
            .map((slot) => slot.dataset.xyFloatingBallKey);
        savedDescriptors.sort((left, right) => order.indexOf(getFingerprintKey(left.fingerprint))
            - order.indexOf(getFingerprintKey(right.fingerprint)));
        saveDescriptors(savedDescriptors);
    };

    const upsertDescriptor = (descriptor) => {
        const key = getFingerprintKey(descriptor.fingerprint);
        const index = savedDescriptors.findIndex((item) => getFingerprintKey(item.fingerprint) === key);
        if (index >= 0) {
            savedDescriptors[index] = descriptor;
        } else if (isPersistentFingerprint(descriptor.fingerprint)) {
            savedDescriptors.push(descriptor);
        }
    };

    const captureElement = (element, restoredDescriptor = null) => {
        if (!isStylableElement(element)
            || isDockElement(element)
            || isProtectedCaptureElement(element)) {
            return false;
        }
        if ([...capturedEntries.values()].some((entry) => entry.element === element)) {
            return false;
        }

        const fingerprint = restoredDescriptor?.fingerprint || getFloatingBallFingerprint(element);
        const key = restoredDescriptor
            ? getFingerprintKey(restoredDescriptor.fingerprint)
            : getFingerprintKey(fingerprint);
        if (capturedEntries.has(key)) {
            return false;
        }

        const metrics = getElementVisualMetrics(element);
        const proxyMode = shouldProxyCapturedElement(element);
        const inPlaceVisual = false;
        const displayElement = proxyMode ? createCapturedProxy(element) : element;
        const proxyStyleContext = getProxyStyleContext(element);
        const suppressedTitles = suppressNativeTitles(displayElement);
        const slot = document.createElement('div');
        slot.className = 'xy-floating-ball-slot';
        slot.classList.toggle('xy-floating-ball-slot--proxy', proxyMode);
        slot.dataset.xyFloatingBallKey = key;
        slot.setAttribute('role', 'listitem');
        const name = restoredDescriptor?.name || getElementName(element);

        const entry = {
            displayElement,
            element,
            fingerprint,
            key,
            name,
            originalNextSibling: element.nextSibling,
            originalParent: element.parentNode,
            originalStyle: element.style.cssText,
            inPlaceVisual,
            proxyMode,
            proxyStyleContext,
            scale: metrics.scale,
            slot,
            suppressedTitles,
            metrics,
        };
        capturedEntries.set(key, entry);
        if (proxyMode) {
            hideProxySource(element);
        } else {
            element.setAttribute(CAPTURED_ATTRIBUTE, 'true');
            setDraggableState(element, false);
        }
        list.append(slot);
        const displayContainer = proxyMode
            ? createProxyStyleContext(displayElement, proxyStyleContext)
            : displayElement;
        slot.append(displayContainer);
        setCapturedInlineStyle(displayElement, metrics);
        upsertDescriptor({ fingerprint, name, order: savedDescriptors.length });
        persistEntries();
        updateDockState();
        return true;
    };

    const bindProxySource = (entry, element) => {
        if (!isStylableElement(element) || isDockElement(element)) {
            return false;
        }
        entry.element = element;
        entry.originalNextSibling = element.nextSibling;
        entry.originalParent = element.parentNode;
        entry.originalStyle = element.style.cssText;
        hideProxySource(element);
        return true;
    };

    const convertEntryToProxy = (entry) => {
        if (entry.proxyMode) {
            return;
        }
        const detachedElement = entry.element;
        const proxy = createCapturedProxy(detachedElement);
        proxy.style.cssText = entry.originalStyle;
        entry.proxyMode = true;
        entry.displayElement = proxy;
        entry.slot.classList.add('xy-floating-ball-slot--proxy');
        entry.slot.replaceChildren(createProxyStyleContext(proxy, entry.proxyStyleContext));
        setCapturedInlineStyle(proxy, entry.metrics);

        if (detachedElement.isConnected && detachedElement.parentElement !== entry.slot) {
            detachedElement.removeAttribute(CAPTURED_ATTRIBUTE);
            detachedElement.style.cssText = entry.originalStyle;
            setDraggableState(detachedElement, true);
            bindProxySource(entry, detachedElement);
        } else {
            entry.element = null;
        }
    };

    const isOpenPopupCandidate = (element) => {
        if (!isStylableElement(element)
            || element === dock
            || element.classList.contains('xy-floating-ball-slot')
            || element.matches('#xy-floating-ball-capture-button, #xy-floating-ball-release-all-button')) {
            return false;
        }
        const style = getComputedStyle(element);
        if (style.display === 'none'
            || style.visibility === 'hidden'
            || Number.parseFloat(style.opacity) <= .05
            || style.pointerEvents === 'none') {
            return false;
        }
        const rect = element.getBoundingClientRect();
        if (rect.width < 96 || rect.height < 60) {
            return false;
        }
        const identity = [
            element.id,
            element.getAttribute('class'),
            element.getAttribute('role'),
        ].filter(Boolean).join(' ').toLowerCase();
        const belongsToCapturedBall = Boolean(element.closest(`[${CAPTURED_ATTRIBUTE}]`));
        const looksLikePopup = element.matches('dialog, [role="dialog"], [role="menu"], [role="listbox"]')
            || /(dialog|drawer|menu|panel|popover|popup|sheet)/i.test(identity)
            || ['fixed', 'absolute'].includes(style.position);
        return belongsToCapturedBall || looksLikePopup;
    };

    const getOpenPopupCandidates = () => [...document.documentElement.querySelectorAll('*')]
        .filter(isOpenPopupCandidate);

    const restoreManagedPopup = (popup) => {
        const record = managedPopups.get(popup);
        if (!record) {
            return;
        }
        // A native close control commonly changes the popup's inline display state. Preserve
        // that state before removing our placement overrides, otherwise restoring the style
        // captured while the popup was open immediately makes it visible again.
        const preserveClosedState = !isOpenPopupCandidate(popup);
        const closedInlineState = preserveClosedState
            ? ['display', 'visibility', 'opacity'].map((property) => ({
                property,
                priority: popup.style.getPropertyPriority(property),
                value: popup.style.getPropertyValue(property),
            })).filter(({ value }) => value)
            : [];
        managedPopups.delete(popup);
        rebindPopupStateObserver();
        popup.removeAttribute('data-xy-floating-popup-managed');
        if (record.reparented && record.originalParent?.isConnected) {
            if (record.originalNextSibling?.parentNode === record.originalParent) {
                record.originalParent.insertBefore(popup, record.originalNextSibling);
            } else {
                record.originalParent.append(popup);
            }
        }
        popup.style.cssText = record.originalStyle;
        closedInlineState.forEach(({ property, priority, value }) => {
            popup.style.setProperty(property, value, priority);
        });
    };

    const restoreEntryPopups = (entryKey) => {
        [...managedPopups.entries()].forEach(([popup, record]) => {
            if (record.entryKey === entryKey) {
                restoreManagedPopup(popup);
            }
        });
    };

    const positionManagedPopup = (popup, record) => {
        const entry = capturedEntries.get(record.entryKey);
        if (!entry || !popup.isConnected || !isOpenPopupCandidate(popup)) {
            restoreManagedPopup(popup);
            return;
        }

        const availableHeight = window.innerHeight - POPUP_VIEWPORT_MARGIN * 2;
        const anchorRect = toggleButton.getBoundingClientRect();
        const availableWidth = Math.max(160, anchorRect.left
            - POPUP_GAP
            - POPUP_VIEWPORT_MARGIN);
        popup.style.setProperty('max-height', `${availableHeight}px`, 'important');
        popup.style.setProperty('max-width', `${availableWidth}px`, 'important');

        let popupRect = popup.getBoundingClientRect();
        if (popupRect.height > availableHeight) {
            popup.style.setProperty('overflow-y', 'auto', 'important');
            popupRect = popup.getBoundingClientRect();
        }
        const slotRect = entry.slot.getBoundingClientRect();
        const desiredLeft = Math.max(
            POPUP_VIEWPORT_MARGIN,
            anchorRect.left - POPUP_GAP - popupRect.width,
        );
        const desiredTop = Math.min(
            Math.max(
                POPUP_VIEWPORT_MARGIN,
                slotRect.top + slotRect.height / 2 - popupRect.height / 2,
            ),
            Math.max(POPUP_VIEWPORT_MARGIN, window.innerHeight - POPUP_VIEWPORT_MARGIN - popupRect.height),
        );
        const inheritedScale = !entry.proxyMode && entry.element?.contains(popup)
            ? entry.scale
            : 1;
        record.translateX += (desiredLeft - popupRect.left) / inheritedScale;
        record.translateY += (desiredTop - popupRect.top) / inheritedScale;
        popup.style.setProperty(
            'translate',
            `${record.translateX}px ${record.translateY}px`,
            'important',
        );
        popup.style.setProperty('z-index', '7300', 'important');
    };

    const syncManagedPopups = () => {
        popupSyncFrame = null;
        [...managedPopups.entries()].forEach(([popup, record]) => {
            positionManagedPopup(popup, record);
        });
    };

    const schedulePopupSync = () => {
        if (popupSyncFrame !== null) {
            return;
        }
        popupSyncFrame = requestAnimationFrame(syncManagedPopups);
    };

    const manageOpenedPopups = (entry, baseline) => {
        if (!capturedEntries.has(entry.key)) {
            return 0;
        }
        const openCandidates = getOpenPopupCandidates();
        const candidates = openCandidates.filter((popup) => entry.element?.contains(popup)
            || !baseline.has(popup));
        const outermostCandidates = candidates.filter((popup) => !candidates.some((other) => other !== popup
            && other.contains(popup)));

        outermostCandidates.slice(0, 3).forEach((popup) => {
            if (!managedPopups.has(popup)) {
                const record = {
                    entryKey: entry.key,
                    originalStyle: popup.style.cssText,
                    originalNextSibling: popup.nextSibling,
                    originalParent: popup.parentNode,
                    reparented: false,
                    translateX: 0,
                    translateY: 0,
                };
                managedPopups.set(popup, record);
                popup.setAttribute('data-xy-floating-popup-managed', 'true');
                rebindPopupStateObserver();
            }
            positionManagedPopup(popup, managedPopups.get(popup));
        });
        return outermostCandidates.length;
    };

    const requestPopupClose = (popup) => {
        if (popup.tagName === 'DIALOG' && popup.open && typeof popup.close === 'function') {
            popup.close();
            return true;
        }
        const closeSelector = [
            '[data-close]',
            '[data-dismiss]',
            '[data-action="close"]',
            '[aria-label*="关闭"]',
            '[title*="关闭"]',
            '.close',
            '[class*="close"]',
            '.btn-close',
            '.popup-close',
            '.dialog-close',
        ].join(', ');
        const closeControl = popup.querySelector(closeSelector);
        if (isStylableElement(closeControl) && typeof closeControl.click === 'function') {
            closeControl.click();
            return true;
        }
        const popupRect = popup.getBoundingClientRect();
        const iconCloseControl = [...popup.querySelectorAll('button, [role="button"]')]
            .find((control) => {
                const rect = control.getBoundingClientRect();
                const label = (control.getAttribute('aria-label') || control.getAttribute('title') || control.textContent || '').trim();
                return !label && rect.top < popupRect.top + Math.min(96, popupRect.height * .28);
            });
        if (isStylableElement(iconCloseControl) && typeof iconCloseControl.click === 'function') {
            iconCloseControl.click();
            return true;
        }
        const escapeEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Escape',
        });
        popup.dispatchEvent(escapeEvent);
        document.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Escape',
        }));
        return true;
    };

    const closeEntryPopups = (entry) => {
        const openPopups = [...managedPopups.entries()]
            .filter(([popup, record]) => record.entryKey === entry.key && isOpenPopupCandidate(popup));
        if (!openPopups.length) {
            return false;
        }
        openPopups.forEach(([popup]) => requestPopupClose(popup));
        entry.suppressClickUntil = Date.now() + 700;
        window.setTimeout(() => {
            openPopups.forEach(([popup]) => {
                if (managedPopups.has(popup)) {
                    restoreManagedPopup(popup);
                }
            });
        }, 80);
        return true;
    };

    const stopPendingPopupDetection = () => {
        pendingPopupDetection = null;
        popupOpenObserver?.disconnect();
        popupOpenObserver = null;
        if (popupOpenWatchTimer !== null) {
            window.clearTimeout(popupOpenWatchTimer);
            popupOpenWatchTimer = null;
        }
    };

    const watchForOpenedPopup = (entry, baseline) => {
        stopPendingPopupDetection();
        const detection = {
            baseline,
            entryKey: entry.key,
        };
        pendingPopupDetection = detection;
        popupOpenObserver = new MutationObserver(() => {
            if (pendingPopupDetection !== detection) {
                return;
            }
            const currentEntry = capturedEntries.get(detection.entryKey);
            if (!currentEntry) {
                stopPendingPopupDetection();
                return;
            }
            if (manageOpenedPopups(currentEntry, detection.baseline) > 0) {
                stopPendingPopupDetection();
            }
        });
        popupOpenObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['aria-hidden', 'class', 'hidden', 'open', 'style'],
            childList: true,
            subtree: true,
        });
        popupOpenWatchTimer = window.setTimeout(stopPendingPopupDetection, 500);
    };

    const scheduleOpenedPopupDetection = (entry, baseline) => {
        watchForOpenedPopup(entry, baseline);
        [0, 80, 220, 420].forEach((delay) => {
            window.setTimeout(() => {
                if (manageOpenedPopups(entry, baseline) > 0) {
                    stopPendingPopupDetection();
                }
            }, delay);
        });
    };

    const releaseEntry = (key, forget = true) => {
        const entry = capturedEntries.get(key);
        if (!entry) {
            return false;
        }

        capturedEntries.delete(key);
        restoreEntryPopups(key);
        const {
            element,
            originalNextSibling,
            originalParent,
            originalStyle,
            inPlaceVisual,
            proxyMode,
            slot,
            suppressedTitles,
        } = entry;
        slot.remove();
        if (isStylableElement(element)) {
            element.removeAttribute(CAPTURED_ATTRIBUTE);
            element.style.cssText = originalStyle;
            restoreNativeTitles(suppressedTitles);
            if (!proxyMode && !inPlaceVisual) {
                if (originalParent?.isConnected) {
                    if (originalNextSibling?.parentNode === originalParent) {
                        originalParent.insertBefore(element, originalNextSibling);
                    } else {
                        originalParent.append(element);
                    }
                } else {
                    document.body.append(element);
                }
            }
            setDraggableState(element, true);
        }
        if (forget) {
            savedDescriptors = savedDescriptors
                .filter((item) => getFingerprintKey(item.fingerprint) !== key);
            saveDescriptors(savedDescriptors);
        }
        updateDockState();
        return true;
    };

    const releaseAllEntries = () => {
        const keys = [...capturedEntries.keys()];
        savedDescriptors = [];
        keys.forEach((key) => releaseEntry(key, false));
        saveDescriptors(savedDescriptors);
        updateDockState();
    };

    const updateCaptureHighlight = (candidate) => {
        highlightedCandidate = candidate;
        if (!isStylableElement(captureHighlight)) {
            return;
        }
        if (!isStylableElement(candidate)) {
            captureHighlight.hidden = true;
            return;
        }
        const rect = candidate.getBoundingClientRect();
        captureHighlight.hidden = false;
        captureHighlight.style.setProperty('--xy-capture-x', `${rect.left}px`);
        captureHighlight.style.setProperty('--xy-capture-y', `${rect.top}px`);
        captureHighlight.style.setProperty('--xy-capture-width', `${rect.width}px`);
        captureHighlight.style.setProperty('--xy-capture-height', `${rect.height}px`);
    };

    const exitCaptureMode = () => {
        if (pointerFrame !== null) {
            cancelAnimationFrame(pointerFrame);
            pointerFrame = null;
        }
        pendingPointer = null;
        highlightedCandidate = null;
        captureLayer?.remove();
        captureLayer = null;
        captureHighlight = null;
        document.body.classList.remove('xy-floating-ball-capture-mode');
        captureButton.setAttribute('aria-pressed', 'false');
        window.removeEventListener('keydown', handleCaptureKeydown, true);
    };

    const handleCaptureKeydown = (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        exitCaptureMode();
    };

    const schedulePointerInspection = (event) => {
        pendingPointer = { clientX: event.clientX, clientY: event.clientY };
        if (pointerFrame !== null) {
            return;
        }
        pointerFrame = requestAnimationFrame(() => {
            pointerFrame = null;
            const point = pendingPointer;
            pendingPointer = null;
            updateCaptureHighlight(point
                ? getCandidateAtPoint(point.clientX, point.clientY)
                : null);
        });
    };

    const suppressCapturePointerEvent = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
    };

    const enterCaptureMode = () => {
        if (captureLayer) {
            exitCaptureMode();
            return;
        }

        captureLayer = document.createElement('div');
        captureLayer.id = CAPTURE_LAYER_ID;
        captureLayer.setAttribute('aria-label', '选择要收纳的悬浮球');
        captureHighlight = document.createElement('div');
        captureHighlight.className = 'xy-floating-ball-capture-highlight';
        captureHighlight.hidden = true;
        captureLayer.append(captureHighlight);
        // Some third-party orbs are mounted directly under <html> at the maximum z-index.
        // Mount beside them, after their node, so capture mode remains the top hit target.
        document.documentElement.append(captureLayer);
        document.body.classList.add('xy-floating-ball-capture-mode');
        captureButton.setAttribute('aria-pressed', 'true');

        captureLayer.addEventListener('pointermove', schedulePointerInspection, true);
        ['pointerdown', 'mousedown', 'mouseup', 'dblclick'].forEach((eventName) => {
            captureLayer.addEventListener(eventName, suppressCapturePointerEvent, true);
        });
        captureLayer.addEventListener('click', (event) => {
            suppressCapturePointerEvent(event);
            const candidate = getCandidateAtPoint(event.clientX, event.clientY)
                || highlightedCandidate;
            if (candidate) {
                captureElement(candidate);
                queueMicrotask(exitCaptureMode);
            }
        }, true);
        captureLayer.addEventListener('contextmenu', (event) => {
            suppressCapturePointerEvent(event);
            exitCaptureMode();
        }, true);
        window.addEventListener('keydown', handleCaptureKeydown, true);
    };

    const getRestorableElements = () => [...document.documentElement.querySelectorAll('*')]
        .filter((element) => isStylableElement(element)
            && !isDockElement(element)
            && !element.hasAttribute(CAPTURED_ATTRIBUTE)
            && ![...capturedEntries.values()].some((entry) => entry.element === element));

    const rebindProxyEntry = (entry, availableElements = getRestorableElements()) => {
        if (!entry.proxyMode || entry.element?.isConnected) {
            return false;
        }
        let bestElement = null;
        let bestScore = -1;
        availableElements.forEach((element) => {
            const score = scoreFingerprintMatch(
                getFloatingBallFingerprint(element),
                entry.fingerprint,
            );
            if (score > bestScore) {
                bestElement = element;
                bestScore = score;
            }
        });
        if (!isStylableElement(bestElement) || bestScore < 4) {
            return false;
        }
        bindProxySource(entry, bestElement);
        rebindPopupStateObserver();
        return true;
    };

    const rebindProxyEntries = (availableElements = getRestorableElements()) => {
        capturedEntries.forEach((entry) => {
            if (rebindProxyEntry(entry, availableElements)) {
                availableElements.splice(availableElements.indexOf(entry.element), 1);
            }
        });
    };

    const restoreSavedBalls = () => {
        restoreTimer = null;
        const pending = savedDescriptors.filter((descriptor) => {
            const key = getFingerprintKey(descriptor.fingerprint);
            return !capturedEntries.has(key);
        });
        const hasDetachedProxy = [...capturedEntries.values()]
            .some((entry) => entry.proxyMode && !entry.element?.isConnected);
        if (!pending.length && !hasDetachedProxy) {
            return;
        }

        const availableElements = getRestorableElements();
        rebindProxyEntries(availableElements);

        pending.forEach((descriptor) => {
            let bestElement = null;
            let bestScore = -1;
            availableElements.forEach((element) => {
                const score = scoreFingerprintMatch(
                    getFloatingBallFingerprint(element),
                    descriptor.fingerprint,
                );
                if (score > bestScore) {
                    bestElement = element;
                    bestScore = score;
                }
            });
            if (bestElement && bestScore >= 4 && captureElement(bestElement, descriptor)) {
                availableElements.splice(availableElements.indexOf(bestElement), 1);
            }
        });
    };

    const scheduleRestore = () => {
        if (restoreTimer !== null) {
            window.clearTimeout(restoreTimer);
        }
        restoreTimer = window.setTimeout(restoreSavedBalls, RESTORE_DELAY);
    };

    const cleanupDetachedEntries = () => {
        let needsRebind = false;
        capturedEntries.forEach((entry) => {
            if (entry.proxyMode) {
                if (!entry.element?.isConnected) {
                    entry.element = null;
                    needsRebind = true;
                }
                return;
            }
            if (entry.element?.parentElement === entry.slot) {
                return;
            }
            convertEntryToProxy(entry);
            needsRebind = !entry.element?.isConnected || needsRebind;
        });
        if (needsRebind) {
            scheduleRestore();
        }
    };

    captureButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        enterCaptureMode();
    });
    releaseAllButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        releaseAllEntries();
    });
    toggleButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const nextMode = dock.dataset.xyFloatingBallMode === 'expanded'
            ? 'hidden'
            : 'expanded';
        void setDockMode(nextMode);
    });

    const getInteractionEntry = (target) => {
        if (!isElementNode(target)
            || target.closest('[data-xy-floating-popup-managed="true"]')) {
            return null;
        }
        const slot = target.closest('.xy-floating-ball-slot');
        return isStylableElement(slot)
            ? capturedEntries.get(slot.dataset.xyFloatingBallKey) || null
            : null;
    };

    const forwardProxyEvent = (entry, target, event) => {
        if (!entry.element?.isConnected) {
            rebindProxyEntry(entry);
        }
        if (!entry.element?.isConnected) {
            return;
        }
        const proxyTarget = entry.displayElement.contains(target)
            ? target
            : entry.displayElement;
        const sourceTarget = resolveDescendantPath(
            entry.element,
            getDescendantPath(entry.displayElement, proxyTarget),
        );
        const dispatchTarget = isElementNode(sourceTarget)
            ? sourceTarget
            : entry.element;
        const sourceWindow = dispatchTarget.ownerDocument?.defaultView || window;
        const EventConstructor = event.type.startsWith('pointer')
            ? sourceWindow.PointerEvent
            : sourceWindow.MouseEvent;
        if (typeof EventConstructor !== 'function') {
            return;
        }
        dispatchTarget.dispatchEvent(new EventConstructor(event.type, {
            bubbles: true,
            button: event.button,
            buttons: event.buttons,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            shiftKey: event.shiftKey,
            view: sourceWindow,
        }));
    };

    ['pointerdown', 'pointerup', 'mousedown', 'mouseup'].forEach((eventName) => {
        list.addEventListener(eventName, (event) => {
            if (event.button !== 0 || !isElementNode(event.target)) {
                return;
            }
            const entry = getInteractionEntry(event.target);
            if (!entry) {
                return;
            }
            if (entry.suppressClickUntil > Date.now()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            if (eventName === 'pointerdown' && closeEntryPopups(entry)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            const baseline = new Set(getOpenPopupCandidates());
            if (entry.proxyMode) {
                event.preventDefault();
                event.stopImmediatePropagation();
                forwardProxyEvent(entry, event.target, event);
            }
            scheduleOpenedPopupDetection(entry, baseline);
        }, true);
    });

    list.addEventListener('click', (event) => {
        if (event.button !== 0 || !isElementNode(event.target)) {
            return;
        }
        const entry = getInteractionEntry(event.target);
        if (!entry) {
            return;
        }
        if (entry.suppressClickUntil > Date.now()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        const baseline = new Set(getOpenPopupCandidates());
        if (entry.proxyMode) {
            event.preventDefault();
            event.stopImmediatePropagation();
            forwardProxyEvent(entry, event.target, event);
        }
        scheduleOpenedPopupDetection(entry, baseline);
    }, true);
    list.addEventListener('contextmenu', (event) => {
        if (isElementNode(event.target)
            && event.target.closest('[data-xy-floating-popup-managed="true"]')) {
            return;
        }
        const slot = isElementNode(event.target)
            ? event.target.closest('.xy-floating-ball-slot')
            : null;
        if (!isStylableElement(slot)) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        releaseEntry(slot.dataset.xyFloatingBallKey);
    });

    const observer = new MutationObserver((mutations) => {
        cleanupDetachedEntries();
        if (managedPopups.size) {
            schedulePopupSync();
        }
        const hasExternalAddition = mutations.some((mutation) => [...mutation.addedNodes]
            .some((node) => isElementNode(node) && !isDockElement(node)));
        if (hasExternalAddition) {
            scheduleRestore();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const handlePopupWindowResize = () => {
        if (managedPopups.size) {
            schedulePopupSync();
        }
    };
    window.addEventListener('resize', handlePopupWindowResize, { passive: true });

    const controller = {
        captureElement,
        destroy({ restore = true } = {}) {
            observer.disconnect();
            popupStateObserver.disconnect();
            window.removeEventListener('resize', handlePopupWindowResize);
            exitCaptureMode();
            cancelDockAnimation();
            if (popupSyncFrame !== null) {
                cancelAnimationFrame(popupSyncFrame);
                popupSyncFrame = null;
            }
            stopPendingPopupDetection();
            [...managedPopups.keys()].forEach(restoreManagedPopup);
            if (restoreTimer !== null) {
                window.clearTimeout(restoreTimer);
            }
            if (restore) {
                [...capturedEntries.keys()].forEach((key) => releaseEntry(key, false));
            }
            dock.remove();
            delete window.__xyFloatingBallDockController;
        },
        enterCaptureMode,
        exitCaptureMode,
        releaseElement(element) {
            const entry = [...capturedEntries.values()]
                .find((candidate) => candidate.element === element);
            return entry ? releaseEntry(entry.key) : false;
        },
        releaseAll: releaseAllEntries,
        restoreSavedBalls,
    };
    window.__xyFloatingBallDockController = controller;
    updateDockState();
    applyDockMode('hidden', false);
    scheduleRestore();
    return controller;
}
