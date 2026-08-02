// Extension prompts at the same depth are ordered by key. The leading zero keeps this
// rendering protocol ahead of other in-chat system injections.
export const DIALOGUE_GENDER_PROMPT_KEY = '0_xy-message-presentation-v2';

export const DIALOGUE_GENDER_PROMPT = `
<xy_message_presentation_protocol>
以下标记只供前端渲染，绝不输出 HTML 标签、class 属性或对本协议的解释。

世界时空栏：
- 当上下文要求输出世界时间、地点或时空栏时，它必须是每次回复正文前的第一项独立内容，且每轮恰好一条。
- 固定格式：[[XY_TIME]]地点·纪年/日期·星期·具体时间[[/XY_TIME]]
- 此标记替代 Markdown 的三反引号代码围栏；不得在时空栏外重复输出相同信息。

人物台词：
为了让界面区分人物台词颜色，请先确定具体说话者，再标记其直接说出的台词：
- 当前由用户控制的主角：[[XYD|U]]“完整台词”[[/XYD]]
- 女性说话者：[[XYD|F]]“完整台词”[[/XYD]]
- 男性说话者：[[XYD|M]]“完整台词”[[/XYD]]

判断步骤（必须按顺序执行）：
1. 输出正文前，先从用户身份、角色卡和上下文中确定当前由用户控制的主角；不要把其他自称“我”的人物当成用户角色。
2. 每句台词出现时，先根据紧邻的说话动作、前后叙述、称谓和对话轮次确定具体说话者。
3. 如果说话者是当前由用户控制的主角，无论主角性别为何都使用 USER；否则再从人物设定、明确身份和上下文事实取得性别，使用 FEMALE 或 MALE，不得根据语气或措辞猜测。
4. 只要说话者发生切换，就必须重新填写对应类型，不得复制上一句的标记。
5. 同一人物在同一次回复中必须使用相同类型；输出前逐句检查，发现矛盾时统一修正。

明确示例：
当前由用户控制的主角白玄端起茶碗。
[[XYD|U]]“自然是静观其变，保住性命要紧。”[[/XYD]]

紫霄宗女弟子狠狠瞪了散修一眼。
[[XYD|F]]“住口。”[[/XYD]]

规则：
1. 只标记人物直接说出的台词；旁白、心理活动、引用内容、界面标签和代码不标记。
2. 开始与结束标记必须成对出现，并与对应台词放在同一段内；直接台词统一使用中文双引号“……”包裹，不得使用『……』、「……」或英文直引号。
3. 无法确定说话者或类型时保持原文，不添加任何台词标记。
4. 只使用 XYD 格式，类型只能是 U、F、M；不得使用 XY_DIALOGUE、XY_FEMALE、XY_MALE 或其他变体。
5. 开始标签中的类型与人物身份必须一致：U 为用户主角，F 为女性角色，M 为男性角色。
6. 标记只是渲染协议，不要解释、展示或讨论本规则。
7. 人物动作、说话提示与紧随其后的台词必须写在同一段同一行；台词标记前不得插入空行、换行或 HTML 的 br。
8. 必须分两步完成回复：先完成正文并添加所有时空栏、台词标记；随后在内部对已添加的全部标签逐一自检，发现任何拼写、字段、开闭配对或格式错误时先自行修正，确认全部正确后才输出最终回复。时空栏只能是 [[XY_TIME]]...[[/XY_TIME]]；台词只能是 [[XYD|U/F/M]]...[[/XYD]]。开闭标签的字母、竖线和方括号必须完全一致；禁止生成任何其他 XY_* 或 XYD* 标签，禁止只输出开始标签或结束标签。自检过程不得输出到正文。
</xy_message_presentation_protocol>
`.trim();

const AI_MESSAGE_SELECTOR = '.mes[is_user="false"]:not(.smallSysMes):not([type="welcome_prompt"]):not([type="assistant_message"])';
const SKIP_ELEMENT_SELECTOR = 'pre, code, script, style, textarea, .xy-dialogue';
const TIME_MARKER_PATTERN = /^\s*\[\[XY_TIME\]\]([\s\S]*?)\[\[\/XY_TIME\]\]\s*$/;

function isTimebarValue(value) {
    const normalized = value?.trim() || '';
    return normalized.length >= 8
        && normalized.length <= 240
        && normalized.includes('·')
        && /(?:年|月|日|星期|时|:)/.test(normalized);
}

function getLegacyTimebarContainer(block) {
    const children = [...block.children].filter((child) => child.tagName !== 'BR');
    const hasOnlyFormattingOutsideContainer = [...block.childNodes].every((node) => {
        return node.nodeType === Node.TEXT_NODE
            ? !node.nodeValue?.trim()
            : node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'BR' || children.includes(node));
    });
    if (children.length !== 1 || !hasOnlyFormattingOutsideContainer) {
        return null;
    }
    const container = children[0];
    if (!['CODE', 'TIME'].includes(container.tagName) || !isTimebarValue(container.textContent)) {
        return null;
    }
    return container;
}

function trimTimebarLineBreaks(container) {
    const isBlankText = (node) => node?.nodeType === Node.TEXT_NODE && !node.nodeValue?.trim();
    const trimStart = () => {
        while (isBlankText(container.firstChild)) {
            container.firstChild.remove();
        }
        if (container.firstElementChild?.tagName === 'BR') {
            container.firstElementChild.remove();
            trimStart();
        }
    };
    const trimEnd = () => {
        while (isBlankText(container.lastChild)) {
            container.lastChild.remove();
        }
        if (container.lastElementChild?.tagName === 'BR') {
            container.lastElementChild.remove();
            trimEnd();
        }
    };
    trimStart();
    trimEnd();
}

function normalizeTimebarElement(block, content) {
    const time = document.createElement('time');
    time.textContent = content.trim();
    block.replaceChildren(time);
}

function isLegacyTimebarCode(block) {
    return getLegacyTimebarContainer(block) !== null;
}

export function renderTimebar(root) {
    if (!(root instanceof Element)) {
        return 0;
    }

    let renderedCount = 0;
    root.querySelectorAll('p, li, blockquote').forEach((block) => {
        if (block.closest('pre, script, style, textarea')) {
            return;
        }
        const marker = TIME_MARKER_PATTERN.exec(block.textContent || '');
        if (marker) {
            const content = marker[1].trim();
            if (!content) {
                return;
            }
            normalizeTimebarElement(block, content);
            block.classList.add('xy-timebar');
            block.dataset.xyTimebarSource = 'marker';
            renderedCount += 1;
            return;
        }
        if (isLegacyTimebarCode(block)) {
            trimTimebarLineBreaks(getLegacyTimebarContainer(block));
            block.classList.add('xy-timebar');
            block.dataset.xyTimebarSource = 'code';
            renderedCount += 1;
        }
    });
    return renderedCount;
}

function normalizePlainDialogueQuotes(value) {
    const source = String(value ?? '');
    const parts = /^(\s*)([\s\S]*?)(\s*)$/.exec(source);
    const leading = parts?.[1] ?? '';
    let content = parts?.[2] ?? source;
    const trailing = parts?.[3] ?? '';
    const quotePairs = [['『', '』'], ['「', '」'], ['“', '”'], ['"', '"']];
    const matchedPair = quotePairs.find(([open, close]) => content.startsWith(open) && content.endsWith(close));

    if (matchedPair) {
        content = `“${content.slice(matchedPair[0].length, -matchedPair[1].length)}”`;
    } else {
        content = `“${content}”`;
    }
    return `${leading}${content}${trailing}`;
}

function normalizeDialogueQuotes(value) {
    const source = String(value ?? '');
    const quoteElement = /^(\s*<q(?:\s[^>]*)?>)([\s\S]*)(<\/q>\s*)$/i.exec(source);
    if (!quoteElement) {
        return normalizePlainDialogueQuotes(source);
    }
    return `${quoteElement[1]}${normalizePlainDialogueQuotes(quoteElement[2])}${quoteElement[3]}`;
}

export function parseGenderDialogueText(value) {
    const source = String(value ?? '');
    const matches = [];
    const compactPattern = /\[\[XYD\|([UFM])\]\]([\s\S]*?)\[\[\/XYD\]\]/gi;
    const speakerPattern = /\[\[XY_DIALOGUE\|([^|\]\r\n]+)\|(FEMALE|MALE|USER)\]\]([\s\S]*?)\[\[\/XY_DIALOGUE\]\]/g;
    const legacyPattern = /\[\[XY_(FEMALE|MALE)\]\]([\s\S]*?)\[\[\/XY_\1\]\]/g;
    const segments = [];
    let cursor = 0;
    let match = null;

    while ((match = compactPattern.exec(source)) !== null) {
        matches.push({
            end: compactPattern.lastIndex,
            gender: match[1].toUpperCase() === 'F' ? 'female' : match[1].toUpperCase() === 'M' ? 'male' : 'user',
            index: match.index,
            speaker: null,
            text: normalizeDialogueQuotes(match[2]),
        });
    }
    while ((match = speakerPattern.exec(source)) !== null) {
        matches.push({
            end: speakerPattern.lastIndex,
            gender: match[2] === 'FEMALE' ? 'female' : match[2] === 'MALE' ? 'male' : 'user',
            index: match.index,
            speaker: match[1].trim(),
            text: normalizeDialogueQuotes(match[3]),
        });
    }
    while ((match = legacyPattern.exec(source)) !== null) {
        matches.push({
            end: legacyPattern.lastIndex,
            gender: match[1] === 'FEMALE' ? 'female' : 'male',
            index: match.index,
            speaker: null,
            text: normalizeDialogueQuotes(match[2]),
        });
    }

    matches.sort((left, right) => left.index - right.index);
    matches.forEach((dialogue) => {
        if (dialogue.index < cursor) {
            return;
        }
        if (dialogue.index > cursor) {
            segments.push({ gender: null, text: source.slice(cursor, dialogue.index) });
        }
        segments.push({
            gender: dialogue.gender,
            speaker: dialogue.speaker,
            text: dialogue.text,
        });
        cursor = dialogue.end;
    });

    if (!segments.length) {
        return null;
    }
    if (cursor < source.length) {
        segments.push({ gender: null, text: source.slice(cursor) });
    }
    return segments;
}

function stripGenderDialogueMarkers(value) {
    const withoutKnownMarkers = String(value ?? '')
        .replace(/\[\[\/?XY_(?:FEMALE|MALE)\]\]/g, '')
        .replace(/\[\[XY_DIALOGUE\|[^\]\r\n]*\]\]|\[\[\/XY_DIALOGUE\]\]/g, '')
        .replace(/\[\[XYD(?:\|[^\]\r\n]*)?\]\]?|\[\[\/XYD\]\]?/gi, '');
    return withoutKnownMarkers.replace(/\[\[\/?(XY_[A-Z0-9_]*)(?:\|[^\]\r\n]*)?\]\]?/gi, (marker, label) => {
        return label.toUpperCase() === 'XY_TIME' && /^\[\[\/?XY_TIME\]\]$/.test(marker) ? marker : '';
    });
}

function normalizeDialoguePresentation(root) {
    root.querySelectorAll('.xy-dialogue').forEach((dialogue) => {
        let previous = dialogue.previousSibling;
        while (previous?.nodeType === Node.TEXT_NODE && !previous.nodeValue?.trim()) {
            const whitespace = previous;
            previous = previous.previousSibling;
            whitespace.remove();
        }
        if (previous instanceof HTMLBRElement) {
            previous.remove();
        }
    });
}

function collectDialogueTextNodes(root, output) {
    [...root.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.nodeValue?.includes('[[XY')) {
                output.push(node);
            }
            return;
        }
        if (!(node instanceof Element) || node.matches(SKIP_ELEMENT_SELECTOR)) {
            return;
        }
        collectDialogueTextNodes(node, output);
    });
}

export function renderGenderDialogue(root) {
    if (!(root instanceof Element)) {
        return 0;
    }

    let renderedCount = 0;
    const descendantBlocks = [...root.querySelectorAll('p, li, blockquote')];
    const blockContainers = descendantBlocks.length ? descendantBlocks : [root];
    blockContainers.forEach((container) => {
        if (container.closest(SKIP_ELEMENT_SELECTOR) || !container.innerHTML.includes('[[XY')) {
            return;
        }
        const compactPattern = /\[\[XYD\|([UFM])\]\]([\s\S]*?)\[\[\/XYD\]\]/gi;
        const speakerPattern = /\[\[XY_DIALOGUE\|([^|\]\r\n]+)\|(FEMALE|MALE|USER)\]\]([\s\S]*?)\[\[\/XY_DIALOGUE\]\]/g;
        const legacyPattern = /\[\[XY_(FEMALE|MALE)\]\]([\s\S]*?)\[\[\/XY_\1\]\]/g;
        const wrapDialogue = (label, content) => {
            const normalizedLabel = label.toUpperCase();
            const gender = normalizedLabel === 'FEMALE' || normalizedLabel === 'F' ? 'female' : normalizedLabel === 'MALE' || normalizedLabel === 'M' ? 'male' : 'user';
            renderedCount += 1;
            return `<span class="xy-dialogue xy-dialogue--${gender}" data-xy-speaker-gender="${gender}">${normalizeDialogueQuotes(content)}</span>`;
        };
        const nextHtml = stripGenderDialogueMarkers(container.innerHTML
            .replace(compactPattern, (_match, label, content) => wrapDialogue(label, content))
            .replace(speakerPattern, (_match, _speaker, label, content) => wrapDialogue(label, content))
            .replace(legacyPattern, (_match, label, content) => wrapDialogue(label, content)));
        if (nextHtml !== container.innerHTML) {
            container.innerHTML = nextHtml;
        }
    });

    const textNodes = [];
    collectDialogueTextNodes(root, textNodes);

    textNodes.forEach((textNode) => {
        const source = textNode.nodeValue;
        const segments = parseGenderDialogueText(source);
        if (!segments) {
            const cleaned = stripGenderDialogueMarkers(source);
            if (cleaned !== source) {
                textNode.nodeValue = cleaned;
            }
            return;
        }

        const fragment = document.createDocumentFragment();
        segments.forEach(({ gender, text }) => {
            const cleanedText = stripGenderDialogueMarkers(text);
            if (!gender) {
                fragment.append(document.createTextNode(cleanedText));
                return;
            }
            const span = document.createElement('span');
            span.className = `xy-dialogue xy-dialogue--${gender}`;
            span.dataset.xySpeakerGender = gender;
            span.textContent = cleanedText;
            fragment.append(span);
            renderedCount += 1;
        });
        textNode.replaceWith(fragment);
    });

    normalizeDialoguePresentation(root);
    renderTimebar(root);

    return renderedCount;
}

function getAiMessage(node, chat) {
    const element = node instanceof Element ? node : node.parentElement;
    const message = element?.closest(AI_MESSAGE_SELECTOR);
    return message instanceof HTMLElement && message.parentElement === chat ? message : null;
}

export function bindGenderDialogueRenderer(chat = document.querySelector('#chat')) {
    if (!(chat instanceof HTMLElement)) {
        return null;
    }
    if (chat.__xyGenderDialogueRenderer) {
        return chat.__xyGenderDialogueRenderer;
    }

    const pendingMessages = new Set();
    let renderFrame = null;
    const flush = () => {
        renderFrame = null;
        [...pendingMessages].forEach((message) => {
            pendingMessages.delete(message);
            if (message.isConnected) {
                renderGenderDialogue(message.querySelector('.mes_text'));
            }
        });
    };
    const schedule = (message) => {
        if (message) {
            pendingMessages.add(message);
        }
        if (renderFrame === null && pendingMessages.size) {
            renderFrame = requestAnimationFrame(flush);
        }
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            schedule(getAiMessage(mutation.target, chat));
            mutation.addedNodes.forEach((node) => schedule(getAiMessage(node, chat)));
        });
    });
    observer.observe(chat, { childList: true, characterData: true, subtree: true });
    chat.querySelectorAll(`:scope > ${AI_MESSAGE_SELECTOR}`).forEach(schedule);

    const controller = {
        destroy() {
            observer.disconnect();
            if (renderFrame !== null) {
                cancelAnimationFrame(renderFrame);
            }
            pendingMessages.clear();
            delete chat.__xyGenderDialogueRenderer;
            delete chat.dataset.xyGenderDialogueRenderer;
        },
        render() {
            chat.querySelectorAll(`:scope > ${AI_MESSAGE_SELECTOR}`).forEach(schedule);
        },
    };
    chat.__xyGenderDialogueRenderer = controller;
    chat.dataset.xyGenderDialogueRenderer = 'bound';
    return controller;
}
