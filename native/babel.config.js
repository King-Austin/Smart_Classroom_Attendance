module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
          },
          extensions: [
            ".web.ts",
            ".web.tsx",
            ".ios.ts",
            ".ios.tsx",
            ".android.ts",
            ".android.tsx",
            ".ts",
            ".tsx",
            ".web.js",
            ".ios.js",
            ".android.js",
            ".js",
            ".jsx",
            ".json",
          ],
        },
      ],
      "react-native-reanimated/plugin", // must be last
    ],
  };
};
