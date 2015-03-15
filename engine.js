/// <reference path="jquery-1.7.2.min.js" />

String.prototype.replaceAt = function(index, c) {
    return this.substr(0, index) + c + this.substr(index + (c.length == 0 ? 1 : c.length));
}

var engine = {};

engine.getMap = function (width, height) {

    var elements = [], width = width, height = height;

    var inBounds = function (x, y) {
        return x >= 0 && y >= 0 && x < width && y < height;
    };

    var addElement = function (e) {
        if (e.x < 0 || e.x >= width || e.y < 0 || e.y >= height)
            throw "cannot add element, out of range";
        elements.push(e);
    };

    var getVisibleElements = function (viewport) {

        return elements.filter(function (el) {
            return el.display 
                && viewport.top <= el.x
                && viewport.top + viewport.height > el.x
                && viewport.left <= el.y
                && viewport.left + viewport.width > el.y;
        });

    };

    var getElementsAt = function (x, y) {
        return elements.filter(function (el) {
            return x == el.x && y == el.y && el.display;
        });
    };

    var moveElement = function (el, left, up, viewport, keepVisible) {
        var moved = false;
        if (inBounds(el.x + left, el.y + up)) {
            var elsAt = getElementsAt(el.x + left, el.y + up);
            elsAt = elsAt.filter(
                        function (a) {
                            return a.solid;
                        }
                    );

            if (elsAt.length == 0) {
                el.x += left;
                el.y += up;
                moved = true;
            }
        }

        //move viewport to keep this element visible. need to get viewport though...
        if (keepVisible) {
            viewport.makeVisible(el.x, el.y);
        }

        return moved;
    };

    

    var removeElement = function (element) {
        elements.index
    }

    return {
        width: width,
        height: height,
        addElement: addElement,
        getVisibleElements: getVisibleElements,
        moveElement: moveElement
    };
};



engine.getViewport = function (map, outstream, width, height, defSymbol) {
    var map = map, outstream = outstream, defaultSymbol = defSymbol ? defSymbol : '-';

    if (height > map.height || width > map.width) throw "Viewport cannot be bigger than map";

    var shift = function (left, up) {
        if (map.width >= this.left + this.width + left && 0 <= this.left + left) this.left += left;
        if (map.height >= this.top + this.height + up && 0 <= this.top + up) this.top += up;
    };


    var makeVisible = function (x, y) {
        //not quite working

        var sLeft = 0, sUp = 0;
        if (x < this.left)
            sLeft = x - this.left;
        else if (x > this.left + this.width - 1)
            sLeft = this.left + this.width + 1 - x;
        else if (y < this.top)
            sUp = y - this.top;
        else if (y > this.top + this.height - 1)
            sUp = this.top + this.height + 1 - y;

        shift(sLeft, sUp);
    };

    var getViewportIndex = function (el) {
        var x = (el.x - this.left);

        var y = (el.y - this.top) * this.width;

        return x + y;

    };

    var draw = function () {
        var output = [];
        var elements = map.getVisibleElements(this);

        //sort elements in order they should be displayed in
        elements = elements.sort(function (a, b) {
            var aa = a.x + map.width * a.y + a.z * .0049 + .5, bb = b.x + map.width * b.y + b.z * .0049 + .5;
            return aa - bb;
        });

        //fill with default
        while (output.length < map.width * map.height) output.push(defaultSymbol);

        //add elements
        while (elements.length > 0) {
            var el = elements[0];
            elements.splice(0, 1);

            var mapIdx = el.x + el.y * map.width;
            //var viewportIndex = this.getViewportIndex(el);

            output[mapIdx] = el;
        };

        var s = '';
        //convert to string
        while (output.length > 0) {
            var el = output.pop();

            if (el == defaultSymbol) {
                s = el + s;
            }
            else {
                var e = "<span style=\"color:" + el.color + "\">" + el.char + "</span>";
                s = e + s;
            }



            if (output.length % this.height == 0)
                s = '<br/>' + s;
        }

        outstream.html(s);
    };

    return {
        top: 0,
        left: 0,
        width: height,
        height: width,
        shift: shift,
        draw: draw,
        getViewportIndex: getViewportIndex,
        makeVisible: makeVisible
    }
};

engine.elements = {};

engine.createElement = function (char, x, y, z, color, isMask, solid) {
    return {
        char : char,
        x:x,
        y:y,
        z:z, //only supports 99 z levels (positive and negative)
        color: (color ? color : ''),
        isMask :isMask,
        solid : solid,
        display : true
    };
};



