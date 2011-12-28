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
 * ------------------------------
 * SWFObject
 * ------------------------------
 */

 var swfobject = {
    'registerObject': function() {},
    'getObjectById': function() {},
    'embedSWF': function() {},
    'switchOffAutoHideShow': function() {},
    'ua': {
        'w3': {},
        'pv': {
            '0': {},
            '1': {},
            '2': {}
        },
        'wk': {},
        'ie': {},
        'win': {},
        'mac': {}
    },
    'getFlashPlayerVersion': function() {},
    'hasFlashPlayerVersion': function() {},
    'createSWF': function() {},
    'showExpressInstall': function() {},
    'removeSWF': function() {},
    'createCSS': function() {},
    'addDomLoadEvent': function() {},
    'addLoadEvent': function() {},
    'getQueryParamValue': function() {},
    'expressInstallCallback': function() {}
};

/**
 * ------------------------------
 * Modernizr
 * ------------------------------
 */

 var Modernizr = {
    'touch': {},
    'csstransforms3d': {},
    'generatedcontent': {},
    'fontface': {},
    'flexbox': {},
    'canvas': {},
    'canvastext': {},
    'webgl': {},
    'geolocation': {},
    'postmessage': {},
    'websqldatabase': {},
    'indexeddb': {},
    'hashchange': {},
    'history': {},
    'draganddrop': {},
    'websockets': {},
    'rgba': {},
    'hsla': {},
    'multiplebgs': {},
    'backgroundsize': {},
    'borderimage': {},
    'borderradius': {},
    'boxshadow': {},
    'textshadow': {},
    'opacity': {},
    'cssanimations': {},
    'csscolumns': {},
    'cssgradients': {},
    'cssreflections': {},
    'csstransforms': {},
    'csstransitions': {},
    'video': {
        'ogg': {},
        'h264': {},
        'webm': {}
    },
    'audio': {
        'ogg': {},
        'mp3': {},
        'wav': {},
        'm4a': {}
    },
    'localstorage': {},
    'sessionstorage': {},
    'webworkers': {},
    'applicationcache': {},
    'svg': {},
    'inlinesvg': {},
    'smil': {},
    'svgclippaths': {},
    'input': {
        'autocomplete': {},
        'autofocus': {},
        'list': {},
        'placeholder': {},
        'max': {},
        'min': {},
        'multiple': {},
        'pattern': {},
        'required': {},
        'step': {}
    },
    'inputtypes': {
        'search': {},
        'tel': {},
        'url': {},
        'email': {},
        'datetime': {},
        'date': {},
        'month': {},
        'week': {},
        'time': {},
        'datetime-local': {},
        'number': {},
        'range': {},
        'color': {}
    },
    'addTest': function() {},
    '_version': {},
    '_prefixes': {
        '0': {},
        '1': {},
        '2': {},
        '3': {},
        '4': {},
        '5': {},
        '6': {}
    },
    '_domPrefixes': {
        '0': {},
        '1': {},
        '2': {},
        '3': {},
        '4': {}
    },
    'mq': function() {},
    'hasEvent': function() {},
    'testProp': function() {},
    'testAllProps': function() {},
    'testStyles': function() {},
    'prefixed': function() {}
};

/**
 * ------------------------------
 * Chrome Web Store
 * ------------------------------
 */
 var window = {
    'chrome': {
        'app': {
            'isInstalled': {}
        },
        'webstore': {
            'install': function() {}
        }
    }
};

var console = {};
/**
 * @param {string} message
 */
console.log = function(message, var_args) {};
/**
 * @param {string} message
 */
console.warn = function(message, var_args) {};
