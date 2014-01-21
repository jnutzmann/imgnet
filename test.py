from flask import Flask
from flask import Response
from flask import url_for
from flask import redirect
from flask import abort
from flask import request
from flask import make_response

import database

import random
import json

app = Flask(__name__)

bigd = database.connect('test.db')

# ===============================================================

@app.route("/list/photos/allsub/<int:label>")
def list_photos_allsub(label):
    p = database.get_photos_in_label_and_sublabels(bigd,int(label))
    return Response(json.dumps(p),mimetype="application/json")

# ===============================================================

def build_label_tree(db,label):
    subs = []
    
    for l in database.get_sub_labels(db,label):
        lbl = {}
        lbl["name"] = str(l[1])
        lbl["id"] = l[0]
        lbl["sub"] = build_label_tree(db, l[0])
        subs.append(lbl)
        
    return subs

@app.route("/tree/labels/<int:label>")
def tree_labels(label):
    tree = []
    lbl = {}
    lbl["name"] = database.get_label_name(bigd,label)
    lbl["id"] = label
    lbl["sub"] = build_label_tree(bigd,label)
    tree.append(lbl)
    return json.dumps(tree)

# ===============================================================

@app.route("/applylabel/<int:label>/<int:photo>")
def apply_label(label,photo):
    database.add_label(bigd,photo,label);
    bigd.db.commit()
    return "";
    
# ===============================================================

@app.route("/labels/photo/<int:photo>")
def get_labels_on_photo(photo):
    return json.dumps(database.get_labels_on_photo(bigd,photo));

# ===============================================================

@app.route("/add/label/<int:parent>/<name>")
def add_label(parent,name):
    database.push_label(bigd,name,parent)
    bigd.db.commit()
    return ""

# ===============================================================

@app.route("/img/<int:id>", methods=[ "GET" ])
def img(id):    
    path = database.get_image_path(bigd,id)
    f = open(path)
    resp = f.read()
    f.close()
    return Response(resp,mimetype="image/jpeg")

# ========================================================================

if __name__ == "__main__":
    app.run(debug=True)
    bigd.db.close()
