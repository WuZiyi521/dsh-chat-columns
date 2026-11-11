/**
 * C-Native｜交互版复制：同一份对话并排 N 栏，每栏都是**真实 React 实例**。
 *
 * 与轻量版（mirror.js，DOM 克隆只读）的差别只有一个：
 * 这里的每一栏都是调宿主的 `conversation.chat.node` 渲染器画出来的，
 * 所以按钮、折叠、复制代码全都活着；代价是 N 倍真组件（N 倍订阅与内存）。
 *
 * 已知限制：
 *  - 折叠/思维链展开这类状态存在宿主 store 里，**一栏动、各栏跟着动**（对照阅读时反而更合理）；
 *  - 跨栏选中无关（每栏是独立的滚动容器），栏内选中正常；
 *  - 长对话 N 倍实例，重活；后续要按可见区裁剪。
 */
DSHC.nativeMirror = (() => {
  'use strict';

  function constantSnapshot(value) {
    return { getSnapshot: () => value, subscribe: () => () => {} };
  }

  /**
   * @param {object} react 宿主共享的 React 实例
   * @returns {(props: object) => any} 组件
   */
  function make(react) {
    const h = react.createElement;

    function useSource(source) {
      return react.useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
    }

    /** 一条消息：自己订阅 keyed source，流式只刷这一条。 */
    function Row(props) {
      const { nodeKey, nodes, renderSlot, shared } = props;
      const source = react.useMemo(() => nodes.source(nodeKey), [nodes, nodeKey]);
      const node = useSource(source);
      const owner = react.useMemo(() => (node ? { ...shared.owner, node } : null), [node, shared.owner]);
      const hookContext = react.useMemo(
        () => ({ turnData: undefined, disclosureReset: constantSnapshot(0), useGroupAction: () => react.useRef(null) }),
        []
      );
      if (!node) return null;
      const attrs = Object.assign({ 'data-dshc-native-mirror-row': '' }, DSHC.adapter.flowRowAttrs(node));
      return h(
        'div',
        { ...attrs, style: { minWidth: '0', marginTop: '12px' } },
        renderSlot('conversation.chat.node', owner, {
          entryKey: node.kind,
          hookContext,
          fallback: h('div', null, '这条消息类型暂未渲染：' + node.kind)
        })
      );
    }

    function NativeMirror(props) {
      const { renderSlot, useChat, columns, shared } = props;
      const order = useChat((value) => value.order);
      const nodes = useChat((value) => value.nodes);
      const count = Math.max(1, Math.min(3, Number(columns) || 2));
      const colRefs = react.useRef([]);
      const rootRef = react.useRef(null);
      const [height, setHeight] = react.useState(0);

      // 栏高 = 阅读视口高度（标题栏底到输入框顶），和竖向无缝同一套量法。
      react.useLayoutEffect(() => {
        const read = () => {
          const root = rootRef.current;
          if (!root) return;
          const scroller = root.closest(DSHC.adapter.HOST.scroller);
          const rect = scroller ? DSHC.adapter.measure(scroller) : null;
          if (rect && rect.height > 140) setHeight(Math.floor(rect.height));
        };
        read();
        window.addEventListener('resize', read);
        return () => window.removeEventListener('resize', read);
      }, []);

      // 各栏独立滚动，但进入时对齐到同一位置（最新内容）。
      react.useLayoutEffect(() => {
        for (const el of colRefs.current) {
          if (el) el.scrollTop = el.scrollHeight;
        }
      }, [count]);

      const cols = [];
      for (let c = 0; c < count; c += 1) {
        const rows = [];
        for (const key of order) {
          if (!nodes || typeof nodes.source !== 'function') continue;
          rows.push(h(Row, { key: key, nodeKey: key, nodes, renderSlot, shared }));
        }
        cols.push(
          h(
            'div',
            {
              key: 'col' + c,
              'data-dshc-native-mirror-col': '',
              ref: (el) => {
                colRefs.current[c] = el;
              }
            },
            h('div', { 'data-dshc-native-mirror-head': '' }, '栏 ' + (c + 1) + ' · 交互'),
            h('div', { 'data-dshc-native-mirror-body': '' }, rows)
          )
        );
      }
      return h('div', { ref: rootRef, 'data-dshc-native-mirror': '', style: height ? { height: height + 'px' } : undefined }, cols);
    }

    return NativeMirror;
  }

  return { make };
})();
