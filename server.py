from flask import Flask
from flask import Response
from flask import render_template

from database import ImgnetDatabase
import datastore
import json

app = Flask(__name__)
db = ImgnetDatabase()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/list/photos/allsub/<int:label>")
def list_photos_allsub(label):

    p = db.get_photos_in_label_and_sublabels(label)

    return Response(json.dumps(p), mimetype="application/json")


def build_label_tree(label):
    subs = []
    
    for l in db.get_sub_labels(label):
        lbl = {}
        lbl["name"] = str(l[1])
        lbl["id"] = l[0]
        lbl["sub"] = build_label_tree(l[0])
        subs.append(lbl)
        
    return subs


@app.route("/tree/labels/<int:label>")
def tree_labels(label):
    tree = []
    lbl = {}
    lbl["name"] = db.get_label_name(label)
    lbl["id"] = label
    lbl["sub"] = build_label_tree(label)
    tree.append(lbl)
    return Response(json.dumps(tree), mimetype="application/json")


@app.route("/applylabel/<int:label>/<int:photo>")
def apply_label(label, photo):
    db.label_photo(photo, label)
    db.commit()
    return ""
    

@app.route("/labels/photo/<int:photo>")
def get_labels_on_photo(photo):
    return json.dumps(db.get_labels_on_photo(photo))


@app.route("/add/label/<int:parent>/<name>")
def add_label(parent, name):
    db.create_label(name, parent)
    db.commit()
    return ""


@app.route("/img/<int:id_>")
def img(id_):
    with open(datastore.get(id_), 'rb') as f:
        resp = f.read()
        return Response(resp, mimetype="image/jpeg")


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
