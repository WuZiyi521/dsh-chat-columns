/**
 * MessageIndex — 消息识别、顺序与变更合并。
 *
 * 全插件只在主列上挂一个内容观察器：
 *  - 只观察主列子树，不观察 document.body；
 *  - 变更合并成批次（120ms），不逐条重排；
 *  - 区分「结构变化」（增删/换序/折叠）与「内容变化」（某些消息脏了）。
 *
 * 注意：观察器的 attributeFilter 故意不包含 style/class ——
 * B 无缝会给消息行写内联样式，包含它们会形成「写样式 → 触发观察 → 再写」的自激循环。
 */
DSHC.indexer = (() => {
  'use strict';

  const BATCH_MS = 120;
  const WATCHED_ATTRS = ['hidden', 'open', 'disabled', 'aria-expanded'];

  /**
   * @param {HTMLElement} column 主消息列
   * @param {{onChange?: (change: {structural: boolean, dirty: Set<string>}) => void}} options
   */
  function create(column, options) {
    const adapter = DSHC.adapter;
    const onChange = (options && options.onChange) || function noop() {};
    let dirty = new Set();
    let structural = false;
    let timer = 0;
    let disposed = false;

    function flush() {
      if (timer) clearTimeout(timer);
      timer = 0;
      if (disposed) return;
      const change = { structural, dirty };
      structural = false;
      dirty = new Set();
      try {
        onChange(change);
      } catch (error) {
        console.error('[dsh-chat-columns] indexer callback failed', error);
      }
    }

    function schedule(delay) {
      if (disposed) return;
      if (timer) return;
      timer = setTimeout(flush, delay === undefined ? BATCH_MS : delay);
    }

    function markItem(node) {
      const item = adapter.itemOf(node, column);
      if (!item) return false;
      const id = adapter.itemId(item);
      if (id) dirty.add(id);
      return true;
    }

    function collect(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.matches && node.matches(adapter.HOST.item)) {
        const id = adapter.itemId(node);
        if (id) dirty.add(id);
      }
      if (node.querySelectorAll) {
        for (const inner of node.querySelectorAll(adapter.HOST.item)) {
          const id = adapter.itemId(inner);
          if (id) dirty.add(id);
        }
      }
    }

    const observer = new MutationObserver((records) => {
      let touched = false;
      for (const record of records) {
        if (record.type === 'attributes') {
          if (markItem(record.target)) touched = true;
          else if (record.target === column) structural = true;
          touched = true;
          continue;
        }
        if (record.type === 'characterData') {
          markItem(record.target);
          touched = true;
          continue;
        }
        // childList
        if (adapter.isInsideItem(record.target, column)) {
          if (!markItem(record.target)) structural = true;
        } else {
          structural = true;
          for (const node of record.addedNodes) collect(node);
          for (const node of record.removedNodes) collect(node);
        }
        touched = true;
      }
      if (touched) schedule();
    });

    observer.observe(column, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRS
    });

    /** 当前顺序的消息快照（每次现读，不维护第二份列表）。 */
    function read() {
      return adapter.getItems(column).map((item, index) => ({
        el: item.el,
        id: item.id,
        kind: item.kind,
        index
      }));
    }

    function destroy() {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = 0;
      observer.disconnect();
      dirty = new Set();
      structural = false;
    }

    return { read, flush, destroy, column };
  }

  return { create };
})();
