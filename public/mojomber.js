(function($){
    $.fn.extend({
        mojomber: function(options) {
            var mojomber = this;

            var defaults = {
            }

            var options = $.extend(defaults, options);

            this.displayMessage = function (msg) {
                $(this).html(msg);
            };

            return this.each(function() {
                var o = options;

                mojomber.displayMessage('Connecting...');

                // Connect to WebSocket
                var ws = new WebSocket(o.url);

                ws.onerror = function(e) {
                    mojomber.displayMessage("Error: " + e);
                };

                ws.onopen = function() {
                    mojomber.displayMessage('Connected. Loading...');

                            ws.send($.toJSON({"text" : chat.toUTF(message)}));
                };

                ws.onmessage = function(e) {
                    var data = $.evalJSON(e.data);

                    if (data.text) {
                    }
                };

                ws.onclose = function() {
                    mojomber.displayMessage('Disconnected. <a href="/">Reconnect</a>');
                }
            });
        }
    });
})(jQuery);
