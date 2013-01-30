
/*
 * aciShinyText jQuery Plugin v1.0
 * http://acoderinsights.ro
 *
 * Copyright (c) 2013 Dragos Ursu
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Require jQuery Library http://jquery.com
 * Based on the ideea behind http://labs.dragoninteractive.com/rainbows_demo.php
 *
 * Date: Fri Jan 25 22:15 2013 +0200
 */

(function($){

    $.aciShinyText = {
        nameSpace: '.aciShinyText'
    };

    $.fn.aciShinyText = function(options, data){
        var result = null;
        for (var i = 0; i < this.length; i++){
            result = $(this[i])._aciShinyText(options, data);
            if (!(result instanceof jQuery)){
                return result;
            }
        }
        return this;
    };

    // default options
    $.fn.aciShinyText.defaults = {
        colors: ['#ccc', '#000'],       // a list of colors to be used for the gradient (need minimum 2!)
        highlight: false,               // should show highlight? (if TRUE then use color from CSS) OR color value to be used
        shadow: false,                  // should show shadow? (if TRUE then use color from CSS) OR color value to be used
        ratio: 1,                       // blend ratio - default is 1, lower than 1 => first color have more weight, higher than 1 => last color have more weight
        exclude: 'script',              // exclude elements selector (need not to be empty)
        autoInit: true,                 // if autoInit is disabled need to manually init the shinytext
        callbacks: {                    // all callback functions receive a parameter: the current jquery object
            beforeInit: null,           // just before init
            afterInit: null             // just after init (after dom changes)
        }
    };

    $.fn._aciShinyText = function(options, mixed){

        var $this = this;

        // get RGB from string
        var _rgb = function(colour){
            if (typeof colour == 'string'){
                colour = colour.replace(/[^0-9a-f]/i, '');
                switch (colour.length) {
                    case 3:
                        return {
                            r: parseInt(colour.substr(0, 1) + colour.substr(0, 1), 16),
                            g: parseInt(colour.substr(1, 1) + colour.substr(1, 1), 16),
                            b: parseInt(colour.substr(2, 1) + colour.substr(2, 1), 16)
                        };
                    case 6:
                        return {
                            r: parseInt(colour.substr(0, 2), 16),
                            g: parseInt(colour.substr(2, 2), 16),
                            b: parseInt(colour.substr(4, 2), 16)
                        };
                }
            }
            return {
                r: 0,
                g: 0,
                b: 0
            };
        };

        var data = this.data($.aciShinyText.nameSpace);
        if (!data && ((typeof options == 'undefined') || (typeof options == 'object'))){
            data = {
                options: $.extend({}, $.fn.aciShinyText.defaults, options),
                wasInit: false,         // init state
                colors: []              // color RGB cache
            };
            for (var i in data.options.colors){
                data.colors[i] = _rgb(data.options.colors[i]);
            }
            this.data($.aciShinyText.nameSpace, data);
        }

        // blend a list or RGB values
        var _blend = function(rgb, size, factor){
            var blend = [];
            var rgbs = rgb.length;
            var ratio, index, last = -1;
            for (var i = 0, j = 0; i < size; i++, j++) {
                index = Math.min(Math.floor(i * (rgbs - 1) / size), rgbs - 2);
                if (last != index){
                    last = index;
                    j = 0;
                }
                ratio = (j * (rgbs - 1) / size) * factor;
                blend[blend.length] = {
                    r: Math.round(rgb[index].r * (1 - ratio) + rgb[index + 1].r * ratio),
                    g: Math.round(rgb[index].g * (1 - ratio) + rgb[index + 1].g * ratio),
                    b: Math.round(rgb[index].b * (1 - ratio) + rgb[index + 1].b * ratio)
                };
            }
            return blend;
        };

        // blend cache
        var _cache = [];

        var _cached = function(size){
            for (var i in _cache){
                if (_cache[i].size == size){
                    return _cache[i].blend;
                }
            }
            var blend = _blend(data.colors, size, data.options.ratio);
            _cache[_cache.length] = {
                'size': size,
                'blend': blend
            };
            return blend;
        };

        // really make it shine :)
        var _shine = function(text, size){
            var shine = '';
            var blend = _cached(size);
            for (var i in blend){
                shine += '<span class="shinyTextLine" style="color:rgb(' + blend[i].r + ',' + blend[i].g + ',' + blend[i].b + ')"><span class="shinyTextItem" style="top:-' + i + 'px">' + text + '</span></span>';
            }
            return shine;
        };

        // init text nodes
        var _textNode = function(element){
            var text = element.text();
            text = text.replace(/\s+/gm, ' ');
            if (text.length && (text != ' ')){
                var replace = '';
                text = text.split(' ');
                for (var i in text){
                    replace += '<span class="shinyText"><span class="shinyTextOld">' + text[i] + '</span></span>' + ((i < text.length - 1) ? ' ' : '');
                }
                element.replaceWith(replace);
            }
        };

        // get color option
        var _color = function(option){
            if (option){
                if (option === true){
                    return '';
                } else {
                    var color = _rgb(option);
                    return 'color:rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
                }
            } else {
                return 'display:none';
            }
        }

        // init shinytext, change text nodes
        var _init = function(){
            if (!data || data.wasInit){
                return;
            }
            data.wasInit = true;
            if (data.options.callbacks && data.options.callbacks.beforeInit){
                data.options.callbacks.beforeInit($this);
            }
            $this.contents().each(function(){
                if (typeof this.tagName == 'undefined') {
                    _textNode($(this));
                }
            });
            $this.find('*').not('[class^=shinyText],' + data.options.exclude).each(function(){
                $(this).contents().each(function(){
                    if (typeof this.tagName == 'undefined') {
                        _textNode($(this));
                    }
                });
            });
            // init cache
            _cache = [];
            var highlight = _color(data.options.highlight);
            var shadow = _color(data.options.shadow);
            $this.find('.shinyText').each(function(){
                var old = $(this).find('>.shinyTextOld');
                var text = old.text();
                var height = old.height();
                var width = old.width();
                old.before('<span class="shinyTextHighlight" style="' + highlight + '">' + text +
                    '</span><span class="shinyTextShadow" style="' + shadow + '">' + text + '</span>' + _shine(text, height));
                $(this).find('span').not('.shinyTextOld').css({
                    'width': width + 'px',
                    '-moz-user-select': 'none',
                    '-webkit-user-select': 'none'
                }).attr('unselectable', 'on').bind('selectstart', function(){
                    return false;
                }).not('.shinyTextHighlight,.shinyTextShadow').css('display', 'block');
            });
            if (data.options.callbacks && data.options.callbacks.afterInit){
                data.options.callbacks.afterInit($this);
            }
        };

        // set new color blending ratio
        var _ratio = function(ratio){
            if (!data || !data.wasInit){
                return;
            }
            data.options.ratio = ratio;
            // init cache
            _cache = [];
            $this.find('.shinyText').each(function(){
                var line = $(this).find('.shinyTextLine');
                var blend = _cached(line.length);
                for (var i in blend){
                    line.eq(i).css('color', 'rgb(' + blend[i].r + ',' + blend[i].g + ',' + blend[i].b + ')');
                }
            });
        };

        // init control based on options
        var _initUi = function(){
            if ((typeof options == 'undefined') || (typeof options == 'object')){
                _customUi();
            } else {
                // process custom request
                if (typeof options == 'string'){
                    switch (options){
                        case 'init':
                            // init dom
                            _init();
                            break;
                        case 'ratio':
                            // set blending ratio
                            _ratio(mixed);
                            break;
                        case 'options':
                            // get options
                            return data ? data.options : null;
                        case 'destroy':
                            // destroy the control
                            _destroyUi();
                            break;
                    }
                }
            }
            // return this object
            return $this;
        };

        // destroy control
        var _destroyUi = function(){
            if (data){
                $this.find('.shinyText').each(function(){
                    $(this).find('[class^=shinyText]').not('.shinyTextOld').remove();
                    var text = $(this).find('>.shinyTextOld').text();
                    $(this).replaceWith(text.replace(/&nbsp;$/i, ' '));
                });
                $this.data($.aciShinyText.nameSpace, null);
            }
        };

        // init custom UI
        var _customUi = function(){

            if (data.options.autoInit){
                // auto init
                _init();
            }

        };

        // init the control
        return _initUi();

    };

})(jQuery);
