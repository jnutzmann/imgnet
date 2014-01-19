from flask import Flask
from flask import Response
from flask import url_for
from flask import redirect
from flask import abort
from flask import request

import sys
import os
import time
import string



app = Flask(__name__)

@app.route("/test", methods=[ "GET" ])
def tree():
    
    path = request.args.get('p')
    print path

    file = parse_path(path)

    return Response(file,mimetype="text/html")



def parse_path(path):

    dirs = filter(os.path.isdir, [path + r for r in os.listdir(path)])
    files = filter(os.path.isfile, [path + r for r in os.listdir(path)])

    text = '<html><body>'

    for dir in dirs:
        name = string.replace(dir,path,'')
        text = text + '<a href="./test?p='+path+name+'/">'+name+'</a><br/>'

    for file in files:        
        name = string.replace(file,path,'')
        text = text + name + '<br/>'
        
    text = text + '</body></html>'

    return text

def in_directory(file, directory):
    
    #make both absolute    
    directory = os.path.realpath(directory)
    file = os.path.realpath(file)

    #return true, if the common prefix of both is equal to directory
    #e.g. /a/b/c/d.rst and directory is /a/b, the common prefix is /a/b
    return os.path.commonprefix([file, directory]) == directory

# ========================================================================

if __name__ == "__main__":
    app.run()
