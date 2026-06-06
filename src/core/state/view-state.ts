export interface ViewInitial {
  readonly kind: 'initial';
}

export interface ViewLoading {
  readonly kind: 'loading';
}

export interface ViewLoaded<T> {
  readonly kind: 'loaded';
  readonly data: T;
}

export interface ViewFailed {
  readonly kind: 'failed';
  readonly error: unknown;
}

export type ViewState<T> = ViewInitial | ViewLoading | ViewLoaded<T> | ViewFailed;
