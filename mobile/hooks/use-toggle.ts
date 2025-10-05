import { useState, useCallback } from 'react';

interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}

/**
 * Hook for toggling boolean state
 *
 * Provides convenient methods for managing boolean state values.
 * Useful for modals, dropdowns, visibility toggles, etc.
 *
 * @param initialValue - Initial boolean value (default: false)
 * @returns Object with value and toggle functions
 *
 * @example
 * const { value: isOpen, toggle, setTrue: open, setFalse: close } = useToggle(false);
 *
 * <Modal visible={isOpen} onClose={close}>
 *   <Button onPress={toggle}>Toggle</Button>
 * </Modal>
 *
 * @example
 * const modal = useToggle();
 *
 * <Button onPress={modal.setTrue}>Open Modal</Button>
 * <Modal visible={modal.value} onClose={modal.setFalse} />
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
  };
}

export default useToggle;
