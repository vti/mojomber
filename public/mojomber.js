(function($){
    $.fn.extend({
        mojomber: function(options) {
            var mojomber = this;

            var cellsize = 30;
            var canvas = null;
            var context = null;
            var arena;

            this.player_id = null;
            this.players = {};

            var defaults = {
            }

            var options = $.extend(defaults, options);

            this.displayMessage = function (msg) {
                $(this).html(msg);
            };

            this.walkArena = function(row, col, radius, callback) {
                var mcol = mojomber.arena[0].length;
                var mrow = mojomber.arena.length;
                callback(row, col);

                for (var i = 1; i < radius; i++) {
                    if (row + i < mrow) {
                        if (mojomber.arena[row + i][col])
                            break;

                        callback(row + i, col);
                    }
                }

                for (var i = 1; i < radius; i++) {
                    if (row - i > 0) {
                        if (mojomber.arena[row - i][col])
                            break;

                        callback(row - i, col);
                    }
                }

                for (var i = 1; i < radius; i++) {
                    if (col + i < mcol) {
                        if (mojomber.arena[row][col + i])
                            break;

                        callback(row, col + i);
                    }
                }

                for (var i = 1; i < radius; i++) {
                    if (col - i > 0) {
                        if (mojomber.arena[row][col - i])
                            break;

                        callback(row, col - i);
                    }
                }
            }

            this.redraw = function() {

                // Redraw arena
                for (var i = 0; i < mojomber.arena.length; i++) {
                    for (var j = 0; j < mojomber.arena[0].length; j++) {
                        if (!mojomber.arena[i][j]) {
                            context.clearRect(j * cellsize, i * cellsize, cellsize, cellsize);
                        }
                    }
                }

                // Redraw bombs
                for (var id in mojomber.players) {
                    if (mojomber.players.hasOwnProperty(id)) {
                        var player = mojomber.getPlayer(id);
                        var bomb = player.bomb;
                        if (bomb) {
                            var x = bomb.col * cellsize;
                            var y = bomb.row * cellsize;
                            if (bomb.exploded) {
                                mojomber.walkArena(bomb.row, bomb.col, 3, function(row, col) {
                                    context.drawImage(bomb.imgExplosion, col * cellsize, row * cellsize, 27, 30);
                                        });
                            }
                            else {
                                context.drawImage(bomb.img, x, y, 30, 23);
                            }
                        }
                    }
                }

                var player = mojomber.getPlayer();

                // Redraw other players
                for (var id in mojomber.players) {
                    if (mojomber.players.hasOwnProperty(id) && id != player.id) {
                        var p = mojomber.getPlayer(id);
                        if (p.alive) {
                            var x = p.col * cellsize;
                            var y = p.row * cellsize;
                            context.drawImage(p.img, x, y, 26, 30);
                        }
                    }
                }

                // Redraw our player so it stays always on top
                if (player && player.alive) {
                    var x = player.col * cellsize;
                    var y = player.row * cellsize;
                    context.drawImage(player.img, x, y, 26, 30);
                }
            };

            this.clearExplosions = function() {
                for (var id in mojomber.players) {
                    if (mojomber.players.hasOwnProperty(id)) {
                        var player = mojomber.getPlayer(id);

                        if (player.bomb && player.bomb.exploded) {
                            player.bomb = null;
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
                        var player = mojomber.players[id];
                        toplist.push({"nick":player.nick,"frags":player.frags});
                    }

                    if (toplist.length) {
                    //toplist.sort(function(a, b) {return a.frags - b.frags});

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
            }

            this.init = function() {
            };

            function Player(options) {
                var player = this;

                this.id = options.id;
                this.alive = true;

                this.row = options.pos[0];
                this.col = options.pos[1];

                this.nick = options.nick || '';
                this.frags = options.frags || 0;

                this.bomb = null;

                this.img = new Image();
                if (options.enemy) {
                    this.img.src = '/enemy.png';
                }
                else {
                    this.img.src = '/player.png';
                }

                this.setPos = function(pos) {
                    player.row = pos[0];
                    player.col = pos[1];
                };

                this.hide = function() {
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
                    }

                    if (!mojomber.arena[row][col]) {
                        player.row = row;
                        player.col = col;

                        player.updated = true;
                    }
                };

                this.mine = function() {
                    if (!player.bomb) {
                        player.bomb = new Bomb(player.id);
                    }
                };
            }

            function Bomb(id) {
                var bomb = this;

                this.exploded = false;

                this.img = new Image();
                this.img.src = '/bomb.png';

                this.imgExplosion = new Image();
                this.imgExplosion.src = '/explosion.png';

                var player = mojomber.getPlayer(id);

                this.row = player.row;
                this.col = player.col;

                this.explode = function() {
                    bomb.exploded = true;
                };

                //setTimeout(this.explode, 1000);
            }

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

                    mojomber.init();

                    $(document).keypress(function(e) {
                        var player = mojomber.getPlayer();

                        // Ignore player when he is dead
                        if (!player.alive)
                            return false;

                        var code = e.keyCode ? e.keyCode : e.which;
                        var id = player.id;
                        if (code == 37) {
                            ws.send($.toJSON({"type" : "move", "direction" : "left"}));
                            mojomber.getPlayer().move("left");
                        }
                        else if (code == 38) {
                            ws.send($.toJSON({"type" : "move", "direction" : "up"}));
                            mojomber.getPlayer().move("up");
                        }
                        else if (code == 39) {
                            ws.send($.toJSON({"type" : "move", "direction" : "right"}));
                            mojomber.getPlayer().move("right");
                        }
                        else if (code == 40) {
                            ws.send($.toJSON({"type" : "move", "direction" : "down"}));
                            mojomber.getPlayer().move("down");
                        }
                        else if (code == 32) {
                            var player = mojomber.getPlayer();
                            if (!player.bomb) {
                                ws.send($.toJSON({"type" : "bomb"}));
                                player.mine();
                            }
                        }

                        mojomber.redraw();

                        return false;
                    });
                };

                ws.onmessage = function(e) {
                    var data = $.evalJSON(e.data);
                    var type = data.type;

                    if (type == 'drawarena') {
                        mojomber.drawarena(data.arena);
                        mojomber.redraw();
                    }
                    else if (type == 'initplayers') {
                        var players = data.players;
                        for (var i = 0; i < players.length; i++) {
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
                    else if (type == 'new_player') {
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
                        delete mojomber.players[data.id];
                        mojomber.updatetop();
                        mojomber.redraw();
                    }
                    else if (type == 'player') {
                        var player = new Player({
                                "id" : data.id,
                                "pos": data.pos,
                                "nick" : data.nick
                                });
                        mojomber.playerId = player.id;
                        mojomber.addPlayer(player);
                        mojomber.redraw();
                        mojomber.updatetop();
                    }
                    else if (type == 'alive') {
                        for (var i = 0; i < data.players.length; i++) {
                            var player = mojomber.getPlayer(data.players[i].id);
                            player.setPos(data.players[i].pos);
                            player.alive = true;
                        }
                        mojomber.redraw();
                    }
                    else if (type == 'die') {
                        for (var i = 0; i < data.players.length; i++) {
                            mojomber.getPlayer(data.players[i]).alive = false;
                        }

                        mojomber.redraw();
                    }
                    else if (type == 'frags') {
                        var player = mojomber.getPlayer(data.id);
                        player.frags = data.frags;
                        mojomber.updatetop();
                    }
                    else if (type == 'move') {
                        mojomber.getPlayer(data.id).move(data.direction)
                        mojomber.redraw();
                    }
                    else if (type == 'bomb') {
                        console.log('BOMB!');
                        var player = mojomber.getPlayer(data.id);
                        player.bomb = new Bomb(data.id);
                        mojomber.redraw();
                    }
                    else if (type == 'explode') {
                        var player = mojomber.getPlayer(data.id);
                        player.bomb.explode();
                        setTimeout(mojomber.clearExplosions, 1000);
                        mojomber.redraw();
                    }
                };

                ws.onclose = function() {
                    $('#top').html('');
                    mojomber.displayMessage('Disconnected. <a href="/">Reconnect</a>');
                }
            });
        }
    });
})(jQuery);
