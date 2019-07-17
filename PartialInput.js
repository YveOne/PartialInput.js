/*
 *  PartialInput.js v1.0
 *  Author: Yvonne P. (yveone.com)
 *  License: MIT
**/
"use strict";

((name, deps, factory) => {

    // AMD
    if (typeof define !== "undefined" && define.amd){
        define(deps, factory);

    // Node.js
    } else if (typeof module !== "undefined" && module.exports) {
        module.exports = factory.apply(deps.map(require));

    // Browser
    } else {
        let d, i = 0, global = this, old = global[name], mod;
        while(d = deps[i]){
            deps[i++] = this[d];
        }
        global[name] = mod = factory.apply(null, deps);
        mod.noConflict = () => {
            global[name] = old;
            return mod;
        };
    }

})("PartialInput", [], () => {

    function PartialInput(itemsContainer) {
        let that = this;

        let inputContainer = document.createElement("div");
        inputContainer.classList.add("input-container");

        let input = document.createElement("input");
        input.setAttribute("type", "text");
        input.classList.add("input-field");
        inputContainer.appendChild(input);

        let tempContainer = document.createElement("div");
        tempContainer.classList.add("multi-item");
        tempContainer.appendChild(inputContainer);

        itemsContainer.innerHTML = "";
        itemsContainer.appendChild(tempContainer);

        let inputValue = "";
        let currentChars = "";
        let dataList = [];
        let tempList = [];

        this.splitItems = true;
        this.splitSubItems = true;
        this.addDelimiters = true;
        this.onchange = () => {};
        this.delimiters = {};

        function getTextWidth(el) {
            let canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
            let context = getTextWidth.context || (getTextWidth.context = canvas.getContext("2d"));
            context.font = window.getComputedStyle(el, null).getPropertyValue('font');
            return context.measureText(el.value).width;
        }

        function resizeInput() {
            let width = Math.floor(getTextWidth(input));
            width = Math.max(20, Math.min(200, width));
            input.style.width = (width + 1) + "px";
        }

        function cloneArray(arr) {
            return Array.isArray(arr) ? arr.map(cloneArray) : arr;
        }

        function retrieveCurrentString() {
            let str = currentChars.trim();
            currentChars = "";
            return str;
        }

        function findDelimiter() {
            let foundDelim = false;
            Object.keys(that.delimiters).some((delim) => {
                let delimStartPos = currentChars.length - delim.length;
                if (delimStartPos < 0) {
                    return false;
                }
                if (currentChars.substr(delimStartPos) === delim) {
                    currentChars = currentChars.substr(0, delimStartPos);
                    foundDelim = delim;
                    return true;
                }
                return false;
            });
            return foundDelim;
        }

        /**
         *
         */

        function createMultiItemElement() {
            let el = document.createElement("div");
            el.classList.add("multi-item");
            return el;
        }

        function createSubItemElement(str) {
            let el = document.createElement("span");
            el.classList.add("sub-item");
            el.appendChild(document.createTextNode(str));
            return el;
        }

        function createSingleItemElement(str) {
            let el = document.createElement("span");
            el.classList.add("single-item");
            el.appendChild(document.createTextNode(str));
            return el;
        }

        /**
         *
         */

        function newMultiItemElement() {
            tempContainer = createMultiItemElement()
            itemsContainer.appendChild(tempContainer);
            tempContainer.appendChild(inputContainer);
            input.focus();
        }

        function newSubItemElement(str) {
            tempContainer.insertBefore(createSubItemElement(str), inputContainer);
        }

        function newSingleItemElement(str) {
            itemsContainer.insertBefore(createSingleItemElement(str), tempContainer);
        }

        /**
         *
         */

        function pushMultiItem() {
            if (tempList.length) {
                dataList.push(tempList);
                tempList = [];
                newMultiItemElement();
                return true;
            }
            return false;
        }

        function pushSubItem(str) {
            if (str.length) {
                tempList.push(str);
                newSubItemElement(str);
                return true;
            }
            return false;
        }

        function pushSingleItem(str) {
            if (str.length) {
                dataList.push(str);
                newSingleItemElement(str);
                return true;
            }
            return false;
        }

        /**
         *
         */

        function finishItem() {
            if (that.splitItems) {
                if (finishSubItem()) {
                    return pushMultiItem();
                } else {
                    return pushSingleItem(retrieveCurrentString())
                }
            }
            return false;
        }

        function finishSubItem() {
            if (that.splitSubItems) {
                return pushSubItem(retrieveCurrentString());
            }
            return false;
        }

        function finishDelimiter(str, allowDuplicate) {
            if (that.addDelimiters) {
                finishItem();
                if (!allowDuplicate) {
                    let lastItem = dataList[dataList.length-1];
                    if (!Array.isArray(lastItem) && lastItem === str) {
                        return false;
                    }
                }
                return pushSingleItem(str);
            }
        }

        /**
         *
         */

        function addText(text) {
            let chars = text.split("");

            let changed = false;

            while (chars.length) {
                currentChars += chars.shift();

                let delim = findDelimiter();
                if (delim) {

                    let delimFlags      = that.delimiters[delim];
                    let delimItem       = (delimFlags & PI_DELIM_ITEMS)         === PI_DELIM_ITEMS;
                    let delimSubItem    = (delimFlags & PI_DELIM_SUBITEMS)      === PI_DELIM_SUBITEMS;
                    let insertDelim     = (delimFlags & PI_INSERT_DELIM)        === PI_INSERT_DELIM;
                    let insertDuplicate = (delimFlags & PI_INSERT_DELIM_DUP)    === PI_INSERT_DELIM_DUP;

                    if (delimItem && finishItem()) {
                        changed = true;
                    } else {
                        if (delimSubItem && finishSubItem()) {
                            changed = true;
                        } else {
                            if (insertDelim && finishDelimiter(delim, insertDuplicate)) {
                                changed = true;
                            } else {
                                delim = false;
                            }
                        }
                    }
                }
            }

            // add remaining text to input
            input.value = currentChars;
            inputValue = currentChars;

            if (changed) {
                that.onchange();
            }

        }

        input.oninput = (event) => {
            // added
            if (input.value.length > inputValue.length) {
                let addedText = input.value.substr(inputValue.length);
                addText(addedText);
            // removed
            } else {
                inputValue = input.value;
                currentChars = input.value;
            }
            resizeInput();
        };

        function injectDataList(list, append) {

            let _injectItemElement;
            let _injectItem;

            function injectSimpleItem(str) {
                itemsContainer.insertBefore(createSingleItemElement(str), tempContainer);
                dataList.push(str);
            }

            function injectSubItem(str) {
                _injectItemElement.appendChild(createSubItemElement(str));
                _injectItem.push(str);
            }

            function injectItem(i) {
                if (Array.isArray(i)) {
                    _injectItemElement = createMultiItemElement();
                    _injectItem = [];
                    dataList.push(_injectItem);
                    itemsContainer.insertBefore(_injectItemElement, tempContainer);
                    i.forEach(injectSubItem);
                } else {
                    injectSimpleItem(i);
                }
            }

            function injectList(l) {
                l.forEach(injectItem);
            }

            if (!append) {
                dataList = [];
                itemsContainer.removeChild(tempContainer);
                itemsContainer.innerHTML = "";
                itemsContainer.appendChild(tempContainer);
// TODO: check if input got focus, otherwise dont focus
                input.focus();
            }
            injectList(list);
            _injectItemElement = undefined;
            _injectItem = undefined;
            that.onchange();
        }

        function injectTempList(list, append) {

            function injectSubItem(str) {
                if (Array.isArray(str)) {
                    str.forEach(injectSubItem);
                } else {
                    tempContainer.insertBefore(createSubItemElement(str), inputContainer);
                    tempList.push(str);
                }
            }

            function injectList(l) {
                l.forEach(injectSubItem);
            }

            if (!append) {
                tempList = [];
                tempContainer.removeChild(inputContainer);
                tempContainer.innerHTML = "";
                tempContainer.appendChild(inputContainer);
                input.focus();
            }
            injectList(list);

            that.onchange();
        }

        function removeData() {
            let removed = false;
            if (tempList.length) {
                currentChars = inputValue = input.value = tempList.pop();
                tempContainer.removeChild(tempContainer.childNodes[tempContainer.childNodes.length-2]);
                removed = true;
            } else {
                if (dataList.length > 0) {
                    let lastItem = dataList[dataList.length-1];
                    if (Array.isArray(lastItem)) {
                        tempContainer.parentNode.removeChild(tempContainer);
                        tempContainer = itemsContainer.childNodes[itemsContainer.childNodes.length-1]
                        //dataList.pop();
                        tempList = dataList.pop();
                        tempContainer.appendChild(inputContainer);
                        input.focus();
                    } else {
                        currentChars = inputValue = input.value = lastItem;
                        dataList.pop();
                        itemsContainer.removeChild(itemsContainer.childNodes[itemsContainer.childNodes.length-2]);
                    }
                    removed = true;
                }
            }
            if (removed) {
                resizeInput();
                that.onchange();
            }
        }

        function removeDataAuto() {
            doRemove = false;
            if (removeData()) {
                that.onchange();
            }
            keyDownTimeout = setTimeout(removeDataAuto, 100);
        }

        /**
         *
         */

        this.finishItem = finishItem;
        this.finishSubItem = finishSubItem;
        this.onenter = finishItem;

        this.data = (list, append) => {
            if (list !== undefined && Array.isArray(list)) {
                injectDataList(list, append);
            }
            return cloneArray(dataList);
        };

        this.temp = (list, append) => {
            if (list !== undefined && Array.isArray(list)) {
                injectTempList(list, append);
            }
            return cloneArray(tempList);
        };

        let keyDownTimeout = false;
        let keyIsDown = false;
        let doRemove = true;

        input.onkeydown = (event) => {
            if (!keyIsDown) {
                keyIsDown = true;

                switch(event.keyCode) {
                
                    case 8:
                        doRemove = !inputValue;
                        if (doRemove) { // dont auto remove, when we just wanna delete current text
                            keyDownTimeout = setTimeout(removeDataAuto, 500);
                        }
                        break;
                
                    case 13:
                        if (that.onenter()) {
                            input.value = "";
                            inputValue = "";
                            that.onchange();
                        }
                        break;

                }
            }
        };

        input.onkeyup = (event) => {
            if (event.keyCode === 8) {
                if (keyDownTimeout) {
                    clearTimeout(keyDownTimeout);
                    keyDownTimeout = false;
                }
                if (doRemove) {
                    if (removeData()) {
                        that.onchange();
                    }
                }
            }
            keyIsDown = false;
        };

        resizeInput();
        input.focus();
    }

    PartialInput.NOTHING            =   0;

    PartialInput.DELIM_ITEMS        =   1;
    PartialInput.DELIM_SUBITEMS     =   2;
    PartialInput.INSERT_DELIM       =   4;
    PartialInput.INSERT_DELIM_DUP   =   8 | PartialInput.INSERT_DELIM;

    PartialInput.HARD_INSERT        = PartialInput.INSERT_DELIM;
    PartialInput.HARD_INSERT_DUP    = PartialInput.HARD_INSERT | PartialInput.INSERT_DELIM_DUP;
    PartialInput.SOFT_INSERT        = PartialInput.DELIM_ITEMS | PartialInput.INSERT_DELIM;
    PartialInput.SOFT_INSERT_DUP    = PartialInput.SOFT_INSERT | PartialInput.INSERT_DELIM_DUP;

    PartialInput.fromSelector = (selector) => {
        return new PartialInput(document.querySelector(selector));
    };

    return PartialInput;
});
