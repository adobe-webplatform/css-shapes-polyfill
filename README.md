shapes-polyfill
===============

The shapes polyfill is a JavaScript implementation of the [CSS Shapes][css-shapes-spec] specification.
You can use the polyfill to approximate CSS Shapes behavior in browsers that do not
support the feature. By default, the polyfill will not run when a native shapes
implementation is available.

## Using the polyfill

To use the polyfill, download or build `shapes-polyfill.js` or `shapes-polyfill.min.js` (the minified version). Then, include it in your page:

    <script src='/shapes-polyfill.js'></script>

After that, set any shape styles in `<link>` or `<style>` stylesheets accessible to your domain:

    .shape {
        float: left;
        shape-outside: circle(50%);
        shape-margin: 1em;
    }

And add the required markup:

    <div class='shape'></div>
    This is some content that will wrap around the floating
    shape to the left. How very exciting!

That's it!

## Customization

By default, the script runs automatically. You can disable this behavior by setting `data-auto-run` to `false` on the script tag.

    <script src='/shapes-polyfill.js' data-auto-run='false'></script>

The polyfill can also be run on-demand using the `run` method:

    <script>
        window.onload = function() {
            window.ShapesPolyfill.run();
        }
    </script>

If you are going to re-run the polyfill, you should first call `teardown`:

    <script>
        window.setInterval(function() {
            window.ShapesPolyfill.teardown();
            window.ShapesPolyfill.run();
        }, 5000);
    </script>

Optional parameters can be passed in a params object to the run method, including `force` which can be set to one of the `ShapePolyfill.Force` values to force style reload, layout, or both. You might want to use this approach if you are dynamically modifying styles, or want to control exactly when the polyfill runs. For an example, check out `tests\shapes-performance.html`.

## Building the Polyfill

If you are interested in tinkering with the polyfill, you will need the following build dependencies:

* [node][node],
* [npm][npm], and
* [grunt][grunt]

To build

1. Clone the source code
2. From the command line, enter the source directory
3. Run `npm install`
4. Run `grunt build`

If you are successful, you should have an updated `shapes-polyfill.js` and `shapes-polyfill.min.js` in your source directory. For a full list of tasks, just enter `grunt` at the command line.

The main source files are in the `src` directory, and you should make sure that any modifications you make pass the test suite in `tests\shape-test-suite.html`. Note that some of the tests require being run from a local server.

## Known Issues

The polyfill isn't perfect, and will generally work best with simple shapes. If you find a bug, please log an [issue][new-issue] to let us know.
* Because of the way styles are loaded, inline styles, and those added after the script is loaded, will not be added automatically.
* The implementation works by creating a series of floats approximating the shape's contour and parenting them within a zero-height div. As such, it may introduce line breaks if the original float shape occurs in the middle of a line of text.
* Multiple shaped floats stacking or in close proximity may clear each other once the polyfill is applied.
* The polyfill is slower than native implementations doing shapes layout (roughly 10-20x). You should take this into consideration when deciding if the polyfill is right for your project.
* IE does not support SVG image values, as its security model prevents grabbing [rendered SVG pixel values via canvas][svg-canvas-origin-clean].
* Some browsers will not issue a CORS request if a non-CORS version of the resource has already been loaded. This may surface if you use the same image as an `img`' `src` and `shape-outside`.

## Browser Support

The polyfill should work with all current versions of desktop and mobile browsers. Below is a table of support for Chrome (C), Firefox (FF), Internet Explorer (IE), Opera (O), Safari (S), Android (A), and iOS (iOS) browsers.

<table>
  <tr>
    <th>C</th>
    <th>FF</th>
    <th>IE</th>
    <th>O</th>
    <th>S</th>

    <th>A</th>
    <th>iOS</th>
  </tr>
  <tr>
    <td>5+</td>
    <td>4+</td>
    <td>10+ [1]</td>
    <td>12+</td>
    <td>5+</td>

    <td>2.1</td>
    <td>3.2+</td>
  </tr>
</table>

[1] If you are not using cross-origin images, the polyfill should work back to IE 9. Also note the lack of SVG support, as of IE 11.

## Feedback

Please let us know if you have any feedback. If you run into any problems, you can file a [new issue][new-issue]. You can also reach us [@adobeweb][twitter].

[css-shapes-spec]: http://www.w3.org/TR/css-shapes/
[new-issue]: https://github.com/adobe-webplatform/css-shapes-polyfill/issues/new
[node]: http://nodejs.org
[npm]: http://www.npmjs.org
[grunt]: http://gruntjs.com
[twitter]: http://twitter.com/adobeweb
[svg-canvas-origin-clean]: http://svgopen.org/2010/papers/62-From_SVG_to_Canvas_and_Back/
