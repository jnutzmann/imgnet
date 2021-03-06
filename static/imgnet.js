
// ============== State Variables ============

var VIEW_MODE = 0;
var ADD_LABEL_MODE = 1;

var photos = []

var minIndex = 0;
var maxIndex = 0;

var dispLabel = 1;

var randomize = true;

var mode = VIEW_MODE;

var current_photo;

// ============= AJAX Requests ===============

function list_photos_allsub(label) { $.getJSON( "/list/photos/allsub/"+label, list_photos_allsub_callback )}
function make_label_tree(label)    { $.getJSON( "/tree/labels/"+label, make_label_tree_callback )}
function populate_other_labels(iid) { $.getJSON( "/labels/photo/"+iid, populate_other_labels_callback )}

// ============= Drawing Label Tree ===============

function populate_other_labels_callback(data) {
    ul = $("<ul>")

    for ( var i=0; i < data.length; i++) {
        ul.append( 
            $("<li>").append(
                $("<a>").attr("href","?label="+data[i][0])
                        .html(data[i][1])
            )
        );
        
    }

    $("#fullscreen_labels").html("").append(ul);
}

function make_label_tree_callback(data) {
    $("#treebox").html("");
    $("#treebox").append( draw_labels(data) );
    draw_label_dropdown(data,0);
}

function draw_label_dropdown(data, level)
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
            $.get("/applylabel/"+lid+"/"+photos[iid]);
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
    maxIndex = Math.min(min + get_image_count(), photos.length);
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
            .attr("src","/img/"+photos[i])
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
    
    if (dispLabel == null) dispLabel = 0;
    
    make_label_tree(0);
}

function next_photo() {
    if (current_photo == null) return;

    iid = parseInt(current_photo.attr("iid")) + 1;
    current_photo.unbind("click")
           .click(fullscreen_listener)
           .removeClass("fullscreen")
           .css("height",get_image_size());
    $("img[iid='"+iid+"']").click();
}

function previous_photo() {
    if (current_photo == null) return;

    iid = parseInt(current_photo.attr("iid")) - 1;
    current_photo.unbind("click")
           .click(fullscreen_listener)
           .removeClass("fullscreen")
           .css("height",get_image_size());
    $("img[iid='"+iid+"']").click();
}

function fullscreen_listener() {
    iid = parseInt($(this).attr("iid"));
    $(this).css("height","")
           .addClass("fullscreen")
           .unbind("click")
           .click(next_photo);
    current_photo = $(this);
    $("#fullscreen_background").show();
    populate_other_labels(photos[iid]);
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

    current_photo = null;
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
        $.get("/add/label/"+$("#activeLabel").val()+"/"+$("#newLabelName").val());
    });

    $(document).keydown(function(e) {
        if ( e.which == 27 ) {
            restore_from_fullscreen(); 
        }

        if ( e.which == 39 ) {
            next_photo();
        }

        if ( e.which == 37 ) {
            previous_photo();
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
