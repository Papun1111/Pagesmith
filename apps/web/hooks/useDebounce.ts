import { useState, useEffect } from 'react';

/**
 * A custom React hook that debounces a value.
 * It's used to delay the processing of a rapidly changing value, such as user input in a text field.
 * This is crucial for performance, as it prevents excessive API calls or re-renders.
 *
 * @template T The type of the value to be debounced.
 * @param {T} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {T} The debounced value, which only updates after the specified delay has passed
 * without the original value changing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay has passed.
    // This is the core of the debounce logic: resetting the timer on each change.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run the effect only if the value or delay changes.

  return debouncedValue;
}
