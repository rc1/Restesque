

module.exports = {
    sequentialLoop : sequentialLoop,
    escapeRegExp : escapeRegExp,
    removeBaseFromUrl : removeBaseFromUrl,
    getActionsFromString : getActionsFromString
};

function sequentialLoop (iterations, fn, callback) {
    var index = 0;
    var done = false;
    var end =  function() {
        done = true;
        callback();
    };
    var next = function() {
        if (done) { return; }
        if (index < iterations) {
            index++;
            fn(index-1, next, end);
        } else {
            done = true;
            if (callback) { callback(); }
        }
    };
    next();
    return next;
}

function removeBaseFromUrl (base, url) {
    var regex = new RegExp("^(" + escapeRegExp(base) + ")", "");
    return url.replace(regex,"");
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function getActionsFromString(str) {
    var split = str.split('?');
    str = split[split.length-1];    
    var match;
    var pl = /\+/g;  // Regex for replacing addition symbol with a space
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function (s) { 
        var result = decodeURIComponent(s.replace(pl, " "));
        return  result === "" ? true : result;
    };
    var query  = str;
    urlParams = {};
    while (match = search.exec(query)) urlParams[decode(match[1])] = decode(match[2]);
    return urlParams;
}