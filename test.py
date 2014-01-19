from flask import Flask
from flask import Response
from flask import url_for
from flask import redirect
from flask import abort
from flask import request
from flask import make_response

import database

app = Flask(__name__)



def draw_index(d,label):
    
    txt = '<ul>'
    
    for l in database.get_sub_labels(d,label):
        txt += '<li><a href="./'+str(l[0])+'">' + str(l[1]) + '</a>'
        txt += draw_index(d,l[0])
        txt += '</li>'
    
    txt += '</ul>'
    
    return txt

@app.route("/index",strict_slashes=False)
@app.route("/index/<label>")
def index(label=1):
    
    db = database.connect('test.db')
    
    txt = '<html><body><div style="float:right;">'
    txt += draw_index(db,label)
    txt += '</div>'
    
    p = get_photos_in_label_and_sublabels(db,label)
    
    ids = [ p[random.randint(0,len(p))] for r in xrange(50)]
        
    for i in ids:
        txt += '<img style="height:450px;" src="./img/'+str(i)+'"/>'
    
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
    

def parse_path(path,maximg):

    dirs = filter(os.path.isdir, [path + r for r in os.listdir(path)])
    files = filter(os.path.isfile, [path + r for r in os.listdir(path)])

    text = '<html><body>'

    for dir in dirs:
        name = string.replace(dir,path,'')
        text = text + '<a href="./test?p='+path+name+'/">'+name+'</a><br/>'

    photocount = 0
    
    for file in files:
        
        name = string.replace(file,path,'')
        
        if name.endswith('.jpg') and photocount < maximg:
            photocount += 1
            text += '<img style="height:450px;" src="./img?p='+path+name+'"/>'    
                
        else:    
            text += name + '<br/>'
                
    text = text + '</body></html>'

    return text

# ========================================================================

if __name__ == "__main__":
    app.run(debug=True)
