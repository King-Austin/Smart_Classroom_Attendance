import Toast from "react-native-toast-message";

const resolveDescription = (text2?: string | { description?: string }) =>
  typeof text2 === "object" ? text2?.description : text2;

/**
 * Thin wrapper around react-native-toast-message so callers ported from the
 * web (sonner) can keep their `toast.success/error/info/warning(...)` API.
 *
 * Note: react-native-toast-message ships with three built-in types
 * (`success`, `error`, `info`). `warning` is intentionally an alias for
 * `error` so warnings get the attention-grabbing red treatment instead of
 * being indistinguishable from info. To get true warning styling, register
 * a custom `warning` renderer in the Toast config at the app root and
 * change the type below to `"warning"`.
 */
export const toast = {
  success: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "success", text1, text2: resolveDescription(text2) }),
  error: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "error", text1, text2: resolveDescription(text2) }),
  info: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "info", text1, text2: resolveDescription(text2) }),
  warning: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "error", text1, text2: resolveDescription(text2) }),
};
