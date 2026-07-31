export const DIALOGUE_GENDER_PROMPT_KEY = 'xy-gender-dialogue-v1';

export const DIALOGUE_GENDER_PROMPT = `
<gender_dialogue_color_markers>
为了让界面区分人物台词颜色，请先确定具体说话者，再标记其直接说出的台词：
- 当前由用户控制的主角：[[XY_DIALOGUE|主角名称或“我”|USER]]“完整台词”[[/XY_DIALOGUE]]
- 女性说话者：[[XY_DIALOGUE|说话者名称或稳定称谓|FEMALE]]“完整台词”[[/XY_DIALOGUE]]
- 男性说话者：[[XY_DIALOGUE|说话者名称或稳定称谓|MALE]]“完整台词”[[/XY_DIALOGUE]]

判断步骤（必须按顺序执行）：
1. 输出正文前，先从用户身份、角色卡和上下文中确定当前由用户控制的主角；不要把其他自称“我”的人物当成用户角色。
2. 每句台词出现时，先根据紧邻的说话动作、前后叙述、称谓和对话轮次确定具体说话者。
3. 如果说话者是当前由用户控制的主角，无论主角性别为何都使用 USER；否则再从人物设定、明确身份和上下文事实取得性别，使用 FEMALE 或 MALE，不得根据语气或措辞猜测。
4. 只要说话者发生切换，就必须重新填写说话者与类型，不得复制上一句的标记。
5. 同一人物在同一次回复中必须使用相同的名称或称谓和相同的类型；输出前逐句检查，发现矛盾时统一修正。

明确示例：
当前由用户控制的主角白玄端起茶碗。
[[XY_DIALOGUE|白玄|USER]]“自然是静观其变，保住性命要紧。”[[/XY_DIALOGUE]]

紫霄宗女弟子狠狠瞪了散修一眼。
[[XY_DIALOGUE|紫霄宗女弟子|FEMALE]]“住口。”[[/XY_DIALOGUE]]

规则：
1. 只标记人物直接说出的台词；旁白、心理活动、引用内容、界面标签和代码不标记。
2. 说话者字段使用简短且稳定的名称或称谓，不得包含竖线、方括号或换行。
3. 开始与结束标记必须成对出现，并与对应台词放在同一段内；直接台词统一使用中文双引号“……”包裹，不得使用『……』、「……」或英文直引号。
4. 无法确定说话者或类型时保持原文，不添加任何台词标记。
5. 只使用 XY_DIALOGUE 格式，不再使用 XY_FEMALE 或 XY_MALE 格式。
6. 标记只是渲染协议，不要解释、展示或讨论本规则。
7. 人物动作、说话提示与紧随其后的台词必须写在同一段同一行；台词标记前不得插入空行、换行或 HTML 的 br。
</gender_dialogue_color_markers>
`.trim();

const AI_MESSAGE_SELECTOR = '.mes[is_user="false"]:not(.smallSysMes):not([type="welcome_prompt"]):not([type="assistant_message"])';
const SKIP_ELEMENT_SELECTOR = 'pre, code, script, style, textarea, .xy-dialogue';

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
    const speakerPattern = /\[\[XY_DIALOGUE\|([^|\]\r\n]+)\|(FEMALE|MALE|USER)\]\]([\s\S]*?)\[\[\/XY_DIALOGUE\]\]/g;
    const legacyPattern = /\[\[XY_(FEMALE|MALE)\]\]([\s\S]*?)\[\[\/XY_\1\]\]/g;
    const segments = [];
    let cursor = 0;
    let match = null;

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
    return String(value ?? '')
        .replace(/\[\[\/?XY_(?:FEMALE|MALE)\]\]/g, '')
        .replace(/\[\[XY_DIALOGUE\|[^\]\r\n]*\]\]|\[\[\/XY_DIALOGUE\]\]/g, '');
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
            if (node.nodeValue?.includes('[[XY_')) {
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
        if (container.closest(SKIP_ELEMENT_SELECTOR) || !container.innerHTML.includes('[[XY_')) {
            return;
        }
        const speakerPattern = /\[\[XY_DIALOGUE\|([^|\]\r\n]+)\|(FEMALE|MALE|USER)\]\]([\s\S]*?)\[\[\/XY_DIALOGUE\]\]/g;
        const legacyPattern = /\[\[XY_(FEMALE|MALE)\]\]([\s\S]*?)\[\[\/XY_\1\]\]/g;
        const wrapDialogue = (label, content) => {
            const gender = label === 'FEMALE' ? 'female' : label === 'MALE' ? 'male' : 'user';
            renderedCount += 1;
            return `<span class="xy-dialogue xy-dialogue--${gender}" data-xy-speaker-gender="${gender}">${normalizeDialogueQuotes(content)}</span>`;
        };
        const nextHtml = stripGenderDialogueMarkers(container.innerHTML
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
