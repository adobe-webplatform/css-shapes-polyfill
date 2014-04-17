shapes-polyfill
===============

The shapes polyfill is a JavaScript implementation of the CSS Shapes specification.
You can use the polyfill to approximate CSS Shapes behavior in browsers that do not
support the feature.

## Building the Polyfill

Besides the source code, you will also need node, npm, and grunt to compile. To build
1. Clone the source code
2. Enter the source directory
3. Run `npm install`
4. Run `grunt build`

If you are successful, you should see a `shapes-polyfill.js` and `shapes-polyfill.min.js` in your source directory.

## Using the polyfill

To use the polyfill, simply include the script in your page.
    <script src='/shapes-polyfill.js'></script>

Then, set any shape styles in `<link>` or `<style>` stylesheets accessible to your domain.

    .shape {
        shape-outside: circle(50%);
        shape-margin: 10px;
    }

That's it!

## Customization

By default, the script runs automatically. You can disable this behavior by setting `data-auto-run` to `false` on the script tag.

    <script src='/shapes-polyfill.js' data-auto-run='false'></script>

The polyfill can also be run on-demand using the `run` method.

    <script>
        window.onload = function() {
            window.ShapesPolyfill.run();
        }
    </script>

Optional parameters can be passed in a params object to the run method, including `force` which will reload all styles as well as re-running the layout algorithm.

## Known Issues

Because of the way styles are loaded, inline styles, and those added after the script is loaded, will not be added automatically.

The implementation works by creating a series of floats approximating the shape's contour and parenting them within a zero-height div. As such, it may introduce line breaks if the original float shape occurs in the middle of a line of text. Also, multiple shaped floats stacking or in close proximity to each other may need to clear each other to work with the polyfill.

## Browser Support

The polyfill should work with all current versions of desktop and mobile browsers. Unsupported browsers include IE versions less than 9.

## Feedback

Please let us know if you have any feedback, including bugs.
