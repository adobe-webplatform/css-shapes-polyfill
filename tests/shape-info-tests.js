var ShapeInfoTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    var offsetTests = {
        styles: {
                margin: '0',
                border: 'none',
                padding: '0',
                width: '100px',
                height: '100px',
                cssFloat: 'left'
        },
        tests: [
        {
            name: 'for inset',
            shapeOutside: 'inset(21px 20px)',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the content-box',
            shapeOutside: 'inset(1px 0px) content-box',
            styles: {
                margin: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 100, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 100, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 100, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the content box + (negative margin)',
            shapeOutside: 'inset(0px) content-box',
            styles: {
                margin: '-20px'
            },
            step: 60,
            output: [
                { top: 0, bottom: 60, offset: 60, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the content-box + (padding & border & margin)',
            shapeOutside: 'inset(0px) content-box',
            styles: {
                padding: '10px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 0, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 125, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 125, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 125, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 125, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 125, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 0, cssFloat: 'left' },
                { top: 160, bottom: 170, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the margin-box + (padding & border & margin)',
            shapeOutside: 'inset(0px) margin-box',
            styles: {
                padding: '10px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 170, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 170, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 170, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 170, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 170, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 170, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 170, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 170, cssFloat: 'left' },
                { top: 160, bottom: 170, offset: 170, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the border-box + (padding & border & margin)',
            shapeOutside: 'inset(0px) border-box',
            styles: {
                padding: '10px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 150, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 150, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 150, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 150, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 150, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 150, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 150, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 150, cssFloat: 'left' },
                { top: 160, bottom: 170, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the padding-box + (padding & border & margin)',
            shapeOutside: 'inset(0px) padding-box',
            styles: {
                padding: '10px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 135, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 135, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 135, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 135, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 135, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 135, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 0, cssFloat: 'left' },
                { top: 160, bottom: 170, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset with rounds only on left',
            shapeOutside: 'inset(0px round 50% 0 0 50%)',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 100, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 100, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 100, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 100, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset with rounds only on right',
            shapeOutside: 'inset(0px round 0 50% 50% 0)',
            step: 10,
            output: [
                { top: 0, bottom: 10, offset: 80, cssFloat: 'left' },
                { top: 10, bottom: 20, offset: 90, cssFloat: 'left' },
                /* don't check the offsets that are non-integer */
                { top: 20, bottom: 30, cssFloat: 'left' },
                { top: 30, bottom: 40, cssFloat: 'left' },
                { top: 40, bottom: 50, offset: 100, cssFloat: 'left' },
                { top: 50, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 70, cssFloat: 'left' },
                { top: 70, bottom: 80, cssFloat: 'left' },
                { top: 80, bottom: 90, offset: 90, cssFloat: 'left' },
                { top: 90, bottom: 100, offset: 80, cssFloat: 'left' }
            ]
        },
        {
            name: 'for margin-box',
            shapeOutside: 'margin-box',
            styles: {
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 90,
            output: [
                { top: 0, bottom: 90, offset: 180, cssFloat: 'left' },
                { top: 90, bottom: 180, offset: 180, cssFloat: 'left' }
            ]
        },
        {
            name: 'for margin-box + (padding & border & margin)',
            shapeOutside: 'margin-box',
            styles: {
                padding: '11px 22px 33px 44px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 276, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 276, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 276, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 276, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 276, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 276, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 276, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 276, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 276, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 276, cssFloat: 'left' },
                { top: 200, bottom: 220, offset: 276, cssFloat: 'left' },
                { top: 220, bottom: 240, offset: 276, cssFloat: 'left' },
                { top: 240, bottom: 254, offset: 276, cssFloat: 'left' }
            ]
        },
        {
            name: 'for margin-box (+ padding)',
            shapeOutside: 'margin-box',
            styles: {
                padding: '11px 22px 33px 44px',
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 246, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 246, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 246, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 246, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 246, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 246, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 246, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 246, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 246, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 246, cssFloat: 'left' },
                { top: 200, bottom: 220, offset: 246, cssFloat: 'left' },
                { top: 220, bottom: 224, offset: 246, cssFloat: 'left' }
            ]
        },
        {
            name: 'for margin-box (+ border)',
            shapeOutside: 'margin-box',
            styles: {
                border: '33px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 246, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 246, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 246, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 246, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 246, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 246, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 246, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 246, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 246, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 246, cssFloat: 'left' },
                { top: 200, bottom: 220, offset: 246, cssFloat: 'left' },
                { top: 220, bottom: 240, offset: 246, cssFloat: 'left' }
            ]
        },
        {
            name: 'for border-box',
            shapeOutside: 'border-box',
            styles: {
                border: '30px',
                borderColor: 'black',
                borderStyle: 'solid',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 140, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 140, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 140, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 140, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 140, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 140, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 140, cssFloat: 'left' }
            ]
        },
        {
            name: 'for border-box + (padding & border & margin)',
            shapeOutside: 'border-box',
            styles: {
                padding: '11px 22px 33px 44px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 0, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 226, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 226, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 226, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 226, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 226, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 226, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 226, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 226, cssFloat: 'left' },
                { top: 200, bottom: 220, offset: 226, cssFloat: 'left' },
                { top: 220, bottom: 240, offset: 0, cssFloat: 'left' },
                { top: 240, bottom: 254, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for border-box (+ padding)',
            shapeOutside: 'border-box',
            styles: {
                padding: '10px 20px 30px 40px',
                border: '30px',
                borderColor: 'black',
                borderStyle: 'solid',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 200, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 200, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 200, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 200, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 200, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 200, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 200, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 200, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 200, cssFloat: 'left' }
            ]
        },
        {
            name: 'for border-box (+ margin)',
            shapeOutside: 'border-box',
            styles: {
                margin: '11px 22px 33px 44px',
                border: '30px',
                borderColor: 'black',
                borderStyle: 'solid',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 184, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 184, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 184, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 184, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 184, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 184, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 184, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 184, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for padding-box',
            shapeOutside: 'padding-box',
            styles: {
                padding: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 120, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 120, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 120, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 120, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 120, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 120, cssFloat: 'left' }
            ]
        },
        {
            name: 'for padding-box + (padding & border & margin)',
            shapeOutside: 'padding-box',
            styles: {
                padding: '11px 22px 33px 44px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 0, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 0, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 211, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 211, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 211, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 211, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 211, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 211, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 211, cssFloat: 'left' },
                { top: 200, bottom: 220, offset: 0, cssFloat: 'left' },
                { top: 220, bottom: 240, offset: 0, cssFloat: 'left' },
                { top: 240, bottom: 254, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for padding-box (20px border, padding)',
            shapeOutside: 'padding-box',
            styles: {
                padding: '19px 20px',
                borderWidth: '21px 20px',
                borderStyle: 'solid',
                width: '20px',
                height: '20px',
                'shape-outside': 'padding-box'
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' },
            ]
        },
        {
            name: 'for padding-box (21px margin)',
            shapeOutside: 'padding-box',
            styles: {
                padding: '20px',
                margin: '21px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 141, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 141, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 141, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 141, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 141, cssFloat: 'left' }
            ]
        },
        {
            name: 'for padding-box (21px border)',
            shapeOutside: 'padding-box',
            styles: {
                padding: '20px',
                border: '21px',
                borderStyle: 'solid',
                borderColor: 'yellow',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 141, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 141, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 141, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 141, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 141, cssFloat: 'left' }
            ]
        },
        {
            name: 'for content-box',
            shapeOutside: 'content-box',
            styles: {
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 80, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
            ]
        },
        {
            name: 'for content-box + (padding & border & margin)',
            shapeOutside: 'content-box',
            styles: {
                padding: '11px 22px 33px 44px',
                border: '15px',
                borderColor: 'black',
                borderStyle: 'solid',
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 0, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 0, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 189, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 189, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 189, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 189, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 189, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 0, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 0, cssFloat: 'left' },
                { top: 200, bottom: 220, offset: 0, cssFloat: 'left' },
                { top: 220, bottom: 240, offset: 0, cssFloat: 'left' },
                { top: 240, bottom: 254, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for content-box (21px padding)',
            shapeOutside: 'content-box',
            // If the line and shape both overlap at 20px, even coincidentally,
            // they will avoid each other, so tweak them slightly
            styles: {
                padding: '21px 20px',
                width: '80px',
                height: '78px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 100, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 100, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 100, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 0, cssFloat: 'left' },
            ]
        },
        {
            name: 'for content-box (21px margin)',
            shapeOutside: 'content-box',
            // If the line and shape both overlap at 20px, even coincidentally,
            // they will avoid each other, so tweak them slightly
            styles: {
                margin: '21px',
                width: '79px',
                height: '79px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 100, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 100, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 100, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 0, cssFloat: 'left' },
            ]
        },
        {
            name: 'for content-box (21px border)',
            shapeOutside: 'content-box',
            // If the line and shape both overlap at 20px, even coincidentally,
            // they will avoid each other, so tweak them slightly
            styles: {
                border: '21px',
                borderStyle: 'solid',
                borderColor: 'black',
                width: '79px',
                height: '79px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 100, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 100, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 100, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 0, cssFloat: 'left' },
            ]
        },
        {
            name: 'for inset with shape-margin applied',
            shapeOutside: 'inset(31px 30px)',
            shapeMargin: '10px',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for circle',
            shapeOutside: 'circle(24px)',
            step: 25,
            output: [
                { top: 0, bottom: 25, offset: 0, cssFloat: 'left' },
                { top: 25, bottom: 50, offset: 74, cssFloat: 'left' },
                { top: 50, bottom: 75, offset: 74, cssFloat: 'left' },
                { top: 75, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for ellipse',
            shapeOutside: 'ellipse(24px 24px)',
            step: 25,
            output: [
                { top: 0, bottom: 25, offset: 0, cssFloat: 'left' },
                { top: 25, bottom: 50, offset: 74, cssFloat: 'left' },
                { top: 50, bottom: 75, offset: 74, cssFloat: 'left' },
                { top: 75, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for polygon',
            shapeOutside: 'polygon(20px 21px, 80px 21px, 80px 79px, 20px 79px)',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(test.name, function() {
                var el = document.createElement('div');
                for (var prop in offsetTests.styles)
                    el.style[prop] = offsetTests.styles[prop];
                for (prop in test.styles)
                    el.style[prop] = test.styles[prop];
                el.setAttribute('data-shape-outside', test.shapeOutside);
                if (test.shapeMargin)
                    el.setAttribute('data-shape-margin', test.shapeMargin);

                document.body.appendChild(el);
                var shapeInfo = new ShapeInfo(el);
                document.body.removeChild(el);

                var offsets;
                shapeInfo.onReady(function() {
                    // count on this executing immediately except for images
                    offsets = shapeInfo.offsets({mode: "step", step: test.step});
                });

                test.output.forEach(function(output, i) {

                    for (var prop in output)
                        expect(offsets[i][prop]).to.equal(output[prop]);
                });
            })
        }
    }

    var adaptiveTests = {
        styles: {
                margin: '0',
                border: 'none',
                padding: '0',
                width: '100px',
                height: '100px',
                cssFloat: 'left'
        },
        tests: [{
            name: 'inset with rounds on left',
            width: 100, height: 100,
            topCorner: { width: 0, height: 0 },
            bottomCorner: { width: 0, height: 0 },
            shapeOutside: 'inset(0px round 50% 0 0 50%)'
        }, {
            name: 'inset with rounds on right',
            width: 100, height: 100,
            topCorner: { width: 50, height: 50 },
            bottomCorner: { width: 50, height: 50 },
            shapeOutside: 'inset(0px round 0 50% 50% 0)'
        }, {
            name: 'inset with uneven round on right',
            width: 100, height: 100,
            topCorner: { width: 50, height: 50 },
            bottomCorner: { width: 20, height: 20 },
            shapeOutside: 'inset(0px round 30% 50% 20% 40%)'
        }, {
            name: 'circle with negative margin',
            width: 60, height: 60,
            topCorner: { width: 0, height: 0 },
            bottomCorner: { width: 0, height: 0 },
            shapeOutside: 'circle() content-box',
            styles: {
                margin: '-20px'
            }
        }],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(test.name, function() {
                var el = document.createElement('div'), prop;
                for (prop in adaptiveTests.styles)
                    el.style[prop] = adaptiveTests.styles[prop];
                for (prop in test.styles)
                    el.style[prop] = test.styles[prop];
                el.setAttribute('data-shape-outside', test.shapeOutside);
                if (test.shapeMargin)
                    el.setAttribute('data-shape-margin', test.shapeMargin);

                document.body.appendChild(el);
                var shapeInfo = new ShapeInfo(el);
                document.body.removeChild(el);

                var offsets;
                shapeInfo.onReady(function() {
                    // returns immediately for non-image values
                    offsets = shapeInfo.offsets({ limit: 18 });
                });

                offsets.forEach(function(offset) {
                    var expected;
                    if (offset.bottom <= test.topCorner.height) {
                        expected = ellipseXIntercept(test.topCorner.height - offset.bottom, test.topCorner.width, test.topCorner.height);
                        expected += test.width - test.topCorner.width;
                        expect(offset.offset).to.be.within(expected - 0.1, expected + 0.1);
                    } else if (offset.bottom <= test.height - test.bottomCorner.height) {
                        expected = test.width;
                        expect(offset.offset).to.equal(expected);
                    } else {
                        expected = ellipseXIntercept(offset.top - (test.height - test.bottomCorner.height), test.bottomCorner.width, test.bottomCorner.height);
                        expected += test.width - test.bottomCorner.width;
                        expect(offset.offset).to.be.within(expected - 0.1, expected + 0.1);
                    }
                });
            });
        }
    }

    function ellipseXIntercept(y, rx, ry) {
        return rx * Math.sqrt(1 - (y * y) / (ry * ry));
    }

    function generateTests(testSet) {
        testSet.tests.forEach(function(test) {
            testSet.runTest(test);
        });
    }

    describe('ShapeInfo.offsets', function() {
        generateTests(offsetTests);
    });

    describe('ShapeInfo.offsets adaptive', function() {
        generateTests(adaptiveTests);
    });
}

return {
    'register': register
}
}()
