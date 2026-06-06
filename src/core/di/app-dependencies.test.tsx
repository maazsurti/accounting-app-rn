import { Text } from 'react-native';
import { render, renderHook } from '@testing-library/react-native';

import { createTestAppDependencies } from '@/core/di/test-utils/test-app-dependencies';
import { AppDependenciesProvider, useDeps, type AppDependencies } from './app-dependencies';

function Probe() {
  const deps = useDeps();
  return <Text>{deps.db === null ? 'no db' : 'has db'}</Text>;
}

describe('AppDependenciesProvider / useDeps', () => {
  it('exposes the provided dependency graph to descendants', async () => {
    const deps = createTestAppDependencies();

    const { getByText } = await render(
      <AppDependenciesProvider deps={deps}>
        <Probe />
      </AppDependenciesProvider>
    );

    expect(getByText('has db')).toBeTruthy();
  });

  it('throws when used outside a provider', async () => {
    await expect(renderHook(() => useDeps())).rejects.toThrow(
      'useDeps() called outside an AppDependenciesProvider'
    );
  });
});

describe('createTestAppDependencies', () => {
  it('builds an in-memory graph usable as AppDependencies', () => {
    const deps: AppDependencies = createTestAppDependencies();

    expect(deps.db).toBeTruthy();
  });

  it('lets callers override individual services with test doubles', () => {
    const fakeDb = {} as AppDependencies['db'];

    const deps = createTestAppDependencies({ db: fakeDb });

    expect(deps.db).toBe(fakeDb);
  });
});
