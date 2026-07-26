(() => {
    'use strict';

    const POPOVER_ID = 'xy-select-popover';
    let mounted = false;
    let rootSelector = '';
    let minOptions = 10;
    let activeSelect = null;
    let transientListenersAttached = false;

    function attachTransientListeners() {
        if (transientListenersAttached) return;
        transientListenersAttached = true;
        document.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
    }

    function detachTransientListeners() {
        if (!transientListenersAttached) return;
        transientListenersAttached = false;
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
    }

    function getUsableOptions(select) {
        return [...select.options].filter(option => !option.hidden && option.style.display !== 'none');
    }

    function canEnhance(select) {
        if (!(select instanceof HTMLSelectElement) || select.disabled || select.multiple || select.size > 1) {
            return false;
        }
        if (select.matches('#WorldInfo select[name="position"]')) {
            return false;
        }
        if (!select.closest(rootSelector) || select.classList.contains('select2-hidden-accessible') || select.hasAttribute('data-select2-id')) {
            return false;
        }
        return getUsableOptions(select).length >= minOptions;
    }

    function closePopover({ restoreFocus = false } = {}) {
        document.getElementById(POPOVER_ID)?.remove();
        if (activeSelect) {
            activeSelect.setAttribute('aria-expanded', 'false');
            activeSelect.removeAttribute('aria-controls');
            if (restoreFocus) {
                activeSelect.focus({ preventScroll: true });
            }
        }
        activeSelect = null;
        detachTransientListeners();
    }

    function placePopover(popover, select) {
        const rect = select.getBoundingClientRect();
        const viewportGap = 12;
        const width = Math.min(Math.max(rect.width, 260), window.innerWidth - viewportGap * 2);
        const left = Math.min(Math.max(rect.left, viewportGap), window.innerWidth - width - viewportGap);
        const spaceBelow = window.innerHeight - rect.bottom - viewportGap;
        const spaceAbove = rect.top - viewportGap;
        const dropUp = spaceBelow < 260 && spaceAbove > spaceBelow;
        const available = Math.max(140, Math.min(360, (dropUp ? spaceAbove : spaceBelow) - 8));

        popover.style.width = `${width}px`;
        popover.style.left = `${left}px`;
        popover.style.setProperty('--xy-select-list-max-height', `${Math.max(92, available - 52)}px`);
        popover.classList.toggle('xy-select-popover--up', dropUp);

        if (dropUp) {
            popover.style.top = 'auto';
            popover.style.bottom = `${window.innerHeight - rect.top + 5}px`;
        } else {
            popover.style.top = `${rect.bottom + 5}px`;
            popover.style.bottom = 'auto';
        }
    }

    function selectOption(select, index) {
        select.selectedIndex = index;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closePopover({ restoreFocus: true });
    }

    function openPopover(select) {
        closePopover();
        activeSelect = select;

        const popover = document.createElement('div');
        popover.id = POPOVER_ID;
        popover.className = 'xy-select-popover';
        popover.setAttribute('role', 'dialog');
        popover.setAttribute('aria-label', '搜索并选择选项');

        const searchWrap = document.createElement('div');
        searchWrap.className = 'xy-select-search';

        const searchIcon = document.createElement('i');
        searchIcon.className = 'fa-solid fa-magnifying-glass';
        searchIcon.setAttribute('aria-hidden', 'true');

        const search = document.createElement('input');
        search.type = 'search';
        search.className = 'xy-select-search__input';
        search.placeholder = '搜索选项...';
        search.autocomplete = 'off';
        search.spellcheck = false;
        search.setAttribute('aria-label', '搜索选项');

        const list = document.createElement('div');
        list.className = 'xy-select-options';
        list.setAttribute('role', 'listbox');

        const empty = document.createElement('div');
        empty.className = 'xy-select-empty';
        empty.textContent = '没有匹配的选项';
        empty.hidden = true;

        const groupRows = [];
        let currentGroup = null;
        let selectedButton = null;

        getUsableOptions(select).forEach(option => {
            const group = option.parentElement instanceof HTMLOptGroupElement ? option.parentElement : null;
            if (group && group !== currentGroup) {
                currentGroup = group;
                const label = document.createElement('div');
                label.className = 'xy-select-group';
                label.textContent = group.label;
                label.dataset.group = group.label;
                list.append(label);
                groupRows.push({ group, label });
            } else if (!group) {
                currentGroup = null;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'xy-select-option';
            button.dataset.index = String(option.index);
            button.dataset.search = option.textContent.trim().toLocaleLowerCase();
            button.textContent = option.textContent.trim();
            button.disabled = option.disabled || Boolean(group?.disabled);
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', String(option.selected));
            if (option.selected) {
                button.classList.add('is-selected');
                selectedButton = button;
            }
            list.append(button);
        });

        function visibleButtons() {
            return [...list.querySelectorAll('.xy-select-option:not([hidden]):not(:disabled)')];
        }

        function filterOptions() {
            const term = search.value.trim().toLocaleLowerCase();
            let visibleCount = 0;
            list.querySelectorAll('.xy-select-option').forEach(button => {
                const matches = !term || button.dataset.search.includes(term);
                button.hidden = !matches;
                if (matches) visibleCount += 1;
            });
            groupRows.forEach(({ group, label }) => {
                label.hidden = ![...group.children].some(option => {
                    const button = list.querySelector(`.xy-select-option[data-index="${option.index}"]`);
                    return button && !button.hidden;
                });
            });
            empty.hidden = visibleCount !== 0;
        }

        search.addEventListener('input', filterOptions);
        search.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closePopover({ restoreFocus: true });
                return;
            }
            if (event.key === 'ArrowDown') {
                const [first] = visibleButtons();
                if (first) {
                    event.preventDefault();
                    first.focus();
                }
                return;
            }
            if (event.key === 'Enter') {
                const [first] = visibleButtons();
                if (first) {
                    event.preventDefault();
                    first.click();
                }
            }
        });

        list.addEventListener('click', event => {
            const button = event.target.closest('.xy-select-option');
            if (!button || button.disabled) return;
            event.preventDefault();
            event.stopPropagation();
            selectOption(select, Number(button.dataset.index));
        });

        list.addEventListener('keydown', event => {
            const button = event.target.closest('.xy-select-option');
            if (!button) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closePopover({ restoreFocus: true });
                return;
            }
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            const buttons = visibleButtons();
            const current = buttons.indexOf(button);
            let next = current;
            if (event.key === 'ArrowDown') next = Math.min(current + 1, buttons.length - 1);
            if (event.key === 'ArrowUp') next = Math.max(current - 1, 0);
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = buttons.length - 1;
            event.preventDefault();
            buttons[next]?.focus();
        });

        searchWrap.append(searchIcon, search);
        list.append(empty);
        popover.append(searchWrap, list);
        document.body.append(popover);
        attachTransientListeners();
        placePopover(popover, select);

        select.setAttribute('aria-expanded', 'true');
        select.setAttribute('aria-controls', POPOVER_ID);
        search.focus({ preventScroll: true });
        requestAnimationFrame(() => selectedButton?.scrollIntoView({ block: 'nearest' }));
    }

    function handlePointerDown(event) {
        const select = event.target.closest('select');
        if (select && canEnhance(select)) {
            event.preventDefault();
            event.stopPropagation();
            if (activeSelect === select) {
                closePopover({ restoreFocus: true });
            } else {
                select.focus({ preventScroll: true });
                openPopover(select);
            }
            return;
        }
        if (activeSelect && !event.target.closest(`#${POPOVER_ID}`)) {
            closePopover();
        }
    }

    function handleKeyDown(event) {
        const select = event.target instanceof HTMLSelectElement ? event.target : null;
        if (!select || !canEnhance(select) || !['Enter', ' ', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        openPopover(select);
    }

    function handleScroll(event) {
        if (!activeSelect || event.target.closest?.(`#${POPOVER_ID}`)) return;
        closePopover();
    }

    function handleResize() {
        if (activeSelect) closePopover();
    }

    window.XYSearchableSelects = {
        mount(options = {}) {
            rootSelector = options.rootSelector || rootSelector;
            minOptions = Number(options.minOptions) || minOptions;
            if (mounted || !rootSelector) return;
            mounted = true;
            document.addEventListener('pointerdown', handlePointerDown, true);
            document.addEventListener('keydown', handleKeyDown, true);
        },
        close: closePopover,
    };
})();
