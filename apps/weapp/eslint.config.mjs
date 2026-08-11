import uni from '@uni-helper/eslint-config'

/**
 * weapp 统一使用 @uni-helper/eslint-config（antfu）风格：
 * - 单引号
 * - 无分号
 * - 2 空格缩进
 * - quote-props: consistent（含 app-plus / mp-weixin 等连字符 key 时需全部加引号）
 *
 * 保存时请依赖 ESLint Fix，不要用 Prettier 格式化本包（见 package.json "prettier": false）。
 */
export default uni(
  {
    unocss: true,
    rules: {
      'no-console': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
      'style/quotes': ['error', 'single'],
      'style/semi': ['error', 'never'],
      'style/quote-props': ['error', 'consistent'],
      'style/comma-dangle': ['error', 'always-multiline'],
      'style/indent': ['error', 2],
    },
    ignores: [
      'src/uni_modules/**/*',
      'dist/**/*',
      '**/*.md',
    ],
  },
)
