(function(){

    function ProgressBar(parent) {
        if (!parent || !(parent instanceof HTMLElement)) {
            parent = document.body;
        }
        var self = this;
        var progressBar = null;
        var progressDiv = null;

        var progressTask = -1;
        var progress = 0;

        var liveStep = 0;

        this.step = 1;
        this.interval = 20;


        function doProgress() {
            progress += liveStep;
            if (progress > 100 || progress < 0) {
                liveStep *= -1;
                progress += liveStep;
            }
            progressDiv.style.width = progress + "%";
        }

        function centerProgress() {
            progressBar.style.top = Math.round(window.innerHeight / 2 - progressBar.offsetHeight / 2) + "px";
            progressBar.style.left = Math.round(window.innerWidth / 2 - progressBar.offsetWidth / 2) + "px";
        }

        this.start = function() {
            if (progressBar != null) {
                throw "ProgressBar already open!";
            }
            progressBar = document.createElement("div");
            progressBar.id = "progressbar";

            progressDiv = document.createElement("div");
            progressDiv.className = "progress";
            progressBar.appendChild(progressDiv);

            var text = document.createElement("div")
            text.className = "text";
            text.innerHTML = "Lade... Bitte warten!";
            progressBar.appendChild(text);

            parent.appendChild(progressBar);
            centerProgress();
            bindEvent("resize", window, centerProgress);
            liveStep = this.step;
            progressTask = setInterval(doProgress, this.interval);
        };

        this.stop = function() {
            if (progressBar == null) {
                throw "ProgressBar not open!";
            }
            unbindEvent("resize", window, centerProgress);
            document.body.removeChild(progressBar);
            progressBar = progressDiv = null;
            clearInterval(progressTask);
        };
    }

    function Stack() {
        var topEntry = null;
        var count = 0;

        function Entry(value, next) {
            this.value = value;
            this.nextEntry = next || null;
        }

        this.peek = function() {
            if (topEntry) {
                return topEntry.value;
            }
            return null;
        };

        this.pop = function() {
            if (topEntry) {
                var value = topEntry.value;
                topEntry = topEntry.nextEntry;
                count--;
                return value;
            }
            return null;
        };

        this.push = function(value) {
            topEntry = new Entry(value, topEntry);
            count++;
        };

        this.count = function() {
            return count;
        };

        this.forEach = function(callback) {
            var entry = topEntry;
            do {
                callback(entry.value);
                entry = entry.nextEntry;
            } while (entry);
        }

        this.values = function() {
            var values = [];
            var i = 0;
            this.forEach(function(value) {
                values[i++] = value;
            });
            return values;
        }
    }

    function Pos(x, y, target, scale) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.scale = scale || .5;
    }

    var self = this;

    var IMAGE_BASE_PATH = "pictures/";
    var IMAGE_FILE_EXT = ".jpg";
    var IMAGE_ENTRY_POINT = "hallway";

    var mainContainer = null;
    var imageContainer = null;

    var mainImage = null;
    var buttons = {
        forward: null,
        left: null,
        right: null
    };
    var previousButton = null;
    var startButton = null;

    var imageStack = new Stack();

    var images = {
        "hallway": {
            forward: new Pos(.50, -.20, "hallway_corner")
        },
        "hallway_corner": {
            left: new Pos(.13,.30, "hallway2", .3)
        },
        "hallway2": {
            forward: new Pos(.36, -.25, "doors")
        },
        "doors": {
            forward: new Pos(.50, -.28, "office", .3),
            right: new Pos(-.18, .50, "practice_room1", .25),
            left: new Pos(.17, .50, "teaching_room", .24)
        },
        "office": {},
        "teaching_room": {},
        "practice_room1": {
            forward: new Pos(.47, -.20, "practice_room2"),
            left: new Pos(.18, .50, "blackboard", 0.26)
        },
        "practice_room2": {
            right: new Pos(0, 0, "cast_room")
        },
        "cast_room": {}
    };

    var progress = new ProgressBar();

    function preloadImages() {

        var preloadImages = [];

        var i = 0;
        var keys = getKeys(images);
        for (var k in keys) {
            preloadImages[i++] = IMAGE_BASE_PATH + keys[k] + IMAGE_FILE_EXT;
        }
        keys = getKeys(buttons);
        for (k in keys) {
            preloadImages[i++] = IMAGE_BASE_PATH + "buttons/" + keys[k] + ".png";
            preloadImages[i++] = IMAGE_BASE_PATH + "buttons/" + keys[k] + "_hover.png";
        }

        var imageCount = preloadImages.length;
        function handle() {
            imageCount--;
            if (imageCount <= 0) {
                progress.stop();
                doneLoadingImages();
            }
        }

        progress.start();
        for (i in preloadImages) {
            var img = new Image();
            img.src = preloadImages[i];
            bindEvent("load", img, handle);
            bindEvent("error", img, function(e) {
                console.log("Failed to load " + e.target.src);
                handle();
            });
        }
    }

    function doneLoadingImages() {
        initializeDom();
        bindEvent("resize", window, function() {
            setImage(imageStack.peek());
        });
        setImage(IMAGE_ENTRY_POINT);
    }

    function hidePreviousButton() {
        previousButton.style.display = "none";
        startButton.style.display = "none";
    }

    function showPreviousButton() {
        previousButton.style.display = "block";
        startButton.style.display = "block";
    }

    function initializeDom() {
        imageContainer = window.document.createElement("div");
        imageContainer.id = "tour-image-container";
        imageContainer.style.position = "relative";
        imageContainer.style.margin = "auto";
        imageContainer.style.overflow = "hidden";
        mainContainer.appendChild(imageContainer);

        previousButton = document.createElement("div");
        previousButton.className = "previous";
        previousButton.innerHTML = "<span>Zurück</span>";
        bindEvent("click", previousButton, function(e) {
            cancelEvent(e);
            imageStack.pop();
            setImage(imageStack.peek());
        });
        imageContainer.appendChild(previousButton);

        startButton = document.createElement("div");
        startButton.className = "start";
        startButton.innerHTML = "<span>Zurück zum Start</span>";
        bindEvent("click", startButton, function(e) {
            cancelEvent(e);
            setImage(IMAGE_ENTRY_POINT);
        });
        imageContainer.appendChild(startButton);

        var backButton = document.createElement("div");
        backButton.className = "back";
        var backLink = document.createElement("a");
        backLink.href = "/";
        backLink.innerHTML = "&lt;&lt; Zurück zur Website";
        backButton.appendChild(backLink);
        bindEvent("click", backButton, function(e) {
            stopEvent(e);
            history.back();
        });
        imageContainer.appendChild(backButton);

        mainImage = window.document.createElement("img");
        mainImage.id = "tour-image";
        resetMainImage();

        imageContainer.appendChild(mainImage);

        function handleClick(e) {
            setImage(images[imageStack.peek()][e.target.className].target);
        }

        function mouseOver(e) {
            var t = e.target;
            t.src = t.src.replace(/[a-z_]+\.png$/, t.className + "_hover.png");
        }

        function mouseOut(e) {
            var t = e.target;
            t.src = t.src.replace(/_hover\.png$/, ".png");
        }

        for (var index in buttons) {
            if (!buttons.hasOwnProperty(index)) {
                continue;
            }
            var btn = document.createElement("img");
            btn.className = index;
            btn.style.position = "absolute";
            btn.style.display = "block";
            btn.style.top = "0";
            btn.style.left = "0";
            btn.src = IMAGE_BASE_PATH + "buttons/" + index + ".png";
            imageContainer.appendChild(btn);
            buttons[index] = btn;

            bindEvent("click", btn, handleClick);
            bindEvent("mouseover", btn, mouseOver);
            bindEvent("mouseout", btn, mouseOut);
        }
    }

    var origWidth = 0;
    var origHeight = 0;

    var widthRatio = 0;
    var heightRatio = 0;

    var widthScale = 1;
    var heightScale = 1;

    function resetMainImage() {
        mainImage.removeAttribute("style");
        mainImage.style.display = "block";
    }

    function setImage(name) {
        if (!mainContainer) {
            throw "DOM not initialized!";
        }
        if (!name) {
            throw "name is required!";
        }
        if (!images[name]) {
            throw "name not found!";
        }
        if (name != imageStack.peek()) {
            imageStack.push(name);
        }

        if (name == IMAGE_ENTRY_POINT) {
            hidePreviousButton();
        } else {
            showPreviousButton();
        }

        mainImage.src = IMAGE_BASE_PATH + name + IMAGE_FILE_EXT;

        resetMainImage();

        origWidth = mainImage.width;
        origHeight = mainImage.height;
        widthRatio = origHeight / origWidth;
        heightRatio = origWidth / origHeight;

        mainImage.style.width = "100%";
        mainImage.style.height = "100%";

        imageContainer.style.width = (window.innerHeight * heightRatio) + "px";
        imageContainer.style.height = window.innerHeight + "px";

        if (imageContainer.offsetWidth > window.innerWidth) {
            imageContainer.style.width = window.innerWidth + "px";
            imageContainer.style.height = (window.innerWidth * widthRatio) + "px";
        }

        widthScale = imageContainer.offsetWidth / origWidth;
        heightScale = imageContainer.offsetHeight / origHeight;

        placeButtons();
    }

    function placeButtons() {
        var imageInfo = images[imageStack.peek()];
        var button, buttonInfo;
        for (var buttonType in buttons) {
            if (!buttons.hasOwnProperty(buttonType)) {
                continue;
            }
            button = buttons[buttonType];
            buttonInfo = imageInfo[buttonType];

            if (!buttonInfo) {
                button.style.display = "none";
            } else {
                button.removeAttribute("style"); // reset all styles
                button.style.position = "absolute";
                button.style.display = "block";
                var x = buttonInfo.x,
                    y = buttonInfo.y;

                button.style.width = (button.width * (buttonInfo.scale + widthScale)) + "px";
                button.style.height = (button.height * (buttonInfo.scale + heightScale)) + "px";
                button.style[x < 0 ? "right" : "left"] = Math.round(imageContainer.offsetWidth * Math.abs(x) - button.offsetWidth / 2) + "px";
                button.style[y < 0 ? "bottom" : "top"] = Math.round(imageContainer.offsetHeight * Math.abs(y)) + "px";
                button.title = buttonInfo.target;
            }
        }
    }

    function bindEvent(event, elem, handler) {
        if (typeof event != "string") {
            throw "Bad event!";
        }
        if (elem.addEventListener) {
            elem.addEventListener(event, handler);
        } else if (elem.attachEvent) {
            elem.attachEvent("on" + event, handler);
        } else {
            var old = elem["on" + event];
            elem[event] = function(e) {
                if (!e) {
                    e = window.event;
                }
                this.old = old;
                if (this.old != null) {
                    this.old(e);
                }
                handler(e);
            }
        }
    }

    function unbindEvent(event, elem, handler) {
        if (typeof event != "string") {
            throw "Bad event!";
        }
        if (elem.removeEventListener) {
            elem.removeEventListener(event, handler);
        } else if (elem.detachEvent) {
            elem.detachEvent("on" + event, handler);
        } else {
            var oldHandler = elem["on" + event];
            if (oldHandler != null) {
                elem["on" + event] = oldHandler.old || null;
            }
        }
    }

    function stopEvent(e) {
        if (!e) {
            e = window.event;
        }
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
    }

    function cancelEvent(e) {
        if (!e) {
            e = window.event;
        }
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    }

    function getKeys(object) {
        if (Object.keys) {
            return Object.keys(object);
        }
        var keys = [];
        var i = 0;
        for (var k in object) {
            if (object.hasOwnProperty(k)) {
                keys[i++] = k;
            }
        }
        return keys;
    }

    /**
     * This method is basically the entry point for the whole script
     */
    function init() {
        mainContainer = window.document.getElementById("tour");
        mainContainer.style.height = "100%";
        if (!mainContainer) {
            throw "Container not found!";
        }
        preloadImages();
    }

    // initialize as early as the browser allows
    bindEvent("load", window, init);
    bindEvent("DOMContentLoaded", window, function() {
        unbindEvent("load", window, init);
        init();
    });

    return window.CBSTour = function() {
        this.setImage = self.setImage;
    };
})();

