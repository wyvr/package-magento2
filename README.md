# Magento 2 Shop Implementation Package

Package for [wyvr](https://wyvr.dev) which provides a headless ecommerce implementation of the [shop package](https://github.com/wyvr/package-shop).

This package requires the [shop package](https://github.com/wyvr/package-shop) to be installed and used to work.

## **WARNING: This software is currently under heavy development. It is not considered stable and there may be bugs, incomplete features, or changes without prior notice. Use at your own risk.**

## Install

### Install dependency

Add it to your Node.js Dependencies with

```bash
pnpm install @wyvr/package-magento2
```

### Add package

Add the package to your `wyvr.js` file, before the shop package

```javascript
export default {
    packages: [
        {
            name: 'magento2',
            path: '@wyvr/package-magento2',
        },
        {
            name: 'Shop',
            path: '@wyvr/package-shop',
        },
    ],
};
```

## Release Notes

see [Release Notes](RELEASE_NOTES.md)

## Contributing Guidelines

TBD

## License

[MIT](LICENSE.md)
