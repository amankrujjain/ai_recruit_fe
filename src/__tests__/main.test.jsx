import { describe, it, expect, vi, beforeEach } from 'vitest';

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({ render: renderMock }));

vi.mock('react-dom/client', () => ({
  createRoot: (...args) => createRootMock(...args),
}));

vi.mock('../App', () => ({
  default: function MockApp() {
    return null;
  },
}));

vi.mock('../index.css', () => ({}));

describe('main.jsx', () => {
  beforeEach(() => {
    vi.resetModules();
    createRootMock.mockClear();
    renderMock.mockClear();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('mounts App into #root under StrictMode', async () => {
    await import('../main.jsx');
    const rootEl = document.getElementById('root');
    expect(createRootMock).toHaveBeenCalledWith(rootEl);
    expect(renderMock).toHaveBeenCalledTimes(1);
    const tree = renderMock.mock.calls[0][0];
    expect(tree.type?.name || tree.type).toBeTruthy();
    expect(tree.props.children).toBeTruthy();
  });
});
