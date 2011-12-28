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
 * Provide a namespace for this class
 */
goog.provide('gva.util.DateUtil');

/**
 * A set of static utility methods for formatting Date objects in a manner similar to PHP
 * Based on: http://jacwright.com/projects/javascript/date_format/
 */
gva.util.DateUtil = (function() {

    var _shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var _longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var _shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var _longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    var _methods = {
         // Day
        'd': function(_d) { return (_d.getDate() < 10 ? '0' : '') + _d.getDate(); },
        'D': function(_d) { return _shortDays[_d.getDay()]; },
        'j': function(_d) { return _d.getDate(); },
        'l': function(_d) { return _longDays[_d.getDay()]; },
        'N': function(_d) { return _d.getDay() + 1; },
        'S': function(_d) { return (_d.getDate() % 10 == 1 && _d.getDate() != 11 ? 'st' : (_d.getDate() % 10 == 2 && _d.getDate() != 12 ? 'nd' : (_d.getDate() % 10 == 3 && _d.getDate() != 13 ? 'rd' : 'th'))); },
        'w': function(_d) { return _d.getDay(); },
        'z': function(_d) { var d = new Date(_d.getFullYear(), 0, 1); return Math.ceil((this - d) / 86400000); }, // Fixed now
        // Week
        'W': function(_d) { var d = new Date(_d.getFullYear(), 0, 1); return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7); }, // Fixed now
        // Month
        'F': function(_d) { return _longMonths[_d.getMonth()]; },
        'm': function(_d) { return (_d.getMonth() < 9 ? '0' : '') + (_d.getMonth() + 1); },
        'M': function(_d) { return _shortMonths[_d.getMonth()]; },
        'n': function(_d) { return _d.getMonth() + 1; },
        't': function(_d) { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate();}, // Fixed now, gets #days of date
        // Year
        'L': function(_d) { var year = _d.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },             // Fixed now
        'o': function(_d) { var d = new Date(_d.valueOf()); d.setDate(d.getDate() - ((_d.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
        'Y': function(_d) { return _d.getFullYear(); },
        'y': function(_d) { return ('' + _d.getFullYear()).substr(2); },
        // Time
        'a': function(_d) { return _d.getHours() < 12 ? 'am' : 'pm'; },
        'A': function(_d) { return _d.getHours() < 12 ? 'AM' : 'PM'; },
        'B': function(_d) { return Math.floor((((_d.getUTCHours() + 1) % 24) + _d.getUTCMinutes() / 60 + _d.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
        'g': function(_d) { return _d.getHours() % 12 || 12; },
        'G': function(_d) { return _d.getHours(); },
        'h': function(_d) { return ((_d.getHours() % 12 || 12) < 10 ? '0' : '') + (_d.getHours() % 12 || 12); },
        'H': function(_d) { return (_d.getHours() < 10 ? '0' : '') + _d.getHours(); },
        'i': function(_d) { return (_d.getMinutes() < 10 ? '0' : '') + _d.getMinutes(); },
        's': function(_d) { return (_d.getSeconds() < 10 ? '0' : '') + _d.getSeconds(); },
        'u': function(_d) { var m = _d.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ? '0' : '')) + m; },
        // Timezone
        'e': function(_d) { return 'Not Yet Supported'; },
        'I': function(_d) { return 'Not Yet Supported'; },
        'O': function(_d) { return (-_d.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(_d.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(_d.getTimezoneOffset() / 60)) + '00'; },
        'P': function(_d) { return (-_d.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(_d.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(_d.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
        'T': function(_d) { var m = _d.getMonth(); _d.setMonth(0); var result = _d.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); _d.setMonth(m); return result;},
        'Z': function(_d) { return -_d.getTimezoneOffset() * 60; },
        // Full Date/Time
        'c': function(_d) { return _d.formatDate('Y-m-d\\TH:i:sP'); },
        'r': function(_d) { return _d.toString(); },
        'U': function(_d) { return _d.getTime() / 1000; }
    };

    return {

        /**
         * Returns a string representation of a Date object based on the provided template
         * @param {Date} date The Date to format.
         * @param {string} format The format to return the Date in.
         * @return {string} The string representation of the Date.
         */
        formatDate: function(date, format) {
            var result = '', str;
            for (var i = 0; i < format.length; i++) {
                str = format.charAt(i);
                if (i - 1 >= 0 && format.charAt(i - 1) == '\\') {
                    result += str;
                }
                else if (_methods[str]) {
                    result += _methods[str](date);
                } else if (str != '\\') {
                    result += str;
                }
            }
            return result;
        }
    };

})();
