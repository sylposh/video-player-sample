/*
Copyright 2011 Google

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Declare namespaces
 */
goog.provide('gva.easing');
goog.provide('gva.easing.back');
goog.provide('gva.easing.bounce');
goog.provide('gva.easing.circular');
goog.provide('gva.easing.cubic');
goog.provide('gva.easing.elastic');
goog.provide('gva.easing.exponential');
goog.provide('gva.easing.linear');
goog.provide('gva.easing.quadratic');
goog.provide('gva.easing.quartic');
goog.provide('gva.easing.quintic');
goog.provide('gva.easing.sinusoidal');

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.linear.easeNone = function(k) {
    return k;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quadratic.easeIn = function(k) {
    return k * k;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quadratic.easeOut = function(k) {
    return -k * (k - 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quadratic.easeInOut = function(k) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k;
    }
    return -0.5 * (--k * (k - 2) - 1);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.cubic.easeIn = function(k) {
    return k * k * k;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.cubic.easeOut = function(k) {
    return --k * k * k + 1;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.cubic.easeInOut = function(k) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k * k;
    }
    return 0.5 * ((k -= 2) * k * k + 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quartic.easeIn = function(k) {
    return k * k * k * k;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quartic.easeOut = function(k) {
    return -(--k * k * k * k - 1);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quartic.easeInOut = function(k) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k;
    }
    return -0.5 * ((k -= 2) * k * k * k - 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quintic.easeIn = function(k) {
    return k * k * k * k * k;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quintic.easeOut = function(k) {
    return (k = k - 1) * k * k * k * k + 1;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.quintic.easeInOut = function(k) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k * k;
    }
    return 0.5 * ((k -= 2) * k * k * k * k + 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.sinusoidal.easeIn = function(k) {
    return -Math.cos(k * Math.PI / 2) + 1;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.sinusoidal.easeOut = function(k) {
    return Math.sin(k * Math.PI / 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.sinusoidal.easeInOut = function(k) {
    return -0.5 * (Math.cos(Math.PI * k) - 1);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.exponential.easeIn = function(k) {
    return k == 0 ? 0 : Math.pow(2, 10 * (k - 1));
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.exponential.easeOut = function(k) {
    return k == 1 ? 1 : -Math.pow(2, -10 * k) + 1;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.exponential.easeInOut = function(k) {
    if (k == 0) {
        return 0;
    }
    if (k == 1) {
        return 1;
    }
    if ((k *= 2) < 1) {
        return 0.5 * Math.pow(2, 10 * (k - 1));
    }
    return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.circular.easeIn = function(k) {
    return -(Math.sqrt(1 - k * k) - 1);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.circular.easeOut = function(k) {
    return Math.sqrt(1 - --k * k);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.circular.easeInOut = function(k) {
    if ((k /= 0.5) < 1) {
        return -0.5 * (Math.sqrt(1 - k * k) - 1);
    }
    return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.elastic.easeIn = function(k) {
    var s, a = 0.1, p = 0.4;
    if (k == 0) {
        return 0;
    }
    if (k == 1) {
        return 1;
    }
    if (!p) {
        p = 0.3;
    }
    if (!a || a < 1) {
        a = 1;
        s = p / 4;
    } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.elastic.easeOut = function(k) {
    var s, a = 0.1, p = 0.4;
    if (k == 0) {
        return 0;
    }
    if (k == 1) {
        return 1;
    }
    if (!p) {
        p = 0.3;
    }
    if (!a || a < 1) {
        a = 1;
        s = p / 4;
    } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.elastic.easeInOut = function(k) {
    var s, a = 0.1, p = 0.4;
    if (k == 0) {
        return 0;
    }
    if (k == 1) {
        return 1;
    }
    if (!p) {
        p = 0.3;
    }
    if (!a || a < 1) {
        a = 1;
        s = p / 4;
    } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    if ((k *= 2) < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
    }
    return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.back.easeIn = function(k) {
    var s = 1.70158;
    return k * k * ((s + 1) * k - s);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.back.easeOut = function(k) {
    var s = 1.70158;
    return (k = k - 1) * k * ((s + 1) * k + s) + 1;
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.back.easeInOut = function(k) {
    var s = 1.70158 * 1.525;
    if ((k *= 2) < 1) {
        return 0.5 * (k * k * ((s + 1) * k - s));
    }
    return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.bounce.easeIn = function(k) {
    return 1 - gva.easing.Bounce.easeOut(1 - k);
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.bounce.easeOut = function(k) {
    if ((k /= 1) < (1 / 2.75)) {
        return 7.5625 * k * k;
    } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
    } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
    } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
    }
};

/**
 * @param {number} k Input value.
 * @return {number} Remapped output value.
 */
gva.easing.bounce.easeInOut = function(k) {
    if (k < 0.5) {
        return gva.easing.Bounce.easeIn(k * 2) * 0.5;
    }
    return gva.easing.Bounce.easeOut(k * 2 - 1) * 0.5 + 0.5;
};
