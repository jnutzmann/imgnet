import database
import os
import string
import filecmp

def import_dir(db,path,label):

    path += '/'

    dirs = filter(os.path.isdir, [path + r for r in os.listdir(path)])
    files = filter(os.path.isfile, [path + r for r in os.listdir(path)])

    for f in files:
        found_dup = False
        for p in database.get_photos_of_size(db,f):
            if filecmp.cmp(p[1],f):
                database.add_label(db,p[0],label)
                print "Duplicate Found: ",f,p[1]
                found_dup = True
                break
        if not found_dup:        
            pid = database.push_photo(db,f)
            database.add_label(db,pid,label)
    
    for d in dirs:
        name = string.replace(d,path,'')
        lid = database.push_label(db,name,label)
        import_dir(db,d,lid)

