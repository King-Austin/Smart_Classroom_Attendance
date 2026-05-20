import Toast from "react-native-toast-message";

export const toast = {
  success: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "success", text1, text2: typeof text2 === "object" ? text2?.description : text2 }),
  error: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "error", text1, text2: typeof text2 === "object" ? text2?.description : text2 }),
  info: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "info", text1, text2: typeof text2 === "object" ? text2?.description : text2 }),
  warning: (text1: string, text2?: string | { description?: string }) =>
    Toast.show({ type: "info", text1, text2: typeof text2 === "object" ? text2?.description : text2 }),
};
