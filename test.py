#from flask import Flask
#from flask import Response
#from flask import url_for
#from flask import redirect
#from flask import abort

import sys
import os
import time
import string



#app = Flask(__name__)

#@app.route("/test", methods=[ "GET" ])
def tree():

    file = "" # add stuffs

    return Response(file,mimetype="text/plain")



def parse_path(path):

    dirs = filter(os.path.isdir, [path + r for r in os.listdir(path)])
    files = filter(os.path.isfile, [path + r for r in os.listdir(path)])

    text = ''

    for dir in dirs:
        name = string.replace(dir,path,'')
        text = text + 'DIR: '+ name + '\n'

    for file in files:        
        name = string.replace(file,path,'')
        text = text + 'FILE: ' + name + '\n'

	return text

def in_directory(file, directory):
    
    #make both absolute    
    directory = os.path.realpath(directory)
    file = os.path.realpath(file)

    #return true, if the common prefix of both is equal to directory
    #e.g. /a/b/c/d.rst and directory is /a/b, the common prefix is /a/b
    return os.path.commonprefix([file, directory]) == directory

# ========================================================================

#if __name__ == "__main__":
#    app.run()
