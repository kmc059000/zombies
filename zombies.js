/// <reference path="engine.js" />
/// <reference path="jquery-1.7.2.min.js" />

var intervals = [];

function start() {
    window.zombiesDisplay = getZombiesDisplay($('#port'));

    window.zombies = getZombies(window.zombiesDisplay);

    $(document).unbind();

    //setup controls
    $(document).keydown(function (e) {
        if (e.keyCode == 37) {
            window.zombies.character.walk(-1, 0);
            return false;
        }
        else if (e.keyCode == 38) {
            window.zombies.character.walk(0, -1);
            return false;
        }
        else if (e.keyCode == 39) {
            window.zombies.character.walk(1, 0);
            return false;
        }
        else if (e.keyCode == 40) {
            window.zombies.character.walk(0, 1);
            return false;
        }
        else if (e.keyCode == 32) {
            window.zombies.character.attack();
            return false;
        }
    });

    while (intervals.length > 0) clearInterval(intervals.pop());


    window.zombiesDisplay.viewport.draw();
    intervals.push(setInterval(function () { window.zombiesDisplay.viewport.draw(); }, 100));
    intervals.push(setInterval(function () { window.zombies.actionAllZombies(); }, 750));
}

function getZombiesDisplay(display) {
    var map = engine.getMap(80, 30);
    var viewport = engine.getViewport(map, display, 80, 30);
    var displayElement = display;

    var lose = function () {
        alert('Blargh!');
        start();
    };

    var win = function () {
        alert('Woohoo!');
        start();
    };

    return {
        map: map,
        viewport: viewport,
        lose : lose,
        win : win
    };

};

function getZombies(zombieDisplay) {
    var score = 0;

    var character = function () {
        var el = engine.createElement('X', 0, 0, 100, null, false, true);
        var inventory = [];
        var health = 255;
        var weapon = { name: 'Ice Pick', damage: 50 };

        zombieDisplay.map.addElement(el);

        var walk = function (left, up) {
            if (zombieDisplay.map.moveElement(el, left, up, zombieDisplay.viewport, true))
                score++;

            if (el.x == zombieDisplay.map.width - 1 && el.y == zombieDisplay.map.height - 1) {
                zombieDisplay.win();
            }
        };

        var injure = function (pts) {
            health -= pts;

            if (health <= 0) {
                health = 0;
            }

            return health;
        };

        var attack = function () {
            var positions = [
                { x: el.x + 0, y: el.y - 1 },
                { x: el.x + 0, y: el.y + 1 },
                { x: el.x + 1, y: el.y - 1 },
                { x: el.x + 1, y: el.y + 0 },
                { x: el.x + 1, y: el.y + 1 },
                { x: el.x + -1, y: el.y - 1 },
                { x: el.x + -1, y: el.y + 0 },
                { x: el.x + -1, y: el.y + 1 },
            ];

            var zs = window.zombies.getZombiesAtPositions(positions);
            var numZs = zs.length;
            if(numZs) {
                var damage = weapon.damage / numZs;

                for (var i = numZs - 1; i >= 0; --i) {
                    zs[i].injure(damage);
                }
            }

        };

        return {
            el: el,
            inventory: inventory,
            health: health,
            walk: walk,
            injure: injure,
            attack: attack,
        };
    } ();

    var zombies = function () {
        //create a bunch of random zombies in different states of health

        var createZombie = function () {

            var x = Math.round(Math.random() * (zombieDisplay.map.width - 1));
            var y = Math.round(Math.random() * (zombieDisplay.map.height - 1));

            if (x < 5 && y < 5) {
                x += 5;
                y += 5;
            }

            var el = engine.createElement(Math.random() * 100 > 10 ? 'Z' : 'z', x, y, 1, '#00FF00', false, true);
            var health = Math.round(Math.random() * 255);
            var hasSeenCharacter = 0;
            var brainDestroyed = false; //i would say "dead", but since its a zombie it's already dead :)

            zombieDisplay.map.addElement(el);

            var action = function () {
                //walk around, go after character, search for noises, etc
                if (brainDestroyed) return 1;

                if (Math.random() * 255 < health) {

                    var charDist = Math.sqrt(Math.pow((el.x - character.el.x), 2) + Math.pow((el.y - character.el.y), 2));

                    var sightRand = Math.random();

                    var canSeeCharacter = sightRand * 40 > charDist;

                    var seekingCharacter = sightRand * (40 + hasSeenCharacter * 2000) > charDist;

                    hasSeenCharacter = canSeeCharacter;
                    seekingCharacter = seekingCharacter || canSeeCharacter;

                    //if zombie can see character, go after character
                    if (seekingCharacter) {

                        if (canSeeCharacter) {
                            hasSeenCharacter = true;

                        }
                        var directions = [
                            { left: 0, up: -1, distance: Math.sqrt(Math.pow((el.x - character.el.x), 2) + Math.pow((el.y - 1 - character.el.y), 2)) },
                            { left: 0, up: 1, distance: Math.sqrt(Math.pow((el.x - character.el.x), 2) + Math.pow((el.y + 1 - character.el.y), 2)) },

                            { left: 1, up: -1, distance: Math.sqrt(Math.pow((el.x + 1 - character.el.x), 2) + Math.pow((el.y - 1 - character.el.y), 2)) },
                            { left: 1, up: 0, distance: Math.sqrt(Math.pow((el.x + 1 - character.el.x), 2) + Math.pow((el.y - character.el.y), 2)) },
                            { left: 1, up: 1, distance: Math.sqrt(Math.pow((el.x + 1 - character.el.x), 2) + Math.pow((el.y + 1 - character.el.y), 2)) },

                            { left: -1, up: -1, distance: Math.sqrt(Math.pow((el.x - 1 - character.el.x), 2) + Math.pow((el.y - 1 - character.el.y), 2)) },
                            { left: -1, up: 0, distance: Math.sqrt(Math.pow((el.x - 1 - character.el.x), 2) + Math.pow((el.y - character.el.y), 2)) },
                            { left: -1, up: 1, distance: Math.sqrt(Math.pow((el.x - 1 - character.el.x), 2) + Math.pow((el.y + 1 - character.el.y), 2)) }
                        ];

                        directions.sort(function (a, b) { return b.distance - a.distance; });

                        var moved = 0;

                        while (!moved && directions.length > 4) {
                            var closest = directions.pop();
                            var left = closest.left * (seekingCharacter * 2), up = closest.up * (seekingCharacter * 2);
                            moved = zombieDisplay.map.moveElement(el, left, up, zombieDisplay.viewport, false);
                        }

                    }
                    //go after noise
                    else if (0) {

                    }
                    //otherwise go in random direction
                    else {
                        var dir = Math.round(Math.random() * 8) + 1;
                        var left = 0, up = 0;

                        switch (dir) {
                            case 1:
                                left = 0; up = -1;
                                break;
                            case 2:
                                left = 1; up = -1;
                                break;
                            case 3:
                                left = 1; up = 0;
                                break;
                            case 4:
                                left = 1; up = 1;
                                break;
                            case 5:
                                left = 0; up = -1;
                                break;
                            case 6:
                                left = -1; up = -1;
                                break;
                            case 7:
                                left = -1; up = 0;
                                break;
                            case 8:
                                left = -1; up = 1;
                                break;
                        }

                        zombieDisplay.map.moveElement(el, left, up, zombieDisplay.viewport, false);
                    }

                    charDist = Math.sqrt(Math.pow((el.x - character.el.x), 2) + Math.pow((el.y - character.el.y), 2));
                    //EAT BRAINS!
                    if (charDist == 1) {
                        var remainingHealth = character.injure(Math.random() * this.health / 10);

                        if (remainingHealth == 0) {
                            zombieDisplay.lose();
                            return 0;
                        }
                    }
                }

                return true;
            };

            var injure = function (pts) {
                health -= pts;

                if (health <= 0) {
                    health = 0;
                    brainDestroyed = true;
                    el.display = !brainDestroyed;
                }
                //remove zombie from map
            };

            return {
                el: el,
                health: health,
                action: action,
                injure: injure,
            };
        }

        var z = [];

        for (var i = 0; i < 100; i++) {
            z.push(createZombie());
        }

        return z;
    } ();

    var getZombiesAtPositions = function (positions) {
        return zombies.filter(function (z) {
            for (var i = positions.length - 1; i >= 0; --i) {
                var pos = positions[i];
                if (pos.x == z.el.x && pos.y == z.el.y) return true;
            }
            return false;
        });
    };

    var actionAllZombies = function () {
        for (var i = zombies.length - 1; i >= 0; --i) {
            if (!zombies[i].action()) {
                return;
            }


        }
    };


    return {
        character : character,
        zombies : zombies,
        actionAllZombies : actionAllZombies,
        getZombiesAtPositions : getZombiesAtPositions
    };

};
