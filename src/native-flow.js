/**
 * B-Native｜交互版竖向无缝：接管 chat flow，三列连续流，跨缝用**真实 React 实例**补。
 *
 * 与轻量版（ghost / flow.js）的关系：
 *  - 阅读模型完全一致：列高 = 阅读视口 H，滚动量 s，第 c 列显示 [s+cH, s+(c+1)H)；
 *  - 唯一差别：跨缝那一份**不是 DOM 克隆**，而是对同一个 node 再调一次宿主的
 *    `conversation.chat.node` 渲染器 —— 得到的是真组件，按钮/折叠都活着。
 *
 * 布局由本组件自己负责（绝对定位 + 粘滞视口层 + 逻辑占位层），
 * 位置更新走命令式 transform，不触发 React 重渲染；只有"某条消息需要多一份"时才 setState。
 *
 * 已知限制（短期待接受）：
 *  - 跨缝选中仍会断（两棵 DOM 子树，语义上无解）；
 *  - Ctrl+F 会命中两份；
 *  - turn-process / 分组卡的分段折叠属于宿主内部实现，这里先按普通节点渲染。
 */
DSHC.native = (() => {
  'use strict';

  /** 宿主 flow 槽注册时没给 priority（默认 0），更小的值覆盖它。 */
  const PRIORITY = -1;
  const SLOT_FLOW = 'conversation.chat.flow';
  const SLOT_NODE = 'conversation.chat.node';
  const RAIL = 44;
  const MIN_VIEWPORT = 160;
  const GAP = 12;

  let installed = false;
  let teardown = null;
  let React = null;
  let lastError = '';
  let renders = 0;

  function safeRequire(name) {
    try {
      return require(name);
    } catch (error) {
      lastError = 'require("' + name + '") 失败: ' + (error && error.message ? error.message : error);
      return null;
    }
  }

  function constantSnapshot(value) {
    return { getSnapshot: () => value, subscribe: () => () => {} };
  }

  /** 阅读视口几何：从宿主滚动容器与正文列上量，和 ghost 用的是同一套 adapter。 */
  function readGeometry(column, scroller) {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    const rect = adapter.measure(scroller);
    if (!rect || !(rect.height >= MIN_VIEWPORT)) return null;
    const H = Math.floor(rect.height);
    const available = Math.floor(adapter.availableWidth(column, scroller) - RAIL);
    const cols = Math.max(1, Math.min(3, math.resolveColumns(available, 'auto')));
    const columnWidth = Math.floor(math.columnWidth(available, cols, math.GAP));
    if (!(columnWidth >= 220)) return null;
    return { H, cols, columnWidth, step: columnWidth + math.GAP };
  }

  function makeFlow(react) {
    const h = react.createElement;
    const { useRef, useState, useEffect, useLayoutEffect, useCallback } = react;

    function useSource(source) {
      return react.useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
    }

    /** 一条消息的一个视图：自己订阅 keyed source，所以流式更新是局部的。 */
    function NodeView(props) {
      const { nodeKey, nodes, renderSlot, shared, registerRef } = props;
      const source = react.useMemo(() => nodes.source(nodeKey), [nodes, nodeKey]);
      const node = useSource(source);
      const owner = react.useMemo(
        () => (node ? { ...shared.owner, node } : null),
        [node, shared.owner]
      );
      const hookContext = react.useMemo(
        () => ({
          turnData: undefined,
          disclosureReset: constantSnapshot(0),
          useGroupAction: () => react.useRef(null)
        }),
        []
      );
      const ref = useCallback((el) => registerRef(nodeKey, el), [registerRef, nodeKey]);
      if (!node) return null;
      const attrs = Object.assign({ 'data-dshc-native-row': '' }, DSHC.adapter.flowRowAttrs(node));
      return h(
        'div',
        { ref, ...attrs, style: { position: 'absolute', left: '0px', top: '0px', width: '100%' } },
        renderSlot(SLOT_NODE, owner, {
          entryKey: node.kind,
          hookContext,
          fallback: h('div', null, '这条消息类型暂未渲染：' + node.kind)
        })
      );
    }

    function NativeFlow(props) {
      const { entries, renderSlot, useChat, cwd, openFile, openSkill, inspectCall, forkAt, loadImage, fileMentions } = props;
      renders += 1;

      const order = useChat((value) => value.order);
      const nodes = useChat((value) => value.nodes);

      const rootRef = useRef(null);
      const layerRef = useRef(null);
      const viewRefs = useRef(new Map()); // key -> first element (用来量高)
      const heights = useRef(new Map()); // key -> 像素高
      const startsRef = useRef([]); // 前缀和
      const totalRef = useRef(0);
      const sRef = useRef(0);
      const geomRef = useRef(null);
      const [geomState, setGeomState] = useState(null);
      const scrollRaf = useRef(0);
      const elRefs = useRef(new Map()); // "key:k" -> 视图元素

      // 每条消息当前需要几个视图（跨了几列缝就多几份）；只在数量变化时才 setState。
      const [extra, setExtra] = useState(() => ({}));

      const keys = react.useMemo(() => {
        const list = Array.isArray(entries) ? entries.filter((e) => e && e.kind === 'node').map((e) => e.key) : null;
        return list && list.length ? list : Array.isArray(order) ? order.slice() : [];
      }, [entries, order]);

      const shared = react.useMemo(
        () => ({
          owner: { cwd, openFile, openSkill, inspectCall, forkAt, loadImage, renderMessageImages: () => null, fileMentions }
        }),
        [cwd, openFile, openSkill, inspectCall, forkAt, loadImage, fileMentions]
      );

      const registerRef = useCallback((key, el) => {
        if (el) {
          if (!viewRefs.current.has(key)) viewRefs.current.set(key, el);
        }
      }, []);

      const scrollerOf = useCallback(() => {
        const root = rootRef.current;
        if (!root) return null;
        return DSHC.adapter.HOST.scroller ? root.closest(DSHC.adapter.HOST.scroller) : null;
      }, []);

      /** 量高 + 重算前缀和。 */
      const recompute = useCallback(() => {
        const geom = geomRef.current;
        if (!geom) return;
        const next = new Map();
        let y = 0;
        const starts = [];
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const el = viewRefs.current.get(key);
          const height = el ? Math.max(0, Math.round(el.getBoundingClientRect().height)) : 0;
          next.set(key, height);
          if (i > 0) y += GAP;
          starts.push(y);
          y += height;
        }
        heights.current = next;
        startsRef.current = starts;
        totalRef.current = y;
      }, [keys]);

      /** 依据当前滚动量，算出每条消息需要几个视图（0 表示不在可见范围）。 */
      const planOf = useCallback(() => {
        const geom = geomRef.current;
        if (!geom) return {};
        const { H, cols } = geom;
        const s = sRef.current;
        const starts = startsRef.current;
        const plan = {};
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const height = heights.current.get(key) || 0;
          if (height < 1) continue;
          const start = starts[i];
          let first = Math.floor((start - s) / H);
          let last = Math.floor((start + height - 1 - s) / H);
          if (last < 0 || first > cols - 1) continue;
          if (first < 0) first = 0;
          if (last > cols - 1) last = cols - 1;
          plan[key] = last - first + 1;
        }
        return plan;
      }, [keys]);

      /** 把每个视图挪到位（命令式，不触发渲染）。 */
      const project = useCallback(() => {
        const geom = geomRef.current;
        if (!geom || !layerRef.current) return;
        const { H, cols, step } = geom;
        const s = sRef.current;
        const starts = startsRef.current;
        const layer = layerRef.current;
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const height = heights.current.get(key) || 0;
          if (height < 1) continue;
          const start = starts[i];
          let first = Math.floor((start - s) / H);
          let last = Math.floor((start + height - 1 - s) / H);
          if (last < 0 || first > cols - 1) {
            for (let k = 0; k < 3; k += 1) {
              const hidden = elRefs.current.get(key + ':' + k);
              if (hidden) hidden.style.visibility = 'hidden';
            }
            continue;
          }
          if (first < 0) first = 0;
          if (last > cols - 1) last = cols - 1;
          const count = last - first + 1;
          for (let k = 0; k < count; k += 1) {
            const col = last - k; // 最后一份放末段（原生控件通常在那儿）
            const el = elRefs.current.get(key + ':' + k);
            if (!el) continue;
            el.style.visibility = '';
            el.style.transform = 'translate3d(' + Math.round(col * step) + 'px,' + Math.round(start - s - col * H) + 'px,0)';
          }
          for (let k = count; k < 3; k += 1) {
            const el = elRefs.current.get(key + ':' + k);
            if (el) el.style.visibility = 'hidden';
          }
        }
      }, [keys]);

      const maxScrollOf = useCallback(() => {
        const geom = geomRef.current;
        if (!geom) return 0;
        return Math.max(0, totalRef.current - geom.cols * geom.H);
      }, []);

      /** 一帧：同步滚动量 → 需要几份 → 数量变了才 setState → 重新投影。 */
      const tick = useCallback(() => {
        const geoms = geomRef.current;
        const scroller = scrollerOf();
        if (!geoms || !scroller) return;
        sRef.current = Math.min(maxScrollOf(), Math.max(0, scroller.scrollTop));
        const next = planOf();
        setExtra((prev) => {
          let changed = false;
          const keyset = new Set(Object.keys(next).concat(Object.keys(prev)));
          for (const key of keyset) {
            if ((next[key] || 0) !== (prev[key] || 0)) {
              changed = true;
              break;
            }
          }
          return changed ? next : prev;
        });
        project();
      }, [maxScrollOf, planOf, project, scrollerOf]);

      // 首帧：量几何、量高、把占位层撑起来。
      useLayoutEffect(() => {
        const scroller = scrollerOf();
        const column = rootRef.current ? rootRef.current.closest(DSHC.adapter.HOST.column) : null;
        if (!scroller || !column) return undefined;
        const geom = readGeometry(column, scroller);
        if (!geom) {
          lastError = '几何不足（视口或列宽太小）';
          return undefined;
        }
        geomRef.current = geom;
        requestAnimationFrame(() => {
          setGeomState(geom);
          recompute();
          // 宿主进来时停在底部：直接把行程拉到最后。
          scroller.scrollTop = Math.max(0, totalRef.current - geom.cols * geom.H);
          tick();
        });

        const onScroll = () => {
          if (scrollRaf.current) return;
          scrollRaf.current = requestAnimationFrame(() => {
            scrollRaf.current = 0;
            tick();
          });
        };
        scroller.addEventListener('scroll', onScroll, { passive: true });
        const onResize = () => {
          const next = readGeometry(column, scroller);
          if (!next) return;
          geomRef.current = next;
          recompute();
          tick();
        };
        window.addEventListener('resize', onResize);
        return () => {
          scroller.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        };
      }, [recompute, scrollerOf, tick]);

      // 消息集合变化（流式/加载更早）后重量一次。
      useLayoutEffect(() => {
        requestAnimationFrame(() => {
          recompute();
          tick();
        });
      }, [keys, recompute, tick]);

      const geom = geomState || geomRef.current;
      const layerHeight = geom ? geom.H : 0;
      const spacer = Math.max(0, maxScrollOf());

      const views = [];
      for (const key of keys) {
        const count = extra[key] || 1;
        for (let k = 0; k < count; k += 1) {
          views.push(
            h(
              'div',
              {
                key: key + ':' + k,
                'data-dshc-view': key + ':' + k,
                ref: (el) => {
                  const id = key + ':' + k;
                  if (el) elRefs.current.set(id, el);
                  else elRefs.current.delete(id);
                },
                style: { position: 'absolute', left: '0px', top: '0px', width: '100%', willChange: 'transform' }
              },
              h(NodeView, { nodeKey: key, nodes, renderSlot, shared, registerRef })
            )
          );
        }
      }

      return h(
        'div',
        { ref: rootRef, 'data-dshc-native': '', style: { display: 'block' } },
        h(
          'div',
          {
            ref: layerRef,
            'data-dshc-native-layer': '',
            style: { position: 'sticky', top: '0px', height: layerHeight + 'px', overflow: 'hidden' }
          },
          views
        ),
        h('div', { 'data-dshc-native-spacer': '', style: { height: spacer + 'px' } })
      );
    }

    return NativeFlow;
  }

  function install(ctx) {
    if (installed) return true;
    if (!ctx || !ctx.slots || typeof ctx.slots.register !== 'function') {
      lastError = '宿主没有提供 ctx.slots';
      return false;
    }
    if (!React) React = safeRequire('react');
    if (!React) return false;
    const Flow = makeFlow(React);
    try {
      const off = ctx.slots.inject(SLOT_FLOW, () => ctx.slots.register({ name: SLOT_FLOW, priority: PRIORITY }, Flow));
      teardown = typeof off === 'function' ? off : null;
      installed = true;
      return true;
    } catch (error) {
      lastError = '注册槽位失败: ' + (error && error.message ? error.message : error);
      return false;
    }
  }

  function uninstall() {
    if (teardown) {
      try {
        teardown();
      } catch (error) {
        lastError = '卸载槽位失败: ' + (error && error.message ? error.message : error);
      }
    }
    teardown = null;
    installed = false;
  }

  function diagnose() {
    return { installed, priority: PRIORITY, react: !!React, renders, lastError };
  }

  return { install, uninstall, diagnose, isInstalled: () => installed };
})();
