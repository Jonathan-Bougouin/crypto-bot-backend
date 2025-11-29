import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;

    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as any;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.permission).toBe('default');
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isEnabled).toBe(false);
  });

  it('should request permission successfully', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      const permission = await result.current.requestPermission();
      expect(permission).toBe('granted');
    });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'crypto_alerts_notifications_enabled',
      'true'
    );
  });

  it('should toggle notifications', async () => {
    global.Notification.permission = 'granted';
    global.localStorage.getItem = vi.fn().mockReturnValue('true');

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.toggleNotifications();
    });

    expect(global.localStorage.setItem).toHaveBeenCalled();
  });
});
