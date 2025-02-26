// .eslintrc.js (FlatCompat 사용 버전)
module.exports = (() => {
  const { FlatCompat } = require('@eslint/eslintrc');
  const compat = new FlatCompat({
    baseDirectory: __dirname,
  });
  return [
    ...compat.extends('next/core-web-vitals'),
  ];
})();