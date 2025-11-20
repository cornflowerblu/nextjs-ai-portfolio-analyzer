import { vi } from 'vitest';

// Mock SWR for component tests
const useSWR = vi.fn(() => ({
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
}));

export default useSWR;
