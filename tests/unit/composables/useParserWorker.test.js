/**
 * Unit Tests for useParserWorker Composable
 *
 * Feature: 009-vue-migration-completion
 * User Story 3: Performance & Privacy Verification
 *
 * Tests worker lifecycle management, state transitions, and cleanup
 *
 * Task: T073
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

// Mock Comlink
vi.mock('comlink', () => ({
  wrap: vi.fn((worker) => ({
    parseIOS: vi.fn().mockResolvedValue({
      metadata: { platform: 'iOS' },
      breakdownRoot: { name: 'root', children: [] },
      treemapData: { id: 'root', children: [] },
      summary: { totalSize: 1024 },
    }),
    parseAndroid: vi.fn().mockResolvedValue({
      metadata: { platform: 'Android' },
      breakdownRoot: { name: 'root', children: [] },
      treemapData: { id: 'root', children: [] },
      summary: { totalSize: 1024 },
    }),
    cancel: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Worker
let mockWorker;
global.Worker = vi.fn((url, options) => {
  mockWorker = {
    terminate: vi.fn(),
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return mockWorker;
});

describe('useParserWorker Composable', () => {
  let useParserWorker;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Import composable (fresh each time)
    const module = await import('@/composables/useParserWorker');
    useParserWorker = module.useParserWorker;
  });

  afterEach(() => {
    mockWorker = null;
  });

  /**
   * T073: Verify worker terminates in onUnmounted() hook
   *
   * Success criteria:
   * - Worker is created when parseFile() is called
   * - Worker.terminate() is called when component unmounts
   * - No memory leaks from lingering workers
   */
  it('T073: should terminate worker on component unmount', async () => {
    // Create a test component that uses the composable
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    // Mount component
    const wrapper = mount(TestComponent);

    // Parse a file to initialize worker
    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.ipa',
      { type: 'application/octet-stream' }
    );

    await wrapper.vm.workerAPI.parseIOS(mockFile);

    // Verify worker was created
    expect(global.Worker).toHaveBeenCalled();
    expect(mockWorker).toBeTruthy();

    // Unmount component (triggers onUnmounted)
    wrapper.unmount();

    // VERIFICATION: Worker.terminate() was called
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should initialize with idle state', () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    // Verify initial state
    expect(wrapper.vm.workerAPI.status).toBe('idle');
    expect(wrapper.vm.workerAPI.state).toBe('idle');
    expect(wrapper.vm.workerAPI.progress).toBe(0);
    expect(wrapper.vm.workerAPI.error).toBeNull();
    expect(wrapper.vm.workerAPI.isParsing).toBe(false);
    expect(wrapper.vm.workerAPI.isComplete).toBe(false);

    wrapper.unmount();
  });

  it('should update status to parsing when parseIOS is called', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.ipa',
      { type: 'application/octet-stream' }
    );

    // Start parsing (async)
    const parsePromise = wrapper.vm.workerAPI.parseIOS(mockFile);

    // Check status is 'parsing' while in progress
    expect(wrapper.vm.workerAPI.status).toBe('parsing');
    expect(wrapper.vm.workerAPI.isParsing).toBe(true);

    // Wait for completion
    await parsePromise;

    // Check status is 'success' after completion
    expect(wrapper.vm.workerAPI.status).toBe('success');
    expect(wrapper.vm.workerAPI.isComplete).toBe(true);
    expect(wrapper.vm.workerAPI.progress).toBe(100);

    wrapper.unmount();
  });

  it('should update status to parsing when parseAndroid is called', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.apk',
      { type: 'application/octet-stream' }
    );

    // Start parsing
    const parsePromise = wrapper.vm.workerAPI.parseAndroid(mockFile);

    // Check status is 'parsing'
    expect(wrapper.vm.workerAPI.status).toBe('parsing');

    await parsePromise;

    // Check status is 'success'
    expect(wrapper.vm.workerAPI.status).toBe('success');
    expect(wrapper.vm.workerAPI.progress).toBe(100);

    wrapper.unmount();
  });

  it('should handle parseFile with iOS file', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'MyApp.ipa',
      { type: 'application/octet-stream' }
    );

    const result = await wrapper.vm.workerAPI.parseFile(mockFile);

    expect(result.metadata.platform).toBe('iOS');
    expect(wrapper.vm.workerAPI.status).toBe('success');

    wrapper.unmount();
  });

  it('should handle parseFile with Android file', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'MyApp.apk',
      { type: 'application/octet-stream' }
    );

    const result = await wrapper.vm.workerAPI.parseFile(mockFile);

    expect(result.metadata.platform).toBe('Android');
    expect(wrapper.vm.workerAPI.status).toBe('success');

    wrapper.unmount();
  });

  it('should reject unsupported file types', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'document.txt',
      { type: 'text/plain' }
    );

    await expect(
      wrapper.vm.workerAPI.parseFile(mockFile)
    ).rejects.toThrow('Unsupported file type');

    expect(wrapper.vm.workerAPI.status).toBe('error');
    expect(wrapper.vm.workerAPI.error).toBeTruthy();

    wrapper.unmount();
  });

  it('should handle cancellation', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.ipa',
      { type: 'application/octet-stream' }
    );

    // Start parsing (don't await yet)
    const parsePromise = wrapper.vm.workerAPI.parseIOS(mockFile);

    // Cancel while parsing
    await wrapper.vm.workerAPI.cancel();

    // Status should be 'cancelled'
    expect(wrapper.vm.workerAPI.status).toBe('cancelled');

    wrapper.unmount();
  });

  it('should reset state correctly', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.ipa',
      { type: 'application/octet-stream' }
    );

    // Parse file
    await wrapper.vm.workerAPI.parseIOS(mockFile);

    // Verify state after parsing
    expect(wrapper.vm.workerAPI.status).toBe('success');
    expect(wrapper.vm.workerAPI.progress).toBe(100);

    // Reset
    wrapper.vm.workerAPI.reset();

    // Verify state is reset
    expect(wrapper.vm.workerAPI.status).toBe('idle');
    expect(wrapper.vm.workerAPI.state).toBe('idle');
    expect(wrapper.vm.workerAPI.progress).toBe(0);
    expect(wrapper.vm.workerAPI.error).toBeNull();

    wrapper.unmount();
  });

  it('should handle parse errors gracefully', async () => {
    // Mock a worker that throws an error
    const { wrap } = await import('comlink');
    wrap.mockReturnValueOnce({
      parseIOS: vi.fn().mockRejectedValue(new Error('Parse failed')),
      parseAndroid: vi.fn(),
      cancel: vi.fn(),
    });

    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.ipa',
      { type: 'application/octet-stream' }
    );

    // Parse file (should fail)
    await expect(
      wrapper.vm.workerAPI.parseIOS(mockFile)
    ).rejects.toThrow('Parse failed');

    // Verify error state
    expect(wrapper.vm.workerAPI.status).toBe('error');
    expect(wrapper.vm.workerAPI.error).toBeTruthy();
    expect(wrapper.vm.workerAPI.error.message).toBe('Parse failed');

    wrapper.unmount();
  });

  it('should not create worker until parseFile is called', () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    // Verify worker is NOT created yet
    expect(global.Worker).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('should create worker lazily on first parse call', async () => {
    const TestComponent = {
      setup() {
        const workerAPI = useParserWorker();
        return { workerAPI };
      },
      template: '<div>{{ workerAPI.status }}</div>',
    };

    const wrapper = mount(TestComponent);

    const mockFile = new File(
      [new ArrayBuffer(1024)],
      'test.ipa',
      { type: 'application/octet-stream' }
    );

    // Parse file (triggers worker creation)
    await wrapper.vm.workerAPI.parseIOS(mockFile);

    // Verify worker was created
    expect(global.Worker).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
