import database
import os
import string

def import_dir(db,path,label):

    path += '/'

    dirs = filter(os.path.isdir, [path + r for r in os.listdir(path)])
    files = filter(os.path.isfile, [path + r for r in os.listdir(path)])

    for f in files:
        pid = database.push_photo(db,f)
        database.add_label(db,pid,label)
    
    for d in dirs:
        name = string.replace(d,path,'')
        lid = database.push_label(db,name,label)
        import_dir(db,d,lid)

