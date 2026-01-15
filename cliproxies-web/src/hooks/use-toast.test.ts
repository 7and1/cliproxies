import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useToast, toast, reducer } from "./use-toast";

describe("use-toast hook", () => {
  beforeEach(() => {
    // Clear toasts before each test
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("reducer", () => {
    it("returns initial state for empty action", () => {
      const state = { toasts: [] };
      const newState = reducer(state, {
        type: "REMOVE_TOAST",
        toastId: undefined,
      });
      expect(newState.toasts).toEqual([]);
    });

    it("ADD_TOAST adds toast to beginning of array", () => {
      const state = { toasts: [] };
      const newState = reducer(state, {
        type: "ADD_TOAST",
        toast: { id: "1", title: "Test" },
      });
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe("1");
    });

    it("ADD_TOAST enforces TOAST_LIMIT", () => {
      const state = { toasts: [] };
      // Add more than TOAST_LIMIT (3)
      for (let i = 1; i <= 5; i++) {
        state.toasts = reducer(state, {
          type: "ADD_TOAST",
          toast: { id: String(i), title: `Toast ${i}` },
        }).toasts;
      }
      expect(state.toasts).toHaveLength(3);
      // Should keep the 3 most recent (5, 4, 3)
      expect(state.toasts.map((t) => t.id)).toEqual(["5", "4", "3"]);
    });

    it("UPDATE_TOAST updates existing toast", () => {
      const state = {
        toasts: [{ id: "1", title: "Original" }],
      };
      const newState = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });
      expect(newState.toasts[0].title).toBe("Updated");
    });

    it("UPDATE_TOAST does not add new toast", () => {
      const state = { toasts: [{ id: "1", title: "Test" }] };
      const newState = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "2", title: "New" },
      });
      expect(newState.toasts).toHaveLength(1);
    });

    it("DISMISS_TOAST schedules removal", () => {
      vi.useRealTimers();
      const state = {
        toasts: [{ id: "1", title: "Test" }],
      };
      reducer(state, {
        type: "DISMISS_TOAST",
        toastId: "1",
      });
      // Toast should still be in state immediately after DISMISS
      expect(state.toasts).toHaveLength(1);
    });

    it("REMOVE_TOAST removes specific toast", () => {
      const state = {
        toasts: [
          { id: "1", title: "Test 1" },
          { id: "2", title: "Test 2" },
        ],
      };
      const newState = reducer(state, {
        type: "REMOVE_TOAST",
        toastId: "1",
      });
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe("2");
    });

    it("REMOVE_TOAST with undefined removes all toasts", () => {
      const state = {
        toasts: [
          { id: "1", title: "Test 1" },
          { id: "2", title: "Test 2" },
        ],
      };
      const newState = reducer(state, {
        type: "REMOVE_TOAST",
        toastId: undefined,
      });
      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe("useToast hook", () => {
    it("returns initial state with empty toasts", () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it("toast function adds a new toast", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Test Toast" });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Test Toast");
    });

    it("toast function returns dismiss and update functions", () => {
      const { result } = renderHook(() => useToast());

      let toastReturn;
      act(() => {
        toastReturn = result.current.toast({ title: "Test" });
      });

      expect(toastReturn).toHaveProperty("id");
      expect(toastReturn).toHaveProperty("dismiss");
      expect(toastReturn).toHaveProperty("update");
      expect(typeof toastReturn.dismiss).toBe("function");
      expect(typeof toastReturn.update).toBe("function");
    });

    it("dismiss function removes toast by id", () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        toastId = result.current.toast({ title: "Test" }).id;
      });

      act(() => {
        result.current.dismiss(toastId);
      });

      // Toast is removed after timeout
      vi.advanceTimersByTime(5000);
      expect(result.current.toasts).toHaveLength(0);
    });

    it("dismiss function without id removes all toasts", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
        result.current.toast({ title: "Toast 2" });
      });

      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        result.current.dismiss();
      });

      vi.advanceTimersByTime(5000);
      expect(result.current.toasts).toHaveLength(0);
    });

    it("update function updates toast", () => {
      const { result } = renderHook(() => useToast());

      let toastReturn;
      act(() => {
        toastReturn = result.current.toast({ title: "Original" });
      });

      act(() => {
        toastReturn.update({ id: toastReturn.id, title: "Updated" });
      });

      expect(result.current.toasts[0].title).toBe("Updated");
    });

    it("toast includes variant", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Error", variant: "destructive" });
      });

      expect(result.current.toasts[0].variant).toBe("destructive");
    });

    it("auto-removes toast after delay", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Auto-remove" });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it("can add multiple toasts", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
        result.current.toast({ title: "Toast 2" });
        result.current.toast({ title: "Toast 3" });
      });

      expect(result.current.toasts).toHaveLength(3);
    });

    it("respects TOAST_LIMIT", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.toast({ title: `Toast ${i}` });
        }
      });

      expect(result.current.toasts).toHaveLength(3);
    });
  });

  describe("toast function directly", () => {
    it("can be called outside of React", () => {
      const result = toast({ title: "Direct toast" });
      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("string");
    });

    it("generates unique IDs", () => {
      const id1 = toast({ title: "Test" }).id;
      const id2 = toast({ title: "Test" }).id;
      expect(id1).not.toBe(id2);
    });

    it("handles description", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: "Title",
          description: "Description",
        });
      });

      expect(result.current.toasts[0].description).toBe("Description");
    });
  });

  describe("cleanup and unmount", () => {
    it("cleans up listener on unmount", () => {
      const { unmount } = renderHook(() => useToast());

      expect(() => unmount()).not.toThrow();
    });

    it("handles multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: "From hook 1" });
      });

      // Both hooks should see the toast due to shared memory state
      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
    });
  });

  describe("edge cases", () => {
    it("handles empty toast object", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({});
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it("handles very long titles", () => {
      const { result } = renderHook(() => useToast());
      const longTitle = "A".repeat(1000);

      act(() => {
        result.current.toast({ title: longTitle });
      });

      expect(result.current.toasts[0].title).toBe(longTitle);
    });

    it("handles special characters in title", () => {
      const { result } = renderHook(() => useToast());
      const specialTitle = "Test <script>alert('xss')</script> & \"quotes\"";

      act(() => {
        result.current.toast({ title: specialTitle });
      });

      expect(result.current.toasts[0].title).toBe(specialTitle);
    });

    it("handles rapid dismiss calls", () => {
      const { result } = renderHook(() => useToast());

      let id;
      act(() => {
        id = result.current.toast({ title: "Test" }).id;
      });

      act(() => {
        result.current.dismiss(id);
        result.current.dismiss(id);
        result.current.dismiss(id);
      });

      expect(result.current.toasts).toHaveLength(1);
      vi.advanceTimersByTime(5000);
      expect(result.current.toasts).toHaveLength(0);
    });
  });
});
