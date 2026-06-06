import { render } from '@testing-library/react-native';

import { RouteStub } from '@/components/route-stub';

describe('RouteStub', () => {
  it('renders the given label', async () => {
    const { getByText } = await render(<RouteStub label="Home — quick_record (Phase 2)" />);

    expect(getByText('Home — quick_record (Phase 2)')).toBeTruthy();
  });
});
