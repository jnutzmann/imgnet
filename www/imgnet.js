
var photos = []
var minIndex = 0;
var maxIndex = 0;
var dispLabel = 1;

// ============= AJAX ===============

function list_photos_allsub(label) { $.getJSON( "http://localhost/ajax/list/photos/allsub/"+label, draw_photoset )}
function tree_labels(label)        { $.getJSON( "http://localhost/ajax/tree/labels/"+label, update_tree )}


// ============= Label Tree ===============

function update_tree(data) {
    ul = draw_label_tree(data);
    $("#treebox").html("");
    $("#treebox").append(ul);
}

function draw_label_tree(data) {

data.sort(function(a, b){
 var av=a.n.toLowerCase(), bv=b.n.toLowerCase()
 if (av < bv) //sort string ascending
  return -1
 if (av > bv)
  return 1
 return 0 //default return value (no sorting)
});

    var ul = $("<ul>");
    
    for ( var i=0; i < data.length; i++ ) {
        var li = $("<li>");
        ul.append(li);
        var a = $("<a>");
        li.append(a);
        a.attr("href","?label="+data[i].id);
//        a.click(function(id) {
//            return function() {
//                alert(id);
//                dispLabel = id;
//                update_to_label();
//            }
//        }(data[i].id));
        a.html(data[i].n);
        li.append( draw_label_tree(data[i].sub) );
    }
    
    return ul;
}

// ============= Photoset Management ===============

function update_count(min) {
    var count = parseInt($("#imgcount").val());
    $.cookie("count",count);
    
    minIndex = min;
    maxIndex = Math.min(min + count,photos.length);
}

function draw_photoset(data) {
    
    shuffle(data);
    photos = data;
    
    update_count(0);
   
    update_photoset();
}

function next() {
    if ( maxIndex == photos.length ) return;
    
    var imgcnt = parseInt($("#imgcount").val());
    
    update_count( minIndex + imgcnt );
    update_photoset();
}

function back() {
    if ( minIndex == 0 ) return;

    var imgcnt = parseInt($("#imgcount").val());
    
    update_count( Math.max( 0, minIndex - imgcnt));
    update_photoset();
}


function update_size() {
    $.cookie("height",$("#imgsize_slider").slider("value"));
    $("#imgsize_disp").text( get_photo_height() );
    $("#photobox img").css("height",get_photo_height());
}

function update_photoset() {
    
    $("#photobox").html("");
    
    for (var i = minIndex; i < maxIndex; i++) {
        var im = $("<img>");
        im.attr("src","http://localhost/ajax/img/"+photos[i])
        im.css("height",get_photo_height());
        im.click(function() {
            $(this).css("height","");
            $(this).addClass("fullscreen");
            $("#fullscreen_background").show();
            
        });
        $("#photobox").append(im);
    }
    
    $("#imgdisp").html( "(" + minIndex + "..." + maxIndex + "/" + photos.length + ")" );
}

function update_to_label() {
    list_photos_allsub(dispLabel);
    tree_labels(dispLabel);
}

// ============= Photo Height Slider ===============

function get_photo_height() {
    return $("#imgsize_slider").slider("value") + "px";
}

// ============= On Ready ===============

$(document).ready(function(){
    
    var defaultHeight = $.cookie("height");
    if (defaultHeight == null) defaultHeight = 400;
    
    $("#imgsize_slider").slider({
        range: "min",
        value: defaultHeight,
        min: 50,
        max: 1000,
        change: update_size,
        slide: update_size,
    });
    
    $("#imgcount").spinner();
    $("#imgcount").change( function () { update_count(minIndex); update_photoset(); } );
    $("#imgcount").on("spin", function () { update_count(minIndex); update_photoset(); } );
    
    var defaultCount = $.cookie("count");
    if (defaultCount == null) defaultCount = 50;
    $("#imgcount").val(defaultCount);
    
    $("#next_button").button().click(next);
    $("#prev_button").button().click(back);
    
    dispLabel = $.urlParam("label");
    if (dispLabel == null) dispLabel = 1;
    
    

    $(document).keypress(function(e) {
        if ( e.which == 0 ) {
            hide_fullscreen(); 
        }
    });
    
    $("#fullscreen_background").hide().click(hide_fullscreen);
    
    update_size();
    update_to_label();
});

function hide_fullscreen() {
   $(".fullscreen").removeClass("fullscreen").css("height",get_photo_height());
            $("#fullscreen_background").hide();
}

// ================ Utils ==================

function shuffle(array) {

  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


$.urlParam = function(name){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
