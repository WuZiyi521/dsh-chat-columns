/**
 * HistoryController — 历史加载的唯一入口与状态机。
 *
 * 只做三件事：
 *  1. 读宿主「加载更早」按钮，判断 hasMore / loading / end；
 *  2. 在允许时点它（auto 或 manual），不自己发请求；
 *  3. 防重复触发、失败可重试，并把状态上报给控制器。
 *
 * 绝不写宿主滚动位置、绝不插入/删除消息节点。
 */
DSHC.history = (() => {
  'use strict';

  const NEAR_TOP = 24;
  const REARM_AT = 120;
  const THROTTLE = 1500;
  const WATCHDOG = 2600;

  function create(options) {
    const adapter = DSHC.adapter;
    const onChange = (options && options.onChange) || function noop() {};
    let disposed = false;
    let state = 'unknown';
    let button = null;
    let auto = false;
    let count = 0;
    let firstId = '';
    let everHadButton = false;
    let loadingMark = { count: 0, firstId: '' };
    let errorMark = { count: 0, firstId: '' };
    let lastRequest = 0;
    let armed = true;
    let scrollEl = null;
    let watchdog = 0;
    let armTimer = 0;
    let tries = 0;
    let lastEmit = '';

    function snapshot() {
      return {
        state,
        hasMore: !!button,
        count,
        canRetry: state === 'error'
      };
    }

    function emit(force) {
      if (disposed) return;
      const view = snapshot();
      const key = view.state + '|' + view.hasMore + '|' + view.count;
      if (!force && key === lastEmit) return;
      lastEmit = key;
      try {
        onChange(view);
      } catch (error) {
        console.error('[dsh-chat-columns] history callback failed', error);
      }
    }

    function stopWatchdog() {
      if (watchdog) clearTimeout(watchdog);
      watchdog = 0;
    }

    function startWatchdog() {
      stopWatchdog();
      watchdog = setTimeout(function tick() {
        watchdog = 0;
        if (disposed || state !== 'loading') return;
        if (!button || !button.isConnected) {
          state = 'end';
          emit(true);
          return;
        }
        if (!button.disabled) {
          const changed = count !== loadingMark.count || firstId !== loadingMark.firstId;
          if (changed) {
            state = 'idle';
            emit(true);
          } else if (tries < 2) {
            tries += 1;
            watchdog = setTimeout(tick, WATCHDOG);
          } else {
            state = 'error';
            errorMark = { count, firstId };
            emit(true);
          }
          return;
        }
        if (tries < 6) {
          tries += 1;
          watchdog = setTimeout(tick, WATCHDOG);
        }
      }, WATCHDOG);
    }

    /**
     * 用宿主按钮与消息集合刷新状态。
     * @param {{button: HTMLButtonElement|null, count: number, firstId: string}} input
     */
    function refresh(input) {
      if (disposed) return;
      button = (input && input.button) || null;
      count = (input && Number(input.count)) || 0;
      firstId = (input && input.firstId) || '';
      if (button) everHadButton = true;

      const prev = state;
      if (prev === 'loading') {
        if (!button) {
          state = 'end';
          stopWatchdog();
        } else if (!button.disabled) {
          const changed = count !== loadingMark.count || firstId !== loadingMark.firstId;
          state = changed ? 'idle' : 'error';
          if (!changed) errorMark = { count, firstId };
          stopWatchdog();
        }
      } else if (prev === 'error') {
        if (!button) state = 'end';
        else if (count !== errorMark.count || firstId !== errorMark.firstId) state = 'idle';
      } else if (!button) {
        state = everHadButton || count > 0 ? 'end' : 'unknown';
      } else if (button.disabled) {
        state = 'loading';
      } else {
        state = 'idle';
      }

      if (prev !== 'loading' && state === 'loading') {
        loadingMark = { count, firstId };
        tries = 0;
        startWatchdog();
      }
      emit();
    }

    /**
     * 触发一次加载（只点宿主按钮）。
     * @param {'auto'|'manual'} kind
     * @returns {boolean} 是否真的点了
     */
    function request(kind) {
      if (disposed) return false;
      if (kind === 'auto' && !auto) return false;
      if (state !== 'idle' && state !== 'error') return false;
      if (!button || button.disabled || !button.isConnected) return false;
      const now = Date.now();
      if (now - lastRequest < THROTTLE) return false;

      lastRequest = now;
      armed = false;
      loadingMark = { count, firstId };
      tries = 0;
      state = 'loading';
      emit(true);
      startWatchdog();
      button.click();
      return true;
    }

    function retry() {
      if (state === 'error') {
        lastRequest = 0;
        state = 'idle';
      }
      return request('manual');
    }

    function onScroll() {
      if (disposed || !scrollEl) return;
      const top = scrollEl.scrollTop;
      if (top > REARM_AT) {
        armed = true;
        return;
      }
      if (!auto || state !== 'idle' || !armed) return;
      if (top <= NEAR_TOP) request('auto');
    }

    /** 绑定自动加载的滚动源；传 null 解绑。 */
    function setScrollSource(el) {
      if (disposed) return;
      if (el === scrollEl) return;
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = el || null;
      if (scrollEl) {
        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        armed = true;
        // 切模式时可能已经停在顶部，给宿主一帧再补一次机会。
        if (armTimer) clearTimeout(armTimer);
        armTimer = setTimeout(() => {
          armTimer = 0;
          if (disposed || !scrollEl || !auto || state !== 'idle') return;
          if (scrollEl.scrollTop <= NEAR_TOP) request('auto');
        }, 350);
      }
    }

    function setAuto(value) {
      auto = !!value;
      if (auto && state === 'idle' && scrollEl && scrollEl.scrollTop <= NEAR_TOP) request('auto');
    }

    function reset() {
      stopWatchdog();
      if (armTimer) clearTimeout(armTimer);
      armTimer = 0;
      state = 'unknown';
      button = null;
      count = 0;
      firstId = '';
      everHadButton = false;
      loadingMark = { count: 0, firstId: '' };
      errorMark = { count: 0, firstId: '' };
      lastRequest = 0;
      armed = true;
      lastEmit = '';
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = null;
      if (!disposed) emit(true);
    }

    function destroy() {
      disposed = true;
      stopWatchdog();
      if (armTimer) clearTimeout(armTimer);
      armTimer = 0;
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = null;
      button = null;
    }

    return {
      refresh,
      request,
      retry,
      setAuto,
      setScrollSource,
      reset,
      snapshot,
      destroy
    };
  }

  return { create, NEAR_TOP, REARM_AT };
})();
