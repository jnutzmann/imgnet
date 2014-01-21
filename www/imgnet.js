
// ============== State Variables ============

var VIEW_MODE = 0;
var ADD_LABEL_MODE = 1;

var photos = []

var minIndex = 0;
var maxIndex = 0;

var dispLabel = 1;

var randomize = true;

var mode = VIEW_MODE;

// ============= AJAX Requests ===============

function list_photos_allsub(label) { $.getJSON( "http://localhost/ajax/list/photos/allsub/"+label, list_photos_allsub_callback )}
function make_label_tree(label)    { $.getJSON( "http://localhost/ajax/tree/labels/"+label, make_label_tree_callback )}

// ============= Drawing Label Tree ===============

function make_label_tree_callback(data) {
    $("#treebox").html("");
    $("#treebox").append( draw_labels(data) );
    draw_label_dropdown(data,0);
}

function draw_label_dropdown(data,level)
{
    for ( var i=0; i < data.length; i++ ) {
    
        var opt = $("<option>")
                .html(data[i].name)
                .val(data[i].id)
                .css("padding-left",level + "em");
                
        $("#activeLabel").append(opt);
        
        draw_label_dropdown( data[i].sub, level+1 );
    }
}

function draw_labels(data) {
    data.sort(sortLabels);

    var ul = $("<ul>").addClass("tree");
    
    for ( var i=0; i < data.length; i++ ) {
    
        var a = $("<a>")
            .attr("lid",data[i].id)
            .click( treeitem_click )
            .html(data[i].name);
            
        if (data[i].id == dispLabel)
            a.css('font-weight','bold');
    
        ul.append( $("<li>")
            .append(a)
            .append( draw_labels(data[i].sub) )
        );
    }
    
    return ul;
}

function treeitem_click() {

    if ( mode == VIEW_MODE ) {
        window.location.href = "?label="+$(this).attr("lid");
    } else if ( mode == ADD_LABEL_MODE ) {
        var lid = $(this).attr("lid");
        
        $("#photobox img.selected").each(function() {
            iid = $(this).attr("iid");
            $.get("http://localhost/ajax/applylabel/"+lid+"/"+photos[iid]);
            $(this).removeClass("selected");
        });
    }
}

// ============= Image Size and Count ===========

function get_image_size() { return parseInt($("#imgsize_slider").slider("value")); }
function get_image_size_cookie()  { var size  = $.cookie("size");  if (size == null)  size  = 400; return size;  }
function set_image_size_cookie(size)   { $.cookie("size", size); }

function get_image_count() { return parseInt($("#imgcount").val()) };
function get_image_count_cookie() { var count = $.cookie("count"); if (count == null) count = 50;  return count; }
function set_image_count_cookie(count) { $.cookie("count",count); }

function image_size_onchange() {    
    set_image_size_cookie(get_image_size());
    $("#imgsize_disp").text( get_image_size() + " px" );
    $("#photobox img").css("height",get_image_size());
}

function image_count_onchange() {    
    set_image_count_cookie(get_image_count());
    update_bounds(minIndex);    
    repaint_photoset();
}

// ============= Displayed Photos Bounds ===============

function update_bounds(min) {
    minIndex = min;
    maxIndex = Math.min(min + get_image_count(),photos.length);
}

// ============= Forward / Back Buttons ===============

function next_onclick() {
    if ( maxIndex == photos.length ) return;
    update_bounds( minIndex + get_image_count() );
    repaint_photoset();
}

function back_onclick() {
    if ( minIndex == 0 ) return;
    update_bounds( Math.max( 0, minIndex - get_image_count()));
    repaint_photoset();
}

// ============= Photoset Management ===============

function repaint_photoset() {
    $("#photobox").html("");
    
    for (var i = minIndex; i < maxIndex; i++) {
        $("#photobox").append( $("<img>")
            .attr("src","http://localhost/ajax/img/"+photos[i])
            .css("height",get_image_size())
            .attr("iid",i)
        );
    }
    
    $("#imgdisp").html( "(" + minIndex + "..." + maxIndex + "/" + photos.length + ")" );
    add_photo_click_listener();
}

function list_photos_allsub_callback(data) {    
    
    if ( randomize) shuffle(data);
    
    photos = data;
    update_bounds(0);
    repaint_photoset();
}

// ============= Setup ===============

function setup_header() {

    $("#imgsize_slider").slider({
        value: get_image_size_cookie(),
        min: 50,
        max: 1000,
        change: image_size_onchange,
        slide: image_size_onchange,
    });
    
    $("#imgcount").spinner();
    
    $("#imgcount").change( image_count_onchange );
    $("#imgcount").on("spin", image_count_onchange );
    
    $("#imgcount").val(get_image_count_cookie());
    
    $("#next_button").click(next_onclick);
    $("#prev_button").click(back_onclick);
}

function setup_tree() {
    dispLabel = $.urlParam("label");
    
    if (dispLabel == null) dispLabel = 1;
    
    make_label_tree(1);
}

function next_photo() {
    iid = parseInt($(this).attr("iid")) + 1;
    $(this).unbind("click")
           .click(fullscreen_listener)
           .removeClass("fullscreen")
           .css("height",get_image_size());
    $("img[iid='"+iid+"']").click();
}

function fullscreen_listener() {
    $(this).css("height","")
           .addClass("fullscreen")
           .unbind("click")
           .click(next_photo);        
    $("#fullscreen_background").show();
}

function select_listener() {
    $(this).toggleClass("selected");
}

function add_photo_click_listener() {
    $("#photobox img").unbind("click");
    
    if ( mode == VIEW_MODE )
        $("#photobox img").click(fullscreen_listener);
    else if ( mode == ADD_LABEL_MODE )
        $("#photobox img").click(select_listener);
}

function restore_from_fullscreen() {
    $(".fullscreen")
        .unbind("click")
        .click(fullscreen_listener)
        .removeClass("fullscreen")
        .css("height",get_image_size());
        
    $("#fullscreen_background").hide();
}

function mode_onchange() {
    mode = parseInt($("#mode").val());
    add_photo_click_listener();
}

$(document).ready(function() {
    
    setup_header();
    setup_tree();
    
    list_photos_allsub(dispLabel);
        
    image_size_onchange();
    image_count_onchange();
    
    $("#mode").change(mode_onchange).val(mode);
    
    $("#addLabelButton").click(function() {
        $.get("http://localhost/ajax/add/label/"+$("#activeLabel").val()+"/"+$("#newLabelName").val());
    });
    

    $(document).keypress(function(e) {
        if ( e.which == 0 ) {
            restore_from_fullscreen(); 
        }
    });
    
    $("#fullscreen_background").hide().click(restore_from_fullscreen);
});

// ==================================


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

function sortLabels(a, b){

    var av=a.name.toLowerCase(), bv=b.name.toLowerCase()
    if (av < bv) //sort string ascending
        return -1
    if (av > bv)
        return 1
    return 0 //default return value (no sorting)
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
