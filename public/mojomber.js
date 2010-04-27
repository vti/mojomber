(function($){
    $.fn.extend({
        mojomber: function(o) {
            var mojomber = this;

            var cellsize = 30;
            var canvas   = null;
            var context  = null;
            var arena    = [];
            var i;
            var images = {};

            this.playerId = null;
            this.players = {};

            this.bombs = {};

            var defaults = {};

            var options = $.extend(defaults, o);

            this.preloadImages = function(hash) {
                //console.log('Preload images');
                for (var i = 0; i < arguments.length; i += 2) {
                    //console.log('Preloading ' + arguments[i] + arguments[i + 1]);
                    jQuery("<img>").attr("src", arguments[i + 1]);
                    var img = new Image();
                    img.src = arguments[i + 1];
                    images[arguments[i]] = img;
                }
            };

            this.displayMessage = function (msg) {
                $(this).html(msg);
            };

            this.walkArena = function(row, col, radius, callback) {
                var mcol = mojomber.arena[0].length;
                var mrow = mojomber.arena.length;
                callback(row, col);

                for (i = 1; i < radius; i++) {
                    if (row + i < mrow) {
                        if (mojomber.arena[row + i][col]) {
                            break;
                        }

                        callback(row + i, col);
                    }
                }

                for (i = 1; i < radius; i++) {
                    if (row - i > 0) {
                        if (mojomber.arena[row - i][col]) {
                            break;
                        }

                        callback(row - i, col);
                    }
                }

                for (i = 1; i < radius; i++) {
                    if (col + i < mcol) {
                        if (mojomber.arena[row][col + i]) {
                            break;
                        }

                        callback(row, col + i);
                    }
                }

                for (i = 1; i < radius; i++) {
                    if (col - i > 0) {
                        if (mojomber.arena[row][col - i]) {
                            break;
                        }

                        callback(row, col - i);
                    }
                }
            };

            this.redrawExplosion = function(row, col) {
                context.drawImage(images['explosion'], col * cellsize, row * cellsize, 27, 30);
            };

            this.redraw = function() {
                //console.log('redraw1');

                // Redraw arena
                for (var i = 0; i < mojomber.arena.length; i++) {
                    for (var j = 0; j < mojomber.arena[0].length; j++) {
                        if (!mojomber.arena[i][j]) {
                            context.clearRect(j * cellsize, i * cellsize, cellsize, cellsize);
                        }
                    }
                }

                //console.log('redraw2');
                // Redraw bombs
                for (var id in mojomber.bombs) {
                    if (mojomber.bombs.hasOwnProperty(id)) {
                        var bomb = mojomber.getBomb(id);
                        if (bomb) {
                            var x = bomb.col * cellsize;
                            var y = bomb.row * cellsize;
                            if (bomb.exploded) {
                                mojomber.walkArena(bomb.row, bomb.col, 3, mojomber.redrawExplosion);
                            }
                            else {
                                context.drawImage(images['bomb'], x, y, 30, 23);
                            }
                        }
                    }
                }

                //console.log('redraw3');
                var player = mojomber.getPlayer();

                // Redraw other players
                for (var id in mojomber.players) {
                    if (mojomber.players.hasOwnProperty(id) && id != player.id) {
                        var p = mojomber.getPlayer(id);
                        if (p.alive) {
                            var x = p.col * cellsize;
                            var y = p.row * cellsize;
                            context.drawImage(images['enemy'], x, y, 26, 30);
                        }
                    }
                }

                //console.log('Trying to redraw the player');
                player = mojomber.getPlayer();
                // Redraw our player so it stays always on top
                if (player && player.alive) {
                    //console.log('Redraw player');
                    var x = player.col * cellsize;
                    var y = player.row * cellsize;
                    context.drawImage(images['player'], x, y, 26, 30);
                }

                //console.log('Redraw is finished');
            };

            this.clearExplosions = function() {
                for (var id in mojomber.bombs) {
                    if (mojomber.bombs.hasOwnProperty(id)) {
                        var bomb = mojomber.getBomb(id);

                        if (bomb.exploded) {
                            delete mojomber.bombs[id];

                            var player = mojomber.getPlayer(id);
                            if (player) {
                                player.bomb = 0;
                            }
                        }
                    }
                }

                mojomber.redraw();
            };

            this.addPlayer = function(player) {
                mojomber.players[player.id] = player;
            };

            this.getPlayer = function(id) {
                if (id) {
                    return mojomber.players[id];
                }

                return mojomber.players[mojomber.playerId];
            };

            this.addBomb = function(bomb) {
                mojomber.bombs[bomb.id] = bomb;
            };

            this.getBomb = function(id) {
                if (id) {
                    return mojomber.bombs[id];
                }
            };

            this.drawarena = function(arena) {
                mojomber.arena = arena;

                $(this).html('<canvas width="' + arena[0].length * cellsize +'" height="' + arena.length * cellsize + '" style="border:1px solid red"></canvas>');

                canvas = $('canvas');
                context = canvas[0].getContext('2d');

                for (var i = 0; i < arena.length; i++) {
                    for (var j = 0; j < arena[0].length; j++) {
                        if (arena[i][j]) {
                            context.beginPath();
                            context.fillStyle = '#000000';
                            context.rect(j * cellsize, i * cellsize, cellsize, cellsize);
                            context.fill();
                        }
                    }
                }
            };

            this.updatetop = function() {
                var top = $('#top');

                if (top) {
                    top.html('');

                    var toplist = [];
                    for (var id in mojomber.players) {
                        if (mojomber.players.hasOwnProperty(id)) {
                            var player = mojomber.players[id];
                            toplist.push({"nick":player.nick,"frags":player.frags});
                        }
                    }

                    if (toplist.length) {
                    toplist.sort(function(a, b) {return b.frags - a.frags});

                        top.append('<h3>Top List</h3>');
                        var list = '<ol>';
                        for (var i = 0; i < toplist.length; i++) {
                            var player = toplist[i];
                            var me = (player.nick == mojomber.getPlayer().nick) ? true : false ;
                            list += '<li>';
                            if (me) {
                                list += '<b>';
                            }
                            list += player.nick + ' (' + player.frags + ')';
                            if (me) {
                                list += '</b>';
                            }
                            list += '</li>';
                        }
                        list += '</ol>';
                        top.append(list);
                    }
                }
            };

            this.init = function() {
                //console.log('init');
            };

            function Player(options) {
                var player = this;

                this.id = options.id;
                this.alive = true;

                this.row = options.pos[0];
                this.col = options.pos[1];

                this.nick = options.nick || '';
                this.frags = options.frags || 0;

                this.bomb = false;

                if (options.enemy) {
                    this.img = 'enemy';
                }
                else {
                    this.img = 'player';
                }

                this.setPos = function(pos) {
                    player.row = pos[0];
                    player.col = pos[1];
                };

                this.move = function(direction) {
                    var row = player.row;
                    var col = player.col;
                    switch (direction) {
                        case "up":
                            row--;
                            break;
                        case "down":
                            row++;
                            break;
                        case "left":
                            col--;
                            break;
                        case "right":
                            col++;
                            break;
                        default:
                            break;
                    }

                    player.row = row;
                    player.col = col;
                };

                this.mine = function() {
                    if (!player.bomb) {
                        player.bomb = true;
                        mojomber.bombs[player.id] = new Bomb({
                            "id" : player.id,
                            "pos" : [player.row, player.col]
                        });
                    }
                };
            }

            function Bomb(options) {
                var bomb = this;

                //console.log(options);

                this.exploded = false;

                this.id = options.id;

                this.row = options.pos[0];
                this.col = options.pos[1];

                this.explode = function() {
                    bomb.exploded = true;
                };
            }

            return this.each(function() {
                var o = options;

                mojomber.preloadImages(
                    'player', '/player.png',
                    'enemy', '/enemy.png',
                    'bomb', '/bomb.png',
                    'explosion', '/explosion.png'
                );

                mojomber.displayMessage('Connecting...');

                // Connect to WebSocket
                var ws = new WebSocket(o.url);

                ws.onerror = function(e) {
                    mojomber.displayMessage("Error: " + e);
                };

                ws.onopen = function() {
                    mojomber.displayMessage('Connected. Loading...');

                    mojomber.init();

                    //console.log('Keypress initialization');
                    $(document).keydown(function(e) {
                        //console.log('Key pressed');
                        var player = mojomber.getPlayer();

                        // Ignore player when he is dead
                        if (!player.alive) {
                            return false;
                        }

                        var code = e.keyCode ? e.keyCode : e.which;
                        if (code == 37 || code == 65) {
                            ws.send($.toJSON({"type" : "move", "direction" : "left"}));
                        }
                        else if (code == 38 || code == 87) {
                            ws.send($.toJSON({"type" : "move", "direction" : "up"}));
                        }
                        else if (code == 39 || code == 68) {
                            ws.send($.toJSON({"type" : "move", "direction" : "right"}));
                        }
                        else if (code == 40 || code == 83) {
                            ws.send($.toJSON({"type" : "move", "direction" : "down"}));
                        }
                        else if (code == 32) {
                            var player = mojomber.getPlayer();
                            if (!player.bomb) {
                                ws.send($.toJSON({"type" : "bomb"}));
                                player.mine();
                                mojomber.redraw();
                            }
                        }
                        else {
                            return;
                        }

                        return false;
                    });
                };

                ws.onmessage = function(e) {
                    var data = $.evalJSON(e.data);
                    var type = data.type;

                    //console.log('Message received');

                    if (type == 'drawarena') {
                        //console.log('Draw arena');
                        mojomber.drawarena(data.arena);
                        mojomber.redraw();
                    }
                    else if (type == 'initplayers') {
                        //console.log('Init players');
                        var players = data.players;
                        for (i = 0; i < players.length; i++) {
                            var player = players[i];
                            mojomber.addPlayer(new Player({
                                "id" : player.id,
                                "enemy" : true,
                                "nick" : player.nick,
                                "frags" : player.frags,
                                "pos" : player.pos
                            }));
                        }
                        mojomber.updatetop();
                        mojomber.redraw();
                    }
                    else if (type == 'initbombs') {
                        console.log('initbombs');
                        for (i = 0; i < data.bombs.length; i++) {
                            var bomb = data.bombs[i];
                            mojomber.addBomb(new Bomb({
                                "id" : bomb.id,
                                "pos" : bomb.pos
                            }));
                        }
                        mojomber.redraw();
                    }
                    else if (type == 'new_player') {
                        //console.log('New player connected');
                        var player = new Player({
                            "id" : data.id,
                            "enemy" : true,
                            "pos": data.pos,
                            "nick" : data.nick
                        });
                        mojomber.addPlayer(player);
                        mojomber.updatetop();
                        mojomber.redraw();
                    }
                    else if (type == 'old_player') {
                        //console.log('Player disconnected');
                        delete mojomber.players[data.id];
                        mojomber.updatetop();
                        mojomber.redraw();
                    }
                    else if (type == 'player') {
                        //console.log('Received player information');
                        var player = new Player({
                            "id" : data.id,
                            "pos": data.pos,
                            "nick" : data.nick
                        });
                        //console.log(player);
                        mojomber.playerId = player.id;
                        mojomber.addPlayer(player);
                        mojomber.redraw();
                        mojomber.updatetop();
                    }
                    else if (type == 'alive') {
                        //console.log('Bring players to live');
                        for (i = 0; i < data.players.length; i++) {
                            var player = mojomber.getPlayer(data.players[i].id);
                            player.setPos(data.players[i].pos);
                            player.alive = true;
                        }
                        mojomber.redraw();
                    }
                    else if (type == 'die') {
                        //console.log('Kill players');
                        for (i = 0; i < data.players.length; i++) {
                            mojomber.getPlayer(data.players[i]).alive = false;
                        }

                        mojomber.redraw();
                    }
                    else if (type == 'frags') {
                        //console.log('Update player frags');
                        var player = mojomber.getPlayer(data.id);
                        player.frags = data.frags;
                        mojomber.updatetop();
                    }
                    else if (type == 'move') {
                        //console.log('Player moved');
                        mojomber.getPlayer(data.id).move(data.direction);
                        mojomber.redraw();
                    }
                    else if (type == 'bomb') {
                        //console.log('Player set up a bomb');
                        mojomber.addBomb(new Bomb({
                            "id" : data.id,
                            "pos" : data.pos
                        }));
                        mojomber.redraw();
                    }
                    else if (type == 'explode') {
                        //console.log('Bomb explosion');
                        var bomb = mojomber.getBomb(data.id);
                        if (bomb) {
                            bomb.explode();
                            setTimeout(mojomber.clearExplosions, 1000);
                            mojomber.redraw();
                        }
                    }
                };

                ws.onclose = function() {
                    $('#top').html('');
                    mojomber.displayMessage('Disconnected. <a href="/">Reconnect</a>');
                };
            });
        }
    });
})(jQuery);
