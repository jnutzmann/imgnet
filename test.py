from flask import Flask
from flask import Response
from flask import url_for
from flask import redirect
from flask import abort
from flask import request
from flask import make_response

import database

import random

app = Flask(__name__)



def draw_index(d,label):
    
    txt = '<ul>'
    
    for l in database.get_sub_labels(d,label):
        txt += '<li><a href="/index/'+str(l[0])+'">' + str(l[1]) + '</a>'
        txt += draw_index(d,l[0])
        txt += '</li>'
    
    txt += '</ul>'
    
    return txt

@app.route("/index",strict_slashes=False)
@app.route("/index/<label>")
def index(label=1):
    
    db = database.connect('test.db')
    
    p = database.get_photos_in_label_and_sublabels(db,int(label))
    rns = [ random.randint(0,len(p)-1) for r in xrange(min(len(p),100))]
    
    txt = '''<html>
                <head>
                    <style>
                        .photo { height:400px; }
                    </style>
                    <script type="text/javascript" src="http://thomasdaede.com/wordpress/wp-includes/js/jquery/jquery.js?ver=1.10.2"></script>
                    <script type="text/javascript" src="http://thomasdaede.com/wordpress/wp-includes/js/jquery/jquery-migrate.min.js?ver=1.2.1"></script>
                    <script>
                    $j = jQuery.noConflict();
                        $j(document).ready(function(){
                            $j("#imgsize").change( function () {
                                $j(".photo").css("height", $j("#imgsize").val()+"px");
                            });
                        });
                    </script>
                </head>
                <body>
                    <div id="banner" style="z-index:100; background-color:black; width:100%; position:fixed; color:white;">
                    
                        Image Height: <input type="text" value="400" id="imgsize" >'''
                        
    txt += "(Images " + str(len(rns)) + "/" + str(len(p))+")"
    txt += '''
                       </div>
                    <div style="float:right; padding-top:50px; ">'''
    txt += draw_index(db,label)
    txt += '</div>'
    
    ids = []
    
    for r in rns:
        while p[r] in ids:
            r = (r + 1) % len(rns)    
        ids.append(p[r])    
        
    for i in ids:
        txt += '<img class="photo" src="/img/'+str(i)+'"/>'
    
    txt+='</body></html>'
    
    db.db.close()
    
    return Response(txt,'text/html')    
    

@app.route("/img/<int:id>", methods=[ "GET" ])
def img(id):
   
    db = database.connect('test.db')
    
    path = database.get_image_path(db,id)
   
    f = open(path)
    resp = f.read()
    f.close()
    
    db.db.close()
    
    return Response(resp,mimetype="image/jpeg")

# ========================================================================

if __name__ == "__main__":
    app.run(debug=True)
