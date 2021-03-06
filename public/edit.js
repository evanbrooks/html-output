var socket = io.connect('/');
var socket_id = parseInt(Math.random() * 10000);


// var editor = ace.edit("editscript");
// editor.setTheme("ace/theme/dawn");
// editor.getSession().setMode("ace/mode/javascript");
// editor.getSession().setUseSoftTabs(true);
// editor.setShowFoldWidgets(false);
// // editor.setShowInvisibles(true);
// document.getElementById('editscript').style.fontSize='14px';

$edit = document.getElementById("edit");
$editscript = document.getElementById("editscript");

// ============

// E D I T O R

var editor = CodeMirror.fromTextArea($editscript, {
  mode: "javascript",
  tabSize: 2,
  lineNumbers: true,
  gutters: ["marginalia", "CodeMirror-lint-markers"],
  lint: true,
  theme: "loop"
});


// ===========

// L I N T E R

// var widgets = []
// function updateHints() {
//   editor.operation(function(){

//     // Remove old errors
//     for (var i = 0; i < widgets.length; ++i) {
//       editor.removeLineWidget(widgets[i]);
//     }
//     widgets.length = 0;

//     // Hint on current text
//     JSHINT(editor.getValue());

//     // For all returned errors
//     for (var i = 0; i < JSHINT.errors.length; ++i) {
//       var err = JSHINT.errors[i];
//       if (!err) continue;

//       // Create widget
//       var msg = document.createElement("div");

//       // Add icon
//       var icon = msg.appendChild(document.createElement("span"));
//       icon.innerHTML = "!!";
//       icon.className = "lint-error-icon";

//       // Add reason
//       msg.appendChild(document.createTextNode(err.reason));

//       // Insert widget
//       msg.className = "lint-error";
//       widgets.push(editor.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}));
//     }
//   });

//   var info = editor.getScrollInfo();
//   var after = editor.charCoords({line: editor.getCursor().line + 1, ch: 0}, "local").top;
//   if (info.top + info.clientHeight < after)
//     editor.scrollTo(null, after - info.clientHeight + 3);
// }

// ===========

// H U S L p


var css = "";
for (var i = 0; i < 40; i++) {
  var col = $.husl.p.toHex(((i / 40) * 360), 90, 60);
  var className = ".cm-s-loop .cm-color-" + i;
  css += className + " { color: " + col + "}\n"; 
}
add_style_sheet(css);



// ===========


var tabs = document.querySelectorAll("[data-tab]");
for (var i = 0; i < tabs.length; i++ ) {
  tabs[i].addEventListener("click",function(e){
    e.preventDefault();
  });
  tabs[i].addEventListener("mousedown",function(e){
    var activetab = document.querySelector(".activetab");
    if (activetab) activetab.classList.remove("activetab");
    this.classList.add("activetab");

    var sel = "." + this.getAttribute("data-tab");
    var active = document.querySelector(".active");
    if (active) active.classList.remove("active");
    document.querySelector(sel).classList.add("active");
  }, false);
}


document.getElementById("execute").addEventListener("click", function(e){
  e.preventDefault();
  send_script();
});

function send() {
  socket.emit('message', {
    "css": $edit.innerText,
    "ID": socket_id
  });
}

function send_script() {
  document.querySelector(".error").innerHTML = "";
  socket.emit('message', {
    "script": $editscript.innerText,
    "ID": socket_id
  });
}

function send_highlight(s) {
  socket.emit('message', {
    "highlight": s,
    "ID": socket_id
  });
}

function clear_highlight(s) {
  socket.emit('message', {
    "unhighlight": s,
    "ID": socket_id
  });
}

// ================

socket.on('message', function(msg) {
  if (msg.ID !== socket_id) {
    if (msg.error) {
      var parts = msg.error.text.split(":");
      var txt = '<span class="error-type">' + parts[0] + '</span>' + parts[1];
      document.querySelector(".error").innerHTML = txt;
    }
  }
});

// ================


function Slider(el) {
  var self = this;
  var $el = $(el);

  $el.attr("tabindex", 0);
  $el.html('<div class="slider-rail"></div><div class="slider-thumb"></div>');

  var $rail = $el.find(".slider-rail");
  var $thumb = $el.find(".slider-thumb");
  var $val = $el.next();
  var dragging = false;
  var start = {x:0, y:0};
  var delt = {x:0, y:0};
  var val = 0;
  var strtval = 0;
  var step = 1;

  $el.attr("contenteditable", false);
  $rail.attr("contenteditable", false);
  $thumb.attr("contenteditable", false);


  $thumb.mousedown(function(e){
    dragging = true;
    $el.addClass("dragging");
    $("body").addClass("dragging");
    $("#edit").attr("contenteditable", false);
    start.x = e.clientX;
    start.y = e.clientY;
    delt.x = 0;
    delt.y = 0;
    val = parseInt($el.next().html());
    strtval = val;
  });
  $("html").mousemove(function(e){
    if (dragging) {
      delt.x = e.clientX - start.x;
      delt.y = e.clientY - start.y;

      val = parseInt(strtval - parseInt(delt.y * 0.1) * step);

      $val.html(val);
      send();

      $rail.css({
        "-webkit-transform": "translate3d(0, " + delt.y + "px, 0)"
      });
    }
  });
  $("html").mouseup(function(){
    dragging = false;
    $("#edit").attr("contenteditable", true);
    $(".dragging").removeClass("dragging");
    $rail.css({
      "-webkit-transform": ""
    });
  });

  $el.keydown(function(e){
    // UP KEY
    if (e.keyCode == 38) {
      e.preventDefault();
      val += step;
      $val.html(val);
      send();
    }
    // DOWN KEY
    else if (e.keyCode == 40) {
      e.preventDefault();
      val -= step;
      $val.html(val);
      send();
    }

  });
}


// =============


if ($edit) {
  $edit.addEventListener("keyup", function(e){
    send();
  }, false);


  // Ajax get
  // -------

  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

          var txt = xmlhttp.responseText;

          var lines = txt.split("\n");

          // SPLIT
          for (var i = 0; i < lines.length; i++) {
            // var words = lines[i].split(" ");
            if (lines[i].indexOf("{") !== -1 ) {
              var parts = lines[i].split("{");
              lines[i] = [
                {
                  sel: true,
                  str: parts[0]
                },
                {
                  str: "{"
                },
                {
                  str: parts[1]
                }
              ];
            }
            else {
              var parts = lines[i].split(" ");
              var arr = [];
              for (var j = 0; j < parts.length; j++) {
                var is_number = false;
                // if (/([0-9]+([a-z]{2}|%))/.test(parts[j])) {
                if (/([0-9]+)/.test(parts[j])) {
                  is_number = true;
                }
                arr.push({
                  numerical: is_number,
                  str: parts[j]
                });
                arr.push({
                  str: " "
                });
              }
              lines[i] = arr;
            }

          }

          // RECOMBINE
          for (var i = 0; i < lines.length; i++) {
            var words = lines[i];

            for (var j = 0; j < words.length; j++) {
              if (words[j].sel) {
                var sel = words[j].str.trim();
                sel = sel.replace(/(\s|^)([\*a-zA-Z]+[1-7]{0,1})/g, function(match, grp){
                  return '<span class="sel-name">' + match + '</span>';
                });
                sel = sel.replace(/#([a-zA-Z]*)/, function(match, grp){
                  return '<span class="sel-id">' + match + '</span>';
                });
                sel = sel.replace(/(\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g, function(match, grp){
                  return '<span class="sel-class">' + match + '</span>';
                });
                words[j].str = words[j].str.replace(words[j].str.trim(), '<span data-selector>' + sel + '</span>');
              }

              else if (words[j].numerical) {
                var str = words[j].str.trim();
                var val = parseFloat(str);
                var min, max, step, unit;
                if (str.indexOf("em") !== -1) {
                  min = -2;
                  max = 10;
                  step = 0.1;
                  unit = "em";
                }
                else if (str.indexOf("px") !== -1) {
                  min = -20;
                  max = 200;
                  step = 1;
                  unit = "px";
                }
                else if (str.indexOf("vw") !== -1) {
                  min = -10;
                  max = 100;
                  step = 1;
                  unit = "vw";
                }
                else if (str.indexOf("%") !== -1) {
                  min = -10;
                  max = 200;
                  step = 1;
                  unit = "%";
                }

                // var input = '<input type="range" value="' + val + '" min="' + min + '" max="' + max + '" step="' + step + '"/> <span class="rangeDat">' + val + '</span>';


                var input = '<span class="slider"></span><span class="slider-val">' + val + '</span>';



                words[j].str = words[j].str.replace(val, input );
              }
              else if (words[j].str == "black;") {
                words[j].str = '<input class="color" type="text" value="#000">;';
              }
              else if (words[j].str == "white;") {
                words[j].str = '<input class="color" type="text" value="#fff">;';
              }
              else if (words[j].str == "blue;") {
                words[j].str = '<input class="color" type="text" value="#00f">;';
              }
              // else if (words[j].str == "2em;") {
              //   words[j].str = '<input type="range" value="2" min="0" max="30" step="0.1"/> <span class="rangeafter">2</span>em;';
              // }
              // else if (words[j].str == "28px/1.25") {
              //   words[j].str = '<input type="range" value="28" min="0" max="50" step="1"/> <span class="rangeafter">28</span>px/1.25';
              // }
            }
            lines[i] = words.reduce(function(prev, curr, i, arr){
              return prev + curr.str;
            }, "");
          }

          var html = lines.join("\n");

          document.getElementById("edit").innerHTML = html;



          $(".color").minicolors({
            opacity: false,
            change: function(hex, opacity) {
              this.parentNode.querySelector(".minicolors-swatch-color").innerText = hex;
              send();
            }
          });
          $(".color").each(function(){
            this.parentNode.querySelector(".minicolors-swatch-color").innerText = this.value;
          });



          // $("input[type=range]").on("mousemove change", function(e){
          //   $(this).next().html( $(this).val() );
          //     send();
          // });


          var sliders = document.querySelectorAll(".slider");
          for (var i = 0; i < sliders.length; i++) {
            new Slider(sliders[i]);
          }


          $("[data-selector]").hover(function(e){
            var s = this.innerText;
            send_highlight(s);
          }, function(e){
            var s = this.innerText;
            clear_highlight(s);
          });

      }
  }

  xmlhttp.open("GET", "../sketch/style.css", true);
  xmlhttp.send();
}

// ==============================

// DOM Utilities


function add_style_sheet(css) {
  var head, styleElement;
  head = document.getElementsByTagName('head')[0];
  styleElement = document.createElement('style');
  styleElement.setAttribute('type', 'text/css');
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    styleElement.appendChild(document.createTextNode(css));
  }
  head.appendChild(styleElement);
  return styleElement;
}
