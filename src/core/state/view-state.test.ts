import { signal } from '@preact/signals-react';
import type { ViewState } from './view-state';

describe('ViewState', () => {
  it('narrows to data when kind is loaded', () => {
    const state = signal<ViewState<number>>({ kind: 'loaded', data: 42 });

    const value = state.value;
    expect(value.kind === 'loaded' && value.data).toBe(42);
  });

  it('narrows to error when kind is failed', () => {
    const state = signal<ViewState<number>>({ kind: 'failed', error: new Error('boom') });

    const value = state.value;
    expect(value.kind === 'failed' && (value.error as Error).message).toBe('boom');
  });

  it('initial and loading carry no payload', () => {
    const initial: ViewState<number> = { kind: 'initial' };
    const loading: ViewState<number> = { kind: 'loading' };

    expect(initial.kind).toBe('initial');
    expect(loading.kind).toBe('loading');
  });
});
