
# Adpanel
> An advert panel using GPT tags

## Usage

**This component expects an ES6 environment**, and so if you are using this in an app,
you should drop in a polyfill library - it has been tested with [babel-polyfill] but
[core-js] or [es6-shim] may also work.

[babel-polyfill]: https://babeljs.io/docs/usage/polyfill/
[core-js]: https://www.npmjs.com/package/core-js
[es6-shim]: https://www.npmjs.com/package/es6-shim

The default export is a React Component, so you can simply import the component and use
it within some JSX, like so:

```js
import Adpanel from '@economist/component-ad-panel';

return <Adpanel/>;
```

For more examples on usage, see [`src/example.es6`](./src/example.es6).

## Props and defaults:

 * `adTag` (required string): The DFP tag this points to. Often in the format of a URL. example: `/5605/foo.bar/qux/x`.
 * `className` (string): Add this className to ad-panel__container.
 * ```
  sizes={[
      [ 60, 60 ],
      [ 70, 70 ],
      [ 300, 250 ],
      [ 1024, 768 ]
    ]}
  ``` (array of pairs of advertisement width, height): what ad sizes can be loaded. Is used as the `size` argument to [googletag.defineSlot](https://developers.google.com/doubleclick-gpt/reference#googletag.defineSlot)
 * ```
 sizeMapping={[
        [[980, 200], [[1024, 768]]],
        [[0, 0], [[300, 250]]],
      ]}
      ``` (array of pairs of screen sizes [ width, height ] and advertisement sizes [ [width1, height1], [width2, height2], ... ] ): Each element in this array results in a call to [sizeMapping().addSize](https://developers.google.com/doubleclick-gpt/reference#googletag.SizeMappingBuilder_addSize)
 * `targeting` (array of pairs of key/value strings): Defines the ad targeting. Each element corresponds to a call to [setTargeting](https://developers.google.com/doubleclick-gpt/reference#googletag.PassbackSlot_setTargeting)
 * `reserveHeight` (number of px): Sets a min-height to the ad, so as to avoid content jumps when the ad eventually comes around.
 * `googletag` (instance of the googletag object): Mostly a testing hook, but can be passed to avoid loading the DFP tag again, if it was already loaded.

## Relevant reading:

 * [The window.googletag API](https://developers.google.com/doubleclick-gpt/reference)
 * [understanding sizeMappings](https://support.google.com/dfp_premium/answer/3423562)


## Deprecation notice

The `lazyload` prop has been removed as the feature was making this component unmaintainable and bug-prone. From now on you can use the excellent [react-lazy-load](https://github.com/loktar00/react-lazy-load/). Here's an example:

```
// Before:
<AdPanel lazyLoad {...otherProps} />

// After:
<LazyLoad>
  <AdPanel {...otherProps} />
</LazyLoad>
```

The `animated` prop has also been removed, and its relevant CSS with it. This feature can also be implemented very easily using LazyLoad (and some classNames):

```
// Before:
<AdPanel animated {...otherProps} />

// After:
class AnimatedAd extends React.Component {
  render() {
    const className = this.state && this.state.visible ?
      'animated-ad-wrapper animated-ad-wrapper--visible' :
      'animated-ad-wrapper';
    return (
      <div className={className}>
        <LazyLoad onContentVisible={() => { this.setState({ visible: true }) }}>
          <AdPanel {...this.props} />
        </LazyLoad>
      </div>
    )
  }
}
<AnimatedAd {...otherProps} />
```

Both work exactly the same.

## Install

```bash
npm i -S @economist/component-ad-panel
```

## Run tests

```bash
npm test
```
